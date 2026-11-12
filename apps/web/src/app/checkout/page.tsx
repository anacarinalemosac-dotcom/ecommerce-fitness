import type { Metadata } from 'next';
import CheckoutClient from './CheckoutClient';
import { normalizeOriginFromHeaders, resolveProductOgData } from '@/lib/productOgHelper';

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const origin = normalizeOriginFromHeaders();
  const rawSlug = searchParams?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (!slug) {
    return {
      metadataBase: new URL(origin),
      title: 'Checkout Seguro | ANA Fitness Wear',
      description: 'Finalize sua compra com Zelle, Venmo, Cash App, Cartão, Apple Pay, Affirm ou Afterpay.',
    };
  }

  const product = await resolveProductOgData(String(slug).trim());
  if (!product) {
    return {
      metadataBase: new URL(origin),
      title: 'Checkout Direto | ANA Fitness Wear',
    };
  }

  const title = `${product.title} ($${product.price}) | Checkout Direto ANA Fitness Wear`;
  const ogImageUrl = product.rawImageUrl
    ? `${origin}/api/og/product?slug=${encodeURIComponent(product.slug)}`
    : `${origin}/logo-ana-fitness.png`;

  return {
    metadataBase: new URL(origin),
    title,
    description: product.description,
    openGraph: {
      title,
      description: product.description,
      url: `${origin}/checkout?direct=1&slug=${encodeURIComponent(product.slug)}`,
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
      description: product.description,
      images: [ogImageUrl],
    },
  };
}

export default function CheckoutPage() {
  return <CheckoutClient />;
}
