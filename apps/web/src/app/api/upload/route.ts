import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let buffer: Buffer | null = null;
    let originalName = 'photo.jpg';
    let mimeType = 'image/jpeg';
    let fileExtension = '.jpg';

    // 1. Suporte a Base64 via JSON
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const dataUrl = body.dataUrl || body.image;
      const fileNameHint = body.filename || 'photo';

      if (!dataUrl || !dataUrl.includes('base64,')) {
        return NextResponse.json({ error: 'Nenhum dataUrl em base64 fornecido.' }, { status: 400 });
      }

      const matches = dataUrl.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: 'Formato de imagem inválido.' }, { status: 400 });
      }

      mimeType = matches[1];
      const extMatch = mimeType.split('/')[1] || 'jpg';
      fileExtension = extMatch === 'jpeg' ? '.jpg' : `.${extMatch}`;
      originalName = `${fileNameHint}${fileExtension}`;
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      // 2. Suporte a Multipart / FormData
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
      }

      originalName = file.name;
      mimeType = file.type || 'image/jpeg';
      fileExtension = path.extname(file.name) || (mimeType.startsWith('video/') ? '.mp4' : '.jpg');
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: 'Arquivo vazio ou inválido.' }, { status: 400 });
    }

    const cleanBaseName = path
      .basename(originalName, fileExtension)
      .replace(/[^\w-]/g, '')
      .toLowerCase();
    const uniqueFilename = `ana-${Date.now()}-${cleanBaseName || 'item'}${fileExtension}`;

    // ESTRATÉGIA A: Upload Oficial no Supabase Storage (Nuvem / CDN Público)
    try {
      const { data: uploadData, error: uploadErr } = await supabaseServer.storage
        .from('product-images')
        .upload(uniqueFilename, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        const { data: publicUrlData } = supabaseServer.storage
          .from('product-images')
          .getPublicUrl(uniqueFilename);

        if (publicUrlData?.publicUrl) {
          return NextResponse.json({
            url: publicUrlData.publicUrl,
            filename: uniqueFilename,
            storage: 'supabase',
            success: true,
          });
        }
      } else if (uploadErr) {
        console.warn('Supabase Storage aviso, tentando fallback local:', uploadErr.message);
      }
    } catch (supErr: any) {
      console.warn('Erro ao conectar ao Supabase Storage:', supErr.message);
    }

    // ESTRATÉGIA B: Fallback no disco local (public/uploads)
    try {
      // Detecta pasta correta quer esteja rodando da raiz ou de apps/web
      const candidatePaths = [
        path.join(process.cwd(), 'apps', 'web', 'public', 'uploads'),
        path.join(process.cwd(), 'public', 'uploads'),
      ];

      let targetDir = candidatePaths[0];
      for (const p of candidatePaths) {
        const parent = path.dirname(p);
        if (fs.existsSync(parent)) {
          targetDir = p;
          break;
        }
      }

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, uniqueFilename);
      await fs.promises.writeFile(filePath, buffer);

      return NextResponse.json({
        url: `/uploads/${uniqueFilename}`,
        filename: uniqueFilename,
        storage: 'local',
        success: true,
      });
    } catch (fsErr: any) {
      console.warn('Fallback em disco falhou:', fsErr.message);
    }

    // ESTRATÉGIA C: Fallback para Data URL Base64 caso o disco seja read-only
    const base64Fallback = `data:${mimeType};base64,${buffer.toString('base64')}`;
    return NextResponse.json({
      url: base64Fallback,
      filename: uniqueFilename,
      storage: 'base64',
      success: true,
    });
  } catch (err: any) {
    console.error('Erro geral no endpoint de upload:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao salvar o arquivo no servidor' },
      { status: 500 }
    );
  }
}
