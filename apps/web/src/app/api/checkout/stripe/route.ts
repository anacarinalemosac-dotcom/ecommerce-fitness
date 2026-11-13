import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { supabaseServer } from '@/lib/supabaseServer';
import { enrichOrderItemsWithCatalog, loadCatalogProductsForOrderMatch } from '@/lib/orderItemEnricher';
import { loadActiveCartReservations, summarizeOtherSessionHolds } from '@/lib/cartReservationsStore';
import { isComboEligiblePaymentMethod } from '@/lib/cart';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      items = [],
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      coupon_code,
      discount_amount = 0,
      combo_discount = 0,
      seller_name,
      payment_method = 'card',
      delivery_method = 'DELIVERY',
      shipping_fee,
      cart_session_id,
    } = body;

    const origin = req.headers.get('origin') || 'https://anafitwear.com';

    // Regra comercial: promoção do combo é válida para Zelle, Venmo, Cash App e também para formas parceladas (Cartão, Afterpay, Affirm, Klarna).
    const requestedDiscount = Math.max(0, Number(discount_amount || 0));
    const requestedComboDiscount = Math.max(0, Number(combo_discount || 0));
    const comboAllowedForMethod = isComboEligiblePaymentMethod(payment_method);
    const effectiveDiscountAmount = comboAllowedForMethod
      ? requestedDiscount
      : Math.max(0, requestedDiscount - requestedComboDiscount);

    // Se a Stripe ainda não tiver a chave configurada no Vercel, retorna aviso para simulação
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json({
        configured: false,
        combo_eligible: comboAllowedForMethod,
        effective_discount_amount: effectiveDiscountAmount,
        message: 'STRIPE_SECRET_KEY não foi configurada ainda nas variáveis de ambiente.',
      });
    }

    const catalogProducts = await loadCatalogProductsForOrderMatch(supabaseServer);
    const enrichedItems = enrichOrderItemsWithCatalog(
      (items || []).map((it: any) => ({
        ...it,
        unit_price: Number(it.unit_price || it.price || 44.90),
        quantity: Number(it.quantity) || 1,
      })),
      catalogProducts
    );

    // Valida rigorosamente se a quantidade solicitada de cada item não ultrapassa o estoque disponível
    if (Array.isArray(catalogProducts) && catalogProducts.length > 0) {
      const activeHolds = await loadActiveCartReservations();
      const { byKey: otherHoldsByKey } = summarizeOtherSessionHolds(activeHolds, cart_session_id);
      const requestedPerSku = new Map<string, { qty: number; available: number; title: string }>();
      for (const it of enrichedItems) {
        const matchedProd = catalogProducts.find(
          (cp) =>
            (it.slug && cp.slug === it.slug) ||
            cp.variants.some((v) => it.sku && v.sku && v.sku.toUpperCase() === String(it.sku).toUpperCase()) ||
            cp.title.trim().toUpperCase() === String(it.title || '').trim().toUpperCase()
        );
        if (!matchedProd) continue;
        const matchedVar =
          matchedProd.variants.find((v) => it.sku && v.sku && v.sku.toUpperCase() === String(it.sku).toUpperCase()) ||
          matchedProd.variants.find(
            (v) =>
              (!it.size || v.size.toUpperCase() === String(it.size).toUpperCase()) &&
              (!it.color || v.color.toLowerCase() === String(it.color).toLowerCase())
          ) ||
          matchedProd.variants.find((v) => !it.size || v.size.toUpperCase() === String(it.size).toUpperCase());
        if (!matchedVar || matchedVar.allow_backorder) continue;

        const key = (matchedVar.sku || `${matchedProd.slug}-${matchedVar.color}-${matchedVar.size}`).toUpperCase();
        const skuHoldKey = matchedVar.sku ? `SKU:${String(matchedVar.sku).trim().toUpperCase()}` : '';
        const ssHoldKey = `SS:${String(matchedProd.slug || '').trim().toLowerCase()}::${String(matchedVar.size || '').trim().toUpperCase()}`;
        const heldByOthers = Math.max(0, Number((skuHoldKey && otherHoldsByKey[skuHoldKey]) ?? otherHoldsByKey[ssHoldKey] ?? 0));
        const rawStock = Math.max(0, Number(matchedVar.stock_quantity ?? 0));
        const available = Math.max(0, rawStock - heldByOthers);
        const prev = requestedPerSku.get(key) || { qty: 0, available, title: `${matchedProd.title} (${matchedVar.size})` };
        prev.qty += Math.max(1, Number(it.quantity) || 1);
        requestedPerSku.set(key, prev);
      }

      for (const entry of Array.from(requestedPerSku.values())) {
        if (entry.qty > entry.available) {
          return NextResponse.json(
            {
              error:
                entry.available <= 0
                  ? `O item "${entry.title}" acabou de esgotar e não pode ser comprado.`
                  : `Estoque insuficiente para "${entry.title}": apenas ${entry.available} ${
                      entry.available === 1 ? 'unidade disponível' : 'unidades disponíveis'
                    }.`,
              insufficientStock: true,
            },
            { status: 409 }
          );
        }
      }
    }

    // Calcula os itens no formato exigido pela Stripe (em centavos de dólar)
    const lineItems: any[] = enrichedItems.map((it: any) => {
      const unitAmountInCents = Math.round(Number(it.unit_price || it.price || 44.90) * 100);
      const itemSize = it.size || '';
      const itemColor = it.color || '';
      const variantLabel = itemColor && itemSize ? ` (${itemColor} • TAM ${itemSize})` : (itemSize ? ` (TAM ${itemSize})` : '');
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${it.title || 'PEÇA FIT'}${variantLabel}`,
            description: `ANA FITNESS WEAR LLC • SKU: ${it.sku || 'ANA-ITEM'}`,
            images: it.image ? [it.image] : ['https://anafitwear.com/logo-ana-fitness.png'],
            metadata: {
              title: String(it.title || 'PEÇA FIT').slice(0, 450),
              size: String(itemSize).slice(0, 50),
              color: String(itemColor).slice(0, 100),
              sku: String(it.sku || 'ANA-ITEM').slice(0, 100),
              slug: String(it.slug || '').slice(0, 100),
              image: String(it.image || '').slice(0, 490),
              unit_price: String(Number(it.unit_price || it.price || 44.90).toFixed(2)),
              cost_price: String(Number(it.cost_price || 0).toFixed(2)),
            },
          },
          unit_amount: unitAmountInCents,
        },
        quantity: Number(it.quantity) || 1,
      };
    });

    // Se houver desconto de cupom (ou combo elegível calculado no topo), distribui proporcionalmente entre os itens para atender à exigência da Stripe (unit_amount >= 0)
    const totalDiscountInCents = Math.round(effectiveDiscountAmount * 100);
    if (totalDiscountInCents > 0 && lineItems.length > 0) {
      const totalItemsGrossCents = lineItems.reduce((acc, it) => acc + (it.price_data.unit_amount * it.quantity), 0);
      if (totalItemsGrossCents > 0) {
        const targetNetCents = Math.max(0, totalItemsGrossCents - totalDiscountInCents);
        const ratio = targetNetCents / totalItemsGrossCents;
        let runningSum = 0;
        lineItems.forEach((it, idx) => {
          if (idx === lineItems.length - 1) {
            const remaining = targetNetCents - runningSum;
            it.price_data.unit_amount = Math.max(0, Math.round(remaining / it.quantity));
          } else {
            const adjustedUnit = Math.round(it.price_data.unit_amount * ratio);
            it.price_data.unit_amount = adjustedUnit;
            runningSum += adjustedUnit * it.quantity;
          }
        });
      }
    }

    const isPickup = delivery_method === 'PICKUP' || shipping_address?.delivery_method === 'PICKUP';
    // Subtotal líquido dos itens para qualificação de frete grátis (>= $100)
    const grossItemsAmount = enrichedItems.reduce((acc, it) => acc + (Number(it.unit_price) * Number(it.quantity)), 0);
    const netItemsAmount = Math.max(0, grossItemsAmount - effectiveDiscountAmount);
    const isOver100FreeShipping = netItemsAmount >= 100;
    const finalShippingFee = isPickup
      ? 0
      : (isOver100FreeShipping || shipping_fee === 0
          ? 0
          : (shipping_fee !== undefined ? Number(shipping_fee) : 9.90));

    // Se for retirada no showroom, não cobra frete ($0.00). Se for entrega, cobra $9.90 (ou grátis para compras $100+ / cupom)
    if (isPickup) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Retirada no Showroom (Grátis)',
            description: '126 First St, Apt 01, Leominster, MA 01453 • Sem cobrança de frete ($0.00)',
          },
          unit_amount: 0,
        },
        quantity: 1,
      });
    } else if (finalShippingFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'USPS Domestic Priority Shipping (Flat Rate)',
            description: 'Entrega expressa para todos os Estados Unidos (1 a 5 dias úteis com rastreamento)',
          },
          unit_amount: Math.round(finalShippingFee * 100),
        },
        quantity: 1,
      });
    } else {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Frete Grátis Cortesia (USPS Priority)',
            description: isOver100FreeShipping
              ? 'Promoção oficial: Frete grátis para compras a partir de $100 • $0.00'
              : 'Promoção / Cupom de frete grátis • $0.00',
          },
          unit_amount: 0,
        },
        quantity: 1,
      });
    }

    // Se houver cupom com desconto, podemos aplicar ou abater
    const generatedOrderId = order_id || `ANA-${Math.floor(100000 + Math.random() * 900000)}`;
    const paymentMethodChoice = (payment_method || 'card').toLowerCase();

    const sessionPayloadBase: any = {
      line_items: lineItems,
      mode: 'payment',
      customer_email: customer_email || undefined,
      client_reference_id: generatedOrderId,
      // Fornece obrigatoriamente os dados de entrega física nos EUA exigidos pelo Afterpay e Affirm
      payment_intent_data: {
        shipping: {
          name: customer_name || (isPickup ? 'Cliente Showroom' : 'Cliente VIP'),
          phone: customer_phone || undefined,
          address: isPickup ? {
            line1: '126 First St',
            line2: 'Apt 01',
            city: 'Leominster',
            state: 'MA',
            postal_code: '01453',
            country: 'US',
          } : {
            line1: shipping_address?.address || '742 Commonwealth Ave',
            line2: shipping_address?.apt || undefined,
            city: shipping_address?.city || 'Boston',
            state: shipping_address?.state || 'MA',
            postal_code: shipping_address?.zip || '02215',
            country: 'US',
          },
        },
      },
      metadata: {
        order_id: generatedOrderId,
        payment_method: paymentMethodChoice.toUpperCase(),
        delivery_method: isPickup ? 'PICKUP' : 'DELIVERY',
        showroom_address: isPickup ? '126 First St, Apt 01, Leominster, MA 01453' : '',
        customer_name: customer_name || 'Cliente VIP',
        customer_email: customer_email || '',
        customer_phone: customer_phone || '',
        coupon_code: coupon_code || '',
        seller_name: seller_name || 'Loja Oficial Online',
        shipping_street: isPickup ? '126 First St' : (shipping_address?.address || ''),
        shipping_apt: isPickup ? 'Apt 01' : (shipping_address?.apt || ''),
        shipping_city: isPickup ? 'Leominster' : (shipping_address?.city || ''),
        shipping_state: isPickup ? 'MA' : (shipping_address?.state || ''),
        shipping_zip: isPickup ? '01453' : (shipping_address?.zip || ''),
        shipping_fee: String(finalShippingFee),
        discount_amount: String(effectiveDiscountAmount),
        combo_discount_stripped: !comboAllowedForMethod && requestedComboDiscount > 0 ? String(requestedComboDiscount) : '0',
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${generatedOrderId}`,
      cancel_url: `${origin}/checkout?canceled=true`,
    };

    let session: any;

    try {
      // 1. Cria a sessão com os Métodos de Pagamento Dinâmicos da Stripe (Afterpay, Klarna, Cards, Apple Pay, Google Pay, Link)
      session = await stripe.checkout.sessions.create({
        ...sessionPayloadBase,
      });
    } catch (errDynamic: any) {
      console.warn(
        'Stripe Checkout: sessão dinâmica falhou, tentando com payment_method_types:',
        errDynamic?.message
      );
      try {
        // 2. Fallback com tipos solicitados
        let requestedTypes: string[] = ['card', 'link'];
        if (paymentMethodChoice === 'affirm') {
          requestedTypes = ['affirm', 'card', 'link'];
        } else if (paymentMethodChoice === 'afterpay') {
          requestedTypes = ['afterpay_clearpay', 'card', 'link'];
        } else {
          requestedTypes = ['card', 'affirm', 'afterpay_clearpay', 'link'];
        }
        session = await stripe.checkout.sessions.create({
          ...sessionPayloadBase,
          payment_method_types: requestedTypes as any,
        });
      } catch (errMethodTypes: any) {
        console.warn('Stripe Checkout: fallback method_types falhou, usando card:', errMethodTypes?.message);
        // 3. Fallback seguro para cartão
        session = await stripe.checkout.sessions.create({
          ...sessionPayloadBase,
          payment_method_types: ['card'],
        });
      }
    }

    return NextResponse.json({
      configured: true,
      url: session.url,
      sessionId: session.id,
      orderId: generatedOrderId,
    });
  } catch (err: any) {
    console.error('Erro ao criar sessão Stripe Checkout:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
