import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    const safeFilename = path.basename(filename);

    // 1. Caminho local no disco
    const primaryDir = path.join(process.cwd(), 'public', 'products');
    const fallbackDir = path.join(process.cwd(), 'apps', 'web', 'public', 'products');
    let localPath = path.join(primaryDir, safeFilename);

    if (!fs.existsSync(localPath) && fs.existsSync(path.join(fallbackDir, safeFilename))) {
      localPath = path.join(fallbackDir, safeFilename);
    }

    const ext = path.extname(safeFilename).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.svg') mimeType = 'image/svg+xml';
    else if (ext === '.mp4') mimeType = 'video/mp4';
    else if (ext === '.mov') mimeType = 'video/quicktime';

    // Se existe localmente no disco, serve imediatamente
    if (fs.existsSync(localPath)) {
      const fileBuffer = await fs.promises.readFile(localPath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. Se não existe no disco, busca no Supabase Storage e salva cache local
    const supabaseUrl = `https://grmlmouqkixvfxbdifrc.supabase.co/storage/v1/object/public/products/${encodeURIComponent(safeFilename)}`;
    try {
      const res = await fetch(supabaseUrl);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);

        // Salva cópia local para as próximas requisições não gastarem banda do Supabase
        const targetFolder = fs.existsSync(fallbackDir) ? fallbackDir : primaryDir;
        if (!fs.existsSync(targetFolder)) {
          fs.mkdirSync(targetFolder, { recursive: true });
        }
        try {
          fs.writeFileSync(path.join(targetFolder, safeFilename), buffer);
        } catch (_) {}

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': res.headers.get('content-type') || mimeType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    } catch (_) {}

    return new NextResponse('Imagem não encontrada', { status: 404 });
  } catch (err) {
    return new NextResponse('Erro interno ao ler imagem', { status: 500 });
  }
}
