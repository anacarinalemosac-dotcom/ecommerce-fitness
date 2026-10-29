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

    // Adiciona o Frete Fixo USPS ($9.99 = 999 centavos)
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'USPS Domestic Priority Shipping (Flat Rate)',
          description: 'Entrega rápida para todos os Estados Unidos (1 a 5 dias úteis com rastreamento)',
        },
        unit_amount: 999, // $9.99
      },
      quantity: 1,
    });

    // Se houver cupom com desconto, podemos aplicar ou abater
    const generatedOrderId = order_id || `ANA-${Math.floor(100000 + Math.random() * 900000)}`;
    const paymentMethodChoice = (payment_method || 'card').toLowerCase();

    const sessionPayloadBase: any = {
      line_items: lineItems,
      mode: 'payment',
      customer_email: customer_email || undefined,
      client_reference_id: generatedOrderId,
      metadata: {
        order_id: generatedOrderId,
        payment_method: paymentMethodChoice.toUpperCase(),
        customer_name: customer_name || 'Cliente VIP',
        customer_email: customer_email || '',
        customer_phone: customer_phone || '',
        coupon_code: coupon_code || '',
        seller_name: seller_name || 'Loja Oficial Online',
        shipping_street: shipping_address?.address || '',
        shipping_apt: shipping_address?.apt || '',
        shipping_city: shipping_address?.city || '',
        shipping_state: shipping_address?.state || '',
        shipping_zip: shipping_address?.zip || '',
        discount_amount: String(discount_amount || 0),
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${generatedOrderId}`,
      cancel_url: `${origin}/checkout?canceled=true`,
    };

    let session: any;

    // Determina os tipos de método de pagamento solicitados
    let requestedTypes: string[] = ['card', 'link'];
    if (paymentMethodChoice === 'affirm') {
      requestedTypes = ['affirm', 'card', 'link'];
    } else if (paymentMethodChoice === 'afterpay') {
      requestedTypes = ['afterpay_clearpay', 'card', 'link'];
    } else {
      requestedTypes = ['card', 'affirm', 'afterpay_clearpay', 'link'];
    }

    try {
      // 1. Tenta criar com os tipos BNPL solicitados (Affirm / Afterpay)
      session = await stripe.checkout.sessions.create({
        ...sessionPayloadBase,
        payment_method_types: requestedTypes as any,
      });
    } catch (errMethodTypes: any) {
      console.warn(
        'Stripe Checkout: payment_method_types com Affirm/Afterpay não ativos na conta ou restrito por moeda/país. Aplicando fallback resiliente:',
        errMethodTypes?.message
      );
      try {
        // 2. Fallback resiliente para cartão padrão
        session = await stripe.checkout.sessions.create({
          ...sessionPayloadBase,
          payment_method_types: ['card'],
        });
      } catch (errCardFallback: any) {
        // 3. Fallback dinâmico (usa métodos configurados no Stripe Dashboard)
        session = await stripe.checkout.sessions.create({
          ...sessionPayloadBase,
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
