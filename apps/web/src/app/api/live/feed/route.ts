import { NextRequest, NextResponse } from 'next/server';
import { getLiveFeed } from '@/lib/liveStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const feed = getLiveFeed(180); // Considera ativos quem enviou ping nos últimos 3 minutos
    return NextResponse.json(feed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
