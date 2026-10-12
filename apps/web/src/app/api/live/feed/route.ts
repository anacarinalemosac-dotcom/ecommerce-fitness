import { NextRequest, NextResponse } from 'next/server';
import { getLiveFeed } from '@/lib/liveStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const feed = await getLiveFeed(300); // Considera ativos quem enviou ping nos últimos 5 minutos
    return NextResponse.json(feed, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
