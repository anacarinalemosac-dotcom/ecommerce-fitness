import { Metadata } from 'next';
import {
  normalizeOriginFromHeaders,
  resolveAbsoluteAssetUrl,
  resolveProductOgData,
} from '@/lib/productOgHelper';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = params.slug;
  const origin = normalizeOriginFromHeaders();

  try {
    const product = await resolveProductOgData(slug);

    if (!product) {
      return {
        metadataBase: new URL(origin),
        title: 'ANA Fitness Wear | Luxury Activewear',
        description:
          'Moda fitness feminina de alta performance e compressão anatômica com zero transparência comprovada.',
      };
    }

    const title = `${product.title} | ANA Fitness Wear`;
    const description =
      product.description ||
      'Moda fitness feminina premium com tecnologia squat-proof e compressão anatômica.';

    // Endpoint /api/og/product gera uma JPEG leve (<100KB) da foto real do produto para WhatsApp/Instagram/iMessage
    const ogImageUrl = product.rawImageUrl
      ? `${origin}/api/og/product?slug=${encodeURIComponent(slug)}`
      : `${origin}/logo-ana-fitness.png`;

    const productPageUrl = `${origin}/produto/${encodeURIComponent(slug)}`;

    return {
      metadataBase: new URL(origin),
      title,
      description,
      openGraph: {
        title,
        description,
        url: productPageUrl,
        siteName: 'ANA Fitness Wear',
        images: [
          {
            url: ogImageUrl,
            secureUrl: ogImageUrl.startsWith('https://') ? ogImageUrl : undefined,
            width: 800,
            height: 1000,
            type: 'image/jpeg',
            alt: product.title,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
      other: {
        'product:price:amount': product.price,
        'product:price:currency': 'USD',
        'product:availability': product.inStock ? 'in stock' : 'preorder',
        'product:condition': 'new',
        'product:brand': 'ANA Fitness Wear',
      },
    };
  } catch (e) {
    return {
      metadataBase: new URL(origin),
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
  const origin = normalizeOriginFromHeaders();
  let jsonLd: any = null;

  try {
    const product = await resolveProductOgData(slug);
    if (product) {
      const resolvedImg = product.rawImageUrl
        ? resolveAbsoluteAssetUrl(product.rawImageUrl, origin)
        : `${origin}/logo-ana-fitness.png`;

      jsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.title,
        image: resolvedImg,
        description: product.description,
        brand: {
          '@type': 'Brand',
          name: 'ANA Fitness Wear',
        },
        offers: {
          '@type': 'Offer',
          url: `${origin}/produto/${encodeURIComponent(slug)}`,
          priceCurrency: 'USD',
          price: product.price,
          availability: product.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/PreOrder',
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
