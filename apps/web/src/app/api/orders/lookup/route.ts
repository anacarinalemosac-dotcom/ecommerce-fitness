import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

const BACKUP_SALES_FILE = path.join(process.cwd(), 'sales_history_db.json');

// Pedidos demonstrativos zerados para exibir apenas pedidos 100% reais
const DEMO_ORDERS: any[] = [];

function readAllOrders(): any[] {
  let list = [...DEMO_ORDERS];
  try {
    if (fs.existsSync(BACKUP_SALES_FILE)) {
      const raw = fs.readFileSync(BACKUP_SALES_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((s: any) => {
          // Se já não estiver na lista demo
          if (!list.some((d) => d.order_id === s.order_id)) {
            list.push({
              order_id: s.order_id,
              customer_name: s.customer_name,
              customer_email: s.customer_email || 'cliente@anafitnesswear.com',
              customer_phone: s.customer_phone || '',
              created_at: s.created_at,
              status: s.status === 'IN_PRODUCTION' ? 'IN_PRODUCTION' : 'CONFIRMED',
              tracking_code: s.channel === 'ONLINE' ? '9400' + Math.floor(100000000000000000 + Math.random() * 900000000000000000) : 'BALCAO-SHOWROOM',
              carrier: s.channel === 'ONLINE' ? 'USPS Domestic Priority ($9.99)' : 'Retirada no Showroom (Leominster, MA)',
              estimated_delivery: s.channel === 'ONLINE' ? '1 a 5 dias úteis' : 'Imediato no balcão',
              shipping_address: s.shipping_address || {
                address: 'Leominster Area / Online Delivery',
                apt: '',
                city: 'Leominster',
                state: 'MA',
                zip: '01453',
              },
              payment_method: s.payment_method,
              subtotal: s.subtotal_products,
              shipping_fee: s.shipping_fee,
              discount: s.discount_amount,
              total: s.subtotal_products + s.shipping_fee - s.discount_amount,
              items: s.items || [],
            });
          }
        });
      }
    }
  } catch (e) {
    console.warn('Erro ao ler pedidos para clientes:', e);
  }
  return list;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = (searchParams.get('order_id') || '').trim().toUpperCase();
  const emailOrPhone = (searchParams.get('query') || '').trim().toLowerCase();

  const allOrders = readAllOrders();

  // 1. Busca por Order ID exato
  if (orderId) {
    const found = allOrders.find(
      (o) => o.order_id.toUpperCase() === orderId || o.order_id.replace(/[^0-9]/g, '') === orderId.replace(/[^0-9]/g, '')
    );
    if (found) {
      return NextResponse.json({ order: found });
    }
  }

  // 2. Busca por e-mail ou telefone
  if (emailOrPhone) {
    const matches = allOrders.filter(
      (o) =>
        (o.customer_email && o.customer_email.toLowerCase().includes(emailOrPhone)) ||
        (o.customer_phone && o.customer_phone.replace(/[^0-9]/g, '').includes(emailOrPhone.replace(/[^0-9]/g, ''))) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(emailOrPhone))
    );
    if (matches.length > 0) {
      return NextResponse.json({ orders: matches });
    }
  }

  // Se não encontrar nada
  return NextResponse.json(
    { error: 'Pedido não encontrado. Verifique o número digitado ou o e-mail de compra.' },
    { status: 404 }
  );
}
