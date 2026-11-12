import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // 1. Busca todos os produtos com suas categorias
    const { data: products, error: pErr } = await supabaseServer
      .from('products')
      .select('id, title, slug, description, category_id, supplier_id, created_at, categories(id, name)')
      .order('title', { ascending: true });

    if (pErr) {
      console.error('[API Inventory GET] Error fetching products:', pErr);
      return NextResponse.json({ error: 'Erro ao buscar catálogo de produtos.' }, { status: 500 });
    }

    // 2. Busca todas as variações da tabela product_variants
    const { data: variants, error: vErr } = await supabaseServer
      .from('product_variants')
      .select('*')
      .order('color', { ascending: true });

    if (vErr) {
      console.error('[API Inventory GET] Error fetching variants:', vErr);
      return NextResponse.json({ error: 'Erro ao buscar variações de estoque.' }, { status: 500 });
    }

    const productsMap = new Map<string, any>();
    (products || []).forEach((p: any) => {
      let meta: any = {};
      try {
        if (p.description && typeof p.description === 'string' && p.description.startsWith('{')) {
          meta = JSON.parse(p.description);
        }
      } catch (e) {}
      productsMap.set(p.id, { ...p, _meta: meta });
    });

    const inventoryItems: any[] = [];
    const handledProductVariantPairs = new Set<string>();

    // 3. Itera sobre todas as variantes do banco
    (variants || []).forEach((v: any) => {
      const prod = productsMap.get(v.product_id);
      if (!prod) return; // ignora variantes órfãs de produtos deletados

      // Evita produtos de sistema interno
      if (prod.title?.startsWith('__')) return;

      const meta = prod._meta || {};

      const primaryImage =
        (Array.isArray(v.images) && v.images[0]) ||
        (Array.isArray(meta.images) && meta.images[0]) ||
        meta.primary_image ||
        '/placeholder.png';

      const unitCost = Number(v.cost_price ?? meta.cost_price ?? 16.0);
      const unitPrice = Number(v.price ?? meta.price ?? meta.promotional_price ?? 44.9);
      const stock = Math.max(0, parseInt(String(v.stock_quantity ?? 0), 10) || 0);

      // Metadados de cor (ex: código hex caso configurado)
      const colorMeta = Array.isArray(meta.colors)
        ? meta.colors.find((c: any) => c.name?.toLowerCase() === v.color?.toLowerCase())
        : null;

      const categoryName = prod.categories?.name || 'Sem Categoria';

      // Status do produto na loja
      const isVisibleOnline = meta.visible_online === true;
      const isDraft = meta.is_draft === true || !isVisibleOnline;
      const isSpoiler = meta.badge === 'SPOILER' || meta.is_spoiler === true;
      const isLiveProduct = isVisibleOnline && !isDraft && !isSpoiler;
      const isLiveWithStock = isLiveProduct && stock > 0;

      inventoryItems.push({
        id: v.id,
        productId: prod.id,
        productTitle: prod.title,
        productSlug: prod.slug,
        category: categoryName,
        sku: v.sku || `SKU-${v.id.slice(0, 8)}`,
        barcode: v.barcode || '',
        color: v.color || 'Padrão',
        colorHex: colorMeta?.hex || null,
        size: v.size || 'Único',
        stockQuantity: stock,
        unitCost,
        unitPrice,
        totalCostValue: stock * unitCost,
        totalRetailValue: stock * unitPrice,
        profitValue: stock * (unitPrice - unitCost),
        marginEstimate: unitPrice > 0 ? ((unitPrice - unitCost) / unitPrice) * 100 : 0,
        image: primaryImage,
        visibleOnline: isVisibleOnline,
        isDraft,
        isSpoiler,
        isLiveProduct,
        isLiveWithStock,
        allowBackorder: Boolean(v.allow_backorder),
        updatedAt: v.updated_at || v.created_at,
      });

      handledProductVariantPairs.add(`${v.product_id}__${v.color}__${v.size}`);
    });

    // 4. Verifica se algum produto possui variações apenas em _meta.variants que ainda não estavam no banco
    (products || []).forEach((prod: any) => {
      if (prod.title?.startsWith('__')) return;
      const meta = prod._meta || {};
      const metaVars = Array.isArray(meta.variants) ? meta.variants : [];
      const isVisibleOnline = meta.visible_online === true;
      const isDraft = meta.is_draft === true || !isVisibleOnline;
      const isSpoiler = meta.badge === 'SPOILER' || meta.is_spoiler === true;
      const isLiveProduct = isVisibleOnline && !isDraft && !isSpoiler;

      metaVars.forEach((mv: any, idx: number) => {
        const pairKey = `${prod.id}__${mv.color}__${mv.size}`;
        if (!handledProductVariantPairs.has(pairKey)) {
          const unitCost = Number(mv.cost_price ?? meta.cost_price ?? 16.0);
          const unitPrice = Number(mv.price ?? meta.price ?? meta.promotional_price ?? 44.9);
          const stock = Math.max(0, parseInt(String(mv.stock_quantity ?? mv.stock ?? 0), 10) || 0);
          const primaryImage =
            (Array.isArray(mv.images) && mv.images[0]) ||
            (Array.isArray(meta.images) && meta.images[0]) ||
            meta.primary_image ||
            '/placeholder.png';

          const isLiveWithStock = isLiveProduct && stock > 0;

          inventoryItems.push({
            id: mv.id || `virtual-${prod.id}-${idx}`,
            productId: prod.id,
            productTitle: prod.title,
            productSlug: prod.slug,
            category: prod.categories?.name || 'Sem Categoria',
            sku: mv.sku || `SKU-${prod.slug.slice(0, 8)}-${idx}`,
            barcode: mv.barcode || '',
            color: mv.color || 'Padrão',
            colorHex: null,
            size: mv.size || 'Único',
            stockQuantity: stock,
            unitCost,
            unitPrice,
            totalCostValue: stock * unitCost,
            totalRetailValue: stock * unitPrice,
            profitValue: stock * (unitPrice - unitCost),
            marginEstimate: unitPrice > 0 ? ((unitPrice - unitCost) / unitPrice) * 100 : 0,
            image: primaryImage,
            visibleOnline: isVisibleOnline,
            isDraft,
            isSpoiler,
            isLiveProduct,
            isLiveWithStock,
            allowBackorder: false,
            updatedAt: prod.created_at,
          });
        }
      });
    });

    // 5. Calcula KPIs consolidados de estoque
    let totalStockPieces = 0;
    let totalCostAsset = 0;
    let totalRetailAsset = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inStockCount = 0;

    // Totais específicos para peças que estão no ar com estoque
    let liveVariantsCount = 0;
    let livePiecesCount = 0;
    let liveCostAsset = 0;
    let liveRetailAsset = 0;

    const categoriesSet = new Set<string>();
    const colorsSet = new Set<string>();
    const sizesSet = new Set<string>();

    inventoryItems.forEach((item) => {
      totalStockPieces += item.stockQuantity;
      totalCostAsset += item.totalCostValue;
      totalRetailAsset += item.totalRetailValue;

      if (item.stockQuantity === 0) {
        outOfStockCount++;
      } else if (item.stockQuantity <= 3) {
        lowStockCount++;
        inStockCount++;
      } else {
        inStockCount++;
      }

      if (item.isLiveWithStock) {
        liveVariantsCount++;
        livePiecesCount += item.stockQuantity;
        liveCostAsset += item.totalCostValue;
        liveRetailAsset += item.totalRetailValue;
      }

      if (item.category) categoriesSet.add(item.category);
      if (item.color) colorsSet.add(item.color);
      if (item.size) sizesSet.add(item.size);
    });

    const projectedProfit = totalRetailAsset - totalCostAsset;
    const overallMarginPct = totalRetailAsset > 0 ? (projectedProfit / totalRetailAsset) * 100 : 0;

    const liveProjectedProfit = liveRetailAsset - liveCostAsset;
    const liveOverallMarginPct = liveRetailAsset > 0 ? (liveProjectedProfit / liveRetailAsset) * 100 : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalVariants: inventoryItems.length,
        totalStockPieces,
        totalCostAsset,
        totalRetailAsset,
        projectedProfit,
        overallMarginPct,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        // Indicadores específicos das peças NO AR com estoque:
        liveVariantsCount,
        livePiecesCount,
        liveCostAsset,
        liveRetailAsset,
        liveProjectedProfit,
        liveOverallMarginPct,
      },
      filters: {
        categories: Array.from(categoriesSet).sort(),
        colors: Array.from(colorsSet).sort(),
        sizes: Array.from(sizesSet).sort(),
      },
      items: inventoryItems,
    });
  } catch (err: any) {
    console.error('[API Inventory GET] Unexpected exception:', err);
    return NextResponse.json({ error: err.message || 'Erro inesperado no servidor.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { variantId, productId, stockQuantity } = body;

    if (!variantId && !productId) {
      return NextResponse.json({ error: 'variantId ou productId é obrigatório.' }, { status: 400 });
    }

    const newStock = Math.max(0, parseInt(String(stockQuantity), 10) || 0);

    const isUuid = (val: any): boolean =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    let updatedVariant = null;

    // 1. Atualiza na tabela product_variants se for um UUID válido do DB
    if (isUuid(variantId)) {
      const { data, error } = await supabaseServer
        .from('product_variants')
        .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
        .eq('id', variantId)
        .select()
        .single();

      if (error) {
        console.error('[API Inventory PATCH] Error updating variant:', error);
        return NextResponse.json({ error: `Erro ao atualizar estoque da variante: ${error.message}` }, { status: 500 });
      }
      updatedVariant = data;
    }

    // 2. Se temos productId, sincronizamos também o JSON de descrição (meta.variants)
    const targetProductId = productId || updatedVariant?.product_id;
    if (targetProductId && isUuid(targetProductId)) {
      const { data: prod } = await supabaseServer
        .from('products')
        .select('id, description')
        .eq('id', targetProductId)
        .maybeSingle();

      if (prod?.description && prod.description.startsWith('{')) {
        try {
          const meta = JSON.parse(prod.description);
          if (Array.isArray(meta.variants)) {
            let metaChanged = false;
            meta.variants = meta.variants.map((mv: any) => {
              if (
                (variantId && mv.id === variantId) ||
                (updatedVariant &&
                  mv.color?.toLowerCase() === updatedVariant.color?.toLowerCase() &&
                  mv.size?.toLowerCase() === updatedVariant.size?.toLowerCase())
              ) {
                metaChanged = true;
                return { ...mv, stock_quantity: newStock, stock: newStock };
              }
              return mv;
            });

            if (metaChanged) {
              await supabaseServer
                .from('products')
                .update({ description: JSON.stringify(meta) })
                .eq('id', targetProductId);
            }
          }
        } catch (e) {
          console.warn('[API Inventory PATCH] Could not update meta.variants in product description:', e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      newStock,
      variant: updatedVariant,
    });
  } catch (err: any) {
    console.error('[API Inventory PATCH] Unexpected exception:', err);
    return NextResponse.json({ error: err.message || 'Erro inesperado ao atualizar estoque.' }, { status: 500 });
  }
}
