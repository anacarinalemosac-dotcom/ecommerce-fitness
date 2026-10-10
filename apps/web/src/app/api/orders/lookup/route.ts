import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

const BACKUP_SALES_FILE = path.join(process.cwd(), 'sales_history_db.json');

// Pedidos demonstrativos para consulta instantânea do cliente
const DEMO_ORDERS = [
  {
    order_id: 'ANA-928104',
    customer_name: 'Mariana Salles',
    customer_email: 'mariana.salles@gmail.com',
    customer_phone: '+1 (508) 492-8819',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'SHIPPED', // 'CONFIRMED' | 'IN_PRODUCTION' | 'SHIPPED' | 'DELIVERED'
    tracking_code: '9400109205568104229103',
    carrier: 'USPS Priority Mail',
    estimated_delivery: '2-3 Business Days',
    shipping_address: {
      address: '742 Commonwealth Ave',
      apt: 'Apt 4B',
      city: 'Boston',
      state: 'MA',
      zip: '02215',
    },
    payment_method: 'CARD',
    subtotal: 44.90,
    shipping_fee: 9.99,
    discount: 4.49,
    total: 50.40,
    items: [
      {
        title: 'SAMANTA ROMPER',
        size: 'S',
        color: 'Preto Ônix',
        sku: 'SAM-BLK-S',
        quantity: 1,
        unit_price: 44.90,
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80',
      },
    ],
  },
  {
    order_id: 'ANA-927552',
    customer_name: 'Beatriz Figueiredo',
    customer_email: 'beatriz.fig@miamifit.com',
    customer_phone: '+1 (305) 881-2299',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: 'IN_PRODUCTION',
    tracking_code: 'USPS-PENDING-PRODUCTION',
    carrier: 'USPS Ground Advantage',
    estimated_delivery: 'Confeccionando sob medida (5-7 dias)',
    shipping_address: {
      address: '1200 Brickell Bay Dr',
      apt: 'Suite 1205',
      city: 'Miami',
      state: 'FL',
      zip: '33131',
    },
    payment_method: 'CARD',
    subtotal: 79.80,
    shipping_fee: 9.99,
    discount: 0.00,
    total: 89.79,
    items: [
      {
        title: 'KELY PANTS SET (PRE-ORDER)',
        size: 'S',
        color: 'Vinho Marsala',
        sku: 'KEL-VIN-S',
        quantity: 2,
        unit_price: 39.90,
        image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=80',
      },
    ],
  },
];

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
