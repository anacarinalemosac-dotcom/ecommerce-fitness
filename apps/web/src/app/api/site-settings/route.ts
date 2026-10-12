import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SETTINGS_ROW_ID = '00000000-0000-0000-0000-000000000098';
const SETTINGS_SLUG = '__site_settings_state__';

export async function GET() {
  try {
    const { data: row, error } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', SETTINGS_ROW_ID)
      .maybeSingle();

    if (!error && row?.description) {
      try {
        const parsed = JSON.parse(row.description);
        return NextResponse.json(
          { success: true, settings: parsed },
          {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
          }
        );
      } catch (_) {}
    }

    return NextResponse.json({ success: true, settings: {} });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = body.settings || body;

    const { error } = await supabaseServer.from('products').upsert({
      id: SETTINGS_ROW_ID,
      title: '__SITE_SETTINGS_STATE__',
      slug: SETTINGS_SLUG,
      description: JSON.stringify(settings),
    });

    if (error) {
      console.warn('Erro ao salvar site-settings no Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
