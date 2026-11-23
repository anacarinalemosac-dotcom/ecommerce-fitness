import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getFallbackCatalogPath(): string {
  const p1 = path.join(process.cwd(), 'src', 'lib', 'catalogProductsFallback.json');
  if (fs.existsSync(p1)) return p1;
  const p2 = path.join(process.cwd(), 'apps', 'web', 'src', 'lib', 'catalogProductsFallback.json');
  if (fs.existsSync(p2)) return p2;
  return p1;
}

function loadFallbackProducts(): any[] {
  try {
    const fPath = getFallbackCatalogPath();
    if (fs.existsSync(fPath)) {
      const content = fs.readFileSync(fPath, 'utf8');
      return JSON.parse(content) || [];
    }
  } catch (_) {}
  return [];
}

function saveFallbackProducts(products: any[]) {
  try {
    const fPath = getFallbackCatalogPath();
    const dir = path.dirname(fPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fPath, JSON.stringify(products, null, 2), 'utf8');
  } catch (_) {}
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      masterProductId,
      selectedProductIds,
      newTitle,
      actionForSecondaries = 'hide', // 'hide' | 'delete'
    } = body;

    if (!masterProductId || !Array.isArray(selectedProductIds) || selectedProductIds.length < 2) {
      return NextResponse.json(
        { error: 'Selecione pelo menos 2 produtos e defina o produto principal para agrupar.' },
        { status: 400 }
      );
    }

    const secondaryIds = selectedProductIds.filter((id: string) => id !== masterProductId);

    // 1. Busca produtos no Supabase
    let allProds: any[] = [];
    try {
      const { data, error } = await supabaseServer
        .from('products')
        .select('*, product_variants(*)')
        .in('id', selectedProductIds);
      if (!error && data) allProds = data;
    } catch (e) {
      console.warn('Erro ao carregar produtos no Supabase:', e);
    }

    // Se não encontrou no Supabase, tenta no catálogo local fallback
    const fallbackList = loadFallbackProducts();
    if (allProds.length === 0 && fallbackList.length > 0) {
      allProds = fallbackList.filter((p: any) => selectedProductIds.includes(p.id));
    }

    if (allProds.length === 0) {
      return NextResponse.json({ error: 'Nenhum dos produtos selecionados foi encontrado.' }, { status: 404 });
    }

    const masterProd = allProds.find((p: any) => p.id === masterProductId) || allProds[0];
    const secondaryProds = allProds.filter((p: any) => p.id !== masterProd.id);

    // 2. Extrai metadados do produto principal
    let masterMeta: any = {};
    try {
      masterMeta = typeof masterProd.description === 'string' && masterProd.description.startsWith('{')
        ? JSON.parse(masterProd.description)
        : (masterProd.meta || {});
    } catch (_) {
      masterMeta = {};
    }

    // 3. Consolidação de Cores
    const colorsMap = new Map<string, { name: string; hex: string }>();
    const addColors = (list: any[]) => {
      if (!Array.isArray(list)) return;
      list.forEach((c) => {
        const name = typeof c === 'string' ? c.trim() : (c.name || '').trim();
        const hex = (typeof c === 'object' && c.hex) ? c.hex : '#0A0A0A';
        if (name && !colorsMap.has(name.toLowerCase())) {
          colorsMap.set(name.toLowerCase(), { name, hex });
        }
      });
    };

    addColors(masterMeta.colors);
    addColors(masterProd.colors);

    secondaryProds.forEach((sp: any) => {
      let spMeta: any = {};
      try {
        spMeta = typeof sp.description === 'string' && sp.description.startsWith('{')
          ? JSON.parse(sp.description)
          : (sp.meta || {});
      } catch (_) {}
      addColors(spMeta.colors);
      addColors(sp.colors);

      (sp.product_variants || sp.variants || []).forEach((v: any) => {
        if (v.color) addColors([{ name: v.color, hex: v.colorHex || '#0A0A0A' }]);
      });
    });

    const consolidatedColors = Array.from(colorsMap.values());

    // 4. Consolidação de Imagens da Galeria e Mídias
    const imagesSet = new Set<string>();
    const addImg = (url: any) => {
      if (typeof url === 'string' && url.trim().startsWith('http')) {
        imagesSet.add(url.trim());
      }
    };

    addImg(masterProd.primary_image || masterProd.primaryImage || masterMeta.primary_image || masterMeta.primaryImage);
    (masterMeta.gallery || masterMeta.galleryImages || masterMeta.images || []).forEach(addImg);

    secondaryProds.forEach((sp: any) => {
      let spMeta: any = {};
      try {
        spMeta = typeof sp.description === 'string' && sp.description.startsWith('{')
          ? JSON.parse(sp.description)
          : (sp.meta || {});
      } catch (_) {}
      addImg(sp.primary_image || sp.primaryImage || spMeta.primary_image || spMeta.primaryImage);
      (spMeta.gallery || spMeta.galleryImages || spMeta.images || []).forEach(addImg);
    });

    const consolidatedGallery = Array.from(imagesSet);

    // 5. Consolidação de Variantes (tamanhos x cores) no Supabase
    try {
      for (const sp of secondaryProds) {
        if (sp.product_variants && sp.product_variants.length > 0) {
          // Reatribui variações existentes para o master
          await supabaseServer
            .from('product_variants')
            .update({ product_id: masterProd.id })
            .eq('product_id', sp.id);
        } else {
          // Cria variações novas com base nos dados do produto secundário
          let spMeta: any = {};
          try {
            spMeta = typeof sp.description === 'string' && sp.description.startsWith('{')
              ? JSON.parse(sp.description)
              : (sp.meta || {});
          } catch (_) {}
          const spColor = spMeta.colors?.[0]?.name || sp.colorName || sp.title;
          const spSizes = Array.isArray(spMeta.sizes) && spMeta.sizes.length > 0 ? spMeta.sizes : ['ONE SIZE'];
          const spImg = sp.primary_image || spMeta.primary_image || sp.primaryImage || '';

          for (const sz of spSizes) {
            await supabaseServer.from('product_variants').insert({
              product_id: masterProd.id,
              sku: `${masterProd.slug || 'PROD'}-${sz}-${String(spColor).replace(/\s+/g, '').toUpperCase()}`,
              size: sz,
              color: spColor,
              price: Number(sp.price || masterProd.price || 44.9),
              cost_price: Number(sp.cost_price || masterProd.cost_price || 16.0),
              stock_quantity: Math.max(1, Number(sp.stock || 1)),
              allow_backorder: true,
              images: spImg ? [spImg] : [],
            });
          }
        }
      }
    } catch (varErr) {
      console.warn('Aviso ao manipular variantes no Supabase:', varErr);
    }

    // Busca variantes atualizadas do produto principal
    let finalVars: any[] = [];
    try {
      const { data: vData } = await supabaseServer
        .from('product_variants')
        .select('*')
        .eq('product_id', masterProd.id);
      if (vData) finalVars = vData;
    } catch (_) {}

    const totalStock = finalVars.length > 0
      ? finalVars.reduce((acc: number, v: any) => acc + (Number(v.stock_quantity) || 0), 0)
      : Math.max(1, Number(masterProd.stock || 1));

    const consolidatedSizes = Array.from(
      new Set([
        ...(finalVars.map((v: any) => v.size).filter(Boolean)),
        ...(masterMeta.sizes || []),
      ])
    );

    // 6. Atualiza o produto principal
    const finalTitle = (newTitle || masterProd.title).trim();
    masterMeta.colors = consolidatedColors;
    masterMeta.sizes = consolidatedSizes.length > 0 ? consolidatedSizes : ['ONE SIZE'];
    masterMeta.gallery = consolidatedGallery;
    masterMeta.galleryImages = consolidatedGallery;
    masterMeta.images = consolidatedGallery;
    masterMeta.variants = finalVars;

    try {
      await supabaseServer
        .from('products')
        .update({
          title: finalTitle,
          stock: totalStock,
          description: JSON.stringify(masterMeta),
        })
        .eq('id', masterProd.id);
    } catch (upErr) {
      console.warn('Aviso ao atualizar master no Supabase:', upErr);
    }

    // 7. Processa os produtos secundários (Ocultar ou Excluir)
    try {
      if (actionForSecondaries === 'delete') {
        await supabaseServer.from('product_variants').delete().in('product_id', secondaryIds);
        await supabaseServer.from('products').delete().in('id', secondaryIds);
      } else {
        // Desativa e arquiva
        for (const sid of secondaryIds) {
          const sp = secondaryProds.find((p: any) => p.id === sid);
          let spMeta: any = {};
          try {
            spMeta = typeof sp?.description === 'string' && sp.description.startsWith('{')
              ? JSON.parse(sp.description)
              : {};
          } catch (_) {}
          spMeta.visible_online = false;
          spMeta.is_draft = true;
          spMeta.status = 'ARCHIVED';
          spMeta.grouped_into = masterProd.id;

          await supabaseServer
            .from('products')
            .update({
              visible_online: false,
              is_draft: true,
              description: JSON.stringify(spMeta),
            })
            .eq('id', sid);
        }
      }
    } catch (secErr) {
      console.warn('Aviso ao processar secundários:', secErr);
    }

    // 8. Atualiza cache local de fallback
    try {
      let fList = loadFallbackProducts();
      if (fList && fList.length > 0) {
        // Atualiza master
        const mIdx = fList.findIndex((p: any) => p.id === masterProd.id || p.slug === masterProd.slug);
        if (mIdx !== -1) {
          fList[mIdx] = {
            ...fList[mIdx],
            title: finalTitle,
            colors: consolidatedColors,
            sizes: consolidatedSizes,
            galleryImages: consolidatedGallery,
            stock: totalStock,
            variants: finalVars,
          };
        }
        // Remove ou oculta secundários
        if (actionForSecondaries === 'delete') {
          fList = fList.filter((p: any) => !secondaryIds.includes(p.id));
        } else {
          fList = fList.map((p: any) => {
            if (secondaryIds.includes(p.id)) {
              return { ...p, visibleOnline: false, isDraft: true, status: 'ARCHIVED' };
            }
            return p;
          });
        }
        saveFallbackProducts(fList);
      }
    } catch (fbErr) {
      console.warn('Aviso ao atualizar fallback local:', fbErr);
    }

    return NextResponse.json({
      success: true,
      masterProductId: masterProd.id,
      title: finalTitle,
      consolidatedColorsCount: consolidatedColors.length,
      variantsCount: finalVars.length,
      message: `${selectedProductIds.length} produtos foram agrupados com sucesso sob "${finalTitle}"!`,
    });
  } catch (err: any) {
    console.error('Erro na rota de agrupar produtos:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
