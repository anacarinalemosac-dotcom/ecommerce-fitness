import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { recordOrderEvent } from '@/lib/liveStore';
import { upsertMarketingContactAndPersist } from '@/lib/marketingContactsStore';
import fs from 'fs';
import path from 'path';
import {
  readConditionals,
  saveConditionals,
  computeConditionalsSummary,
  ConditionalRecord,
  ConditionalItem,
} from '@/lib/conditionalsStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SALES_FILE = path.join(process.cwd(), 'sales_history_db.json');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase().trim();

    let list = readConditionals();
    const summary = computeConditionalsSummary(list);
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

    if (status) {
      if (status === 'OVERDUE') {
        list = list.filter((c) => c.status === 'OPEN' && c.expected_return_date && c.expected_return_date < todayStr);
      } else {
        list = list.filter((c) => c.status === status);
      }
    }

    if (search) {
      list = list.filter(
        (c) =>
          c.customer_name.toLowerCase().includes(search) ||
          c.conditional_number.toLowerCase().includes(search) ||
          (c.customer_phone && c.customer_phone.includes(search)) ||
          c.seller_name.toLowerCase().includes(search) ||
          (c.items && c.items.some((it) => it.title.toLowerCase().includes(search) || it.sku.toLowerCase().includes(search)))
      );
    }

    return NextResponse.json({
      conditionals: list,
      summary,
    });
  } catch (err: any) {
    console.error('Erro no GET de condicionais:', err);
    return NextResponse.json({ error: err.message || 'Erro ao carregar condicionais' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      seller_name = 'Ana Karina',
      expected_return_date,
      dispatch_date,
      notes = '',
      items = [],
      skip_stock_decrement = false,
    } = body;

    if (!customer_name || !customer_name.trim()) {
      return NextResponse.json({ error: 'O nome da cliente é obrigatório para registrar a condicional.' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Selecione ao menos 1 peça para incluir na mala condicional.' }, { status: 400 });
    }

    // Calcula prazo de retorno padrão de 3 dias se não foi enviado
    let finalReturnDate = expected_return_date;
    if (!finalReturnDate) {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      finalReturnDate = d.toISOString().split('T')[0];
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const finalDispatchDate = dispatch_date || todayStr;
    const condNumber = `COND-${Math.floor(1000 + Math.random() * 9000)}`;

    let totalItemsCount = 0;
    let totalPotentialValue = 0;

    const formattedItems: ConditionalItem[] = items.map((it: any) => {
      const q = Math.max(1, parseInt(it.quantity) || 1);
      const unit = parseFloat(it.unit_price) || 39.90;
      const cost = parseFloat(it.cost_price) || 15.00;

      totalItemsCount += q;
      totalPotentialValue += unit * q;

      return {
        sku: (it.sku || '').trim().toUpperCase(),
        title: it.title || 'Peça Fitness',
        size: it.size || 'M',
        color: it.color || 'Preto Ônix',
        quantity: q,
        unit_price: Number(unit.toFixed(2)),
        cost_price: Number(cost.toFixed(2)),
        image: it.image || '',
        kept_quantity: 0,
        returned_quantity: 0,
      };
    });

    // 1. Decrementa o estoque no Supabase das peças que saíram na mala
    if (!skip_stock_decrement) {
      for (const item of formattedItems) {
        if (!item.sku) continue;
        try {
          const { data: foundVariants } = await supabaseServer
            .from('product_variants')
            .select('id, stock_quantity')
            .eq('sku', item.sku)
            .limit(1);

          if (foundVariants && foundVariants.length > 0) {
            const v = foundVariants[0];
            const currentStock = Number(v.stock_quantity) || 0;
            const newStock = Math.max(0, currentStock - item.quantity);

            await supabaseServer
              .from('product_variants')
              .update({ stock_quantity: newStock })
              .eq('id', v.id);
          }
        } catch (dbErr) {
          console.warn(`Aviso ao decrementar estoque de condicional para SKU ${item.sku}:`, dbErr);
        }
      }
    }

    const newRecord: ConditionalRecord = {
      id: `cond-${Date.now()}`,
      conditional_number: condNumber,
      customer_name: customer_name.trim().toUpperCase(),
      customer_phone: customer_phone ? customer_phone.trim() : undefined,
      customer_email: customer_email ? customer_email.trim() : undefined,
      customer_address: customer_address ? customer_address.trim() : undefined,
      seller_name: seller_name.trim(),
      dispatch_date: finalDispatchDate,
      expected_return_date: finalReturnDate,
      notes: notes.trim() || undefined,
      status: 'OPEN',
      items: formattedItems,
      total_items: totalItemsCount,
      total_value: Number(totalPotentialValue.toFixed(2)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const all = readConditionals();
    all.unshift(newRecord);
    saveConditionals(all);

    // Registra evento no radar ao vivo do Backoffice e adiciona à Lista de Marketing
    try {
      await upsertMarketingContactAndPersist({
        name: newRecord.customer_name,
        phone: newRecord.customer_phone,
        email: newRecord.customer_email,
        sizes: formattedItems.map((it) => it.size).filter(Boolean),
        last_product: formattedItems[0]?.title || '',
        order_value: 0,
        count_order: false,
        source: 'CONDICIONAL',
        created_at: newRecord.created_at,
      });
    } catch (_) {}

    try {
      await recordOrderEvent({
        orderId: condNumber,
        customerName: newRecord.customer_name,
        city: 'Leominster, MA',
        amount: totalPotentialValue,
        itemsSummary: `Mala Condicional com ${totalItemsCount} peças (Devolução prevista: ${finalReturnDate})`,
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      conditional: newRecord,
      message: `Mala Condicional #${condNumber} cadastrada com sucesso!`,
    });
  } catch (err: any) {
    console.error('Erro no POST de condicionais:', err);
    return NextResponse.json({ error: err.message || 'Erro ao registrar condicional' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const all = readConditionals();

    // =========================================================================
    // 1. ACERTO / FECHAMENTO DA CONDICIONAL (Cliente escolhe o que fica e o que devolve)
    // =========================================================================
    if (action === 'settle') {
      const {
        conditional_id,
        items = [], // [{ sku, kept_quantity, returned_quantity, unit_price, cost_price, title, size, color }]
        payment_method = 'ZELLE',
        discount_amount = 0,
        settlement_notes = '',
        seller_name,
      } = body;

      const condIndex = all.findIndex((c) => c.id === conditional_id || c.conditional_number === conditional_id);
      if (condIndex === -1) {
        return NextResponse.json({ error: 'Mala Condicional não encontrada.' }, { status: 404 });
      }

      const cond = all[condIndex];
      let totalKeptItemsCount = 0;
      let totalReturnedItemsCount = 0;
      let totalKeptGrossValue = 0;
      const keptItemsList: any[] = [];
      const returnedItemsList: any[] = [];

      // Processa cada item apurado
      for (const item of items) {
        const kept = Math.max(0, parseInt(item.kept_quantity) || 0);
        const returned = Math.max(0, parseInt(item.returned_quantity) || 0);
        const sku = (item.sku || '').trim().toUpperCase();
        const price = parseFloat(item.unit_price) || 0;
        const cost = parseFloat(item.cost_price) || 15.0;

        totalKeptItemsCount += kept;
        totalReturnedItemsCount += returned;
        totalKeptGrossValue += price * kept;

        if (kept > 0) {
          keptItemsList.push({
            title: item.title,
            size: item.size,
            color: item.color,
            sku,
            quantity: kept,
            unit_price: price,
            cost_price: cost,
          });
        }

        if (returned > 0) {
          returnedItemsList.push({
            title: item.title,
            size: item.size,
            color: item.color,
            sku,
            quantity: returned,
            unit_price: price,
            cost_price: cost,
          });

          // Devolve as peças não compradas de volta ao estoque no Supabase!
          if (sku) {
            try {
              const { data: foundVariants } = await supabaseServer
                .from('product_variants')
                .select('id, stock_quantity')
                .eq('sku', sku)
                .limit(1);

              if (foundVariants && foundVariants.length > 0) {
                const v = foundVariants[0];
                const currentStock = Number(v.stock_quantity) || 0;
                const newStock = currentStock + returned;

                await supabaseServer
                  .from('product_variants')
                  .update({ stock_quantity: newStock })
                  .eq('id', v.id);
              }
            } catch (dbErr) {
              console.warn(`Aviso ao retornar estoque devolvido da condicional para SKU ${sku}:`, dbErr);
            }
          }
        }
      }

      const finalSeller = seller_name || cond.seller_name || 'Ana Karina';
      const disc = Math.max(0, parseFloat(discount_amount) || 0);
      const totalPaid = Math.max(0, totalKeptGrossValue - disc);
      let createdSaleOrderId = '';

      // Se a cliente ficou com ao menos 1 peça, gera a venda oficial no banco de vendas!
      if (keptItemsList.length > 0) {
        createdSaleOrderId = `POS-COND-${cond.conditional_number.replace('COND-', '')}`;
        const commissionAmount = Number(((totalPaid) * 0.10).toFixed(2)); // 10% padrão de vendedora
        const costOfGoods = keptItemsList.reduce((acc, it) => acc + (it.cost_price * it.quantity), 0);
        const netProfit = Number((totalPaid - costOfGoods - commissionAmount).toFixed(2));

        const saleRecord: any = {
          id: `sale-${Date.now()}`,
          order_id: createdSaleOrderId,
          created_at: new Date().toISOString(),
          customer_name: cond.customer_name,
          customer_phone: cond.customer_phone,
          customer_email: cond.customer_email,
          channel: 'POS_COUNTER',
          seller_name: finalSeller,
          payment_method: payment_method.toUpperCase(),
          subtotal_products: Number(totalKeptGrossValue.toFixed(2)),
          shipping_fee: 0.00,
          shipping_cost: 0.00,
          discount_amount: disc,
          payment_fee: 0.00,
          commission_amount: commissionAmount,
          cost_of_goods: costOfGoods,
          net_profit: netProfit,
          profit_margin_pct: totalPaid > 0 ? Number(((netProfit / totalPaid) * 100).toFixed(1)) : 0,
          items: keptItemsList,
          status: 'COMPLETED',
          fulfillment_status: 'DELIVERED',
          payment_status: 'PAID',
          notes: `Acerto da Mala Condicional #${cond.conditional_number}. ${settlement_notes || ''}`.trim(),
        };

        // Salva na tabela e histórico local de vendas
        try {
          if (fs.existsSync(SALES_FILE)) {
            const raw = fs.readFileSync(SALES_FILE, 'utf8');
            const sales = JSON.parse(raw);
            if (Array.isArray(sales)) {
              sales.unshift(saleRecord);
              fs.writeFileSync(SALES_FILE, JSON.stringify(sales, null, 2), 'utf8');
            }
          }
        } catch (e) {
          console.warn('Aviso ao registrar venda do acerto em sales_history_db.json:', e);
        }

        // Tenta gravar no Supabase orders também
        try {
          await supabaseServer.from('orders').insert([
            {
              channel: 'POS',
              customer_name: cond.customer_name,
              customer_phone: cond.customer_phone || null,
              customer_email: cond.customer_email || null,
              subtotal_amount: saleRecord.subtotal_products,
              discount_amount: saleRecord.discount_amount,
              total_amount: totalPaid,
              status: 'COMPLETED',
              payment_status: 'PAID',
              payment_method: payment_method.toUpperCase(),
              shipping_address: {
                order_number: createdSaleOrderId,
                seller_name: finalSeller,
                notes: saleRecord.notes,
                items: keptItemsList,
              },
            },
          ]);
        } catch (dbErr) {
          console.warn('Aviso ao registrar venda no Supabase orders:', dbErr);
        }
      }

      // Atualiza o registro da condicional
      const finalStatus = keptItemsList.length > 0 ? 'SETTLED' : 'RETURNED';
      const updatedRecord: ConditionalRecord = {
        ...cond,
        status: finalStatus,
        settled_at: new Date().toISOString(),
        settled_sale_order_id: createdSaleOrderId || undefined,
        settled_total_paid: Number(totalPaid.toFixed(2)),
        settled_payment_method: payment_method.toUpperCase(),
        settlement_notes: settlement_notes.trim() || undefined,
        updated_at: new Date().toISOString(),
        items: items.map((it: any) => ({
          sku: it.sku,
          title: it.title,
          size: it.size,
          color: it.color,
          quantity: it.quantity,
          unit_price: it.unit_price,
          cost_price: it.cost_price,
          image: it.image,
          kept_quantity: Math.max(0, parseInt(it.kept_quantity) || 0),
          returned_quantity: Math.max(0, parseInt(it.returned_quantity) || 0),
        })),
      };

      all[condIndex] = updatedRecord;
      saveConditionals(all);

      return NextResponse.json({
        success: true,
        conditional: updatedRecord,
        sale_order_id: createdSaleOrderId,
        total_paid: totalPaid,
        kept_items: keptItemsList,
        returned_items: returnedItemsList,
        message: finalStatus === 'SETTLED'
          ? `✓ Acerto da Mala #${cond.conditional_number} concluído! Venda de $${totalPaid.toFixed(2)} gerada com sucesso e peças não compradas devolvidas ao estoque.`
          : `✓ Todas as peças da Mala #${cond.conditional_number} foram devolvidas com sucesso ao estoque!`,
      });
    }

    // =========================================================================
    // 2. ATUALIZAÇÃO MANUAL (Prazo de devolução, observações, etc.)
    // =========================================================================
    if (action === 'update') {
      const { conditional_id, expected_return_date, notes, customer_phone, customer_address, seller_name } = body;
      const condIndex = all.findIndex((c) => c.id === conditional_id || c.conditional_number === conditional_id);
      if (condIndex === -1) {
        return NextResponse.json({ error: 'Mala Condicional não encontrada.' }, { status: 404 });
      }

      const cond = all[condIndex];
      const updated: ConditionalRecord = {
        ...cond,
        expected_return_date: expected_return_date || cond.expected_return_date,
        notes: notes !== undefined ? notes : cond.notes,
        customer_phone: customer_phone !== undefined ? customer_phone : cond.customer_phone,
        customer_address: customer_address !== undefined ? customer_address : cond.customer_address,
        seller_name: seller_name || cond.seller_name,
        updated_at: new Date().toISOString(),
      };

      all[condIndex] = updated;
      saveConditionals(all);

      return NextResponse.json({ success: true, conditional: updated });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err: any) {
    console.error('Erro no PATCH de condicionais:', err);
    return NextResponse.json({ error: err.message || 'Erro ao atualizar condicional' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const restoreStock = searchParams.get('restore_stock') !== 'false';

    if (!id) {
      return NextResponse.json({ error: 'Informe o ID ou número da condicional.' }, { status: 400 });
    }

    const all = readConditionals();
    const condIndex = all.findIndex((c) => c.id === id || c.conditional_number === id);

    if (condIndex === -1) {
      return NextResponse.json({ error: 'Condicional não encontrada.' }, { status: 404 });
    }

    const targetCond = all[condIndex];

    // Se estiver em aberto e restore_stock for true, devolve as peças ao estoque!
    if (targetCond.status === 'OPEN' && restoreStock) {
      for (const item of targetCond.items || []) {
        if (!item.sku) continue;
        try {
          const { data: foundVariants } = await supabaseServer
            .from('product_variants')
            .select('id, stock_quantity')
            .eq('sku', item.sku)
            .limit(1);

          if (foundVariants && foundVariants.length > 0) {
            const v = foundVariants[0];
            const currentStock = Number(v.stock_quantity) || 0;
            const newStock = currentStock + (Number(item.quantity) || 1);

            await supabaseServer
              .from('product_variants')
              .update({ stock_quantity: newStock })
              .eq('id', v.id);
          }
        } catch (dbErr) {
          console.warn(`Aviso ao devolver estoque na exclusão da condicional para SKU ${item.sku}:`, dbErr);
        }
      }
    }

    // Remove do array
    all.splice(condIndex, 1);
    saveConditionals(all);

    return NextResponse.json({
      success: true,
      message: `Condicional #${targetCond.conditional_number} excluída com sucesso e peças estornadas ao estoque.`,
    });
  } catch (err: any) {
    console.error('Erro no DELETE de condicionais:', err);
    return NextResponse.json({ error: err.message || 'Erro ao excluir condicional' }, { status: 500 });
  }
}
