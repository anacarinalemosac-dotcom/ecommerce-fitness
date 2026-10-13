import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SUPPLIERS_FILE = path.join(process.cwd(), 'suppliers_db.json');

const DEFAULT_SUPPLIERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    company_name: 'Confecções FitPro Brasil (Atelier Sede)',
    contact_name: 'Mariana Ramos',
    phone: '+55 11 98765-4321',
    email: 'compras@fitprobrasil.com.br',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    company_name: 'Ateliê Fitness Minas (Showroom & Costura)',
    contact_name: 'Carla Silva',
    phone: '+55 31 99888-7766',
    email: 'atelie@fitnessminas.com.br',
    created_at: '2026-02-01T00:00:00.000Z',
  },
];

function readLocalSuppliers(): any[] {
  try {
    if (fs.existsSync(SUPPLIERS_FILE)) {
      const raw = fs.readFileSync(SUPPLIERS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler suppliers_db.json:', e);
  }
  return DEFAULT_SUPPLIERS;
}

function writeLocalSuppliers(list: any[]): void {
  try {
    fs.writeFileSync(SUPPLIERS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.warn('Erro ao salvar suppliers_db.json:', e);
  }
}

export async function GET() {
  try {
    // 1. Tenta carregar do Supabase
    const { data: suppliers, error } = await supabaseServer
      .from('suppliers')
      .select('*')
      .order('company_name', { ascending: true });

    if (!error && suppliers && suppliers.length > 0) {
      writeLocalSuppliers(suppliers);
      return NextResponse.json({ success: true, suppliers });
    }

    // 2. Se vazio no Supabase, tenta inserir os padrões
    if (!error && (!suppliers || suppliers.length === 0)) {
      try {
        const { data: inserted } = await supabaseServer
          .from('suppliers')
          .insert(DEFAULT_SUPPLIERS)
          .select('*');
        if (inserted && inserted.length > 0) {
          writeLocalSuppliers(inserted);
          return NextResponse.json({ success: true, suppliers: inserted });
        }
      } catch (_) {}
    }

    // 3. Fallback para arquivo local
    const local = readLocalSuppliers();
    return NextResponse.json({ success: true, suppliers: local });
  } catch (err: any) {
    console.error('Erro no GET de fornecedores:', err);
    const local = readLocalSuppliers();
    return NextResponse.json({ success: true, suppliers: local });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, company_name, contact_name, phone, email, action } = body;

    // Ação de exclusão via POST
    if (action === 'delete') {
      const supplierId = id || body.supplier_id;
      if (!supplierId) {
        return NextResponse.json({ success: false, error: 'ID do fornecedor é obrigatório.' }, { status: 400 });
      }

      try {
        await supabaseServer.from('suppliers').delete().eq('id', supplierId);
      } catch (err) {
        console.warn('Erro ao deletar fornecedor do Supabase:', err);
      }

      const current = readLocalSuppliers().filter((s: any) => s.id !== supplierId);
      writeLocalSuppliers(current);

      return NextResponse.json({ success: true, message: 'Fornecedor removido com sucesso.', suppliers: current });
    }

    // Edição via POST se ID presente
    if (id) {
      if (!company_name?.trim()) {
        return NextResponse.json({ success: false, error: 'Nome da empresa/confecção é obrigatório.' }, { status: 400 });
      }

      const updateData = {
        company_name: company_name.trim(),
        contact_name: contact_name?.trim() || '',
        phone: phone?.trim() || '',
        email: email?.trim() || '',
      };

      let updatedSup = null;
      try {
        const { data: updated, error } = await supabaseServer
          .from('suppliers')
          .update(updateData)
          .eq('id', id)
          .select('*');
        if (!error && updated?.[0]) {
          updatedSup = updated[0];
        }
      } catch (err) {
        console.warn('Erro ao atualizar fornecedor no Supabase:', err);
      }

      const current = readLocalSuppliers().map((s: any) => {
        if (s.id === id) {
          return { ...s, ...updateData };
        }
        return s;
      });
      writeLocalSuppliers(current);

      return NextResponse.json({
        success: true,
        supplier: updatedSup || { id, ...updateData },
        suppliers: current,
      });
    }

    // Criação de novo fornecedor
    if (!company_name?.trim()) {
      return NextResponse.json({ success: false, error: 'Nome da confecção ou empresa é obrigatório.' }, { status: 400 });
    }

    const newSupplier = {
      company_name: company_name.trim(),
      contact_name: contact_name?.trim() || '',
      phone: phone?.trim() || '',
      email: email?.trim() || '',
    };

    let created = null;
    try {
      const { data: saved, error } = await supabaseServer
        .from('suppliers')
        .insert([newSupplier])
        .select('*');
      if (!error && saved?.[0]) {
        created = saved[0];
      }
    } catch (err) {
      console.warn('Erro ao inserir fornecedor no Supabase:', err);
    }

    const finalSupplier = created || {
      id: `sup-${Date.now()}`,
      ...newSupplier,
      created_at: new Date().toISOString(),
    };

    const current = readLocalSuppliers();
    current.unshift(finalSupplier);
    writeLocalSuppliers(current);

    return NextResponse.json({ success: true, supplier: finalSupplier, suppliers: current });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, company_name, contact_name, phone, email } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do fornecedor é obrigatório.' }, { status: 400 });
    }
    if (!company_name?.trim()) {
      return NextResponse.json({ success: false, error: 'Nome da confecção é obrigatório.' }, { status: 400 });
    }

    const updateData = {
      company_name: company_name.trim(),
      contact_name: contact_name?.trim() || '',
      phone: phone?.trim() || '',
      email: email?.trim() || '',
    };

    let updatedSup = null;
    try {
      const { data: updated, error } = await supabaseServer
        .from('suppliers')
        .update(updateData)
        .eq('id', id)
        .select('*');
      if (!error && updated?.[0]) {
        updatedSup = updated[0];
      }
    } catch (err) {
      console.warn('Erro ao atualizar fornecedor no Supabase:', err);
    }

    const current = readLocalSuppliers().map((s: any) => {
      if (s.id === id) {
        return { ...s, ...updateData };
      }
      return s;
    });
    writeLocalSuppliers(current);

    return NextResponse.json({
      success: true,
      supplier: updatedSup || { id, ...updateData },
      suppliers: current,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do fornecedor é obrigatório.' }, { status: 400 });
    }

    try {
      await supabaseServer.from('suppliers').delete().eq('id', id);
    } catch (err) {
      console.warn('Erro ao deletar fornecedor do Supabase:', err);
    }

    const current = readLocalSuppliers().filter((s: any) => s.id !== id);
    writeLocalSuppliers(current);

    return NextResponse.json({ success: true, message: 'Fornecedor removido com sucesso.', suppliers: current });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
