import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SETTINGS_FILE = path.join(process.cwd(), 'site_customizations.json');

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  sets: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700&q=80',
  rompers: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80',
  jumpsuits: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=700&q=80',
  tops: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=700&q=80',
  preorder: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80',
};

function readCategoryImages(): Record<string, string> {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      if (data && data.categoryImages) {
        return { ...DEFAULT_CATEGORY_IMAGES, ...data.categoryImages };
      }
    }
  } catch (_) {}
  return DEFAULT_CATEGORY_IMAGES;
}

function saveCategoryImages(images: Record<string, string>) {
  try {
    let data: any = {};
    if (fs.existsSync(SETTINGS_FILE)) {
      data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    }
    data.categoryImages = images;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('Erro ao salvar site_customizations.json:', e);
  }
}

export async function GET() {
  try {
    const { data: categories, error } = await supabaseServer
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    const categoryImages = readCategoryImages();

    return NextResponse.json(
      {
        categories: categories || [],
        categoryImages,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('Erro no endpoint de categorias:', err);
    return NextResponse.json({ categories: [], categoryImages: DEFAULT_CATEGORY_IMAGES }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Criação de nova Categoria
    if (body.name && typeof body.name === 'string') {
      const cleanName = body.name.trim();
      const cleanSlug = (body.slug || cleanName)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Verifica se já existe categoria com esse slug ou nome
      const { data: existing } = await supabaseServer
        .from('categories')
        .select('*')
        .or(`slug.eq.${cleanSlug},name.ilike.${cleanName}`)
        .limit(1)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          success: true,
          category: existing,
          alreadyExisted: true,
          message: `A categoria "${existing.name}" já existia e foi selecionada.`,
        });
      }

      const { data: inserted, error: insertErr } = await supabaseServer
        .from('categories')
        .insert({
          name: cleanName,
          slug: cleanSlug,
        })
        .select()
        .single();

      if (insertErr) {
        console.error('Erro ao cadastrar categoria no Supabase:', insertErr);
        return NextResponse.json({ error: `Erro no Supabase: ${insertErr.message}` }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        category: inserted,
        message: `Categoria "${cleanName}" cadastrada com sucesso!`,
      });
    }

    // 2. Atualização das Imagens de Capa das Categorias
    const { categoryImages } = body;
    if (categoryImages && typeof categoryImages === 'object') {
      saveCategoryImages(categoryImages);
      return NextResponse.json({ success: true, categoryImages });
    }

    return NextResponse.json({ error: 'Dados inválidos. Forneça "name" para cadastrar categoria ou "categoryImages".' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da categoria é obrigatório.' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Categoria excluída com sucesso.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
