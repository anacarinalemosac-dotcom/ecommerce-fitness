import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

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
        .single();

      if (prodErr || !product) {
        return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
      }

      const { data: variants } = await supabaseServer
        .from('product_variants')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: true });

      return NextResponse.json({ product, variants: variants || [] });
    }

    // Busca todos os produtos com suas variações
    const { data: products, error: prodsErr } = await supabaseServer
      .from('products')
      .select('*, categories(*), suppliers(*)')
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
      const pVariants = (allVariants || []).filter((v) => v.product_id === p.id);
      return {
        ...p,
        variants: pVariants,
        total_stock: pVariants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0),
      };
    });

    return NextResponse.json({ products: enrichedProducts });
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

    // Empacota metadados detalhados (composição, tabela de medidas, tags e subcategoria) no campo description
    const metadataPayload = {
      bio: description || '',
      composition: composition || '',
      sizeGuide: sizeGuide || '',
      tags: Array.isArray(tags) ? tags : [],
      subcategory: subcategory || '',
    };
    const structuredDescription = JSON.stringify(metadataPayload);

    let targetProductId = id;

    // 1. Grava ou atualiza na tabela 'products'
    if (targetProductId) {
      const { data: updatedProduct, error: updateErr } = await supabaseServer
        .from('products')
        .update({
          title: title.toUpperCase(),
          slug: cleanSlug,
          description: structuredDescription,
          category_id: category_id || null,
          supplier_id: supplier_id || null,
        })
        .eq('id', targetProductId)
        .select('*')
        .single();

      if (updateErr) {
        console.error('Erro ao atualizar produto no Supabase:', updateErr);
        return NextResponse.json({ error: `Erro no Supabase: ${updateErr.message}` }, { status: 400 });
      }
      targetProductId = updatedProduct.id;
    } else {
      const { data: newProduct, error: insertErr } = await supabaseServer
        .from('products')
        .insert([
          {
            title: title.toUpperCase(),
            slug: cleanSlug,
            description: structuredDescription,
            category_id: category_id || null,
            supplier_id: supplier_id || null,
          },
        ])
        .select('*')
        .single();

      if (insertErr) {
        console.error('Erro ao criar produto no Supabase:', insertErr);
        return NextResponse.json({ error: `Erro no Supabase: ${insertErr.message}` }, { status: 400 });
      }
      targetProductId = newProduct.id;
    }

    // 2. Grava ou atualiza a matriz de variações na tabela 'product_variants'
    const savedVariants: any[] = [];

    if (Array.isArray(variants) && variants.length > 0) {
      // Remove variantes antigas deste produto que não estão na lista atualizada
      const incomingVariantIds = variants.map((v) => v.id).filter(Boolean);
      if (incomingVariantIds.length > 0) {
        await supabaseServer
          .from('product_variants')
          .delete()
          .eq('product_id', targetProductId)
          .not('id', 'in', `(${incomingVariantIds.join(',')})`);
      } else {
        await supabaseServer
          .from('product_variants')
          .delete()
          .eq('product_id', targetProductId);
      }

      for (const v of variants) {
        const variantPayload: any = {
          product_id: targetProductId,
          sku: v.sku || `${title.slice(0, 3).toUpperCase()}-${(v.color || 'COR').slice(0, 3).toUpperCase()}-${v.size || 'TAM'}`,
          barcode: v.barcode || `${Date.now()}`.slice(-12),
          size: v.size || 'M',
          color: v.color || 'Preto Ônix',
          price: parseFloat(v.price) || 39.9,
          cost_price: parseFloat(v.cost_price) || 15.0,
          stock_quantity: parseInt(v.stock_quantity) || 0,
          allow_backorder: Boolean(v.allow_backorder),
          estimated_production_days: parseInt(v.estimated_production_days) || 7,
          images: Array.isArray(v.images) ? v.images : v.image ? [v.image] : [],
          video_url: v.video_url || null,
        };

        if (v.id) {
          const { data: updatedV, error: vErr } = await supabaseServer
            .from('product_variants')
            .upsert({ ...variantPayload, id: v.id })
            .select('*')
            .single();

          if (!vErr && updatedV) savedVariants.push(updatedV);
        } else {
          const { data: insertedV, error: vErr } = await supabaseServer
            .from('product_variants')
            .insert([variantPayload])
            .select('*')
            .single();

          if (!vErr && insertedV) savedVariants.push(insertedV);
        }
      }
    }

    return NextResponse.json({
      success: true,
      productId: targetProductId,
      product: { id: targetProductId, title, slug: cleanSlug },
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
