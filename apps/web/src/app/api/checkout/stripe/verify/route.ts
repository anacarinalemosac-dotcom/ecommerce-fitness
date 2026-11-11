import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { processCompletedStripeSession } from '@/lib/stripeOrderProcessor';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId || !stripe) {
      return NextResponse.json({ success: false, message: 'Missing session_id or stripe' }, { status: 400 });
    }

    const result = await processCompletedStripeSession(sessionId);
    if (!result.success) {
      return NextResponse.json({ success: false, payment_status: result.payment_status });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Erro ao verificar sessão Stripe:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
