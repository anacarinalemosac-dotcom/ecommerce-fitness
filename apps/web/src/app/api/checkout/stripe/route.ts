import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';

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
      seller_name,
      payment_method = 'card',
      delivery_method = 'DELIVERY',
      shipping_fee,
    } = body;

    const origin = req.headers.get('origin') || 'https://anafitwear.com';

    // Se a Stripe ainda não tiver a chave configurada no Vercel, retorna aviso para simulação
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json({
        configured: false,
        message: 'STRIPE_SECRET_KEY não foi configurada ainda nas variáveis de ambiente.',
      });
    }

    // Calcula os itens no formato exigido pela Stripe (em centavos de dólar)
    const lineItems: any[] = items.map((it: any) => {
      const unitAmountInCents = Math.round(Number(it.unit_price || it.price || 44.90) * 100);
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${it.title || 'PEÇA FIT'} (${it.color || 'Preto Ônix'} • TAM ${it.size || 'M'})`,
            description: `ANA FITNESS WEAR LLC • SKU: ${it.sku || 'ANA-ITEM'}`,
            images: it.image ? [it.image] : ['https://anafitwear.com/logo-ana-fitness.png'],
          },
          unit_amount: unitAmountInCents,
        },
        quantity: Number(it.quantity) || 1,
      };
    });

    const isPickup = delivery_method === 'PICKUP' || shipping_address?.delivery_method === 'PICKUP';
    const finalShippingFee = isPickup ? 0 : (shipping_fee !== undefined ? Number(shipping_fee) : 9.90);

    // Se for retirada no showroom, não cobra frete ($0.00). Se for entrega, cobra $9.90 (ou grátis via cupom)
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
        discount_amount: String(discount_amount || 0),
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
