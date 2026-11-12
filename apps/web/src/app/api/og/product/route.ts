import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { resolveAbsoluteAssetUrl, resolveProductOgData } from '@/lib/productOgHelper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function loadImageBuffer(rawUrl: string, origin: string): Promise<Buffer | null> {
  // 1. Leitura local direta caso seja arquivo em /uploads/ ou public/
  if (rawUrl.startsWith('/')) {
    const cleanRel = rawUrl.split('?')[0].replace(/^\/+/, '');
    const publicCandidate = path.join(process.cwd(), 'public', cleanRel);
    if (fs.existsSync(publicCandidate)) {
      return fs.readFileSync(publicCandidate);
    }
    const uploadsCandidate = path.join(process.cwd(), cleanRel);
    if (fs.existsSync(uploadsCandidate)) {
      return fs.readFileSync(uploadsCandidate);
    }
  }

  // 2. Download HTTP/HTTPS (ex: Supabase Storage)
  const absoluteUrl = resolveAbsoluteAssetUrl(rawUrl, origin);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(absoluteUrl, {
      signal: controller.signal,
      headers: { Accept: 'image/*,*/*;q=0.8' },
    });
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = (searchParams.get('slug') || '').trim();
    const directSrc = (searchParams.get('src') || '').trim();

    const origin = req.nextUrl.origin || 'https://www.anafitwear.com';
    let targetImage = directSrc;

    if (slug && !targetImage) {
      const ogData = await resolveProductOgData(slug);
      targetImage = ogData?.rawImageUrl || '';
    }

    if (!targetImage) {
      targetImage = '/logo-ana-fitness.png';
    }

    const inputBuffer = await loadImageBuffer(targetImage, origin);
    if (!inputBuffer) {
      const fallbackLogo = path.join(process.cwd(), 'public', 'logo-ana-fitness.png');
      if (fs.existsSync(fallbackLogo)) {
        const logoBuf = await sharp(fs.readFileSync(fallbackLogo))
          .flatten({ background: '#0D0D0D' })
          .resize(800, 800, { fit: 'contain', background: '#0D0D0D' })
          .jpeg({ quality: 82 })
          .toBuffer();
        return new NextResponse(new Uint8Array(logoBuf), {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
      return NextResponse.json({ error: 'Image unavailable' }, { status: 404 });
    }

    // Comprime para JPEG leve (<100KB tipicamente) e corrige orientação EXIF para WhatsApp/iMessage/Instagram
    const compressedJpeg = await sharp(inputBuffer)
      .rotate()
      .flatten({ background: '#ffffff' })
      .resize(800, 1000, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 78,
        mozjpeg: true,
      })
      .toBuffer();

    return new NextResponse(new Uint8Array(compressedJpeg), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(compressedJpeg.byteLength),
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err: any) {
    console.error('Erro ao gerar imagem OG do produto:', err);
    return NextResponse.json({ error: 'OG image error' }, { status: 500 });
  }
}
