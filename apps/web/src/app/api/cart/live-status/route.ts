import { NextRequest, NextResponse } from 'next/server';
import { getCartTrackerSummary } from '@/lib/cartTrackerStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const summary = await getCartTrackerSummary();
    return NextResponse.json(
      {
        success: true,
        ...summary,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        activeCount: 0,
        abandonedCount: 0,
        activeCarts: [],
        abandonedCarts: [],
        totalActiveValue: 0,
        totalAbandonedValue: 0,
      },
      { status: 500 }
    );
  }
}
