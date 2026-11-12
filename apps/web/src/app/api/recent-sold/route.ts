import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import {
  enrichOrderItemsWithCatalog,
  findMatchingProductAndVariant,
  isMissingImageUrl,
  loadCatalogProductsForOrderMatch,
} from '@/lib/orderItemEnricher';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RecentSoldItem {
  id: string;
  orderId: string;
  title: string;
  color: string;
  size: string;
  price: number;
  image: string;
  slug: string;
  customerName: string;
  location: string;
  soldAt: string;
}

function readLocalBackupSales(): any[] {
  try {
    const filePath = path.join(process.cwd(), 'sales_history_db.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

function formatCustomerDisplay(rawName?: string): string {
  const parts = String(rawName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'Cliente VIP';
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const first = capitalize(parts[0]);
  if (parts.length === 1) return first;
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

function formatLocationDisplay(addr: any, channel?: string): string {
  const city = String(addr?.city || '').trim();
  const state = String(addr?.state || '').trim();
  if (city && state && !city.toLowerCase().includes('balcao') && !city.toLowerCase().includes('showroom')) {
    return `${city}, ${state}`;
  }
  if (state) return state;
  if (city) return city;
  if (String(channel || '').toUpperCase() === 'POS_COUNTER') return 'Leominster, MA';
  return 'EUA';
}

function isValidRealProductPhoto(url?: string | null): boolean {
  if (isMissingImageUrl(url)) return false;
  const clean = String(url).trim().toLowerCase();
  if (clean.includes('unsplash.com')) return false;
  if (clean.includes('symbol-ana-fitness.png')) return false;
  if (/\.(mp4|webm|mov|m4v)(\?|$)/.test(clean)) return false;
  return true;
}

export async function GET() {
  try {
    // 1. Carrega pedidos reais de Supabase + backup local (sem duplicatas e sem cancelados)
    const combinedOrdersMap = new Map<string, any>();

    const localSales = readLocalBackupSales();
    for (const s of localSales) {
      const orderId = String(s?.order_id || s?.id || '').trim();
      if (!orderId || orderId.startsWith('ANA-TEST-')) continue;
      if (String(s?.status || '').toUpperCase() === 'CANCELLED') continue;
      combinedOrdersMap.set(orderId, {
        orderId,
        customerName: s.customer_name || '',
        channel: s.channel || 'ONLINE',
        shippingAddress: s.shipping_address || {},
        createdAt: s.created_at || new Date().toISOString(),
        items: Array.isArray(s.items) ? s.items : [],
      });
    }

    const { data: dbOrders, error: dbErr } = await supabaseServer
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (dbErr) {
      console.warn('Aviso ao consultar orders em recent-sold:', dbErr.message);
    }

    for (const ord of dbOrders || []) {
      const meta = ord?.shipping_address && typeof ord.shipping_address === 'object' ? ord.shipping_address : {};
      const orderId = String(meta.order_number || ord.order_number || `ANA-${String(ord.id).slice(0, 8).toUpperCase()}`).trim();
      if (!orderId || orderId.startsWith('ANA-TEST-')) continue;
      if (String(ord.status || '').toUpperCase() === 'CANCELLED') continue;

      const existing = combinedOrdersMap.get(orderId);
      const dbItems = Array.isArray(meta.items) ? meta.items : [];
      if (!existing) {
        combinedOrdersMap.set(orderId, {
          orderId,
          customerName: ord.customer_name || '',
          channel: ord.channel || meta.channel_detail || 'ONLINE',
          shippingAddress: meta.address || meta || {},
          createdAt: ord.created_at || new Date().toISOString(),
          items: dbItems,
        });
      } else {
        if ((!existing.items || existing.items.length === 0) && dbItems.length > 0) {
          existing.items = dbItems;
        }
        if ((!existing.shippingAddress || !existing.shippingAddress.city) && (meta.address || meta.city || meta.state)) {
          existing.shippingAddress = meta.address || meta;
        }
      }
    }

    const sortedOrders = Array.from(combinedOrdersMap.values()).sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });

    // 2. Carrega catálogo real para associar fotos e slugs corretos dos itens vendidos
    const catalogProducts = await loadCatalogProductsForOrderMatch(supabaseServer);

    const primaryPick: RecentSoldItem[] = [];
    const overflowPick: RecentSoldItem[] = [];
    const seenOrderItemKeys = new Set<string>();

    for (const order of sortedOrders) {
      const enrichedItems = enrichOrderItemsWithCatalog(order.items || [], catalogProducts);
      let perOrderCount = 0;

      for (let idx = 0; idx < enrichedItems.length; idx++) {
        const it = enrichedItems[idx];
        const rawTitle = String(it.title || it.name || '').trim();
        if (!rawTitle) continue;
        const lowerTitle = rawTitle.toLowerCase();
        if (lowerTitle === 'frete' || lowerTitle.includes('shipping') || lowerTitle.includes('retirada')) continue;

        const { matchedProd } = findMatchingProductAndVariant(it, catalogProducts);
        const resolvedImg = isValidRealProductPhoto(it.image)
          ? String(it.image).trim()
          : isValidRealProductPhoto(matchedProd?.primary_image)
          ? String(matchedProd!.primary_image).trim()
          : '';

        if (!isValidRealProductPhoto(resolvedImg)) continue;

        const slug = String((it as any).slug || matchedProd?.slug || '').trim();
        const dedupeKey = `${order.orderId}-${it.sku || rawTitle}-${idx}`;
        if (seenOrderItemKeys.has(dedupeKey)) continue;
        seenOrderItemKeys.add(dedupeKey);

        const soldEntry: RecentSoldItem = {
          id: dedupeKey,
          orderId: order.orderId,
          title: rawTitle,
          color: String(it.color || 'Padrão').trim(),
          size: String(it.size || 'M').trim(),
          price: Number(it.unit_price ?? it.price ?? 0) || 0,
          image: resolvedImg,
          slug,
          customerName: formatCustomerDisplay(order.customerName),
          location: formatLocationDisplay(order.shippingAddress, order.channel),
          soldAt: order.createdAt,
        };

        // Prioriza até 3 itens por pedido na primeira passagem para mostrar clientes variados nas últimas vendas
        if (perOrderCount < 3) {
          primaryPick.push(soldEntry);
          perOrderCount++;
        } else {
          overflowPick.push(soldEntry);
        }
      }
    }

    const soldItems = [...primaryPick, ...overflowPick].slice(0, 12);

    return NextResponse.json(
      {
        success: true,
        items: soldItems,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('Erro ao buscar últimos produtos vendidos:', err);
    return NextResponse.json({ success: false, items: [], error: err.message }, { status: 500 });
  }
}
