import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const { data: suppliers, error } = await supabaseServer
      .from('suppliers')
      .select('*')
      .order('company_name', { ascending: true });

    if (error) {
      console.warn('Erro ao buscar fornecedores do Supabase:', error);
      return NextResponse.json({ suppliers: [] }, { status: 200 });
    }

    // Se estiver vazio, insere o fornecedor padrão FitPro Brasil
    if (!suppliers || suppliers.length === 0) {
      const defaultSupplier = {
        company_name: 'Confecções FitPro Brasil (Atelier Sede)',
        contact_name: 'Mariana Ramos',
        phone: '+55 11 98765-4321',
        email: 'compras@fitprobrasil.com.br',
      };
      const { data: inserted } = await supabaseServer
        .from('suppliers')
        .insert([defaultSupplier])
        .select('*');
      return NextResponse.json({ suppliers: inserted || [defaultSupplier] });
    }

    return NextResponse.json({ suppliers });
  } catch (err: any) {
    console.error('Erro no endpoint de fornecedores:', err);
    return NextResponse.json({ suppliers: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { company_name, contact_name, phone, email } = body;

    if (!company_name) {
      return NextResponse.json({ error: 'Nome da empresa/confecção é obrigatório.' }, { status: 400 });
    }

    const { data: savedSuppliers, error } = await supabaseServer
      .from('suppliers')
      .insert([{ company_name, contact_name, phone, email }])
      .select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const supplier = savedSuppliers?.[0] || null;
    return NextResponse.json({ supplier });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
