import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    const safeFilename = path.basename(filename);
    const supabaseUrl = `https://grmlmouqkixvfxbdifrc.supabase.co/storage/v1/object/public/products/${encodeURIComponent(safeFilename)}`;
    return NextResponse.redirect(supabaseUrl, 301);
  } catch (err) {
    return new NextResponse('Arquivo não encontrado', { status: 404 });
  }
}
