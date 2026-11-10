import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 1 minuto de cache

export async function GET() {
  try {
    // 1. Busca os últimos pedidos concluídos ou recentes
    const { data: orders, error: ordErr } = await supabaseServer
      .from('orders')
      .select('id, customer_name, total_amount, shipping_address, created_at')
      .order('created_at', { ascending: false })
      .limit(35);

    // 2. Busca catálogo de produtos com imagens para enriquecer
    const { data: products } = await supabaseServer
      .from('products')
      .select('id, title, slug, description')
      .limit(200);

    const productMap = new Map<string, { slug: string; image: string; price: number; title: string }>();
    const productList: Array<{ slug: string; image: string; price: number; title: string }> = [];

    for (const prod of (products || [])) {
      let meta: any = {};
      try {
        if (prod.description && prod.description.startsWith('{')) {
          meta = JSON.parse(prod.description);
        }
      } catch {
        meta = {};
      }

      const img = meta.primary_image || (Array.isArray(meta.images) && meta.images[0]) || '';
      const price = meta.promotional_price ?? meta.price ?? 39.9;
      const cleanTitle = (prod.title || '').trim();

      const itemInfo = {
        slug: prod.slug || '',
        image: img,
        price,
        title: cleanTitle
      };

      if (img) {
        productList.push(itemInfo);
      }
      if (cleanTitle) {
        productMap.set(cleanTitle.toLowerCase(), itemInfo);
      }
    }

    const soldItems: Array<{
      id: string;
      title: string;
      color: string;
      size: string;
      price: number;
      image: string;
      slug: string;
      customerName: string;
      location: string;
      soldAt: string;
    }> = [];

    const customerStates = ['Massachusetts', 'Flórida', 'New Jersey', 'Connecticut', 'New York', 'Califórnia', 'Texas', 'Georgia'];
    let fallbackIdx = 0;

    for (const order of (orders || [])) {
      const addr = order.shipping_address || {};
      const rawItems = addr.items || [];
      const custRaw = order.customer_name ? order.customer_name.trim().split(' ')[0] : 'Cliente';
      const custName = custRaw.charAt(0).toUpperCase() + custRaw.slice(1).toLowerCase();
      const state = addr.state || addr.city || customerStates[Math.floor(Math.random() * customerStates.length)];

      for (const it of rawItems) {
        const itTitle = (it.title || it.name || '').trim();
        if (!itTitle || itTitle.toLowerCase().includes('frete')) continue;

        // Procura correspondência no mapa de produtos
        let match = productMap.get(itTitle.toLowerCase());
        if (!match) {
          for (const item of productList) {
            const lowTitle = item.title.toLowerCase();
            if (lowTitle && (lowTitle.includes(itTitle.toLowerCase()) || itTitle.toLowerCase().includes(lowTitle))) {
              match = item;
              break;
            }
          }
        }

        // Se ainda não achou, pega um produto do catálogo que possua foto real
        const fallbackProd = productList.length > 0 ? productList[(fallbackIdx++) % productList.length] : null;
        const img = it.image || match?.image || fallbackProd?.image || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80';
        const finalSlug = match?.slug || fallbackProd?.slug || '';
        const finalPrice = it.unit_price || it.price || match?.price || fallbackProd?.price || 39.9;

        soldItems.push({
          id: `${order.id}-${it.sku || itTitle}-${soldItems.length}`,
          title: itTitle,
          color: it.color || 'Preto Ônix',
          size: it.size || 'M',
          price: Number(finalPrice),
          image: img,
          slug: finalSlug,
          customerName: custName,
          location: state,
          soldAt: order.created_at || new Date().toISOString()
        });

        if (soldItems.length >= 18) break;
      }
      if (soldItems.length >= 18) break;
    }

    // Se o banco tiver poucos pedidos cadastrados, preenche com os produtos mais recentes
    if (soldItems.length < 6 && productList.length > 0) {
      const names = ['Camila', 'Fernanda', 'Beatriz', 'Juliana', 'Larissa', 'Mariana'];
      for (let i = soldItems.length; i < 6 && i < productList.length; i++) {
        const p = productList[i];
        soldItems.push({
          id: `seed-sold-${i}`,
          title: p.title,
          color: 'Edição Especial',
          size: 'M',
          price: p.price,
          image: p.image,
          slug: p.slug,
          customerName: names[i % names.length],
          location: customerStates[i % customerStates.length],
          soldAt: new Date(Date.now() - (i + 1) * 3600000 * 4).toISOString()
        });
      }
    }

    return NextResponse.json({
      success: true,
      items: soldItems
    });
  } catch (err: any) {
    console.error('Erro ao buscar últimos produtos vendidos:', err);
    return NextResponse.json({ success: false, items: [], error: err.message }, { status: 500 });
  }
}
