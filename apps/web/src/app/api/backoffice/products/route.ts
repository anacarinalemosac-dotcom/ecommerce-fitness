import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // Busca produto específico
      const { data: product, error: prodErr } = await supabaseServer
        .from('products')
        .select('*, categories(*), suppliers(*)')
        .eq('id', id)
        .maybeSingle();

      if (prodErr || !product) {
        return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
      }

      const { data: variants } = await supabaseServer
        .from('product_variants')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: true });

      let meta: any = {};
      try {
        if (product.description && product.description.startsWith('{')) {
          meta = JSON.parse(product.description);
        } else if (product.description) {
          meta = { bio: product.description };
        }
      } catch (e) {}

      const primaryImage = meta.primary_image || (variants?.[0]?.images?.[0]) || '';
      const resolvedCost = (variants?.[0]?.cost_price !== undefined && variants?.[0]?.cost_price !== null)
        ? Number(variants[0].cost_price)
        : (meta.cost_price !== undefined ? Number(meta.cost_price) : 16.0);

      const enrichedProduct = {
        ...product,
        meta,
        primary_image: primaryImage,
        primaryImage: primaryImage,
        cost_price: resolvedCost,
        costPrice: resolvedCost,
        visible_online: meta.visible_online === true,
        visible_pos: meta.visible_pos !== false,
        variants: (variants || []).map((v: any) => ({
          ...v,
          cost_price: (v.cost_price !== undefined && v.cost_price !== null) ? Number(v.cost_price) : resolvedCost,
          costPrice: (v.cost_price !== undefined && v.cost_price !== null) ? Number(v.cost_price) : resolvedCost,
        })),
      };

      return NextResponse.json(
        { product: enrichedProduct, variants: enrichedProduct.variants },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'CDN-Cache-Control': 'no-store',
            'Vercel-CDN-Cache-Control': 'no-store',
          },
        }
      );
    }

    // Busca todos os produtos com suas variações (excluindo estados técnicos do radar e de configurações)
    const { data: products, error: prodsErr } = await supabaseServer
      .from('products')
      .select('*, categories(*), suppliers(*)')
      .neq('slug', '__live_radar_state__')
      .neq('slug', '__site_settings_state__')
      .order('created_at', { ascending: false });

    if (prodsErr) {
      console.warn('Erro ao buscar produtos do Supabase:', prodsErr);
      return NextResponse.json({ products: [] });
    }

    // Busca variações de todos os produtos
    const { data: allVariants } = await supabaseServer
      .from('product_variants')
      .select('*')
      .order('size', { ascending: true });

    const enrichedProducts = (products || []).map((p) => {
      let meta: any = {};
      try {
        if (p.description && p.description.startsWith('{')) {
          meta = JSON.parse(p.description);
        } else if (p.description) {
          meta = { bio: p.description };
        }
      } catch (e) {}

      const pVariants = (allVariants || []).filter((v) => v.product_id === p.id);
      const primaryImage = meta.primary_image || (pVariants[0]?.images?.[0]) || '';
      const resolvedCost = (pVariants[0]?.cost_price !== undefined && pVariants[0]?.cost_price !== null)
        ? Number(pVariants[0].cost_price)
        : (meta.cost_price !== undefined ? Number(meta.cost_price) : 16.0);

      return {
        ...p,
        meta,
        primary_image: primaryImage,
        primaryImage: primaryImage,
        cost_price: resolvedCost,
        costPrice: resolvedCost,
        visible_online: meta.visible_online === true,
        visible_pos: meta.visible_pos !== false,
        variants: pVariants.map((v) => ({
          ...v,
          cost_price: (v.cost_price !== undefined && v.cost_price !== null) ? Number(v.cost_price) : resolvedCost,
          costPrice: (v.cost_price !== undefined && v.cost_price !== null) ? Number(v.cost_price) : resolvedCost,
        })),
        total_stock: pVariants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0),
      };
    });

    return NextResponse.json(
      { products: enrichedProducts },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
        },
      }
    );
  } catch (err: any) {
    console.error('Erro no GET de produtos:', err);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      title,
      slug,
      description,
      composition,
      sizeGuide,
      tags,
      subcategory,
      category_id,
      supplier_id,
      variants,
      visible_online,
      visible_pos,
      promotional_price,
      compare_price,
      ribbon,
      brand,
      sku: generalSku,
      primary_image,
      cost_price,
      costPrice,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Título do produto é obrigatório.' }, { status: 400 });
    }

    const cleanSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const isUuid = (val: any) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const rawExplicitCost = (cost_price !== undefined && cost_price !== null && cost_price !== '')
      ? cost_price
      : (costPrice !== undefined && costPrice !== null && costPrice !== '')
      ? costPrice
      : (variants?.[0]?.cost_price !== undefined && variants?.[0]?.cost_price !== null && variants?.[0]?.cost_price !== '')
      ? variants[0].cost_price
      : null;

    const parsedExplicitCost = rawExplicitCost !== null && !isNaN(Number(rawExplicitCost))
      ? Number(rawExplicitCost)
      : 16.0;

    // Empacota metadados detalhados (composição, tabela de medidas, tags, subcategoria, visibilidade e atributos Wix)
    const primaryImg = primary_image || (variants?.[0]?.images?.[0]) || '';
    const metadataPayload = {
      bio: description || '',
      composition: composition || '',
      sizeGuide: sizeGuide || '',
      tags: Array.isArray(tags) ? tags : [],
      subcategory: subcategory || '',
      promotional_price: promotional_price || null,
      compare_price: compare_price ? parseFloat(compare_price) : null,
      ribbon: ribbon || '',
      brand: brand || 'ANA Fitness Wear',
      general_sku: generalSku || '',
      product_type: 'physical',
      visible_online: visible_online === true,
      visible_pos: visible_pos !== false,
      primary_image: primaryImg,
      cost_price: parsedExplicitCost,
    };
    const structuredDescription = JSON.stringify(metadataPayload);

    // 1. Grava ou atualiza na tabela 'products' usando upsert sem .single()
    const productData: any = {
      title: title.toUpperCase(),
      slug: cleanSlug,
      description: structuredDescription,
      category_id: category_id || null,
      supplier_id: supplier_id || null,
    };

    if (id && isUuid(id)) {
      productData.id = id;
    }

    const { data: savedProducts, error: prodError } = await supabaseServer
      .from('products')
      .upsert(productData)
      .select();

    if (prodError) {
      console.error('Erro ao salvar produto no Supabase:', prodError);
      return NextResponse.json({ error: `Erro no Supabase: ${prodError.message}` }, { status: 400 });
    }

    const product = savedProducts?.[0];
    const targetProductId = product?.id || (id && isUuid(id) ? id : null);

    if (!targetProductId) {
      return NextResponse.json({ error: 'Falha ao salvar produto: ID não pôde ser gerado.' }, { status: 500 });
    }

    // 2. Grava ou atualiza a matriz de variações na tabela 'product_variants' usando upsert sem .single()
    let savedVariants: any[] = [];

    if (Array.isArray(variants) && variants.length > 0 && targetProductId) {
      // Limpa variantes existentes para gravar a grade atualizada sem duplicatas ou órfãos
      await supabaseServer
        .from('product_variants')
        .delete()
        .eq('product_id', targetProductId);

      const variantsData = variants.map((v: any, i: number) => {
        const genBarcode = `789${Math.floor(100000000 + Math.random() * 900000000)}`;
        const rawVarCost = (v.cost_price !== undefined && v.cost_price !== null && v.cost_price !== '')
          ? v.cost_price
          : (v.costPrice !== undefined && v.costPrice !== null && v.costPrice !== '')
          ? v.costPrice
          : parsedExplicitCost;
        const vCost = !isNaN(Number(rawVarCost)) ? Number(rawVarCost) : parsedExplicitCost;

        const variantPayload: any = {
          product_id: targetProductId,
          sku: v.sku || `${title.slice(0, 3).toUpperCase()}-${(v.color || 'COR').slice(0, 3).toUpperCase()}-${v.size || 'TAM'}-${i + 1}`,
          barcode: v.barcode && String(v.barcode).trim() ? String(v.barcode).trim() : genBarcode,
          size: v.size || 'M',
          color: v.color || 'Preto Ônix',
          price: parseFloat(v.price) || 39.9,
          cost_price: vCost,
          stock_quantity: parseInt(v.stock_quantity) || 0,
          allow_backorder: Boolean(v.allow_backorder),
          estimated_production_days: parseInt(v.estimated_production_days) || 7,
          images: Array.isArray(v.images) && v.images.length > 0
            ? v.images
            : v.image
            ? [v.image]
            : primaryImg
            ? [primaryImg]
            : [],
          video_url: v.video_url || null,
        };

        if (v.id && isUuid(v.id)) {
          variantPayload.id = v.id;
        }

        return variantPayload;
      });

      let { data: upsertedVariants, error: varError } = await supabaseServer
        .from('product_variants')
        .upsert(variantsData)
        .select();

      // Fallback em caso de colisão de código de barras
      if (varError && varError.code === '23505' && varError.message?.includes('barcode')) {
        const retryVariantsData = variantsData.map((vd: any) => ({
          ...vd,
          barcode: `789${Math.floor(100000000 + Math.random() * 900000000)}`,
        }));
        const retry = await supabaseServer
          .from('product_variants')
          .upsert(retryVariantsData)
          .select();
        upsertedVariants = retry.data;
        varError = retry.error;
      }

      if (varError) {
        console.warn('Erro ao salvar variantes no Supabase:', varError);
      } else if (upsertedVariants) {
        savedVariants = upsertedVariants;
      }
    }

    return NextResponse.json({
      success: true,
      productId: targetProductId,
      product: product || { id: targetProductId, title, slug: cleanSlug },
      cost_price: parsedExplicitCost,
      costPrice: parsedExplicitCost,
      variants: savedVariants,
      message: 'Produto e variações gravados com sucesso no Supabase!',
    });
  } catch (err: any) {
    console.error('Erro na gravação do produto no Supabase:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório.' }, { status: 400 });
    }

    // Exclui variações vinculadas e o produto
    await supabaseServer.from('product_variants').delete().eq('product_id', id);
    const { error } = await supabaseServer.from('products').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Produto excluído com sucesso.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, visible_online, visible_pos, cost_price, costPrice } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório.' }, { status: 400 });
    }

    const { data: currentProduct, error: fetchErr } = await supabaseServer
      .from('products')
      .select('id, description')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !currentProduct) {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    }

    let meta: any = {};
    try {
      if (currentProduct.description && currentProduct.description.startsWith('{')) {
        meta = JSON.parse(currentProduct.description);
      } else if (currentProduct.description) {
        meta = { bio: currentProduct.description };
      }
    } catch (_) {
      meta = {};
    }

    if (visible_online !== undefined) {
      meta.visible_online = Boolean(visible_online);
    }
    if (visible_pos !== undefined) {
      meta.visible_pos = Boolean(visible_pos);
    }

    const inputCost = cost_price !== undefined ? cost_price : costPrice;
    if (inputCost !== undefined && inputCost !== null && inputCost !== '') {
      const numCost = parseFloat(inputCost);
      if (!isNaN(numCost)) {
        meta.cost_price = numCost;
        // Atualiza o custo em todas as variações do produto na tabela product_variants
        await supabaseServer
          .from('product_variants')
          .update({ cost_price: numCost })
          .eq('product_id', id);
      }
    }

    const { data: updatedRows, error: updErr } = await supabaseServer
      .from('products')
      .update({ description: JSON.stringify(meta) })
      .eq('id', id)
      .select('*');

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      product: updatedRows?.[0] || null,
      visible_online: meta.visible_online,
      visible_pos: meta.visible_pos,
      cost_price: meta.cost_price,
      costPrice: meta.cost_price,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


