import { headers } from 'next/headers';
import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export interface ProductOgData {
  slug: string;
  title: string;
  description: string;
  price: string;
  rawImageUrl: string | null;
  inStock: boolean;
  variants: any[];
}

function isVideoOrLogoUrl(url?: string | null): boolean {
  if (!url) return true;
  const clean = String(url).trim().toLowerCase();
  if (!clean) return true;
  if (clean.includes('logo-ana-fitness.png') || clean.includes('symbol-ana-fitness.png')) return true;
  if (/\.(mp4|webm|mov|m4v)(\?|$)/.test(clean)) return true;
  if (clean.startsWith('data:')) return true;
  return false;
}

export function normalizeOriginFromHeaders(): string {
  try {
    const h = headers();
    const proto = (h.get('x-forwarded-proto') || 'https').split(',')[0].trim();
    const host = (h.get('x-forwarded-host') || h.get('host') || '').split(',')[0].trim();
    if (host) {
      return `${host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : proto}://${host}`;
    }
  } catch (_) {}
  return 'https://www.anafitwear.com';
}

export function resolveAbsoluteAssetUrl(url: string | null | undefined, origin: string): string {
  if (!url) return `${origin}/logo-ana-fitness.png`;
  const trimmed = String(url).trim();
  if (!trimmed) return `${origin}/logo-ana-fitness.png`;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${normalizedPath}`;
}

export async function resolveProductOgData(slug: string): Promise<ProductOgData | null> {
  if (!slug) return null;

  try {
    const { data: prod } = await supabaseServer
      .from('products')
      .select('*, categories(*), product_variants(*)')
      .eq('slug', slug)
      .maybeSingle();

    if (prod) {
      let meta: any = {};
      try {
        if (prod.description && String(prod.description).trim().startsWith('{')) {
          meta = JSON.parse(prod.description);
        } else if (prod.description) {
          meta = { bio: prod.description };
        }
      } catch (_) {}

      const dbVariants = Array.isArray(prod.product_variants) ? prod.product_variants : [];
      const metaVariants = Array.isArray(meta.variants) ? meta.variants : [];
      const variants = dbVariants.length > 0 ? dbVariants : metaVariants;

      const variantImages = variants.flatMap((v: any) =>
        Array.isArray(v?.images) ? v.images : v?.image ? [v.image] : []
      );
      const candidates = [
        meta.primary_image,
        ...(Array.isArray(meta.images) ? meta.images : []),
        ...(Array.isArray(meta.gallery) ? meta.gallery : []),
        ...variantImages,
      ];
      const realImage = candidates.find((u) => !isVideoOrLogoUrl(u)) || null;

      const title = String(prod.title || 'ANA Fitness Wear').trim();
      const description =
        String(
          meta.bio ||
            meta.descriptionPt ||
            meta.descriptionEn ||
            meta.description ||
            'Moda fitness feminina de alta performance e compressão anatômica com zero transparência.'
        ).trim();
      const price = Number(meta.promotional_price || meta.price || prod.price || variants[0]?.price || 39.9).toFixed(2);
      const inStock = variants.length === 0 || variants.some((v: any) => Number(v.stock_quantity ?? v.stock ?? 0) > 0);

      return {
        slug,
        title,
        description,
        price,
        rawImageUrl: realImage,
        inStock,
        variants,
      };
    }
  } catch (_) {}

  // Fallback: busca em live_store_db.json caso o produto não tenha sido encontrado na consulta direta
  try {
    const backupFile = path.join(process.cwd(), 'live_store_db.json');
    if (fs.existsSync(backupFile)) {
      const parsed = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.products) ? parsed.products : [];
      const found = list.find((p: any) => String(p?.slug || '').toLowerCase() === slug.toLowerCase());
      if (found) {
        const candidates = [
          found.primary_image,
          ...(Array.isArray(found.images) ? found.images : []),
          ...(Array.isArray(found.galleryImages) ? found.galleryImages : []),
          ...((Array.isArray(found.variants) ? found.variants : []).flatMap((v: any) =>
            Array.isArray(v?.images) ? v.images : v?.image ? [v.image] : []
          )),
        ];
        const realImage = candidates.find((u) => !isVideoOrLogoUrl(u)) || null;
        return {
          slug: found.slug || slug,
          title: found.title || 'ANA Fitness Wear',
          description: found.descriptionPt || found.description || 'Moda fitness feminina de alta performance.',
          price: Number(found.price || 39.9).toFixed(2),
          rawImageUrl: realImage,
          inStock: Number(found.stock ?? 1) > 0,
          variants: Array.isArray(found.variants) ? found.variants : [],
        };
      }
    }
  } catch (_) {}

  return null;
}
