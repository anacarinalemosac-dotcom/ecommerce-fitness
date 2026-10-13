import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FINANCES_ROW_ID = '00000000-0000-0000-0000-000000000096';
const FINANCES_SLUG = '__finances_db_state__';
const FINANCES_FILE = path.join(process.cwd(), 'finances_db.json');

export type ExpenseCategory =
  | 'RENT' // Aluguel & Showroom Leominster
  | 'UTILITIES' // Contas de Consumo (Luz, Internet, Água)
  | 'SUPPLIERS' // Fornecedores, Confecção & Tecidos
  | 'PACKAGING' // Embalagens, Sacolas & Etiquetas
  | 'SHIPPING' // Fretes & Correios (USPS)
  | 'MARKETING' // Marketing & Anúncios (Instagram Ads)
  | 'WITHDRAWAL' // Retirada da Sócia / Dona (Pró-labore Ana)
  | 'TAXES' // Taxas, Impostos & Contabilidade
  | 'OTHER'; // Diversos / Outros

export interface ExpenseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: ExpenseCategory;
  amount: number; // $ USD
  payment_method: 'ZELLE' | 'BANK' | 'CASH' | 'CARD' | 'VENMO' | 'OTHER';
  status: 'PAID' | 'PENDING';
  due_date?: string; // YYYY-MM-DD
  paid_at?: string;
  notes?: string;
  created_at: string;
}

export interface FinancesState {
  expenses: ExpenseRecord[];
  initialCashBalance: number; // Saldo de abertura em caixa
  updatedAt: string;
}

let memoryFinances: FinancesState | null = null;
let lastFinancesFetch = 0;

async function readFinances(): Promise<FinancesState> {
  const now = Date.now();
  if (memoryFinances && now - lastFinancesFetch < 3000) {
    return memoryFinances;
  }

  // 1. Tenta carregar do Supabase (Nuvem em produção / Vercel)
  try {
    const { data: row, error } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', FINANCES_ROW_ID)
      .maybeSingle();

    if (!error && row?.description) {
      try {
        const parsed = JSON.parse(row.description);
        if (parsed && Array.isArray(parsed.expenses)) {
          memoryFinances = parsed;
          lastFinancesFetch = now;
          return memoryFinances as FinancesState;
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('Erro ao ler finances do Supabase:', err);
  }

  // 2. Fallback para arquivo local
  try {
    if (fs.existsSync(FINANCES_FILE)) {
      const raw = fs.readFileSync(FINANCES_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.expenses)) {
        memoryFinances = parsed;
        lastFinancesFetch = now;
        return memoryFinances as FinancesState;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler finances_db.json:', e);
  }

  const defaultState: FinancesState = {
    expenses: [],
    initialCashBalance: 0,
    updatedAt: new Date().toISOString(),
  };

  memoryFinances = defaultState;
  lastFinancesFetch = now;
  return defaultState;
}

async function writeFinances(state: FinancesState): Promise<void> {
  state.updatedAt = new Date().toISOString();
  memoryFinances = state;
  lastFinancesFetch = Date.now();
  const serialized = JSON.stringify(state, null, 2);

  // 1. Salva no Supabase (Nuvem permanente para produção)
  try {
    await supabaseServer.from('products').upsert({
      id: FINANCES_ROW_ID,
      title: '__FINANCES_DB_STATE__',
      slug: FINANCES_SLUG,
      description: serialized,
    });
  } catch (err) {
    console.warn('Erro ao salvar finances no Supabase:', err);
  }

  // 2. Salva no arquivo local
  try {
    fs.writeFileSync(FINANCES_FILE, serialized, 'utf8');
  } catch (e) {
    console.warn('Erro ao salvar finances_db.json:', e);
  }
}

export async function GET() {
  try {
    const finances = await readFinances();
    return NextResponse.json({ success: true, finances });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const finances = await readFinances();

    // 1. Salvar ou Criar Despesa
    if (action === 'save_expense') {
      const {
        id,
        date,
        description,
        category,
        amount,
        payment_method = 'ZELLE',
        status = 'PAID',
        due_date,
        notes = '',
      } = body.expense || {};

      if (!description || !amount || Number(amount) <= 0) {
        return NextResponse.json(
          { success: false, error: 'Descrição e valor da despesa são obrigatórios.' },
          { status: 400 }
        );
      }

      const expenseDate = date || new Date().toISOString().split('T')[0];
      const parsedAmount = Math.max(0, Number(amount));

      if (id) {
        // Atualiza despesa existente
        finances.expenses = finances.expenses.map((exp) => {
          if (exp.id === id) {
            return {
              ...exp,
              date: expenseDate,
              description: description.trim(),
              category: (category as ExpenseCategory) || exp.category || 'OTHER',
              amount: parsedAmount,
              payment_method: payment_method || exp.payment_method || 'ZELLE',
              status: status || exp.status || 'PAID',
              due_date: due_date || exp.due_date,
              paid_at: status === 'PAID' ? (exp.paid_at || new Date().toISOString()) : undefined,
              notes: notes !== undefined ? notes.trim() : exp.notes,
            };
          }
          return exp;
        });
      } else {
        // Nova despesa
        const newExpense: ExpenseRecord = {
          id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          date: expenseDate,
          description: description.trim(),
          category: (category as ExpenseCategory) || 'OTHER',
          amount: parsedAmount,
          payment_method: payment_method || 'ZELLE',
          status: status || 'PAID',
          due_date: due_date || (status === 'PENDING' ? expenseDate : undefined),
          paid_at: status === 'PAID' ? new Date().toISOString() : undefined,
          notes: notes?.trim() || '',
          created_at: new Date().toISOString(),
        };
        finances.expenses.unshift(newExpense);
      }

      await writeFinances(finances);
      return NextResponse.json({ success: true, finances });
    }

    // 2. Excluir Despesa
    if (action === 'delete_expense') {
      const { expense_id } = body;
      if (!expense_id) {
        return NextResponse.json({ success: false, error: 'ID da despesa obrigatório.' }, { status: 400 });
      }
      finances.expenses = finances.expenses.filter((exp) => exp.id !== expense_id);
      await writeFinances(finances);
      return NextResponse.json({ success: true, finances });
    }

    // 3. Marcar Despesa como Paga (dar baixa em conta pendente)
    if (action === 'mark_paid') {
      const { expense_id, payment_method } = body;
      finances.expenses = finances.expenses.map((exp) => {
        if (exp.id === expense_id) {
          return {
            ...exp,
            status: 'PAID',
            paid_at: new Date().toISOString(),
            payment_method: payment_method || exp.payment_method || 'ZELLE',
          };
        }
        return exp;
      });
      await writeFinances(finances);
      return NextResponse.json({ success: true, finances });
    }

    // 4. Atualizar Saldo Inicial de Caixa
    if (action === 'update_initial_balance') {
      const { balance } = body;
      finances.initialCashBalance = Number(balance) || 0;
      await writeFinances(finances);
      return NextResponse.json({ success: true, finances });
    }

    return NextResponse.json({ success: false, error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
