import fs from 'fs';
import path from 'path';
import { stripe } from '@/lib/stripe';
import { supabaseServer } from '@/lib/supabaseServer';
import { recordOrderEvent } from '@/lib/liveStore';
import { sendOrderConfirmationEmail, sendOwnerSaleNotificationEmail } from '@/lib/emailService';
import {
  decrementProductStockAfterSale,
  enrichOrderItemsWithCatalog,
  loadCatalogProductsForOrderMatch,
  parseStripeItemName,
} from '@/lib/orderItemEnricher';

const BACKUP_SALES_FILE = path.join(process.cwd(), 'sales_history_db.json');

// Coalesces concurrent webhook + redirect verification calls for the same Stripe session/order
const inFlightOrders = new Map<string, Promise<ProcessStripeOrderResult>>();

export interface ProcessStripeOrderResult {
  success: boolean;
  alreadyRecorded?: boolean;
  orderId: string;
  inserted?: boolean;
  payment_status?: string;
}

export function processCompletedStripeSession(
  rawSessionOrId: any
): Promise<ProcessStripeOrderResult> {
  const sessionId = typeof rawSessionOrId === 'string' ? rawSessionOrId : rawSessionOrId?.id;
  const metaOrderId = typeof rawSessionOrId === 'object' ? rawSessionOrId?.metadata?.order_id : undefined;
  const lockKey = metaOrderId || sessionId || `unknown-${Date.now()}`;

  const existingPromise = inFlightOrders.get(lockKey);
  if (existingPromise) {
    return existingPromise;
  }

  const runPromise = executeProcessCompletedStripeSession(rawSessionOrId).finally(() => {
    inFlightOrders.delete(lockKey);
  });

  inFlightOrders.set(lockKey, runPromise);
  return runPromise;
}

async function executeProcessCompletedStripeSession(
  rawSessionOrId: any
): Promise<ProcessStripeOrderResult> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const sessionId = typeof rawSessionOrId === 'string' ? rawSessionOrId : rawSessionOrId?.id;
  let session: any = typeof rawSessionOrId === 'object' ? rawSessionOrId : null;

  if (
    sessionId &&
    (!session?.line_items?.data ||
      session.line_items.data.length === 0 ||
      typeof session.line_items.data[0]?.price?.product === 'string')
  ) {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    });
  }

  if (!session) {
    throw new Error('Stripe session not found');
  }

  if (session.payment_status && session.payment_status !== 'paid') {
    const fallbackOrderId = session.metadata?.order_id || session.client_reference_id || '';
    return { success: false, orderId: fallbackOrderId, payment_status: session.payment_status };
  }

  const meta = session.metadata || {};
  const orderId = meta.order_id || session.client_reference_id || `ANA-${Math.floor(100000 + Math.random() * 900000)}`;
  const totalAmountPaid = session.amount_total ? session.amount_total / 100 : 0;

  try {
    const { data: existing } = await supabaseServer
      .from('orders')
      .select('id, shipping_address')
      .eq('channel', 'ONLINE')
      .order('created_at', { ascending: false })
      .limit(100);

    const alreadyInDb = existing?.some((o: any) => {
      const sAddr = o.shipping_address;
      return sAddr?.order_number === orderId || o.id === orderId;
    });

    if (alreadyInDb) {
      return { success: true, alreadyRecorded: true, orderId };
    }
  } catch (checkErr) {
    console.warn('Aviso ao verificar duplicidade de pedido Stripe:', checkErr);
  }

  const isPickup = (meta.delivery_method || '').toUpperCase() === 'PICKUP';
  const effectiveShippingFee = isPickup ? 0 : Number(meta.shipping_fee || 9.90);
  // Label shipping cost is entered by the store owner after purchasing the label unless configured in metadata
  const effectiveShippingCost = isPickup ? 0 : (meta.shipping_cost !== undefined && meta.shipping_cost !== '' ? Number(meta.shipping_cost) : 0);

  const catalogProducts = await loadCatalogProductsForOrderMatch(supabaseServer);

  let lineItems: any[] = session.line_items?.data || [];
  if (lineItems.length === 0 && session.id) {
    try {
      const listed = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 50,
        expand: ['data.price.product'],
      });
      lineItems = listed?.data || [];
    } catch (_) {}
  }

  const rawExtractedItems = lineItems
    .filter((li: any) => {
      const desc = (li.description || '').toLowerCase();
      return !desc.includes('shipping') && !desc.includes('frete') && !desc.includes('retirada') && !desc.includes('showroom');
    })
    .map((li: any) => {
      const prodObj = li.price?.product && typeof li.price.product === 'object' ? (li.price.product as any) : null;
      const pMeta = prodObj?.metadata || {};
      const parsed = parseStripeItemName(li.description || prodObj?.name || '');

      return {
        title: pMeta.title || parsed.title || 'PEDIDO STRIPE ONLINE',
        size: pMeta.size || parsed.size || meta.size || '',
        color: pMeta.color || parsed.color || meta.color || '',
        sku: pMeta.sku || 'STRIPE-ORDER',
        slug: pMeta.slug || '',
        image: pMeta.image || (Array.isArray(prodObj?.images) ? prodObj.images[0] : '') || '',
        quantity: li.quantity || 1,
        unit_price: Number((((li.amount_total || 0) / 100) / (li.quantity || 1)).toFixed(2)),
        cost_price: pMeta.cost_price !== undefined && pMeta.cost_price !== '' ? Number(pMeta.cost_price) : 0,
      };
    });

  if (rawExtractedItems.length === 0) {
    rawExtractedItems.push({
      title: 'PEDIDO STRIPE ONLINE',
      size: meta.size || '',
      color: meta.color || '',
      sku: 'STRIPE-ORDER',
      slug: '',
      image: '',
      quantity: 1,
      unit_price: Number(Math.max(0, totalAmountPaid - effectiveShippingFee).toFixed(2)),
      cost_price: 0,
    });
  }

  const items = enrichOrderItemsWithCatalog(rawExtractedItems, catalogProducts);

  const totalCostOfGoods = Number(
    items.reduce((acc: number, it: any) => acc + Number(it.cost_price || 0) * Number(it.quantity || 1), 0).toFixed(2)
  );
  const payMethod = (meta.payment_method || 'CARD').toUpperCase();
  const paymentFee =
    payMethod === 'AFTERPAY'
      ? Number((totalAmountPaid * 0.06 + 0.30).toFixed(2))
      : payMethod === 'KLARNA' || payMethod === 'AFFIRM'
      ? Number((totalAmountPaid * 0.0599 + 0.30).toFixed(2))
      : Number((totalAmountPaid * 0.029 + 0.30).toFixed(2));
  const discountAmount = Number(meta.discount_amount) || 0;
  const subtotalProducts = Number(Math.max(0, totalAmountPaid - effectiveShippingFee + discountAmount).toFixed(2));
  const commissionAmount = meta.coupon_code
    ? Number((Math.max(0, subtotalProducts - discountAmount) * 0.10).toFixed(2))
    : 0;
  const netProfit = Number((totalAmountPaid - totalCostOfGoods - paymentFee - effectiveShippingCost - commissionAmount).toFixed(2));
  const marginPct = totalAmountPaid > 0 ? Number(((netProfit / totalAmountPaid) * 100).toFixed(1)) : 0;

  const customerName = meta.customer_name || session.customer_details?.name || 'Cliente Online';
  const customerEmail = meta.customer_email || session.customer_details?.email || '';
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
    payment_fee: paymentFee,
    shipping_fee: effectiveShippingFee,
    shipping_cost: effectiveShippingCost,
    cost_of_goods: totalCostOfGoods,
    net_profit: netProfit,
    profit_margin_pct: marginPct,
    fulfillment_status: 'AWAITING_SEPARATION',
    payment_status: 'PAID',
    address: shippingAddress,
    items,
    discount_reason: meta.coupon_code || undefined,
  };

  const { data: inserted, error: dbErr } = await supabaseServer
    .from('orders')
    .insert([
      {
        channel: 'ONLINE',
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        coupon_code: meta.coupon_code || null,
        subtotal_amount: subtotalProducts,
        discount_amount: discountAmount,
        total_amount: totalAmountPaid,
        commission_amount: commissionAmount,
        payment_method: payMethod,
        status: 'COMPLETED',
        shipping_address: metadataPayload,
      },
    ])
    .select();

  if (dbErr) {
    console.warn('Erro ao inserir pedido Stripe no Supabase orders:', dbErr);
  } else {
    try {
      await recordOrderEvent({
        orderId,
        customerName,
        city: isPickup ? 'Retirada Showroom Leominster, MA' : `${shippingAddress.city}, ${shippingAddress.state}`,
        amount: totalAmountPaid,
        itemsSummary: items.map((i: any) => `${i.title} [${i.sku}] (${i.size})`).join(', '),
      });
    } catch (_) {}
  }

  // Decrements variant stock in Supabase and marks 0-stock items as ESGOTADO
  await decrementProductStockAfterSale(supabaseServer, items, catalogProducts);

  const fullOrderRecord = {
    id: inserted?.[0]?.id || `sale-stripe-${Date.now()}`,
    order_id: orderId,
    created_at: new Date().toISOString(),
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    shipping_address: {
      ...shippingAddress,
      customer_email: customerEmail,
      customer_phone: customerPhone,
    },
    channel: 'ONLINE' as const,
    seller_name: meta.seller_name || 'Loja Oficial Online',
    coupon_code: meta.coupon_code || undefined,
    payment_method: payMethod,
    subtotal_products: subtotalProducts,
    shipping_fee: effectiveShippingFee,
    shipping_cost: effectiveShippingCost,
    discount_amount: discountAmount,
    payment_fee: paymentFee,
    commission_amount: commissionAmount,
    cost_of_goods: totalCostOfGoods,
    net_profit: netProfit,
    profit_margin_pct: marginPct,
    items,
    total_amount: totalAmountPaid,
    status: 'COMPLETED',
    fulfillment_status: 'AWAITING_SEPARATION',
    payment_status: 'PAID',
  };

  try {
    let existingSales: any[] = [];
    if (fs.existsSync(BACKUP_SALES_FILE)) {
      existingSales = JSON.parse(fs.readFileSync(BACKUP_SALES_FILE, 'utf8'));
    }
    if (!existingSales.some((s: any) => s.order_id === orderId)) {
      existingSales = [fullOrderRecord, ...existingSales];
      fs.writeFileSync(BACKUP_SALES_FILE, JSON.stringify(existingSales, null, 2), 'utf8');
    }
  } catch (_) {}

  if (customerEmail) {
    try {
      await sendOrderConfirmationEmail(fullOrderRecord);
    } catch (emailErr) {
      console.warn('Erro ao enviar e-mail de confirmação para cliente:', emailErr);
    }
  }

  try {
    await sendOwnerSaleNotificationEmail(fullOrderRecord);
  } catch (ownerEmailErr) {
    console.warn('Erro ao enviar e-mail de venda para lojista:', ownerEmailErr);
  }

  return { success: true, orderId, inserted: Boolean(inserted) };
}
