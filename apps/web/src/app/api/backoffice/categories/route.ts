import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const { data: categories, error } = await supabaseServer
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Erro ao buscar categorias do Supabase:', error);
      return NextResponse.json({ categories: [] });
    }

    return NextResponse.json({ categories: categories || [] });
  } catch (err: any) {
    console.error('Erro no endpoint de categorias:', err);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}
