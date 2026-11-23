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
  title: 'Combo Especial: 3 Conjuntos por $110',
  required_quantity: 3,
  bundle_price: 110.0,
  badge_text: 'COMBO 3 POR $110',
  description: 'Selecione quaisquer 3 conjuntos participantes por apenas $110! Frete calculado no checkout. Válido para todas as formas de pagamento.',
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

interface ProductRef {
  id: string;
  slug: string;
}

async function getCatalogMap(): Promise<{
  idToProduct: Map<string, ProductRef>;
  slugToProduct: Map<string, ProductRef>;
}> {
  const idToProduct = new Map<string, ProductRef>();
  const slugToProduct = new Map<string, ProductRef>();

  try {
    const { data: prods } = await supabaseServer
      .from('products')
      .select('id, slug')
      .neq('id', COMBO_SETTINGS_ROW_ID)
      .neq('id', '00000000-0000-0000-0000-000000000098');

    if (prods && Array.isArray(prods)) {
      for (const p of prods) {
        if (!p.id) continue;
        const ref: ProductRef = {
          id: String(p.id),
          slug: String(p.slug || ''),
        };
        idToProduct.set(ref.id.toLowerCase(), ref);
        if (ref.slug) {
          slugToProduct.set(ref.slug.toLowerCase(), ref);
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar mapa de produtos em combo-promo:', err);
  }

  return { idToProduct, slugToProduct };
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
        const config: ComboPromoConfig = { ...DEFAULT_CONFIG, ...parsed };
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
    const { idToProduct, slugToProduct } = await getCatalogMap();

    let updated: ComboPromoConfig;

    if (body.action === 'ADD_PRODUCTS') {
      const idsToAdd: string[] = Array.isArray(body.product_ids) ? body.product_ids : [];
      const slugsToAdd: string[] = Array.isArray(body.product_slugs) ? body.product_slugs : [];

      const targetIds = new Set(current.product_ids);
      const targetSlugs = new Set(current.product_slugs || []);

      for (const id of idsToAdd) {
        targetIds.add(id);
        const prod = idToProduct.get(String(id).toLowerCase());
        if (prod?.slug) targetSlugs.add(prod.slug);
      }
      for (const slug of slugsToAdd) {
        targetSlugs.add(slug);
        const prod = slugToProduct.get(String(slug).toLowerCase());
        if (prod?.id) targetIds.add(prod.id);
      }

      updated = {
        ...current,
        product_ids: Array.from(targetIds),
        product_slugs: Array.from(targetSlugs),
        updated_at: new Date().toISOString(),
      };
    } else if (body.action === 'REMOVE_PRODUCTS') {
      const rawIds: string[] = Array.isArray(body.product_ids) ? body.product_ids : [];
      const rawSlugs: string[] = Array.isArray(body.product_slugs) ? body.product_slugs : [];

      const idsToRemove = new Set(rawIds.map((x) => String(x).toLowerCase()));
      const slugsToRemove = new Set(rawSlugs.map((x) => String(x).toLowerCase()));

      // Expandir: qualquer ID sendo removido também marca seu slug para remoção
      for (const id of rawIds) {
        const prod = idToProduct.get(String(id).toLowerCase());
        if (prod?.slug) {
          slugsToRemove.add(prod.slug.toLowerCase());
        }
      }

      // Expandir: qualquer slug sendo removido também marca seu ID para remoção
      for (const slug of rawSlugs) {
        const prod = slugToProduct.get(String(slug).toLowerCase());
        if (prod?.id) {
          idsToRemove.add(prod.id.toLowerCase());
        }
      }

      const newIds = current.product_ids.filter((id) => {
        const idLower = String(id).toLowerCase();
        if (idsToRemove.has(idLower)) return false;
        const prod = idToProduct.get(idLower);
        if (prod?.slug && slugsToRemove.has(prod.slug.toLowerCase())) return false;
        return true;
      });

      const newSlugs = (current.product_slugs || []).filter((slug) => {
        const slugLower = String(slug).toLowerCase();
        if (slugsToRemove.has(slugLower)) return false;
        const prod = slugToProduct.get(slugLower);
        if (prod?.id && idsToRemove.has(prod.id.toLowerCase())) return false;
        return true;
      });

      updated = {
        ...current,
        product_ids: newIds,
        product_slugs: newSlugs,
        updated_at: new Date().toISOString(),
      };
    } else if (body.action === 'TOGGLE_PRODUCT') {
      const rawId = body.product_id ? String(body.product_id) : '';
      const rawSlug = body.product_slug ? String(body.product_slug) : '';

      const ref =
        (rawId ? idToProduct.get(rawId.toLowerCase()) : null) ||
        (rawSlug ? slugToProduct.get(rawSlug.toLowerCase()) : null);

      const targetId = ref?.id || rawId;
      const targetSlug = ref?.slug || rawSlug;
      const targetIdLower = targetId.toLowerCase();
      const targetSlugLower = targetSlug.toLowerCase();

      // Checa se o produto está atualmente participando do combo por ID ou por slug
      const isCurrentlyIn =
        (targetIdLower && current.product_ids.some((x) => String(x).toLowerCase() === targetIdLower)) ||
        (targetSlugLower && (current.product_slugs || []).some((x) => String(x).toLowerCase() === targetSlugLower));

      let newIds: string[];
      let newSlugs: string[];

      if (isCurrentlyIn) {
        // REMOVER: limpa tanto por ID quanto por slug
        newIds = current.product_ids.filter((x) => {
          const xLower = String(x).toLowerCase();
          if (targetIdLower && xLower === targetIdLower) return false;
          const prod = idToProduct.get(xLower);
          if (targetSlugLower && prod?.slug?.toLowerCase() === targetSlugLower) return false;
          return true;
        });

        newSlugs = (current.product_slugs || []).filter((s) => {
          const sLower = String(s).toLowerCase();
          if (targetSlugLower && sLower === targetSlugLower) return false;
          const prod = slugToProduct.get(sLower);
          if (targetIdLower && prod?.id?.toLowerCase() === targetIdLower) return false;
          return true;
        });
      } else {
        // ADICIONAR: inclui tanto o ID quanto o slug
        newIds = targetId
          ? Array.from(new Set([...current.product_ids, targetId]))
          : current.product_ids;
        newSlugs = targetSlug
          ? Array.from(new Set([...(current.product_slugs || []), targetSlug]))
          : current.product_slugs || [];
      }

      updated = {
        ...current,
        product_ids: newIds,
        product_slugs: newSlugs,
        updated_at: new Date().toISOString(),
      };
    } else {
      // Atualização completa da configuração (ex: pelo Modal)
      const incoming = body.comboPromo || body;

      const incomingIds: string[] = Array.isArray(incoming.product_ids)
        ? incoming.product_ids
        : current.product_ids;

      let derivedSlugs: string[] = [];
      if (Array.isArray(incoming.product_ids)) {
        const idSet = new Set(incomingIds.map((x) => String(x).toLowerCase()));
        const slugsFromIncomingProds: string[] = [];
        for (const id of incomingIds) {
          const prod = idToProduct.get(String(id).toLowerCase());
          if (prod?.slug) slugsFromIncomingProds.push(prod.slug);
        }
        const incomingSlugs = Array.isArray(incoming.product_slugs) ? incoming.product_slugs : [];
        derivedSlugs = Array.from(
          new Set([
            ...slugsFromIncomingProds,
            ...incomingSlugs.filter((s) => {
              const p = slugToProduct.get(String(s).toLowerCase());
              return p?.id ? idSet.has(p.id.toLowerCase()) : false;
            }),
          ])
        );
      } else {
        derivedSlugs = Array.isArray(incoming.product_slugs)
          ? incoming.product_slugs
          : current.product_slugs || [];
      }

      updated = {
        ...current,
        ...incoming,
        required_quantity: Number(incoming.required_quantity) || 3,
        bundle_price: Number(incoming.bundle_price) || 110.0,
        product_ids: incomingIds,
        product_slugs: derivedSlugs,
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
