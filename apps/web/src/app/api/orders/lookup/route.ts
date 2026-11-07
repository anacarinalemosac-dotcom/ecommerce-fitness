import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BACKUP_SALES_FILE = path.join(process.cwd(), 'sales_history_db.json');

function readBackupOrders(): any[] {
  const list: any[] = [];
  try {
    if (fs.existsSync(BACKUP_SALES_FILE)) {
      const raw = fs.readFileSync(BACKUP_SALES_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((s: any) => {
          list.push({
            order_id: s.order_id,
            customer_name: s.customer_name,
            customer_email: s.customer_email || 'cliente@anafitnesswear.com',
            customer_phone: s.customer_phone || '',
            created_at: s.created_at,
            status: s.status || 'CONFIRMED',
            fulfillment_status: s.fulfillment_status || 'AWAITING_SEPARATION',
            tracking_code: s.tracking_code || undefined,
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
        });
      }
    }
  } catch (e) {
    console.warn('Erro ao ler pedidos locais para clientes:', e);
  }
  return list;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = (searchParams.get('order_id') || '').trim().toUpperCase();
  const emailOrPhone = (searchParams.get('query') || '').trim().toLowerCase();

  const allOrders: any[] = [];

  // 1. Busca todos os pedidos do Supabase (tempo real)
  try {
    const { data: dbOrders, error } = await supabaseServer
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbOrders && Array.isArray(dbOrders)) {
      dbOrders.forEach((ord: any) => {
        const meta = ord.shipping_address && typeof ord.shipping_address === 'object' ? ord.shipping_address : {};
        const orderNumber = meta.order_number || ord.order_number || `ANA-${ord.id.slice(0, 8).toUpperCase()}`;
        const fStatus = meta.fulfillment_status || (ord.status === 'DELIVERED' || ord.status === 'SHIPPED' ? ord.status : 'AWAITING_SEPARATION');

        let displayStatus = 'CONFIRMADO';
        if (fStatus === 'SHIPPED') displayStatus = 'SHIPPED';
        else if (fStatus === 'IN_PRODUCTION') displayStatus = 'IN_PRODUCTION';
        else if (fStatus === 'DELIVERED') displayStatus = 'DELIVERED';
        else if (fStatus === 'AWAITING_SEPARATION') displayStatus = 'PENDENTE_ENVIO';

        allOrders.push({
          order_id: orderNumber,
          customer_name: ord.customer_name || 'Cliente Online',
          customer_email: ord.customer_email || meta.customer_email || '',
          customer_phone: ord.customer_phone || meta.customer_phone || '',
          created_at: ord.created_at || new Date().toISOString(),
          status: displayStatus,
          fulfillment_status: fStatus,
          tracking_code: meta.tracking_code || ord.tracking_code || undefined,
          carrier: ord.channel === 'ONLINE' ? 'USPS Domestic Priority ($9.99)' : 'Retirada no Showroom (Leominster, MA)',
          estimated_delivery: '1 a 5 dias úteis com código de rastreamento USPS',
          shipping_address: meta.address || {
            address: 'Leominster Area / Online Delivery',
            apt: '',
            city: 'Leominster',
            state: 'MA',
            zip: '01453',
          },
          payment_method: ord.payment_method || 'AFTERPAY',
          subtotal: Number(ord.subtotal_amount) || 0,
          shipping_fee: Number(meta.shipping_fee) || 9.99,
          discount: Number(ord.discount_amount) || 0,
          total: Number(ord.total_amount) || ((Number(ord.subtotal_amount) || 0) + (Number(meta.shipping_fee) || 9.99)),
          items: Array.isArray(meta.items) ? meta.items : [],
        });
      });
    }
  } catch (e) {
    console.warn('Erro ao consultar pedidos do Supabase em lookup:', e);
  }

  // 2. Mescla com pedidos do backup local sem duplicar
  const backup = readBackupOrders();
  backup.forEach((b) => {
    if (!allOrders.some((o) => o.order_id === b.order_id)) {
      allOrders.push(b);
    }
  });

  // 3. Busca por Order ID exato
  if (orderId) {
    const found = allOrders.find(
      (o) =>
        o.order_id.toUpperCase() === orderId ||
        o.order_id.replace(/[^0-9]/g, '') === orderId.replace(/[^0-9]/g, '')
    );
    if (found) {
      return NextResponse.json({ order: found });
    }
  }

  // 4. Busca por e-mail ou telefone
  if (emailOrPhone) {
    const cleanSearch = emailOrPhone.replace(/[^a-z0-9@._-]/g, '');
    const searchDigits = emailOrPhone.replace(/[^0-9]/g, '');

    const matches = allOrders.filter((o) => {
      const emailMatch = o.customer_email && o.customer_email.toLowerCase().includes(cleanSearch);
      const nameMatch = o.customer_name && o.customer_name.toLowerCase().includes(cleanSearch);
      const phoneDigits = (o.customer_phone || '').replace(/[^0-9]/g, '');
      const phoneMatch = searchDigits.length >= 4 && phoneDigits.includes(searchDigits);

      return emailMatch || nameMatch || phoneMatch;
    });

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
