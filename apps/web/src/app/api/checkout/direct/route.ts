import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const size = (searchParams.get('size') || 'M').toUpperCase();
  const color = searchParams.get('color') || 'Preto Ônix';
  const qty = Number(searchParams.get('qty')) || 1;
  const redirectMode = searchParams.get('mode') || 'site'; // 'stripe' | 'site'
  const origin = req.nextUrl.origin || 'https://anafitwear.com';

  // Se o modo for 'site' (padrão recomendado), redireciona para o checkout exclusivo da loja com Afterpay pré-selecionado
  if (redirectMode !== 'stripe') {
    const targetUrl = new URL('/checkout', origin);
    targetUrl.searchParams.set('direct', '1');
    if (slug) targetUrl.searchParams.set('slug', slug);
    targetUrl.searchParams.set('size', size);
    targetUrl.searchParams.set('color', color);
    targetUrl.searchParams.set('qty', String(qty));
    targetUrl.searchParams.set('pay', 'afterpay');

    // Repassa dados opcionais do cliente se informados
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const zip = searchParams.get('zip');
    if (name) targetUrl.searchParams.set('name', name);
    if (email) targetUrl.searchParams.set('email', email);
    if (phone) targetUrl.searchParams.set('phone', phone);
    if (zip) targetUrl.searchParams.set('zip', zip);

    return NextResponse.redirect(targetUrl.toString(), 303);
  }

  // Se o modo for 'stripe', cria na hora uma sessão do Stripe Checkout com Afterpay e redireciona
  try {
    if (!isStripeConfigured || !stripe) {
      return NextResponse.redirect(new URL(`/checkout?direct=1&slug=${slug}&size=${size}&pay=afterpay`, origin).toString(), 303);
    }

    let productTitle = slug ? slug.replace(/-/g, ' ').toUpperCase() : 'PEÇA FITNESS EXCLUSIVA';
    let productPrice = 44.9;
    let productImage = 'https://anafitwear.com/logo-ana-fitness.png';

    if (slug) {
      const { data: prod } = await supabaseServer
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (prod) {
        productTitle = prod.title || productTitle;
        if (prod.price) productPrice = Number(prod.price);
        if (prod.primary_image) productImage = prod.primary_image;
      }
    }

    const orderId = `ANA-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalProductAmount = productPrice * qty;
    const isFreeShipping = totalProductAmount >= 100;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${productTitle} (${color} • TAM ${size})`,
              description: `ANA FITNESS WEAR LLC • LINK DIRETO AFTERPAY • PEDIDO #${orderId}`,
              images: productImage ? [productImage] : undefined,
            },
            unit_amount: Math.round(productPrice * 100),
          },
          quantity: qty,
        },
        isFreeShipping
          ? {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'Frete Grátis Cortesia (USPS Priority)',
                  description: 'Promoção oficial: Frete grátis para compras a partir de $100 • $0.00',
                },
                unit_amount: 0,
              },
              quantity: 1,
            }
          : {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'USPS Domestic Priority Shipping (Flat Rate)',
                  description: 'Entrega rápida para todos os Estados Unidos (1 a 5 dias úteis com rastreamento)',
                },
                unit_amount: 990, // $9.90
              },
              quantity: 1,
            },
      ],
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      client_reference_id: orderId,
      metadata: {
        order_id: orderId,
        payment_method: 'AFTERPAY',
        direct_link: 'true',
        slug: slug || '',
        size: size,
        color: color,
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${origin}/produto/${slug || ''}`,
    });

    if (session?.url) {
      return NextResponse.redirect(session.url, 303);
    }
  } catch (err: any) {
    console.error('Erro ao gerar Stripe Express Checkout Link:', err);
  }

  // Fallback seguro para o checkout da loja
  return NextResponse.redirect(new URL(`/checkout?direct=1&slug=${slug}&size=${size}&pay=afterpay`, origin).toString(), 303);
}
