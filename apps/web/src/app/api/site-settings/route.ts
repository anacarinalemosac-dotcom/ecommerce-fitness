import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SETTINGS_ROW_ID = '00000000-0000-0000-0000-000000000098';
const SETTINGS_SLUG = '__site_settings_state__';

function getLocalSettingsPath(): string {
  const candidates = [
    path.join(process.cwd(), 'apps', 'web', 'site_settings_db.json'),
    path.join(process.cwd(), 'site_settings_db.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.dirname(candidate))) {
      return candidate;
    }
  }
  return candidates[0];
}

function readLocalSettings(): any {
  try {
    const filePath = getLocalSettingsPath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Erro ao ler site_settings_db.json local:', err);
  }
  return null;
}

function writeLocalSettings(data: any): void {
  try {
    const filePath = getLocalSettingsPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Erro ao salvar site_settings_db.json local:', err);
  }
}

export async function GET() {
  try {
    // 1. Tentar ler do Supabase Server
    const { data: row, error } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', SETTINGS_ROW_ID)
      .maybeSingle();

    if (!error && row?.description) {
      try {
        const parsed = JSON.parse(row.description);
        // Atualiza cópia local
        writeLocalSettings(parsed);
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

    // 2. Fallback local se o Supabase não responder
    const local = readLocalSettings();
    if (local) {
      return NextResponse.json(
        { success: true, settings: local, fromFallback: true },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    return NextResponse.json({ success: true, settings: {} });
  } catch (err: any) {
    const local = readLocalSettings();
    if (local) {
      return NextResponse.json({ success: true, settings: local, fromFallback: true });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = body.settings || body;

    // 1. Salvar na cópia local para redundância instantânea
    writeLocalSettings(settings);

    // 2. Salvar na linha oficial do Supabase
    const { error } = await supabaseServer.from('products').upsert({
      id: SETTINGS_ROW_ID,
      title: '__SITE_SETTINGS_STATE__',
      slug: SETTINGS_SLUG,
      description: JSON.stringify(settings),
    });

    if (error) {
      console.warn('Erro ao salvar site-settings no Supabase (salvo localmente):', error);
      // Retorna sucesso pois salvou no fallback
      return NextResponse.json({ success: true, settings, warning: error.message });
    }

    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
