import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { recordOrderEvent } from '@/lib/liveStore';
import fs from 'fs';
import path from 'path';
import {
  readWriteOffs,
  saveWriteOffs,
  deleteWriteOff,
  WriteOffRecord,
  WriteOffItemPayload,
  REASON_LABELS,
} from '@/lib/writeOffsStore';
import {
  readFinances,
  writeFinances,
  syncWriteOffsToFinances,
  ExpenseRecord,
  ExpenseCategory,
} from '@/lib/financesStore';

const SALES_FILE = path.join(process.cwd(), 'sales_history_db.json');

export type { WriteOffRecord, WriteOffItemPayload };

export async function GET() {
  try {
    const writeOffs = await readWriteOffs();
    const totalCost = writeOffs.reduce((acc, w) => acc + (Number(w.total_cost_value) || 0), 0);
    const totalItems = writeOffs.reduce((acc, w) => acc + (Number(w.total_items_count) || 0), 0);

    // Garante que o financeiro esteja reconciliado
    try {
      const finances = await readFinances();
      await syncWriteOffsToFinances(finances);
    } catch (_) {}

    return NextResponse.json({
      writeOffs,
      summary: {
        totalDocuments: writeOffs.length,
        totalItemsWithdrawn: totalItems,
        totalCostValue: Number(totalCost.toFixed(2)),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
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
      date,
      created_at: customCreatedAt,
      skip_stock_decrement = false,
      skipStockDecrement = false,
    } = body;

    const shouldSkipStock = Boolean(skip_stock_decrement || skipStockDecrement);

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Selecione ao menos 1 item para registrar a saída de estoque.' },
        { status: 400 }
      );
    }

    const docNumber = `OUT-${Math.floor(100000 + Math.random() * 900000)}`;
    const reasonLabel = REASON_LABELS[reason] || 'Saída Sem Custo';

    // Determina a data correta (permitindo lançamentos retroativos)
    const recordDate = date || (customCreatedAt ? customCreatedAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    const finalCreatedAt = customCreatedAt || `${recordDate}T12:00:00.000Z`;

    let totalCost = 0;
    let totalQuantity = 0;
    const processedItems: any[] = [];

    // 1. Itera sobre cada item para decrementar estoque no Supabase (se não for retroativo com skip)
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

      // 1.1 Decrementa o estoque no Supabase na tabela product_variants apenas se não for marcado como skip
      if (!shouldSkipStock) {
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
    }

    const newRecord: WriteOffRecord = {
      id: `writeoff-${Date.now()}`,
      document_number: docNumber,
      created_at: finalCreatedAt,
      date: recordDate,
      reason,
      reason_label: reasonLabel,
      beneficiary_name: beneficiary_name.trim() || 'Ana Carina (Proprietária)',
      seller_id,
      notes: notes.trim(),
      skip_stock_decrement: shouldSkipStock,
      total_items_count: totalQuantity,
      total_cost_value: Number(totalCost.toFixed(2)),
      items: processedItems,
    };

    // 2. Salva no banco de retiradas sem custo (Supabase + Local)
    const allRecords = await readWriteOffs();
    allRecords.unshift(newRecord);
    await saveWriteOffs(allRecords);

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

    // 3.1 Registra automaticamente como DESPESA no Módulo Financeiro / Fluxo de Caixa
    try {
      const finances = await readFinances();
      const expenseCat: ExpenseCategory = reason === 'OWNER_PERSONAL_USE'
        ? 'WITHDRAWAL'
        : (reason === 'GIFT_MARKETING' || reason === 'SELLER_SAMPLE' ? 'MARKETING' : 'OTHER');

      const itemsSummaryText = processedItems.map((p) => `${p.quantity}x ${p.title} (${p.color} - ${p.size})`).join(', ');

      const expenseRecord: ExpenseRecord = {
        id: `exp-${newRecord.id || docNumber}`,
        date: recordDate,
        description: `[Saída Estoque #${docNumber}] ${reasonLabel} (${newRecord.beneficiary_name}): ${itemsSummaryText}`,
        category: expenseCat,
        amount: Number(newRecord.total_cost_value.toFixed(2)),
        payment_method: 'OTHER',
        status: 'PAID',
        paid_at: finalCreatedAt,
        notes: `Documento: ${docNumber}. Baixa de ${newRecord.total_items_count} peça(s) a preço de custo contábil. ${notes}`.trim(),
        created_at: finalCreatedAt,
      };

      if (!Array.isArray(finances.expenses)) {
        finances.expenses = [];
      }
      finances.expenses.unshift(expenseRecord);
      await writeFinances(finances);
    } catch (finErr) {
      console.warn('Erro ao registrar despesa financeira da saída de estoque:', finErr);
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const docNumber = searchParams.get('document_number');

    const targetKey = id || docNumber;
    if (!targetKey) {
      return NextResponse.json({ error: 'ID ou Document Number é obrigatório.' }, { status: 400 });
    }

    // 1. Remove do writeOffsStore
    const removed = await deleteWriteOff(targetKey);

    // 2. Remove a despesa correspondente no financeiro
    try {
      const finances = await readFinances();
      if (Array.isArray(finances.expenses)) {
        const initialCount = finances.expenses.length;
        finances.expenses = finances.expenses.filter((e) => {
          const matchId = id && (e.id === `exp-${id}` || (e.notes && e.notes.includes(id)));
          const matchDoc = docNumber && (e.id === `exp-${docNumber}` || (e.notes && e.notes.includes(docNumber)) || (e.description && e.description.includes(docNumber)));
          return !(matchId || matchDoc);
        });
        if (finances.expenses.length !== initialCount) {
          await writeFinances(finances);
        }
      }
    } catch (fErr) {
      console.warn('Aviso ao remover despesa financeira vinculada:', fErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Saída de estoque cancelada/removida com sucesso.',
      removed,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao cancelar saída.' }, { status: 500 });
  }
}
