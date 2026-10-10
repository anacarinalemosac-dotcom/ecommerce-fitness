import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { recordOrderEvent } from '@/lib/liveStore';
import fs from 'fs';
import path from 'path';

const WRITEOFFS_FILE = path.join(process.cwd(), 'inventory_writeoffs_db.json');
const SALES_FILE = path.join(process.cwd(), 'sales_history_db.json');

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
  reason: 'OWNER_PERSONAL_USE' | 'SELLER_SAMPLE' | 'GIFT_MARKETING' | 'DEFECT_DAMAGE' | 'INVENTORY_ADJUSTMENT';
  reason_label: string;
  beneficiary_name: string;
  seller_id?: string;
  notes?: string;
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

const REASON_LABELS: Record<string, string> = {
  OWNER_PERSONAL_USE: 'Uso Próprio da Proprietária (Ana Carina)',
  SELLER_SAMPLE: 'Mostruário / Fornecimento para Vendedora Sem Custo',
  GIFT_MARKETING: 'Brinde / Marketing / Parceria Influencer',
  DEFECT_DAMAGE: 'Avaria / Defeito de Fábrica',
  INVENTORY_ADJUSTMENT: 'Ajuste de Inventário / Perda',
};

function readWriteOffs(): WriteOffRecord[] {
  try {
    if (fs.existsSync(WRITEOFFS_FILE)) {
      const raw = fs.readFileSync(WRITEOFFS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Erro ao ler inventory_writeoffs_db.json:', e);
  }
  return [];
}

function saveWriteOffs(list: WriteOffRecord[]) {
  try {
    fs.writeFileSync(WRITEOFFS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro ao salvar inventory_writeoffs_db.json:', e);
  }
}

export async function GET() {
  const writeOffs = readWriteOffs();
  const totalCost = writeOffs.reduce((acc, w) => acc + w.total_cost_value, 0);
  const totalItems = writeOffs.reduce((acc, w) => acc + w.total_items_count, 0);

  return NextResponse.json({
    writeOffs,
    summary: {
      totalDocuments: writeOffs.length,
      totalItemsWithdrawn: totalItems,
      totalCostValue: Number(totalCost.toFixed(2)),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      reason = 'OWNER_PERSONAL_USE',
      beneficiary_name = 'Ana Carina (Proprietária)',
      seller_id,
      notes = '',
      items = [],
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Selecione ao menos 1 item para registrar a saída de estoque.' },
        { status: 400 }
      );
    }

    const docNumber = `OUT-${Math.floor(100000 + Math.random() * 900000)}`;
    const reasonLabel = REASON_LABELS[reason] || 'Saída Sem Custo';

    let totalCost = 0;
    let totalQuantity = 0;
    const processedItems: any[] = [];

    // 1. Itera sobre cada item para decrementar estoque no Supabase
    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const cost = parseFloat(item.cost_price) || 15.0;
      const sku = (item.sku || '').trim().toUpperCase();

      totalCost += cost * qty;
      totalQuantity += qty;

      processedItems.push({
        sku,
        title: item.title || 'Peça Fitness',
        size: item.size || 'M',
        color: item.color || 'Preto Ônix',
        quantity: qty,
        cost_price: cost,
        total_cost: Number((cost * qty).toFixed(2)),
      });

      // 1.1 Decrementa o estoque no Supabase na tabela product_variants
      try {
        let variantQuery = supabaseServer.from('product_variants').select('id, stock_quantity');

        if (item.variant_id) {
          variantQuery = variantQuery.eq('id', item.variant_id);
        } else if (sku) {
          variantQuery = variantQuery.eq('sku', sku);
        }

        const { data: foundVariants } = await variantQuery;

        if (foundVariants && foundVariants.length > 0) {
          const v = foundVariants[0];
          const currentStock = Number(v.stock_quantity) || 0;
          const newStock = Math.max(0, currentStock - qty);

          await supabaseServer
            .from('product_variants')
            .update({ stock_quantity: newStock })
            .eq('id', v.id);
        }
      } catch (dbErr) {
        console.warn(`Aviso ao atualizar estoque Supabase para SKU ${sku}:`, dbErr);
      }
    }

    const newRecord: WriteOffRecord = {
      id: `writeoff-${Date.now()}`,
      document_number: docNumber,
      created_at: new Date().toISOString(),
      reason,
      reason_label: reasonLabel,
      beneficiary_name: beneficiary_name.trim() || 'Ana Carina (Proprietária)',
      seller_id,
      notes: notes.trim(),
      total_items_count: totalQuantity,
      total_cost_value: Number(totalCost.toFixed(2)),
      items: processedItems,
    };

    // 2. Salva no banco local de retiradas sem custo
    const allRecords = readWriteOffs();
    allRecords.unshift(newRecord);
    saveWriteOffs(allRecords);

    // 3. Registra na tabela de histórico contábil (como saída de custo $0 receita)
    try {
      if (fs.existsSync(SALES_FILE)) {
        const sales = JSON.parse(fs.readFileSync(SALES_FILE, 'utf8'));
        if (Array.isArray(sales)) {
          sales.unshift({
            id: `sale-writeoff-${Date.now()}`,
            order_id: docNumber,
            created_at: newRecord.created_at,
            customer_name: `${newRecord.beneficiary_name} (${reasonLabel})`,
            channel: 'POS_COUNTER',
            seller_name: newRecord.beneficiary_name,
            payment_method: 'CASH',
            subtotal_products: 0.00, // Sem cobrança de venda
            shipping_fee: 0.00,
            shipping_cost: 0.00,
            discount_amount: 0.00,
            payment_fee: 0.00,
            commission_amount: 0.00,
            cost_of_goods: newRecord.total_cost_value,
            net_profit: -newRecord.total_cost_value, // Custo absorvido pela empresa
            profit_margin_pct: 0.00,
            items: processedItems.map((p) => ({
              ...p,
              unit_price: 0.00,
            })),
            status: 'COMPLETED',
          });
          fs.writeFileSync(SALES_FILE, JSON.stringify(sales, null, 2), 'utf8');
        }
      }
    } catch (e) {
      console.warn('Erro ao espelhar baixa no sales_history:', e);
    }

    // 4. Dispara notificação no radar live
    try {
      recordOrderEvent({
        orderId: docNumber,
        customerName: `${newRecord.beneficiary_name} [${reasonLabel}]`,
        city: 'Leominster, MA (Saída de Estoque)',
        amount: 0,
        itemsSummary: processedItems.map((p) => `${p.quantity}x ${p.title} (${p.size})`).join(', '),
      });
    } catch (e) {
      console.warn('Erro ao emitir evento live:', e);
    }

    return NextResponse.json({
      success: true,
      message: `Saída de estoque registrada com sucesso! ${totalQuantity} peça(s) baixada(s).`,
      record: newRecord,
    });
  } catch (err: any) {
    console.error('Erro na baixa de estoque:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
