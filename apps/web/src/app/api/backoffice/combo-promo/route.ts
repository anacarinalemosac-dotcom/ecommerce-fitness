import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface ComboPromoConfig {
  active: boolean;
  title: string;
  required_quantity: number;
  bundle_price: number;
  badge_text: string;
  description: string;
  product_ids: string[];
  product_slugs: string[];
  updated_at?: string;
}

const DEFAULT_CONFIG: ComboPromoConfig = {
  active: true,
  title: 'Promoção Especial: 3 Conjuntos por $99',
  required_quantity: 3,
  bundle_price: 99.0,
  badge_text: '3 POR $99',
  description: 'Selecione quaisquer 3 conjuntos participantes e pague apenas $99.00 no total!',
  product_ids: [],
  product_slugs: [],
};

const COMBO_SETTINGS_ROW_ID = '00000000-0000-0000-0000-000000000097';
const COMBO_SETTINGS_SLUG = '__combo_promo_settings__';

function getLocalComboPath(): string {
  const candidates = [
    path.join(process.cwd(), 'apps', 'web', 'combo_promo_db.json'),
    path.join(process.cwd(), 'combo_promo_db.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.dirname(candidate))) {
      return candidate;
    }
  }
  return candidates[0];
}

function readLocalCombo(): ComboPromoConfig {
  try {
    const filePath = getLocalComboPath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('Erro ao ler combo_promo_db.json local:', err);
  }
  return DEFAULT_CONFIG;
}

function writeLocalCombo(data: ComboPromoConfig): void {
  try {
    const filePath = getLocalComboPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Erro ao salvar combo_promo_db.json local:', err);
  }
}

export async function GET() {
  try {
    // 1. Tentar ler do Supabase Server
    const { data: row, error } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', COMBO_SETTINGS_ROW_ID)
      .maybeSingle();

    if (!error && row?.description) {
      try {
        const parsed = JSON.parse(row.description);
        const config = { ...DEFAULT_CONFIG, ...parsed };
        writeLocalCombo(config);
        return NextResponse.json(
          { success: true, comboPromo: config },
          {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
          }
        );
      } catch (_) {}
    }

    // 2. Fallback local
    const local = readLocalCombo();
    return NextResponse.json(
      { success: true, comboPromo: local, fromFallback: true },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    const local = readLocalCombo();
    return NextResponse.json({ success: true, comboPromo: local, fromFallback: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = readLocalCombo();

    let updated: ComboPromoConfig;

    if (body.action === 'ADD_PRODUCTS') {
      const idsToAdd: string[] = Array.isArray(body.product_ids) ? body.product_ids : [];
      const slugsToAdd: string[] = Array.isArray(body.product_slugs) ? body.product_slugs : [];
      const newIds = Array.from(new Set([...current.product_ids, ...idsToAdd]));
      const newSlugs = Array.from(new Set([...(current.product_slugs || []), ...slugsToAdd]));
      updated = {
        ...current,
        product_ids: newIds,
        product_slugs: newSlugs,
        updated_at: new Date().toISOString(),
      };
    } else if (body.action === 'REMOVE_PRODUCTS') {
      const idsToRemove = new Set(Array.isArray(body.product_ids) ? body.product_ids : []);
      const slugsToRemove = new Set(Array.isArray(body.product_slugs) ? body.product_slugs : []);
      const newIds = current.product_ids.filter((id) => !idsToRemove.has(id));
      const newSlugs = (current.product_slugs || []).filter((s) => !slugsToRemove.has(s));
      updated = {
        ...current,
        product_ids: newIds,
        product_slugs: newSlugs,
        updated_at: new Date().toISOString(),
      };
    } else if (body.action === 'TOGGLE_PRODUCT') {
      const id = body.product_id;
      const slug = body.product_slug;
      const hasId = current.product_ids.includes(id);
      const newIds = hasId
        ? current.product_ids.filter((x) => x !== id)
        : [...current.product_ids, id];
      const newSlugs = slug
        ? hasId
          ? (current.product_slugs || []).filter((x) => x !== slug)
          : [...(current.product_slugs || []), slug]
        : current.product_slugs || [];
      updated = {
        ...current,
        product_ids: newIds,
        product_slugs: newSlugs,
        updated_at: new Date().toISOString(),
      };
    } else {
      // Atualização completa da configuração
      const incoming = body.comboPromo || body;
      updated = {
        ...current,
        ...incoming,
        required_quantity: Number(incoming.required_quantity) || 3,
        bundle_price: Number(incoming.bundle_price) || 99.0,
        product_ids: Array.isArray(incoming.product_ids) ? incoming.product_ids : current.product_ids,
        product_slugs: Array.isArray(incoming.product_slugs) ? incoming.product_slugs : (current.product_slugs || []),
        updated_at: new Date().toISOString(),
      };
    }

    // 1. Salvar cópia local
    writeLocalCombo(updated);

    // 2. Salvar no Supabase
    try {
      await supabaseServer.from('products').upsert({
        id: COMBO_SETTINGS_ROW_ID,
        title: '__COMBO_PROMO_SETTINGS__',
        slug: COMBO_SETTINGS_SLUG,
        description: JSON.stringify(updated),
      });
    } catch (dbErr) {
      console.warn('Erro ao salvar combo no Supabase (salvo localmente):', dbErr);
    }

    return NextResponse.json({ success: true, comboPromo: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
