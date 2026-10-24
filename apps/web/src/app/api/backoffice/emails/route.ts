import { NextRequest, NextResponse } from 'next/server';
import { getEmailOutbox, saveEmailRecord, sendOrderConfirmationEmail, sendShippingNotificationEmail } from '@/lib/emailService';
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
    const { order_id, type = 'ORDER_CONFIRMATION', tracking_code, email, name, phone, source, notes } = body;

    // Se for lead institucional, formulário de contato ou inscrição VIP da newsletter
    if (!order_id && email) {
      const emailRecord = {
        id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        order_id: source || 'CONTACT_LEAD',
        to: email,
        subject: source === 'footer_newsletter' ? 'Inscrição VIP Newsletter' : (notes?.split(']')[0]?.replace('[', '') || 'Mensagem do Site'),
        type: 'GENERAL' as const,
        status: 'SIMULATED_SENT' as const,
        created_at: new Date().toISOString(),
        html_preview: `<p><strong>Nome:</strong> ${name || 'N/A'}</p><p><strong>Telefone:</strong> ${phone || 'N/A'}</p><p><strong>E-mail:</strong> ${email}</p><p><strong>Mensagem:</strong> ${notes || 'Inscrição VIP na Newsletter confirmada.'}</p>`,
      };
      saveEmailRecord(emailRecord as any);
      return NextResponse.json({ success: true, lead: true, id: emailRecord.id });
    }

    if (!order_id) {
      return NextResponse.json({ error: 'order_id ou email é obrigatório' }, { status: 400 });
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
