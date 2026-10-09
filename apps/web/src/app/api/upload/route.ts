import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 1. Suporte a Base64 via JSON
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const dataUrl = body.dataUrl || body.image;
      const fileNameHint = body.filename || 'photo';

      if (!dataUrl || !dataUrl.includes('base64,')) {
        return NextResponse.json({ error: 'Nenhum dataUrl em base64 fornecido.' }, { status: 400 });
      }

      const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: 'Formato de imagem inválido.' }, { status: 400 });
      }

      const ext = matches[1] === 'jpeg' ? '.jpg' : `.${matches[1]}`;
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const filename = `ana-${Date.now()}-${fileNameHint.replace(/[^\w-]/g, '')}${ext}`;
      const filePath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filePath, buffer);

      return NextResponse.json({ url: `/uploads/${filename}`, filename, success: true });
    }

    // 2. Suporte a Multipart / FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extension = path.extname(file.name) || '.jpg';
    const cleanBaseName = path.basename(file.name, extension).replace(/[^\w-]/g, '');
    const filename = `ana-${Date.now()}-${cleanBaseName || 'photo'}${extension}`;

    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}`, filename, success: true });
  } catch (err: any) {
    console.error('Erro no upload de arquivo:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao salvar a imagem no servidor' },
      { status: 500 }
    );
  }
}
