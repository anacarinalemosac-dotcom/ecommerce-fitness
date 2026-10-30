import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { syncProductToTikTokShop } from '@/lib/tiktokShopService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const isUuid = (val: any): boolean =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

function reconcileProductVariants(dbVariants: any[], metaVariants: any[]) {
  const dbList = Array.isArray(dbVariants) ? dbVariants : [];
  const metaList = Array.isArray(metaVariants) ? metaVariants : [];

  if (metaList.length === 0) return dbList;
  if (dbList.length === 0) return metaList;

  // Mapa de variantes por combinação (cor, tamanho)
  const map = new Map<string, any>();
  // 1. Base com as variantes salvas no JSON de descrição
  metaList.forEach((mv: any) => {
    const key = `${String(mv.color || '').trim().toLowerCase()}__${String(mv.size || '').trim().toLowerCase()}`;
    map.set(key, mv);
  });
  // 2. Sobrepõe com dados da tabela product_variants (têm IDs reais do Postgres, barcodes, etc.)
  dbList.forEach((dv: any) => {
    const key = `${String(dv.color || '').trim().toLowerCase()}__${String(dv.size || '').trim().toLowerCase()}`;
    if (map.has(key)) {
      map.set(key, { ...map.get(key), ...dv });
    } else {
      map.set(key, dv);
    }
  });

  return Array.from(map.values());
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // Busca produto específico por UUID ou Slug
      let prodQuery = supabaseServer
        .from('products')
        .select('*, categories(*), suppliers(*)');

      if (isUuid(id)) {
        prodQuery = prodQuery.eq('id', id);
      } else {
        prodQuery = prodQuery.eq('slug', id);
      }

      const { data: product, error: prodErr } = await prodQuery.maybeSingle();

      if (prodErr || !product) {
        return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
      }

      const { data: variants } = await supabaseServer
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: true });

      let meta: any = {};
      try {
        if (product.description && product.description.startsWith('{')) {
          meta = JSON.parse(product.description);
        } else if (product.description) {
          meta = { bio: product.description };
        }
      } catch (e) {}

      const effectiveVariants = reconcileProductVariants(variants || [], meta.variants || []);

      const inStockVariant = effectiveVariants.find((v: any) => {
        const stockQty = Number(v.stock_quantity ?? v.stock ?? 0);
        const varImg = Array.isArray(v.images) && v.images.length > 0 ? v.images[0] : v.image;
        return stockQty > 0 && Boolean(varImg);
      });
      const inStockImage = inStockVariant
        ? (Array.isArray(inStockVariant.images) && inStockVariant.images.length > 0 ? inStockVariant.images[0] : inStockVariant.image)
        : null;

      const primaryImage = meta.primary_image || (meta.images?.[0]) || inStockImage || (effectiveVariants?.[0]?.images?.[0]) || '';
      let galleryImages = Array.isArray(meta.images) && meta.images.length > 0
        ? [...meta.images]
        : Array.isArray(meta.gallery) && meta.gallery.length > 0
        ? [...meta.gallery]
        : Array.from(new Set([
            primaryImage,
            ...effectiveVariants.flatMap((v: any) => Array.isArray(v.images) ? v.images : (v.image ? [v.image] : []))
          ].filter(Boolean)));

      if (primaryImage) {
        const pIdx = galleryImages.indexOf(primaryImage);
        if (pIdx !== -1) galleryImages.splice(pIdx, 1);
        galleryImages.unshift(primaryImage);
      }

      const resolvedCost = (effectiveVariants?.[0]?.cost_price !== undefined && effectiveVariants?.[0]?.cost_price !== null && !isNaN(Number(effectiveVariants[0].cost_price)))
        ? Number(effectiveVariants[0].cost_price)
        : (meta.cost_price !== undefined && meta.cost_price !== null && !isNaN(Number(meta.cost_price)))
        ? Number(meta.cost_price)
        : 16.0;

      const resolvedPrice = (meta.price !== undefined && meta.price !== null && !isNaN(Number(meta.price)))
        ? Number(meta.price)
        : (meta.promotional_price !== undefined && meta.promotional_price !== null && !isNaN(Number(meta.promotional_price)))
        ? Number(meta.promotional_price)
        : (effectiveVariants?.[0]?.price !== undefined && effectiveVariants?.[0]?.price !== null && !isNaN(Number(effectiveVariants[0].price)))
        ? Number(effectiveVariants[0].price)
        : 44.90;

      const resolvedColors = Array.isArray(meta.colors) && meta.colors.length > 0
        ? meta.colors
        : Array.from(new Set(effectiveVariants.map((v: any) => v.color).filter(Boolean))).map((cName: any) => {
            const match = effectiveVariants.find((v: any) => v.color === cName);
            return { name: cName, hex: match?.colorHex || '#0A0A0A' };
          });

      const variantSizes = effectiveVariants.map((v: any) => v.size).filter(Boolean);
      const metaSizes = Array.isArray(meta.sizes) ? meta.sizes.filter(Boolean) : [];
      const resolvedSizes = Array.from(new Set([...metaSizes, ...variantSizes]));

      const enrichedProduct = {
        ...product,
        meta,
        primary_image: primaryImage,
        primaryImage: primaryImage,
        images: galleryImages,
        galleryImages: galleryImages,
        media_list: meta.media_list || [],
        colors: resolvedColors,
        sizes: resolvedSizes,
        price: resolvedPrice,
        cost_price: resolvedCost,
        costPrice: resolvedCost,
        visible_online: meta.visible_online === true,
        visible_pos: meta.visible_pos !== false,
        variants: (effectiveVariants || []).map((v: any) => {
          let varImg = Array.isArray(v.images) && v.images.length > 0 ? v.images[0] : v.image;
          if (!varImg && Array.isArray(meta.media_list) && v.color) {
            const mMatch = meta.media_list.find((m: any) => m.associatedColor && m.associatedColor.trim().toLowerCase() === v.color.trim().toLowerCase());
            if (mMatch?.url) varImg = mMatch.url;
          }
          return {
            ...v,
            image: varImg || galleryImages[0] || primaryImage,
            images: varImg ? [varImg] : (Array.isArray(v.images) && v.images.length > 0 ? v.images : galleryImages),
            price: (v.price !== undefined && v.price !== null && !isNaN(Number(v.price))) ? Number(v.price) : resolvedPrice,
            cost_price: (v.cost_price !== undefined && v.cost_price !== null) ? Number(v.cost_price) : resolvedCost,
            costPrice: (v.cost_price !== undefined && v.cost_price !== null) ? Number(v.cost_price) : resolvedCost,
          };
        }),
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
      .neq('slug', '__instagram_direct_state__')
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
      const effectiveVariants = reconcileProductVariants(pVariants, meta.variants || []);

      const inStockVariant = effectiveVariants.find((v: any) => {
        const stockQty = Number(v.stock_quantity ?? v.stock ?? 0);
        const varImg = Array.isArray(v.images) && v.images.length > 0 ? v.images[0] : v.image;
        return stockQty > 0 && Boolean(varImg);
      });
      const inStockImage = inStockVariant
        ? (Array.isArray(inStockVariant.images) && inStockVariant.images.length > 0 ? inStockVariant.images[0] : inStockVariant.image)
        : null;

      const primaryImage = meta.primary_image || (meta.images?.[0]) || inStockImage || (effectiveVariants[0]?.images?.[0]) || '';
      let galleryImages = Array.isArray(meta.images) && meta.images.length > 0
        ? [...meta.images]
        : Array.isArray(meta.gallery) && meta.gallery.length > 0
        ? [...meta.gallery]
        : Array.from(new Set([
            primaryImage,
            ...effectiveVariants.flatMap((v: any) => Array.isArray(v.images) ? v.images : (v.image ? [v.image] : []))
          ].filter(Boolean)));

      if (primaryImage) {
        const pIdx = galleryImages.indexOf(primaryImage);
        if (pIdx !== -1) galleryImages.splice(pIdx, 1);
        galleryImages.unshift(primaryImage);
      }

      const resolvedCost = (effectiveVariants[0]?.cost_price !== undefined && effectiveVariants[0]?.cost_price !== null)
        ? Number(effectiveVariants[0].cost_price)
        : (meta.cost_price !== undefined ? Number(meta.cost_price) : 16.0);

      const resolvedPrice = (meta.price !== undefined && meta.price !== null && !isNaN(Number(meta.price)))
        ? Number(meta.price)
        : (meta.promotional_price !== undefined && meta.promotional_price !== null && !isNaN(Number(meta.promotional_price)))
        ? Number(meta.promotional_price)
        : (effectiveVariants[0]?.price !== undefined && effectiveVariants[0]?.price !== null && !isNaN(Number(effectiveVariants[0].price)))
        ? Number(effectiveVariants[0].price)
        : 44.90;

      const resolvedColors = Array.isArray(meta.colors) && meta.colors.length > 0
        ? meta.colors
        : Array.from(new Set(effectiveVariants.map((v: any) => v.color).filter(Boolean))).map((cName: any) => {
            const match = effectiveVariants.find((v: any) => v.color === cName);
            return { name: cName, hex: match?.colorHex || '#0A0A0A' };
          });

      const variantSizes = effectiveVariants.map((v: any) => v.size).filter(Boolean);
      const metaSizes = Array.isArray(meta.sizes) ? meta.sizes.filter(Boolean) : [];
      const resolvedSizes = Array.from(new Set([...metaSizes, ...variantSizes]));

      return {
        ...p,
        meta,
        primary_image: primaryImage,
        primaryImage: primaryImage,
        images: galleryImages,
        galleryImages: galleryImages,
        media_list: meta.media_list || [],
        colors: resolvedColors,
        sizes: resolvedSizes,
        price: resolvedPrice,
        cost_price: resolvedCost,
        costPrice: resolvedCost,
        visible_online: meta.visible_online === true,
        visible_pos: meta.visible_pos !== false,
        variants: effectiveVariants.map((v: any) => {
          let varImg = Array.isArray(v.images) && v.images.length > 0 ? v.images[0] : v.image;
          if (!varImg && Array.isArray(meta.media_list) && v.color) {
            const mMatch = meta.media_list.find((m: any) => m.associatedColor && m.associatedColor.trim().toLowerCase() === v.color.trim().toLowerCase());
            if (mMatch?.url) varImg = mMatch.url;
          }
          return {
            ...v,
            image: varImg || galleryImages[0] || primaryImage,
            images: varImg ? [varImg] : (Array.isArray(v.images) && v.images.length > 0 ? v.images : galleryImages),
            price: (v.price !== undefined && v.price !== null && !isNaN(Number(v.price))) ? Number(v.price) : resolvedPrice,
            cost_price: (v.cost_price !== undefined && v.cost_price !== null) ? Number(v.cost_price) : resolvedCost,
            costPrice: (v.cost_price !== undefined && v.cost_price !== null) ? Number(v.cost_price) : resolvedCost,
          };
        }),
        total_stock: effectiveVariants.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0),
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
      description_pt,
      description_en,
      composition,
      cups_type,
      removable_cups,
      has_cups,
      sizeGuide,
      tags,
      subcategory,
      category_id,
      supplier_id,
      variants,
      visible_online,
      visible_pos,
      price,
      defaultPrice,
      promotional_price,
      compare_price,
      ribbon,
      brand,
      sku: generalSku,
      primary_image,
      images,
      gallery,
      media_list,
      colors,
      sizes,
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

    const rawExplicitPrice = (price !== undefined && price !== null && price !== '')
      ? price
      : (defaultPrice !== undefined && defaultPrice !== null && defaultPrice !== '')
      ? defaultPrice
      : (promotional_price !== undefined && promotional_price !== null && promotional_price !== '')
      ? promotional_price
      : (variants?.[0]?.price !== undefined && variants?.[0]?.price !== null && variants?.[0]?.price !== '')
      ? variants[0].price
      : 44.90;

    const parsedExplicitPrice = !isNaN(Number(rawExplicitPrice)) ? Number(rawExplicitPrice) : 44.90;

    // Constrói galeria completa com todas as fotos passadas, garantindo que a capa escolhida esteja no índice 0
    const rawImagesList: string[] = [];
    if (primary_image && typeof primary_image === 'string' && !primary_image.startsWith('data:')) {
      rawImagesList.push(primary_image);
    }
    if (Array.isArray(images)) {
      images.forEach((u) => { if (u && !u.startsWith('data:') && !rawImagesList.includes(u)) rawImagesList.push(u); });
    }
    if (Array.isArray(gallery)) {
      gallery.forEach((u) => { if (u && !u.startsWith('data:') && !rawImagesList.includes(u)) rawImagesList.push(u); });
    }
    if (Array.isArray(media_list)) {
      media_list.forEach((m: any) => {
        if (m?.url && !m.url.startsWith('data:') && !rawImagesList.includes(m.url)) rawImagesList.push(m.url);
      });
    }
    if (Array.isArray(variants)) {
      variants.forEach((v: any) => {
        if (Array.isArray(v.images)) {
          v.images.forEach((u: string) => { if (u && !u.startsWith('data:') && !rawImagesList.includes(u)) rawImagesList.push(u); });
        } else if (v.image && !rawImagesList.includes(v.image)) {
          rawImagesList.push(v.image);
        }
      });
    }

    const primaryImg = primary_image || rawImagesList[0] || (variants?.[0]?.images?.[0]) || '';
    if (primaryImg) {
      const pIdx = rawImagesList.indexOf(primaryImg);
      if (pIdx !== -1) rawImagesList.splice(pIdx, 1);
      rawImagesList.unshift(primaryImg);
    }
    const finalGalleryImages = Array.from(new Set(rawImagesList.filter((u) => u && !u.startsWith('data:'))));

    // Determina o tipo de bojo
    const finalCupsType = cups_type || (removable_cups ? 'removable' : has_cups ? 'fixed' : 'none');

    // 1. Resolução segura de category_id e supplier_id para evitar violações de FK / UUID
    let resolvedCategoryId: string | null = null;
    if (category_id && isUuid(category_id)) {
      const { data: catRow } = await supabaseServer
        .from('categories')
        .select('id')
        .eq('id', category_id)
        .maybeSingle();
      if (catRow?.id) {
        resolvedCategoryId = catRow.id;
      }
    } else if (category_id && typeof category_id === 'string' && category_id.trim()) {
      const catClean = category_id.trim().toLowerCase();
      const { data: catRow } = await supabaseServer
        .from('categories')
        .select('id')
        .or(`slug.eq.${catClean},name.ilike.${catClean}`)
        .maybeSingle();
      if (catRow?.id) {
        resolvedCategoryId = catRow.id;
      }
    }

    let resolvedSupplierId: string | null = null;
    if (supplier_id && isUuid(supplier_id)) {
      const { data: supRow } = await supabaseServer
        .from('suppliers')
        .select('id')
        .eq('id', supplier_id)
        .maybeSingle();
      if (supRow?.id) {
        resolvedSupplierId = supRow.id;
      }
    } else if (supplier_id && typeof supplier_id === 'string' && supplier_id.trim()) {
      const supClean = supplier_id.trim();
      const { data: supRow } = await supabaseServer
        .from('suppliers')
        .select('id')
        .ilike('company_name', supClean)
        .maybeSingle();
      if (supRow?.id) {
        resolvedSupplierId = supRow.id;
      }
    }

    // Se nenhum fornecedor foi resolvido, busca o primeiro existente no banco como fallback seguro
    if (!resolvedSupplierId) {
      const { data: defaultSup } = await supabaseServer
        .from('suppliers')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (defaultSup?.id) {
        resolvedSupplierId = defaultSup.id;
      }
    }

    // 2. Resolução segura do ID e Slug para evitar colisão de chave única (products_slug_key)
    let targetProductId: string | null = (id && isUuid(id)) ? id : null;
    let finalCleanSlug = cleanSlug;

    // Se não tiver ID válido de UUID, verifica se já existe um produto com este slug no banco
    if (!targetProductId) {
      const { data: existingProductBySlug } = await supabaseServer
        .from('products')
        .select('id, slug')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (existingProductBySlug?.id) {
        // Se já existe produto com esse slug e o usuário estava editando, adota o ID existente
        targetProductId = existingProductBySlug.id;
      }
    } else {
      // Se já tem ID, verifica se o cleanSlug pertence a OUTRO produto diferente
      const { data: otherProductWithSlug } = await supabaseServer
        .from('products')
        .select('id')
        .eq('slug', cleanSlug)
        .neq('id', targetProductId)
        .maybeSingle();

      if (otherProductWithSlug?.id) {
        // Colisão com outro produto: gera sufixo único
        finalCleanSlug = `${cleanSlug}-${Date.now().toString(36).slice(-4)}`;
      }
    }

    // Empacota metadados detalhados (composição, bojo, descrições bilíngues, tabela de medidas, tags, subcategoria, galeria de fotos, cores, tamanhos e variações de backup)
    const metadataPayload = {
      bio: description_en || description || description_pt || '',
      description_en: description_en || description || '',
      description_pt: description_pt || '',
      cups_type: finalCupsType,
      removable_cups: finalCupsType === 'removable',
      has_cups: finalCupsType === 'removable' || finalCupsType === 'fixed',
      composition: composition || '',
      sizeGuide: sizeGuide || '',
      tags: Array.isArray(tags) ? tags : [],
      subcategory: subcategory || '',
      category_id: resolvedCategoryId,
      supplier_id: resolvedSupplierId,
      price: parsedExplicitPrice,
      promotional_price: promotional_price ? parseFloat(promotional_price) : (compare_price ? parsedExplicitPrice : null),
      compare_price: compare_price ? parseFloat(compare_price) : null,
      ribbon: ribbon || '',
      brand: brand || 'ANA Fitness Wear',
      general_sku: generalSku || '',
      product_type: 'physical',
      visible_online: visible_online === true,
      visible_pos: visible_pos !== false,
      primary_image: primaryImg,
      images: finalGalleryImages,
      gallery: finalGalleryImages,
      media_list: Array.isArray(media_list) ? media_list : [],
      colors: Array.isArray(colors) ? colors : [],
      sizes: Array.isArray(sizes) ? sizes : [],
      variants: Array.isArray(variants) ? variants : [], // Persistência dupla no JSON da descrição
      cost_price: parsedExplicitCost,
    };
    const structuredDescription = JSON.stringify(metadataPayload);

    // 3. Grava ou atualiza na tabela 'products'
    const productData: any = {
      title: title.toUpperCase(),
      slug: finalCleanSlug,
      description: structuredDescription,
      category_id: resolvedCategoryId,
      supplier_id: resolvedSupplierId,
    };

    if (targetProductId) {
      productData.id = targetProductId;
    }

    let { data: savedProducts, error: prodError } = await supabaseServer
      .from('products')
      .upsert(productData)
      .select();

    // Auto-recuperação caso ocorra colisão de slug (code: 23505)
    if (prodError && prodError.code === '23505') {
      console.warn('Colisão de slug detectada no Supabase, aplicando salt e tentando novamente...', prodError.message);
      productData.slug = `${cleanSlug}-${Math.random().toString(36).substring(2, 6)}`;
      const retryProd = await supabaseServer
        .from('products')
        .upsert(productData)
        .select();
      savedProducts = retryProd.data;
      prodError = retryProd.error;
    }

    // Auto-recuperação caso ocorra erro de foreign key residual (code: 23503 ou 22P02)
    if (prodError && (prodError.code === '23503' || prodError.code === '22P02')) {
      console.warn('Erro de chave estrangeira/UUID detectado, removendo FKs e tentando novamente...', prodError.message);
      productData.category_id = null;
      productData.supplier_id = null;
      const retryProd = await supabaseServer
        .from('products')
        .upsert(productData)
        .select();
      savedProducts = retryProd.data;
      prodError = retryProd.error;
    }

    if (prodError) {
      console.error('Erro crítico ao salvar produto no Supabase:', prodError);
      return NextResponse.json({ error: `Erro no Supabase: ${prodError.message}` }, { status: 400 });
    }

    const product = savedProducts?.[0];
    const finalProductId = product?.id || targetProductId;

    if (!finalProductId) {
      return NextResponse.json({ error: 'Falha ao salvar produto: ID não pôde ser gerado.' }, { status: 500 });
    }

    // 4. Grava ou atualiza a matriz de variações na tabela 'product_variants'
    let savedVariants: any[] = [];

    if (Array.isArray(variants) && variants.length > 0 && finalProductId) {
      // 1. Busca variantes existentes no Supabase para preservar IDs e evitar violação de FK (ON DELETE RESTRICT)
      let existingDbVariants: any[] = [];
      try {
        const { data: dbVars } = await supabaseServer
          .from('product_variants')
          .select('id, sku, barcode, size, color')
          .eq('product_id', finalProductId);
        if (dbVars) existingDbVariants = dbVars;
      } catch (e) {
        console.warn('Aviso ao consultar variantes existentes:', e);
      }

      const batchSkus = new Set<string>();
      const batchBarcodes = new Set<string>();
      const shortId = finalProductId.replace(/-/g, '').slice(0, 4).toUpperCase();
      const timeSalt = Date.now().toString(36).slice(-3).toUpperCase();

      const variantsData = variants.map((v: any, i: number) => {
        const rawVarCost = (v.cost_price !== undefined && v.cost_price !== null && v.cost_price !== '')
          ? v.cost_price
          : (v.costPrice !== undefined && v.costPrice !== null && v.costPrice !== '')
          ? v.costPrice
          : parsedExplicitCost;
        const vCost = (!isNaN(Number(rawVarCost)) && Number(rawVarCost) >= 0) ? Number(rawVarCost) : parsedExplicitCost;

        const rawVarPrice = (v.price !== undefined && v.price !== null && v.price !== '')
          ? v.price
          : parsedExplicitPrice;
        const vPrice = (!isNaN(Number(rawVarPrice)) && Number(rawVarPrice) >= 0) ? Number(rawVarPrice) : (parsedExplicitPrice || 44.90);

        // Identifica correspondência com variante existente no banco para preservar ID e Barcode
        const matchInDb = (existingDbVariants || []).find((edv: any) =>
          (v.id && edv.id === v.id) ||
          (v.sku && edv.sku === v.sku) ||
          (v.barcode && edv.barcode === v.barcode) ||
          (edv.size?.toLowerCase() === (v.size || 'M').toLowerCase() && edv.color?.toLowerCase() === (v.color || 'Preto Ônix').toLowerCase())
        );

        // assignedId DEVE ser estritamente um ID que realmente existe na tabela product_variants do banco
        const assignedId = (matchInDb?.id && isUuid(matchInDb.id))
          ? matchInDb.id
          : (isUuid(v.id) && (existingDbVariants || []).some((edv: any) => edv.id === v.id))
          ? v.id
          : undefined;

        // Gera SKU garantidamente único por variação e globalmente no banco (max 100 caracteres)
        let finalSku = (v.sku?.trim() || matchInDb?.sku || `${title.slice(0, 3).toUpperCase()}-${(v.color || 'COR').slice(0, 3).toUpperCase()}-${v.size || 'TAM'}-${shortId}-${timeSalt}-${i + 1}`).slice(0, 95);
        if (batchSkus.has(finalSku)) {
          finalSku = `${finalSku}-${i + 1}`;
        }
        batchSkus.add(finalSku);

        // Gera Código de Barras garantidamente único por variação
        let genBarcode = v.barcode && String(v.barcode).trim()
          ? String(v.barcode).trim()
          : (matchInDb?.barcode || `789${Math.floor(100000000 + Math.random() * 900000000)}`);
        while (batchBarcodes.has(genBarcode)) {
          genBarcode = `789${Math.floor(100000000 + Math.random() * 900000000)}`;
        }
        batchBarcodes.add(genBarcode);

        const vImages = Array.isArray(v.images) && v.images.length > 0
          ? v.images
          : v.image
          ? [v.image]
          : finalGalleryImages.length > 0
          ? finalGalleryImages
          : primaryImg
          ? [primaryImg]
          : [];

        const variantPayload: any = {
          ...(assignedId ? { id: assignedId } : {}),
          product_id: finalProductId,
          sku: finalSku,
          barcode: genBarcode,
          size: String(v.size || 'M').slice(0, 10),
          color: String(v.color || 'Preto Ônix').slice(0, 50),
          price: vPrice,
          cost_price: vCost,
          stock_quantity: Math.max(0, parseInt(String(v.stock_quantity ?? v.stock ?? 0), 10) || 0),
          allow_backorder: Boolean(v.allow_backorder),
          estimated_production_days: parseInt(String(v.estimated_production_days ?? 7), 10) || 7,
          images: vImages,
          video_url: v.video_url || null,
        };

        return variantPayload;
      });

      // 2. Remove com segurança variantes órfãs que deixaram de existir no formulário
      const retainedVariantIds = new Set(variantsData.map((vd: any) => vd.id).filter(Boolean));
      const orphanedVariants = (existingDbVariants || []).filter((edv: any) => !retainedVariantIds.has(edv.id));
      if (orphanedVariants.length > 0) {
        try {
          const { error: delErr } = await supabaseServer
            .from('product_variants')
            .delete()
            .in('id', orphanedVariants.map((o: any) => o.id));
          if (delErr) {
            console.warn('Aviso: variantes antigas preservadas para histórico de pedidos:', delErr.message);
          }
        } catch (delErr) {
          console.warn('Variantes antigas não puderam ser excluídas:', delErr);
        }
      }

      // 3. Persistência individual e segura de cada variação (sem falha em lote ou colisão de chave única)
      const savedVariantsList: any[] = [];

      for (let idx = 0; idx < variantsData.length; idx++) {
        const vd = { ...variantsData[idx] };
        const hasDbId = Boolean(vd.id && isUuid(vd.id) && (existingDbVariants || []).some((edv: any) => edv.id === vd.id));

        let savedRow: any = null;

        if (hasDbId) {
          // 3.1 Atualiza variante existente pelo ID único
          const { id: vId, ...updateFields } = vd;
          let { data: updated, error: upErr } = await supabaseServer
            .from('product_variants')
            .update(updateFields)
            .eq('id', vId)
            .select()
            .maybeSingle();

          if (upErr && (upErr.code === '23505' || upErr.message?.includes('duplicate key'))) {
            // Colisão de SKU ou Barcode único no update: aplica salt e re-tenta
            const randSalt = Math.random().toString(36).substring(2, 6).toUpperCase();
            const randBarcode = `789${Math.floor(100000000 + Math.random() * 900000000)}`;
            const retryFields = {
              ...updateFields,
              sku: `${updateFields.sku}-${randSalt}`.slice(0, 95),
              barcode: randBarcode,
            };
            const retryUp = await supabaseServer
              .from('product_variants')
              .update(retryFields)
              .eq('id', vId)
              .select()
              .maybeSingle();

            if (!retryUp.error && retryUp.data) {
              updated = retryUp.data;
              upErr = null;
            }
          }

          if (!upErr && updated) {
            savedRow = updated;
          }
        }

        // Se a variante não existia no banco pelo ID ou o update não retornou linha, realiza INSERT com retry seguro
        if (!savedRow) {
          const { id: _, ...insertFields } = vd;
          let { data: inserted, error: inErr } = await supabaseServer
            .from('product_variants')
            .insert(insertFields)
            .select()
            .maybeSingle();

          if (inErr && (inErr.code === '23505' || inErr.message?.includes('duplicate key'))) {
            // Colisão de SKU ou Barcode único na inserção: aplica salt e re-tenta
            const randSalt = Math.random().toString(36).substring(2, 6).toUpperCase();
            const randBarcode = `789${Math.floor(100000000 + Math.random() * 900000000)}`;
            const retryInsertFields = {
              ...insertFields,
              sku: `${insertFields.sku}-${randSalt}`.slice(0, 95),
              barcode: randBarcode,
            };
            const retryIn = await supabaseServer
              .from('product_variants')
              .insert(retryInsertFields)
              .select()
              .maybeSingle();

            if (!retryIn.error && retryIn.data) {
              inserted = retryIn.data;
              inErr = null;
            } else {
              console.warn(`Falha no retry de inserção da variante ${vd.color}/${vd.size}:`, retryIn.error?.message);
            }
          }

          if (!inErr && inserted) {
            savedRow = inserted;
          } else if (inErr) {
            console.warn(`Aviso: não foi possível inserir variante ${vd.color}/${vd.size}:`, inErr?.message);
          }
        }

        savedVariantsList.push(savedRow || vd);
      }

      savedVariants = savedVariantsList;
    }

    // Auto-sincronização com TikTok Shop em segundo plano (se ativada nas configurações)
    try {
      const { data: settingsRow } = await supabaseServer
        .from('products')
        .select('description')
        .eq('id', '00000000-0000-0000-0000-000000000098')
        .maybeSingle();

      if (settingsRow?.description) {
        const parsedSettings = JSON.parse(settingsRow.description);
        if (parsedSettings.tiktokShopAutoSync) {
          const productToSync = {
            id: targetProductId,
            title,
            slug: cleanSlug,
            description,
            description_en,
            description_pt,
            primary_image: primaryImg,
            primaryImage: primaryImg,
            images: finalGalleryImages,
            variants: savedVariants,
          };
          syncProductToTikTokShop(productToSync, {
            appKey: parsedSettings.tiktokShopAppKey || '',
            appSecret: parsedSettings.tiktokShopAppSecret || '',
            accessToken: parsedSettings.tiktokShopAccessToken || '',
            shopCipher: parsedSettings.tiktokShopCipher || '',
            sellerId: parsedSettings.tiktokShopId || '7494943021231081116',
          }).catch((ttErr) => console.warn('TikTok Shop auto-sync aviso:', ttErr));
        }
      }
    } catch (ttIgnored) {
      // Ignora para garantir que o salvamento principal não seja afetado
    }

    return NextResponse.json({
      success: true,
      productId: targetProductId,
      product: {
        ...(product || {}),
        id: finalProductId,
        title: title.toUpperCase(),
        slug: finalCleanSlug,
        meta: metadataPayload,
        primary_image: primaryImg,
        primaryImage: primaryImg,
        images: finalGalleryImages,
        galleryImages: finalGalleryImages,
        media_list: metadataPayload.media_list,
        colors: Array.isArray(colors) ? colors : [],
        sizes: Array.isArray(sizes) ? sizes : [],
        variants: savedVariants,
        price: parsedExplicitPrice,
        cost_price: parsedExplicitCost,
        costPrice: parsedExplicitCost,
        visible_online: visible_online === true,
        visible_pos: visible_pos !== false,
      },
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
    const {
      id,
      visible_online,
      visible_pos,
      cost_price,
      costPrice,
      price,
      promotional_price,
      compare_price,
      stock_quantity,
      stock,
      variant_id,
      sku,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório.' }, { status: 400 });
    }

    let currentProduct = null;
    let targetId = id;

    // 1. Tenta por UUID
    if (isUuid(id)) {
      const { data } = await supabaseServer
        .from('products')
        .select('id, description, title, slug')
        .eq('id', id)
        .maybeSingle();
      currentProduct = data;
    }

    // 2. Tenta por slug
    if (!currentProduct) {
      const { data } = await supabaseServer
        .from('products')
        .select('id, description, title, slug')
        .eq('slug', id)
        .maybeSingle();
      currentProduct = data;
      if (currentProduct) targetId = currentProduct.id;
    }

    // 3. Tenta por título
    if (!currentProduct) {
      const { data } = await supabaseServer
        .from('products')
        .select('id, description, title, slug')
        .ilike('title', id)
        .maybeSingle();
      currentProduct = data;
      if (currentProduct) targetId = currentProduct.id;
    }

    // 4. Tenta por variação (ID da variação, SKU ou código de barras)
    if (!currentProduct) {
      const { data: vRow } = await supabaseServer
        .from('product_variants')
        .select('product_id')
        .or(`id.eq.${id},sku.eq.${id},barcode.eq.${id}`)
        .maybeSingle();
      if (vRow?.product_id) {
        targetId = vRow.product_id;
        const { data } = await supabaseServer
          .from('products')
          .select('id, description, title, slug')
          .eq('id', targetId)
          .maybeSingle();
        currentProduct = data;
      }
    }

    if (!currentProduct) {
      return NextResponse.json({ error: 'Produto não encontrado no Supabase.' }, { status: 404 });
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

    // Atualização atômica de Preço de Custo
    const inputCost = cost_price !== undefined ? cost_price : costPrice;
    if (inputCost !== undefined && inputCost !== null && inputCost !== '') {
      const numCost = parseFloat(inputCost);
      if (!isNaN(numCost)) {
        meta.cost_price = numCost;
        if (Array.isArray(meta.variants)) {
          meta.variants = meta.variants.map((v: any) => ({ ...v, cost_price: numCost, costPrice: numCost }));
        }
        await supabaseServer
          .from('product_variants')
          .update({ cost_price: numCost })
          .eq('product_id', targetId);
      }
    }

    // Atualização atômica de Preço de Venda
    const inputPrice = price !== undefined ? price : promotional_price;
    if (inputPrice !== undefined && inputPrice !== null && inputPrice !== '') {
      const numPrice = parseFloat(inputPrice);
      if (!isNaN(numPrice)) {
        meta.price = numPrice;
        meta.promotional_price = numPrice; // Garante que não haja preço promocional antigo sobrescrevendo
        if (Array.isArray(meta.variants)) {
          meta.variants = meta.variants.map((v: any) => ({ ...v, price: numPrice }));
        }
        await supabaseServer
          .from('product_variants')
          .update({ price: numPrice })
          .eq('product_id', targetId);
      }
    }

    if (compare_price !== undefined) {
      meta.compare_price = compare_price ? parseFloat(compare_price) : null;
    }

    // Atualização de estoque se fornecido
    const inputStock = stock_quantity !== undefined ? stock_quantity : stock;
    if (inputStock !== undefined && inputStock !== null && inputStock !== '') {
      const numStock = parseInt(String(inputStock), 10);
      if (!isNaN(numStock)) {
        if (variant_id) {
          await supabaseServer
            .from('product_variants')
            .update({ stock_quantity: numStock })
            .eq('id', variant_id);
        } else if (sku) {
          await supabaseServer
            .from('product_variants')
            .update({ stock_quantity: numStock })
            .eq('sku', sku);
        } else {
          await supabaseServer
            .from('product_variants')
            .update({ stock_quantity: numStock })
            .eq('product_id', targetId);
        }
      }
    }

    const { data: updatedRows, error: updErr } = await supabaseServer
      .from('products')
      .update({ description: JSON.stringify(meta) })
      .eq('id', targetId)
      .select('*');

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        productId: targetId,
        product: updatedRows?.[0] || null,
        visible_online: meta.visible_online,
        visible_pos: meta.visible_pos,
        price: meta.price,
        cost_price: meta.cost_price,
        costPrice: meta.cost_price,
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


