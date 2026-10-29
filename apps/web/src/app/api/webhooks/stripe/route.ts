import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { recordOrderEvent } from '@/lib/liveStore';
import { supabaseServer } from '@/lib/supabaseServer';
import { sendOrderConfirmationEmail } from '@/lib/emailService';
import fs from 'fs';
import path from 'path';

const BACKUP_SALES_FILE = path.join(process.cwd(), 'sales_history_db.json');

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: any;

    if (webhookSecret && sig && stripe) {
      try {
        event = stripe.webhooks.constructEvent(bodyText, sig, webhookSecret);
      } catch (err: any) {
        console.error('Falha na assinatura do webhook Stripe:', err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
      }
    } else {
      // Se não houver segredo de webhook em ambiente de desenvolvimento/teste, faz parse direto
      try {
        event = JSON.parse(bodyText);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata || {};

      const orderId = meta.order_id || session.client_reference_id || `ANA-${Math.floor(100000 + Math.random() * 900000)}`;
      const totalAmountPaid = session.amount_total ? session.amount_total / 100 : 54.89;

      const newSaleRecord = {
        id: `sale-stripe-${Date.now()}`,
        order_id: orderId,
        created_at: new Date().toISOString(),
        customer_name: meta.customer_name || session.customer_details?.name || 'Cliente Stripe',
        customer_email: meta.customer_email || session.customer_details?.email || 'cliente@stripe.com',
        customer_phone: meta.customer_phone || session.customer_details?.phone || '',
        shipping_address: {
          address: meta.shipping_street || session.customer_details?.address?.line1 || 'Leominster, MA',
          apt: meta.shipping_apt || session.customer_details?.address?.line2 || '',
          city: meta.shipping_city || session.customer_details?.address?.city || 'Leominster',
          state: meta.shipping_state || session.customer_details?.address?.state || 'MA',
          zip: meta.shipping_zip || session.customer_details?.address?.postal_code || '01453',
        },
        channel: 'ONLINE',
        seller_name: meta.seller_name || 'Loja Oficial Online',
        coupon_code: meta.coupon_code || undefined,
        payment_method: (meta.payment_method || 'CARD').toUpperCase(), // Stripe processa cartão, Affirm, Afterpay, Apple Pay e Google Pay
        subtotal_products: Math.max(0, totalAmountPaid - 9.99),
        shipping_fee: 9.99,
        shipping_cost: 7.50,
        discount_amount: Number(meta.discount_amount) || 0,
        payment_fee: Number(((totalAmountPaid * 0.029) + 0.30).toFixed(2)),
        commission_amount: meta.coupon_code ? Number((((totalAmountPaid - 9.99) * 0.10)).toFixed(2)) : 0,
        cost_of_goods: 16.00,
        net_profit: Number((totalAmountPaid - 16.00 - ((totalAmountPaid * 0.029) + 0.30) - 7.50).toFixed(2)),
        profit_margin_pct: totalAmountPaid > 0 ? Number((((totalAmountPaid - 16.00 - ((totalAmountPaid * 0.029) + 0.30) - 7.50) / totalAmountPaid) * 100).toFixed(1)) : 0,
        items: [
          {
            title: 'PEDIDO STRIPE ONLINE',
            size: 'M',
            color: 'Preto Ônix',
            sku: 'STRIPE-ORDER',
            quantity: 1,
            unit_price: Math.max(0, totalAmountPaid - 9.99),
            cost_price: 16.00,
          },
        ],
        status: 'COMPLETED',
      };

      // 1. Grava no Supabase 'orders' permanente
      try {
        const metadataPayload = {
          order_number: orderId,
          seller_name: newSaleRecord.seller_name,
          channel_detail: 'ONLINE',
          payment_fee: newSaleRecord.payment_fee,
          shipping_fee: newSaleRecord.shipping_fee,
          shipping_cost: newSaleRecord.shipping_cost,
          cost_of_goods: newSaleRecord.cost_of_goods,
          net_profit: newSaleRecord.net_profit,
          profit_margin_pct: newSaleRecord.profit_margin_pct,
          items: newSaleRecord.items,
          address: newSaleRecord.shipping_address,
          discount_reason: newSaleRecord.coupon_code,
        };

        await supabaseServer.from('orders').insert([
          {
            channel: 'ONLINE',
            customer_name: newSaleRecord.customer_name,
            customer_email: newSaleRecord.customer_email || null,
            customer_phone: newSaleRecord.customer_phone || null,
            coupon_code: newSaleRecord.coupon_code || null,
            subtotal_amount: newSaleRecord.subtotal_products,
            discount_amount: newSaleRecord.discount_amount,
            total_amount: totalAmountPaid,
            commission_amount: newSaleRecord.commission_amount,
            payment_method: newSaleRecord.payment_method || 'CARD',
            status: 'COMPLETED',
            shipping_address: metadataPayload,
          },
        ]);
      } catch (dbErr) {
        console.warn('Erro ao salvar pedido Stripe no Supabase orders:', dbErr);
      }

      // 2. Grava no arquivo persistente como fallback
      try {
        let existingSales: any[] = [];
        if (fs.existsSync(BACKUP_SALES_FILE)) {
          existingSales = JSON.parse(fs.readFileSync(BACKUP_SALES_FILE, 'utf8'));
        }
        if (!existingSales.some((s) => s.order_id === orderId)) {
          existingSales = [newSaleRecord, ...existingSales];
          fs.writeFileSync(BACKUP_SALES_FILE, JSON.stringify(existingSales, null, 2), 'utf8');
        }
      } catch (e) {
        console.warn('Erro ao salvar venda Stripe no arquivo:', e);
      }

      // Dispara som e notificação Wix de venda confirmada no Backoffice
      try {
        recordOrderEvent({
          orderId,
          customerName: newSaleRecord.customer_name,
          city: `${newSaleRecord.shipping_address.city}, ${newSaleRecord.shipping_address.state}`,
          amount: totalAmountPaid,
          itemsSummary: `Pagamento aprovado via Stripe (Apple Pay/Cartão)`,
        });
      } catch (e) {
        console.warn('Erro ao disparar evento de live order do Stripe:', e);
      }

      // Envia e-mail de confirmação da compra para o cliente
      if (newSaleRecord.customer_email) {
        try {
          await sendOrderConfirmationEmail(newSaleRecord);
        } catch (emailErr) {
          console.warn('Erro ao enviar e-mail de confirmação Stripe:', emailErr);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Erro no webhook Stripe:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
