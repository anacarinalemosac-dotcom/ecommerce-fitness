import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Produtos padrão de fallback caso a base do Supabase esteja vazia ou em atualização
const FALLBACK_CATALOG = [
  {
    id: 'p1',
    title: 'BAILARINA TOP SET',
    slug: 'conjunto-bailarina-top',
    category: 'CONJUNTOS',
    price: 44.9,
    description: 'Conjunto fitness premium com modelagem anatômica, cós duplo de alta compressão e tecnologia zero transparência. Acompanha bojo removível.',
    primaryImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
    ],
    color: 'Onyx Black',
    sizes: ['S', 'M', 'L'],
    stock: 12,
  },
  {
    id: 'p2',
    title: 'SAMANTA ROMPER',
    slug: 'macaquinho-samanta',
    category: 'MACAQUINHOS',
    price: 39.9,
    description: 'Macaquinho esportivo de alta performance com compressão sculpt fit e decote com sustentação anatômica. Zero ver através, ideal para treinos intensos.',
    primaryImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&q=80',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    ],
    color: 'Onyx Black',
    sizes: ['S', 'M', 'L'],
    stock: 15,
  },
  {
    id: 'p3',
    title: 'MONIQUE FLARE PANTS SET',
    slug: 'monique-flare-pants-set',
    category: 'CONJUNTOS',
    price: 49.9,
    description: 'Conjunto fitness de calça flare com cós ultra anatômico modelador. Tecido duplo premium com zero transparência comprovada.',
    primaryImage: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80',
    ],
    color: 'Gold Champagne',
    sizes: ['S', 'M', 'L'],
    stock: 7,
  },
  {
    id: 'p4',
    title: 'KELY PANTS SET',
    slug: 'conjunto-calca-kely',
    category: 'CONJUNTOS',
    price: 39.9,
    description: 'Conjunto sob encomenda confeccionado com tecnologia zero transparência e toque aveludado de luxo.',
    primaryImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80',
    images: ['https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80'],
    color: 'Onyx Black',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 0,
    isPreorder: true,
  },
  {
    id: 'p5',
    title: 'DELUXE ROMPER',
    slug: 'macaquinho-deluxe',
    category: 'MACAQUINHOS',
    price: 49.9,
    description: 'Macaquinho luxo com recortes anatômicos que esculpem a silhueta feminina com alta sustentação.',
    primaryImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80'],
    color: 'Onyx Black',
    sizes: ['S', 'M', 'L'],
    stock: 0,
    isPreorder: true,
  },
  {
    id: 'p6',
    title: 'RAISSA JUMPSUIT',
    slug: 'macacao-raissa',
    category: 'MACACÕES',
    price: 39.9,
    description: 'Macacão fitness longo completo com compressão anatômica 100% squat-proof e acabamento premium.',
    primaryImage: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
    images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80'],
    color: 'Onyx Black',
    sizes: ['S', 'M', 'L'],
    stock: 10,
  },
];

// Helper para escapar caracteres em XML
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') || 'xml').toLowerCase();
    const origin = req.headers.get('host')
      ? `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host')}`
      : 'https://anafitwear.com';

    // 1. Busca produtos reais do banco de dados
    let rawProducts: any[] = [];
    try {
      const { data: dbProds, error: prodErr } = await supabaseServer
        .from('products')
        .select('*, categories(*)')
        .neq('slug', '__live_radar_state__')
        .neq('slug', '__site_settings_state__')
        .neq('slug', '__instagram_direct_state__')
        .order('created_at', { ascending: false });

      if (!prodErr && Array.isArray(dbProds) && dbProds.length > 0) {
        // Busca variações
        const { data: allVars } = await supabaseServer
          .from('product_variants')
          .select('*');

        rawProducts = dbProds
          .filter((p) => {
            // Ignora registros internos de estado
            if (p.slug?.startsWith('__') || p.title?.startsWith('__')) return false;
            try {
              if (p.description && p.description.startsWith('{')) {
                const meta = JSON.parse(p.description);
                if (meta.visible_online === false) return false;
              }
            } catch (e) {}
            return true;
          })
          .map((p) => {
            let meta: any = {};
            try {
              if (p.description && p.description.startsWith('{')) {
                meta = JSON.parse(p.description);
              } else if (p.description) {
                meta = { bio: p.description };
              }
            } catch (e) {}

            const pVars = (allVars || []).filter((v) => v.product_id === p.id);
            const effectiveVars = (pVars.length > 0)
              ? pVars
              : (Array.isArray(meta.variants) && meta.variants.length > 0 ? meta.variants : []);

            // Prioriza imagem da variação com estoque > 0
            const inStockVar = effectiveVars.find((v: any) => {
              const st = v.stock_quantity !== undefined ? Number(v.stock_quantity) : (v.stock !== undefined ? Number(v.stock) : 0);
              const img = v.image || (Array.isArray(v.images) && v.images[0]);
              return st > 0 && !!img;
            });
            const inStockImg = inStockVar ? (inStockVar.image || (Array.isArray(inStockVar.images) && inStockVar.images[0])) : null;

            const primaryImage = inStockImg || meta.primary_image || meta.images?.[0] || effectiveVars[0]?.images?.[0] || effectiveVars[0]?.image || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80';
            const gallery = Array.isArray(meta.images) && meta.images.length > 0
              ? meta.images
              : [primaryImage];

            const basePrice = Number(meta.promotional_price || meta.price || p.price || 49.90);

            return {
              id: p.id,
              slug: p.slug,
              title: p.title,
              category: p.categories?.name || meta.category || 'Activewear',
              description: meta.bio || meta.description || p.description || 'Moda fitness premium com zero transparência e alta compressão anatômica.',
              price: basePrice,
              primaryImage,
              images: gallery,
              color: inStockVar?.color || meta.colors?.[0]?.name || effectiveVars[0]?.color || 'Onyx Black',
              hasPadding: meta.has_padding !== false,
              variants: effectiveVars.length > 0 ? effectiveVars : [
                { size: 'S', color: 'Onyx Black', stock_quantity: 10, sku: `${p.slug}-S` },
                { size: 'M', color: 'Onyx Black', stock_quantity: 10, sku: `${p.slug}-M` },
                { size: 'L', color: 'Onyx Black', stock_quantity: 10, sku: `${p.slug}-L` },
              ],
            };
          });
      }
    } catch (err) {
      console.warn('Erro ao ler produtos para o feed TikTok:', err);
    }

    // Se a base do banco estiver vazia, utiliza o catálogo de alta definição fallback
    if (rawProducts.length === 0) {
      rawProducts = FALLBACK_CATALOG.map((f) => ({
        id: f.id,
        slug: f.slug,
        title: f.title,
        category: f.category,
        description: f.description,
        price: f.price,
        primaryImage: f.primaryImage,
        images: f.images,
        color: f.color,
        hasPadding: true,
        variants: f.sizes.map((sz) => ({
          size: sz,
          color: f.color,
          stock_quantity: f.stock > 0 ? f.stock : 0,
          sku: `${f.slug}-${sz}`,
        })),
      }));
    }

    // Achata produtos para gerar itens individuais por variação (padrão oficial TikTok Shop & Meta)
    const feedItems: any[] = [];
    rawProducts.forEach((prod) => {
      const vars = Array.isArray(prod.variants) && prod.variants.length > 0
        ? prod.variants
        : [{ size: 'M', color: prod.color || 'Onyx Black', stock_quantity: 10, sku: `${prod.slug}-M` }];

      vars.forEach((v: any) => {
        const size = v.size || 'M';
        const color = v.color || prod.color || 'Onyx Black';
        const sku = v.sku || `${prod.slug}-${size}-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
        const stock = v.stock_quantity !== undefined ? Number(v.stock_quantity) : (v.stock !== undefined ? Number(v.stock) : 0);
        const availability = stock > 0 ? 'in stock' : 'preorder';
        const itemUrl = `${origin}/produto/${prod.slug}?size=${encodeURIComponent(size)}&color=${encodeURIComponent(color)}&utm_source=tiktok_shop&utm_medium=catalog_feed&utm_campaign=product_showcase`;
        const variantImg = v.image || (Array.isArray(v.images) && v.images[0]) || prod.primaryImage;
        const addImg = prod.images?.find((img: string) => img !== variantImg) || prod.primaryImage;
        const itemPrice = Number(v.price || prod.price).toFixed(2);

        feedItems.push({
          id: sku,
          item_group_id: prod.slug,
          title: `${prod.title} - ${color} (${size})`,
          description: `${prod.description} Zero transparência e modelagem anatômica. Marca oficial ANA FITNESS WEAR LLC.`,
          link: itemUrl,
          image_link: variantImg,
          additional_image_link: addImg,
          availability,
          price: `${itemPrice} USD`,
          brand: 'ANA FITNESS WEAR',
          condition: 'new',
          google_product_category: '1604', // Apparel & Accessories > Clothing > Activewear
          product_type: `Activewear > ${prod.category}`,
          color,
          size,
          gender: 'female',
          age_group: 'adult',
          shipping_country: 'US',
          shipping_service: 'USPS Priority Mail',
          shipping_price: '9.99 USD',
        });
      });
    });

    // 2. Se o formato solicitado for CSV
    if (format === 'csv') {
      const headers = [
        'id',
        'item_group_id',
        'title',
        'description',
        'link',
        'image_link',
        'additional_image_link',
        'availability',
        'price',
        'brand',
        'condition',
        'google_product_category',
        'product_type',
        'color',
        'size',
        'gender',
        'age_group',
        'shipping',
      ];

      const csvRows = feedItems.map((item) => [
        `"${item.id}"`,
        `"${item.item_group_id}"`,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.description.replace(/"/g, '""')}"`,
        `"${item.link}"`,
        `"${item.image_link}"`,
        `"${item.additional_image_link}"`,
        `"${item.availability}"`,
        `"${item.price}"`,
        `"${item.brand}"`,
        `"${item.condition}"`,
        `"${item.google_product_category}"`,
        `"${item.product_type}"`,
        `"${item.color}"`,
        `"${item.size}"`,
        `"${item.gender}"`,
        `"${item.age_group}"`,
        `"US:USPS Priority Mail:9.99 USD"`,
      ].join(','));

      const csvContent = [headers.join(','), ...csvRows].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'inline; filename="tiktok_catalog_feed.csv"',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }

    // 3. Formato padrão: XML RSS 2.0 (Google Shopping / TikTok Shop Catalog Format)
    const itemsXml = feedItems.map((item) => `
    <item>
      <g:id>${escapeXml(item.id)}</g:id>
      <g:item_group_id>${escapeXml(item.item_group_id)}</g:item_group_id>
      <g:title>${escapeXml(item.title)}</g:title>
      <g:description>${escapeXml(item.description)}</g:description>
      <g:link>${escapeXml(item.link)}</g:link>
      <g:image_link>${escapeXml(item.image_link)}</g:image_link>
      <g:additional_image_link>${escapeXml(item.additional_image_link)}</g:additional_image_link>
      <g:availability>${item.availability}</g:availability>
      <g:price>${item.price}</g:price>
      <g:brand>${escapeXml(item.brand)}</g:brand>
      <g:condition>${item.condition}</g:condition>
      <g:google_product_category>${item.google_product_category}</g:google_product_category>
      <g:product_type>${escapeXml(item.product_type)}</g:product_type>
      <g:color>${escapeXml(item.color)}</g:color>
      <g:size>${escapeXml(item.size)}</g:size>
      <g:gender>${item.gender}</g:gender>
      <g:age_group>${item.age_group}</g:age_group>
      <g:shipping>
        <g:country>${item.shipping_country}</g:country>
        <g:service>${escapeXml(item.shipping_service)}</g:service>
        <g:price>${item.shipping_price}</g:price>
      </g:shipping>
    </item>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>ANA FITNESS WEAR • Official TikTok Catalog Feed</title>
    <link>${origin}</link>
    <description>Luxury Activewear & Zero See-Through Sets Catalog Feed for TikTok Shop and Instagram Shopping</description>
    ${itemsXml}
  </channel>
</rss>`.trim();

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err: any) {
    console.error('Erro ao gerar feed TikTok:', err);
    return new Response(`<error>${err.message}</error>`, {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
