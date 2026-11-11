export interface ParsedStripeItem {
  title: string;
  color: string;
  size: string;
}

export interface CatalogProductForMatch {
  id: string;
  title: string;
  slug: string;
  primary_image: string;
  cost_price: number | null;
  rawMeta: Record<string, any>;
  variants: Array<{
    id?: string;
    sku: string;
    size: string;
    color: string;
    price?: number;
    cost_price?: number | null;
    stock_quantity?: number;
    allow_backorder?: boolean;
    images?: string[];
    image?: string;
  }>;
}

export function parseStripeItemName(rawName: string): ParsedStripeItem {
  const clean = (rawName || '').trim();
  const match = clean.match(/^(.*?)\s*\(([^•)]+)\s*•\s*TAM\s+([^)]+)\)\s*$/i);
  if (match) {
    return {
      title: match[1].trim(),
      color: match[2].trim(),
      size: match[3].trim().toUpperCase(),
    };
  }
  return { title: clean || 'PEDIDO STRIPE ONLINE', color: '', size: '' };
}

export function normalizeProductTitleForMatch(title: string): string {
  return parseStripeItemName(title).title.trim().toUpperCase().replace(/\s+/g, ' ');
}

export function isMissingImageUrl(url?: string | null): boolean {
  if (!url) return true;
  const trimmed = String(url).trim();
  if (!trimmed) return true;
  if (trimmed.includes('logo-ana-fitness.png')) return true;
  return false;
}

function isGenericFallbackSku(sku?: string): boolean {
  if (!sku) return true;
  const s = sku.trim().toUpperCase();
  return s === '' || s === 'STRIPE-ORDER' || s === 'ANA-ITEM' || s === 'ANA-PDV-01';
}

function normalizeStr(val?: string | null): string {
  return String(val || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Queries Supabase `products` + `product_variants` using exact column names
 * (`color`, `images`, `description` JSON) so order enrichment and stock sync never fail.
 */
export async function loadCatalogProductsForOrderMatch(supabaseServer: any): Promise<CatalogProductForMatch[]> {
  try {
    const { data: rows, error } = await supabaseServer
      .from('products')
      .select('id, title, slug, description, variants:product_variants(id, sku, size, color, price, cost_price, stock_quantity, allow_backorder, images)')
      .neq('slug', '__live_radar_state__')
      .neq('slug', '__site_settings_state__')
      .neq('slug', '__instagram_direct_state__')
      .limit(350);

    if (error || !Array.isArray(rows)) {
      if (error) console.warn('Aviso ao carregar catálogo para enriquecimento:', error.message);
      return [];
    }

    return rows.map((row: any) => {
      let meta: Record<string, any> = {};
      try {
        if (typeof row.description === 'string' && row.description.trim().startsWith('{')) {
          meta = JSON.parse(row.description);
        }
      } catch (_) {}

      const dbVariants = Array.isArray(row.variants) ? row.variants : [];
      const metaVariants = Array.isArray(meta.variants) ? meta.variants : [];
      const mergedVariants = (dbVariants.length > 0 ? dbVariants : metaVariants).map((v: any) => ({
        id: v.id,
        sku: v.sku || '',
        size: String(v.size || '').trim().toUpperCase(),
        color: String(v.color || '').trim(),
        price: v.price !== undefined && v.price !== null ? Number(v.price) : undefined,
        cost_price: v.cost_price !== undefined && v.cost_price !== null ? Number(v.cost_price) : null,
        stock_quantity: v.stock_quantity !== undefined && v.stock_quantity !== null ? Number(v.stock_quantity) : 0,
        allow_backorder: v.allow_backorder,
        images: Array.isArray(v.images) ? v.images : (v.image ? [v.image] : []),
        image: (Array.isArray(v.images) && v.images[0]) || v.image || '',
      }));

      const firstImg =
        (!isMissingImageUrl(meta.primary_image) ? meta.primary_image : '') ||
        mergedVariants.find((v: any) => !isMissingImageUrl(v.image))?.image ||
        (Array.isArray(meta.images) ? meta.images.find((u: string) => !isMissingImageUrl(u)) : '') ||
        '';

      const prodCost =
        meta.cost_price !== undefined && meta.cost_price !== null && !isNaN(Number(meta.cost_price))
          ? Number(meta.cost_price)
          : mergedVariants[0]?.cost_price ?? null;

      return {
        id: row.id,
        title: row.title || '',
        slug: row.slug || '',
        primary_image: firstImg,
        cost_price: prodCost,
        rawMeta: meta,
        variants: mergedVariants,
      };
    });
  } catch (err) {
    console.warn('Erro inesperado em loadCatalogProductsForOrderMatch:', err);
    return [];
  }
}

export function findMatchingProductAndVariant(
  item: Record<string, any>,
  catalogProducts: CatalogProductForMatch[]
): { matchedProd?: CatalogProductForMatch; matchedVar?: CatalogProductForMatch['variants'][number] } {
  if (!Array.isArray(catalogProducts) || catalogProducts.length === 0) return {};

  const parsed = parseStripeItemName(item.title || '');
  const cleanTitleUpper = normalizeProductTitleForMatch(item.title || '');
  const itemSku = (item.sku || '').trim();
  const isGenericSku = isGenericFallbackSku(itemSku);

  const matchedProd = catalogProducts.find((cp) => {
    if (!isGenericSku && cp.variants.some((v) => v.sku?.toUpperCase() === itemSku.toUpperCase())) {
      return true;
    }
    if (item.slug && cp.slug && item.slug.toLowerCase() === cp.slug.toLowerCase()) {
      return true;
    }
    const cpUpper = cp.title.trim().toUpperCase().replace(/\s+/g, ' ');
    return Boolean(
      cpUpper &&
        cleanTitleUpper &&
        (cpUpper === cleanTitleUpper || cleanTitleUpper.includes(cpUpper) || cpUpper.includes(cleanTitleUpper))
    );
  });

  if (!matchedProd) return {};

  const targetSize = (parsed.size || item.size || '').trim().toUpperCase();
  const targetColor = normalizeStr(parsed.color || item.color || '');
  const variants = matchedProd.variants || [];

  let matchedVar =
    (!isGenericSku ? variants.find((v) => v.sku?.toUpperCase() === itemSku.toUpperCase()) : undefined) ||
    (targetSize && targetColor
      ? variants.find((v) => v.size === targetSize && normalizeStr(v.color) === targetColor)
      : undefined) ||
    (targetSize ? variants.find((v) => v.size === targetSize) : undefined) ||
    (targetColor ? variants.find((v) => normalizeStr(v.color) === targetColor) : undefined) ||
    variants[0];

  return { matchedProd, matchedVar };
}

/**
 * Enriches order items with real catalog SKU, size, color, thumbnail image, and registered cost_price.
 */
export function enrichOrderItemsWithCatalog<T extends Record<string, any>>(
  items: T[],
  catalogProducts: CatalogProductForMatch[]
): (T & { image: string })[] {
  if (!Array.isArray(items)) return [];

  return items.map((it) => {
    const parsed = parseStripeItemName(it.title || '');
    const originalSku = (it.sku || '').trim();
    const wasGenericSku = isGenericFallbackSku(originalSku);

    const { matchedProd, matchedVar } = findMatchingProductAndVariant(it, catalogProducts);

    let resolvedTitle = it.title || 'Peça Fitness';
    if (parsed.title && parsed.size && it.title?.includes('• TAM')) {
      resolvedTitle = parsed.title;
    } else if (matchedProd?.title && (!resolvedTitle || resolvedTitle === 'PEDIDO STRIPE ONLINE')) {
      resolvedTitle = matchedProd.title;
    }

    // Never leave legacy 'M' / 'Preto Ônix' placeholders if catalog/suffix knows the real variant
    let resolvedSize = (it.size || '').trim().toUpperCase();
    let resolvedColor = (it.color || '').trim();

    if (wasGenericSku) {
      resolvedSize = parsed.size || matchedVar?.size || resolvedSize;
      resolvedColor = parsed.color || matchedVar?.color || resolvedColor;
    } else {
      if (parsed.size && (!resolvedSize || resolvedSize === 'M')) resolvedSize = parsed.size;
      if (parsed.color && (!resolvedColor || resolvedColor === 'Preto Ônix' || resolvedColor === 'Padrão')) resolvedColor = parsed.color;
      if (!resolvedSize && matchedVar?.size) resolvedSize = matchedVar.size;
      if (!resolvedColor && matchedVar?.color) resolvedColor = matchedVar.color;
    }

    // Double-check against registered variants: if item says 'M'/'Preto Ônix' but matched product does NOT have that, trust matchedVar!
    if (matchedProd && matchedProd.variants.length > 0 && matchedVar) {
      const hasCurrentCombo = matchedProd.variants.some(
        (v) => v.size === resolvedSize && normalizeStr(v.color) === normalizeStr(resolvedColor)
      );
      if (!hasCurrentCombo && (wasGenericSku || resolvedSize === 'M' || normalizeStr(resolvedColor) === 'preto ônix')) {
        resolvedSize = matchedVar.size || resolvedSize;
        resolvedColor = matchedVar.color || resolvedColor;
      }
    }

    const resolvedSku =
      !wasGenericSku
        ? originalSku
        : matchedVar?.sku || matchedProd?.rawMeta?.general_sku || originalSku || 'ANA-ITEM';

    let resolvedImage = !isMissingImageUrl(it.image) ? String(it.image).trim() : '';
    if (!resolvedImage) {
      resolvedImage = matchedVar?.image || matchedVar?.images?.[0] || matchedProd?.primary_image || '';
    }

    const rawCost = Number(it.cost_price);
    const catalogCost =
      matchedVar?.cost_price !== undefined && matchedVar?.cost_price !== null
        ? Number(matchedVar.cost_price)
        : matchedProd?.cost_price !== undefined && matchedProd?.cost_price !== null
        ? Number(matchedProd.cost_price)
        : null;

    let resolvedCost = !isNaN(rawCost) && rawCost > 0 ? rawCost : 0;
    // If legacy Stripe order wrote hardcoded $16/$15 fallback while catalog product has true cost_price (unless manually edited), use catalogCost
    if (
      catalogCost !== null &&
      !isNaN(catalogCost) &&
      !it.manual_cost_edited &&
      (resolvedCost <= 0 || (wasGenericSku && (resolvedCost === 16 || resolvedCost === 15)))
    ) {
      resolvedCost = catalogCost;
    } else if (resolvedCost <= 0 && catalogCost !== null && !isNaN(catalogCost)) {
      resolvedCost = catalogCost;
    }

    return {
      ...it,
      title: resolvedTitle,
      size: resolvedSize || 'Único',
      color: resolvedColor || 'Padrão',
      sku: resolvedSku,
      image: resolvedImage,
      cost_price: resolvedCost,
    };
  });
}

/**
 * Decrements variant stock in Supabase `product_variants` AND syncs `products.description` JSON (`meta.variants`),
 * marking `allow_backorder: false` when stock reaches 0 so sold-out pieces immediately show as ESGOTADO / SOLD OUT.
 */
export async function decrementProductStockAfterSale(
  supabaseServer: any,
  items: any[],
  preloadedCatalog?: CatalogProductForMatch[]
): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) return;

  const catalogProducts =
    Array.isArray(preloadedCatalog) && preloadedCatalog.length > 0
      ? preloadedCatalog
      : await loadCatalogProductsForOrderMatch(supabaseServer);

  for (const it of items) {
    const qty = Math.max(1, Number(it.quantity) || 1);
    let targetVariantId: string | undefined;
    let targetProductId: string | undefined;
    let targetSku: string | undefined = !isGenericFallbackSku(it.sku) ? String(it.sku).trim() : undefined;
    let currentStock = 0;

    // 1. Try direct SKU lookup in product_variants
    if (targetSku) {
      try {
        const { data: v } = await supabaseServer
          .from('product_variants')
          .select('id, product_id, sku, stock_quantity')
          .eq('sku', targetSku)
          .maybeSingle();
        if (v) {
          targetVariantId = v.id;
          targetProductId = v.product_id;
          targetSku = v.sku;
          currentStock = Number(v.stock_quantity) || 0;
        }
      } catch (_) {}
    }

    // 2. Fallback: locate variant via catalog product match (handles copied SKUs, missing SKUs, legacy Stripe titles)
    if (!targetVariantId) {
      const { matchedProd, matchedVar } = findMatchingProductAndVariant(it, catalogProducts);
      if (matchedVar?.id) {
        targetVariantId = matchedVar.id;
        targetProductId = matchedProd?.id;
        targetSku = matchedVar.sku || targetSku;
        currentStock = Number(matchedVar.stock_quantity) || 0;
      } else if (matchedProd?.id && matchedVar?.sku) {
        try {
          const { data: v } = await supabaseServer
            .from('product_variants')
            .select('id, product_id, sku, stock_quantity')
            .eq('sku', matchedVar.sku)
            .maybeSingle();
          if (v) {
            targetVariantId = v.id;
            targetProductId = v.product_id;
            targetSku = v.sku;
            currentStock = Number(v.stock_quantity) || 0;
          }
        } catch (_) {}
      }
    }

    if (targetVariantId) {
      const newStock = Math.max(0, currentStock - qty);
      try {
        await supabaseServer
          .from('product_variants')
          .update({
            stock_quantity: newStock,
            ...(newStock <= 0 ? { allow_backorder: false } : {}),
          })
          .eq('id', targetVariantId);
      } catch (updErr) {
        console.warn(`Falha ao decrementar estoque da variante ${targetVariantId}:`, updErr);
      }

      // Sync JSON snapshot in products.description so all views agree immediately
      if (targetProductId) {
        try {
          const { data: prodRow } = await supabaseServer
            .from('products')
            .select('description')
            .eq('id', targetProductId)
            .maybeSingle();

          if (prodRow?.description) {
            const meta = JSON.parse(prodRow.description);
            if (Array.isArray(meta.variants)) {
              let matchedAny = false;
              meta.variants = meta.variants.map((mv: any) => {
                const sameId = mv.id && mv.id === targetVariantId;
                const sameSku = targetSku && mv.sku && mv.sku.toUpperCase() === targetSku.toUpperCase();
                const sameSizeColor =
                  (!it.size || String(mv.size || '').toUpperCase() === String(it.size).toUpperCase()) &&
                  (!it.color || normalizeStr(mv.color) === normalizeStr(it.color));
                if (sameId || sameSku || (meta.variants.length === 1 && sameSizeColor)) {
                  matchedAny = true;
                  return {
                    ...mv,
                    stock_quantity: newStock,
                    ...(newStock <= 0 ? { allow_backorder: false } : {}),
                  };
                }
                return mv;
              });

              if (!matchedAny && meta.variants.length === 1) {
                meta.variants[0] = {
                  ...meta.variants[0],
                  stock_quantity: newStock,
                  ...(newStock <= 0 ? { allow_backorder: false } : {}),
                };
              }

              const totalRemaining = meta.variants.reduce((acc: number, mv: any) => acc + (Number(mv.stock_quantity) || 0), 0);
              if (totalRemaining <= 0) {
                meta.allow_backorder = false;
                meta.visible_online = false;
                meta.is_draft = false;
                meta.out_of_stock_auto = true;
              }

              await supabaseServer
                .from('products')
                .update({ description: JSON.stringify(meta) })
                .eq('id', targetProductId);
            }
          }
        } catch (_) {}
      }
    }
  }
}
