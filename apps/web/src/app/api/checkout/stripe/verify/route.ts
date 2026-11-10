import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseServer } from '@/lib/supabaseServer';
import { recordOrderEvent } from '@/lib/liveStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId || !stripe) {
      return NextResponse.json({ success: false, message: 'Missing session_id or stripe' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ success: false, payment_status: session.payment_status });
    }

    const meta = session.metadata || {};
    const orderId = meta.order_id || session.client_reference_id || `ANA-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalAmountPaid = session.amount_total ? session.amount_total / 100 : 54.89;

    // Verifica se o pedido já existe no Supabase
    const { data: existing } = await supabaseServer
      .from('orders')
      .select('id, shipping_address')
      .eq('channel', 'ONLINE')
      .limit(50);

    const alreadyExists = existing?.some((o: any) => {
      const sAddr = o.shipping_address;
      return sAddr?.order_number === orderId || o.id === orderId;
    });

    if (alreadyExists) {
      return NextResponse.json({ success: true, message: 'Order already recorded', orderId });
    }

    const isPickup = (meta.delivery_method || '').toUpperCase() === 'PICKUP';
    const effectiveShippingFee = isPickup ? 0 : Number(meta.shipping_fee || 9.90);
    const effectiveShippingCost = isPickup ? 0 : 7.50;

    // Itens comprados
    const items = (session.line_items?.data || [])
      .filter((li: any) => {
        const desc = (li.description || '').toLowerCase();
        return !desc.includes('shipping') && !desc.includes('frete') && !desc.includes('retirada') && !desc.includes('showroom');
      })
      .map((li: any) => ({
        title: li.description || 'PEDIDO STRIPE ONLINE',
        size: meta.size || 'M',
        color: meta.color || 'Preto Ônix',
        sku: 'STRIPE-ORDER',
        quantity: li.quantity || 1,
        unit_price: (li.amount_total || 0) / 100 / (li.quantity || 1),
        cost_price: 16.00,
      }));

    if (items.length === 0) {
      items.push({
        title: 'PEDIDO STRIPE ONLINE',
        size: 'M',
        color: 'Preto Ônix',
        sku: 'STRIPE-ORDER',
        quantity: 1,
        unit_price: Math.max(0, totalAmountPaid - effectiveShippingFee),
        cost_price: 16.00,
      });
    }

    const customerName = meta.customer_name || session.customer_details?.name || 'Cliente Online';
    const customerEmail = meta.customer_email || session.customer_details?.email || 'cliente@anafitwear.com';
    const customerPhone = meta.customer_phone || session.customer_details?.phone || '';
    const shippingAddress = {
      address: isPickup ? '126 First St' : (meta.shipping_street || session.customer_details?.address?.line1 || 'Leominster, MA'),
      apt: isPickup ? 'Apt 01' : (meta.shipping_apt || session.customer_details?.address?.line2 || ''),
      city: isPickup ? 'Leominster' : (meta.shipping_city || session.customer_details?.address?.city || 'Leominster'),
      state: isPickup ? 'MA' : (meta.shipping_state || session.customer_details?.address?.state || 'MA'),
      zip: isPickup ? '01453' : (meta.shipping_zip || session.customer_details?.address?.postal_code || '01453'),
      delivery_method: isPickup ? 'PICKUP' : 'DELIVERY',
      showroom_address: isPickup ? '126 First St, Apt 01, Leominster, MA 01453' : undefined,
    };

    const metadataPayload = {
      order_number: orderId,
      seller_name: meta.seller_name || 'Loja Oficial Online',
      channel_detail: 'ONLINE',
      delivery_method: isPickup ? 'PICKUP' : 'DELIVERY',
      payment_fee: (meta.payment_method || '').toUpperCase() === 'AFTERPAY'
        ? Number(((totalAmountPaid * 0.06) + 0.30).toFixed(2))
        : (meta.payment_method || '').toUpperCase() === 'KLARNA' || (meta.payment_method || '').toUpperCase() === 'AFFIRM'
        ? Number(((totalAmountPaid * 0.0599) + 0.30).toFixed(2))
        : Number(((totalAmountPaid * 0.029) + 0.30).toFixed(2)),
      shipping_fee: effectiveShippingFee,
      shipping_cost: effectiveShippingCost,
      cost_of_goods: 16.00,
      net_profit: Number((
        totalAmountPaid - 16.00 - (
          (meta.payment_method || '').toUpperCase() === 'AFTERPAY'
            ? ((totalAmountPaid * 0.06) + 0.30)
            : (meta.payment_method || '').toUpperCase() === 'KLARNA' || (meta.payment_method || '').toUpperCase() === 'AFFIRM'
            ? ((totalAmountPaid * 0.0599) + 0.30)
            : ((totalAmountPaid * 0.029) + 0.30)
        ) - effectiveShippingCost
      ).toFixed(2)),
      profit_margin_pct: totalAmountPaid > 0 ? Number(((
        (totalAmountPaid - 16.00 - (
          (meta.payment_method || '').toUpperCase() === 'AFTERPAY'
            ? ((totalAmountPaid * 0.06) + 0.30)
            : (meta.payment_method || '').toUpperCase() === 'KLARNA' || (meta.payment_method || '').toUpperCase() === 'AFFIRM'
            ? ((totalAmountPaid * 0.0599) + 0.30)
            : ((totalAmountPaid * 0.029) + 0.30)
        ) - effectiveShippingCost) / totalAmountPaid
      ) * 100).toFixed(1)) : 0,
      fulfillment_status: 'AWAITING_SEPARATION',
      payment_status: 'PAID',
      address: shippingAddress,
      items,
      discount_reason: meta.coupon_code || undefined,
    };

    const { data: inserted, error: dbErr } = await supabaseServer.from('orders').insert([
      {
        channel: 'ONLINE',
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        coupon_code: meta.coupon_code || null,
        subtotal_amount: Math.max(0, totalAmountPaid - 9.99),
        discount_amount: Number(meta.discount_amount) || 0,
        total_amount: totalAmountPaid,
        commission_amount: meta.coupon_code ? Number((((totalAmountPaid - 9.99) * 0.10)).toFixed(2)) : 0,
        payment_method: (meta.payment_method || 'AFTERPAY').toUpperCase(),
        status: 'COMPLETED',
        shipping_address: metadataPayload,
      },
    ]).select();

    if (dbErr) {
      console.warn('Erro ao inserir pedido via verify:', dbErr);
    } else {
      recordOrderEvent({
        orderId,
        customerName,
        city: `${shippingAddress.city}, ${shippingAddress.state}`,
        amount: totalAmountPaid,
      });
    }

    return NextResponse.json({ success: true, orderId, inserted: Boolean(inserted) });
  } catch (err: any) {
    console.error('Erro ao verificar sessão Stripe:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
