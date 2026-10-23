import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const FINANCES_ROW_ID = '00000000-0000-0000-0000-000000000096';
export const FINANCES_SLUG = '__finances_db_state__';
export const FINANCES_FILE = path.join(process.cwd(), 'finances_db.json');

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

export interface ClothingItemDetail {
  id: string;
  name: string;
  quantity: number;
  unitCost: number; // in USD (converted)
  unitCostOriginal?: number; // in original currency (e.g. BRL)
  totalCost?: number; // in USD (converted)
  totalCostOriginal?: number; // in original currency (e.g. BRL)
  freightPerUnit: number;
  totalCostPerUnit: number;
  suggestedPrice: number;
  commissionPct?: number;
  commissionAmount?: number;
  profitPerUnit: number;
  marginPct?: number;
  totalItemProfit?: number;
}

export interface ClothingPurchaseRecord {
  id: string;
  invoiceNumber?: string;
  currency?: 'BRL' | 'USD';
  exchangeRate?: number;
  clothesAmountOriginal?: number;
  date: string;
  supplier?: string;
  totalPieces: number;
  clothesAmount: number;
  freightAmount: number;
  totalPaid: number;
  freightPerPiece: number;
  unitCostAverage: number;
  totalCostPerPiece: number;
  defaultCommissionPct?: number;
  totalCommissionsProjected?: number;
  markupMultiplier: number;
  suggestedSalePrice: number;
  profitPerPiece: number;
  totalProjectedProfit: number;
  items?: ClothingItemDetail[];
  notes?: string;
  created_at: string;
}

export interface FinancesState {
  expenses: ExpenseRecord[];
  initialCashBalance: number; // Saldo de abertura em caixa
  clothingPurchases?: ClothingPurchaseRecord[];
  updatedAt: string;
}

import { readWriteOffs, WriteOffRecord } from '@/lib/writeOffsStore';

let memoryFinances: FinancesState | null = null;
let lastFinancesFetch = 0;

export async function syncWriteOffsToFinances(finances: FinancesState): Promise<boolean> {
  try {
    const writeOffs = await readWriteOffs();
    if (!writeOffs || writeOffs.length === 0) return false;

    if (!Array.isArray(finances.expenses)) {
      finances.expenses = [];
    }

    let modified = false;

    for (const w of writeOffs) {
      const doc = w.document_number;
      const wId = w.id;

      // Procura se já existe despesa lançada para esta retirada
      const exists = finances.expenses.some(
        (e) =>
          e.id === `exp-${wId}` ||
          e.id === `exp-${doc}` ||
          (e.notes && (e.notes.includes(doc) || (wId && e.notes.includes(wId)))) ||
          (e.description && e.description.includes(doc))
      );

      if (!exists) {
        const expenseCat: ExpenseCategory =
          w.reason === 'OWNER_PERSONAL_USE'
            ? 'WITHDRAWAL'
            : (w.reason === 'GIFT_MARKETING' || w.reason === 'SELLER_SAMPLE' ? 'MARKETING' : 'OTHER');

        const itemsSummaryText = (w.items || [])
          .map((p) => `${p.quantity}x ${p.title} (${p.color || ''} ${p.size || ''})`.trim())
          .join(', ');

        const dateStr = w.date || (w.created_at ? w.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);

        const newExpense: ExpenseRecord = {
          id: `exp-${wId || doc}`,
          date: dateStr,
          description: `[Saída Estoque #${doc}] ${w.reason_label || 'Retirada'} (${w.beneficiary_name || 'Ana Carina'}): ${itemsSummaryText || 'Peças fitness'}`,
          category: expenseCat,
          amount: Number((w.total_cost_value || 0).toFixed(2)),
          payment_method: 'OTHER',
          status: 'PAID',
          paid_at: w.created_at || new Date().toISOString(),
          notes: `Documento: ${doc}. Retirada de ${w.total_items_count} peça(s) a preço de custo contábil. ${w.notes || ''}`.trim(),
          created_at: w.created_at || new Date().toISOString(),
        };

        finances.expenses.unshift(newExpense);
        modified = true;
      }
    }

    return modified;
  } catch (err) {
    console.warn('Erro ao sincronizar writeOffs com finances:', err);
    return false;
  }
}

export async function readFinances(): Promise<FinancesState> {
  const now = Date.now();
  if (memoryFinances && now - lastFinancesFetch < 3000) {
    return memoryFinances;
  }

  let loadedFinances: FinancesState | null = null;

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
          if (!Array.isArray(parsed.clothingPurchases)) {
            parsed.clothingPurchases = [];
          }
          loadedFinances = parsed;
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('Erro ao ler finances do Supabase:', err);
  }

  // 2. Fallback para arquivo local
  if (!loadedFinances) {
    try {
      if (fs.existsSync(FINANCES_FILE)) {
        const raw = fs.readFileSync(FINANCES_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.expenses)) {
          if (!Array.isArray(parsed.clothingPurchases)) {
            parsed.clothingPurchases = [];
          }
          loadedFinances = parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler finances_db.json:', e);
    }
  }

  if (!loadedFinances) {
    loadedFinances = {
      expenses: [],
      initialCashBalance: 0,
      clothingPurchases: [],
      updatedAt: new Date().toISOString(),
    };
  }

  // 3. Auto-reconciliação contínua: garante que todas as retiradas de estoque sejam lançadas como despesas
  const writeOffsSynced = await syncWriteOffsToFinances(loadedFinances);
  if (writeOffsSynced) {
    await writeFinances(loadedFinances);
  }

  memoryFinances = loadedFinances;
  lastFinancesFetch = now;
  return loadedFinances;
}

export async function writeFinances(state: FinancesState): Promise<void> {
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
