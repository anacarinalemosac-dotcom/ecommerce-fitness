import { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabaseServer';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = params.slug;
  try {
    const { data: prod } = await supabaseServer
      .from('products')
      .select('*, categories(*)')
      .eq('slug', slug)
      .single();

    if (!prod) {
      return {
        title: 'ANA Fitness Wear | Luxury Activewear',
        description: 'Moda fitness feminina de alta performance e compressão anatômica com zero transparência comprovada.',
      };
    }

    let meta: any = {};
    try {
      if (prod.description && prod.description.startsWith('{')) {
        meta = JSON.parse(prod.description);
      }
    } catch (e) {}

    const title = prod.title || 'ANA Fitness Wear';
    const description =
      meta.bio ||
      meta.description ||
      'Moda fitness feminina premium com tecnologia squat-proof e compressão anatômica.';
    const price = Number(meta.promotional_price || meta.price || prod.price || 39.90).toFixed(2);
    const imageUrl =
      meta.primary_image ||
      meta.images?.[0] ||
      'https://www.anafitwear.com/logo-ana-fitness.png';

    return {
      title: `${title} | ANA Fitness Wear`,
      description,
      openGraph: {
        title: `${title} | ANA Fitness Wear`,
        description,
        url: `https://www.anafitwear.com/produto/${slug}`,
        siteName: 'ANA Fitness Wear',
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 1000,
            alt: title,
          },
        ],
        type: 'website',
      },
      other: {
        'product:price:amount': price,
        'product:price:currency': 'USD',
        'product:availability': 'in stock',
        'product:condition': 'new',
        'product:brand': 'ANA Fitness Wear',
      },
    };
  } catch (e) {
    return {
      title: 'ANA Fitness Wear',
    };
  }
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const slug = params.slug;
  let jsonLd: any = null;

  try {
    const { data: prod } = await supabaseServer
      .from('products')
      .select('*, product_variants(*)')
      .eq('slug', slug)
      .single();

    if (prod) {
      let meta: any = {};
      try {
        if (prod.description && prod.description.startsWith('{')) {
          meta = JSON.parse(prod.description);
        }
      } catch (e) {}

      const title = prod.title || 'ANA Fitness Wear';
      const description = meta.bio || meta.description || 'Moda fitness feminina premium.';
      const price = Number(meta.promotional_price || meta.price || prod.price || 39.90).toFixed(2);
      const imageUrl =
        meta.primary_image ||
        meta.images?.[0] ||
        'https://www.anafitwear.com/logo-ana-fitness.png';
      const variants = Array.isArray(prod.product_variants) ? prod.product_variants : [];
      const inStock = variants.length === 0 || variants.some((v: any) => (v.stock_quantity || 0) > 0);

      jsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: title,
        image: imageUrl,
        description: description,
        brand: {
          '@type': 'Brand',
          name: 'ANA Fitness Wear',
        },
        offers: {
          '@type': 'Offer',
          url: `https://www.anafitwear.com/produto/${slug}`,
          priceCurrency: 'USD',
          price: price,
          availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
          itemCondition: 'https://schema.org/NewCondition',
        },
      };
    }
  } catch (e) {}

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
