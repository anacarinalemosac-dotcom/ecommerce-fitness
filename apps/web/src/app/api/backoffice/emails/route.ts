import { NextRequest, NextResponse } from 'next/server';
import { getEmailOutbox, sendOrderConfirmationEmail, sendShippingNotificationEmail } from '@/lib/emailService';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    let outbox = getEmailOutbox();
    if (orderId) {
      outbox = outbox.filter((e) => e.order_id === orderId);
    }

    return NextResponse.json({
      emails: outbox,
      total: outbox.length,
      hasRealProvider: Boolean(process.env.RESEND_API_KEY),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, type = 'ORDER_CONFIRMATION', tracking_code } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'order_id é obrigatório' }, { status: 400 });
    }

    // Busca o pedido no arquivo local de vendas
    const salesFile = path.join(process.cwd(), 'sales_history_db.json');
    let order: any = null;
    if (fs.existsSync(salesFile)) {
      const sales = JSON.parse(fs.readFileSync(salesFile, 'utf8'));
      order = sales.find((s: any) => s.order_id === order_id || s.id === order_id);
    }

    if (!order) {
      return NextResponse.json({ error: 'Pedido não localizado para reenvio' }, { status: 404 });
    }

    let result;
    if (type === 'SHIPPING_NOTIFICATION') {
      result = await sendShippingNotificationEmail(order, tracking_code || order.tracking_code || '9400100000000000000000');
    } else {
      result = await sendOrderConfirmationEmail(order);
    }

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
