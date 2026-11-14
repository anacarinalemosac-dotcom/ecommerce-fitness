import { NextRequest, NextResponse } from 'next/server';
import { getLiveFeed } from '@/lib/liveStore';
import { getCartTrackerSummary } from '@/lib/cartTrackerStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const feed = await getLiveFeed(300); // Considera ativos quem enviou ping nos últimos 5 minutos
    let cartStats = {
      activeCount: 0,
      abandonedCount: 0,
      activeCarts: [],
      abandonedCarts: [],
      totalActiveValue: 0,
      totalAbandonedValue: 0,
    };
    try {
      const summary = await getCartTrackerSummary();
      cartStats = {
        activeCount: summary.activeCount,
        abandonedCount: summary.abandonedCount,
        activeCarts: summary.activeCarts as any,
        abandonedCarts: summary.abandonedCarts as any,
        totalActiveValue: summary.totalActiveValue,
        totalAbandonedValue: summary.totalAbandonedValue,
      };
    } catch (_) {}

    return NextResponse.json({
      ...feed,
      cartStats,
    }, {
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
