import { NextRequest, NextResponse } from 'next/server';
import {
  clearSessionCartReservations,
  loadActiveCartReservations,
  summarizeOtherSessionHolds,
  upsertSessionCartReservations,
} from '@/lib/cartReservationsStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id') || '';
    const active = await loadActiveCartReservations();
    const { byKey, nearestExpiry } = summarizeOtherSessionHolds(active, sessionId);

    return NextResponse.json(
      {
        success: true,
        byKey,
        nearestExpiry,
        activeCount: active.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('Erro ao consultar reservas do carrinho:', err);
    return NextResponse.json({ success: true, byKey: {}, nearestExpiry: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = String(body?.session_id || '').trim();
    const items = Array.isArray(body?.items) ? body.items : [];
    const expiresAt = typeof body?.expires_at === 'number' ? body.expires_at : undefined;

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id obrigatório' }, { status: 400 });
    }

    const active = await upsertSessionCartReservations(sessionId, items, expiresAt);
    const { byKey, nearestExpiry } = summarizeOtherSessionHolds(active, sessionId);

    return NextResponse.json({
      success: true,
      byKey,
      nearestExpiry,
    });
  } catch (err: any) {
    console.error('Erro ao atualizar reservas do carrinho:', err);
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id') || '';
    if (sessionId) {
      await clearSessionCartReservations(sessionId);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: true });
  }
}
