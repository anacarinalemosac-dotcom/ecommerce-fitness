import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const WRITEOFFS_ROW_ID = '00000000-0000-0000-0000-000000000097';
export const WRITEOFFS_SLUG = '__inventory_writeoffs_state__';
export const WRITEOFFS_FILE = path.join(process.cwd(), 'inventory_writeoffs_db.json');

export interface WriteOffItemPayload {
  variant_id?: string;
  product_id?: string;
  sku: string;
  title: string;
  color: string;
  size: string;
  quantity: number;
  cost_price: number;
}

export interface WriteOffRecord {
  id: string;
  document_number: string;
  created_at: string;
  date?: string; // YYYY-MM-DD
  reason: 'OWNER_PERSONAL_USE' | 'SELLER_SAMPLE' | 'GIFT_MARKETING' | 'DEFECT_DAMAGE' | 'INVENTORY_ADJUSTMENT';
  reason_label: string;
  beneficiary_name: string;
  seller_id?: string;
  notes?: string;
  skip_stock_decrement?: boolean;
  total_items_count: number;
  total_cost_value: number;
  items: Array<{
    sku: string;
    title: string;
    size: string;
    color: string;
    quantity: number;
    cost_price: number;
    total_cost: number;
  }>;
}

export const REASON_LABELS: Record<string, string> = {
  OWNER_PERSONAL_USE: 'Uso Próprio da Proprietária (Ana Carina)',
  SELLER_SAMPLE: 'Mostruário / Fornecimento para Vendedora Sem Custo',
  GIFT_MARKETING: 'Brinde / Marketing / Parceria Influencer',
  DEFECT_DAMAGE: 'Avaria / Defeito de Fábrica',
  INVENTORY_ADJUSTMENT: 'Ajuste de Inventário / Perda',
};

let memoryWriteOffs: WriteOffRecord[] | null = null;
let lastWriteOffsFetch = 0;

export async function readWriteOffs(): Promise<WriteOffRecord[]> {
  const now = Date.now();
  if (memoryWriteOffs && now - lastWriteOffsFetch < 2000) {
    return memoryWriteOffs;
  }

  // 1. Tenta carregar do Supabase (Nuvem em produção / Vercel)
  try {
    const { data: row, error } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', WRITEOFFS_ROW_ID)
      .maybeSingle();

    if (!error && row?.description) {
      try {
        const parsed = JSON.parse(row.description);
        if (Array.isArray(parsed)) {
          memoryWriteOffs = parsed;
          lastWriteOffsFetch = now;
          return parsed;
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('Erro ao ler writeOffs do Supabase:', err);
  }

  // 2. Fallback para arquivo local
  try {
    if (fs.existsSync(WRITEOFFS_FILE)) {
      const raw = fs.readFileSync(WRITEOFFS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryWriteOffs = parsed;
        lastWriteOffsFetch = now;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler inventory_writeoffs_db.json:', e);
  }

  memoryWriteOffs = [];
  lastWriteOffsFetch = now;
  return [];
}

export async function saveWriteOffs(list: WriteOffRecord[]): Promise<void> {
  memoryWriteOffs = list;
  lastWriteOffsFetch = Date.now();
  const serialized = JSON.stringify(list, null, 2);

  // 1. Salva no Supabase (Nuvem permanente para produção)
  try {
    await supabaseServer.from('products').upsert({
      id: WRITEOFFS_ROW_ID,
      title: '__INVENTORY_WRITEOFFS_STATE__',
      slug: WRITEOFFS_SLUG,
      description: serialized,
    });
  } catch (err) {
    console.warn('Erro ao salvar writeOffs no Supabase:', err);
  }

  // 2. Salva no arquivo local
  try {
    fs.writeFileSync(WRITEOFFS_FILE, serialized, 'utf8');
  } catch (e) {
    console.error('Erro ao salvar inventory_writeoffs_db.json:', e);
  }
}

export async function deleteWriteOff(idOrDoc: string): Promise<boolean> {
  const current = await readWriteOffs();
  const filtered = current.filter(
    (w) => w.id !== idOrDoc && w.document_number !== idOrDoc
  );
  if (filtered.length !== current.length) {
    await saveWriteOffs(filtered);
    return true;
  }
  return false;
}
