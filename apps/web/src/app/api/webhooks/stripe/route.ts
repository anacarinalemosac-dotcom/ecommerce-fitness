import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { processCompletedStripeSession } from '@/lib/stripeOrderProcessor';

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
      try {
        event = JSON.parse(bodyText);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await processCompletedStripeSession(session);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Erro no webhook Stripe:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
