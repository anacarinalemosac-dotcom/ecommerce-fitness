import { NextRequest, NextResponse } from 'next/server';
import {
  readFinances,
  writeFinances,
  ExpenseCategory,
  ExpenseRecord,
  FinancesState,
  ClothingPurchaseRecord,
  ClothingItemDetail,
} from '@/lib/financesStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export type {
  ExpenseCategory,
  ExpenseRecord,
  FinancesState,
  ClothingPurchaseRecord,
  ClothingItemDetail,
};

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

    // 5. Salvar Compra de Roupas & Frete (Precificação)
    if (action === 'save_clothing_purchase') {
      const purchase = body.purchase || {};
      const {
        id,
        invoiceNumber = '',
        currency = 'USD',
        exchangeRate = 1.0,
        clothesAmountOriginal = 0,
        date,
        supplier,
        totalPieces,
        clothesAmount,
        freightAmount,
        defaultCommissionPct = 15,
        totalCommissionsProjected = 0,
        markupMultiplier = 2.0,
        suggestedSalePriceCustom,
        items = [],
        notes = '',
        register_as_expense = false,
      } = purchase;

      const pieces = Math.max(1, Number(totalPieces) || 1);
      const clothes = Math.max(0, Number(clothesAmount) || 0);
      const freight = Math.max(0, Number(freightAmount) || 0);
      const totalPaid = clothes + freight;
      const freightPerPiece = freight / pieces;
      const unitCostAverage = clothes / pieces;
      const totalCostPerPiece = unitCostAverage + freightPerPiece;
      const multiplier = Number(markupMultiplier) > 0 ? Number(markupMultiplier) : 2.0;
      const suggestedSalePrice = suggestedSalePriceCustom !== undefined && Number(suggestedSalePriceCustom) > 0
        ? Number(suggestedSalePriceCustom)
        : totalCostPerPiece * multiplier;
      const profitPerPiece = suggestedSalePrice - totalCostPerPiece;
      const totalProjectedProfit = profitPerPiece * pieces;

      if (!finances.clothingPurchases) {
        finances.clothingPurchases = [];
      }

      const purchaseDate = date || new Date().toISOString().split('T')[0];

      if (id) {
        finances.clothingPurchases = finances.clothingPurchases.map((p) => {
          if (p.id === id) {
            return {
              ...p,
              invoiceNumber: invoiceNumber || purchase.invoice_number || p.invoiceNumber || '',
              currency: currency as 'BRL' | 'USD',
              exchangeRate: Number(exchangeRate) || 1.0,
              clothesAmountOriginal: Number(clothesAmountOriginal) || 0,
              date: purchaseDate,
              supplier: supplier?.trim() || 'Confecção / Fornecedor',
              totalPieces: pieces,
              clothesAmount: clothes,
              freightAmount: freight,
              totalPaid,
              freightPerPiece,
              unitCostAverage,
              totalCostPerPiece,
              defaultCommissionPct: Number(defaultCommissionPct ?? 15),
              totalCommissionsProjected: Number(totalCommissionsProjected || 0),
              markupMultiplier: multiplier,
              suggestedSalePrice,
              profitPerPiece,
              totalProjectedProfit,
              items,
              notes: notes?.trim() || '',
            };
          }
          return p;
        });
      } else {
        const newPurchaseId = `purch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newPurchase: ClothingPurchaseRecord = {
          id: newPurchaseId,
          invoiceNumber: invoiceNumber || purchase.invoice_number || '',
          currency: currency as 'BRL' | 'USD',
          exchangeRate: Number(exchangeRate) || 1.0,
          clothesAmountOriginal: Number(clothesAmountOriginal) || 0,
          date: purchaseDate,
          supplier: supplier?.trim() || 'Confecção / Fornecedor',
          totalPieces: pieces,
          clothesAmount: clothes,
          freightAmount: freight,
          totalPaid,
          freightPerPiece,
          unitCostAverage,
          totalCostPerPiece,
          defaultCommissionPct: Number(defaultCommissionPct ?? 15),
          totalCommissionsProjected: Number(totalCommissionsProjected || 0),
          markupMultiplier: multiplier,
          suggestedSalePrice,
          profitPerPiece,
          totalProjectedProfit,
          items,
          notes: notes?.trim() || '',
          created_at: new Date().toISOString(),
        };
        finances.clothingPurchases.unshift(newPurchase);

        // Se marcou para registrar no fluxo de caixa / despesas
        if (register_as_expense) {
          if (clothes > 0) {
            finances.expenses.unshift({
              id: `exp-${Date.now()}-c`,
              date: purchaseDate,
              description: `Compra de Roupas: ${supplier || 'Confecção'} (${pieces} peças)`,
              category: 'SUPPLIERS',
              amount: clothes,
              payment_method: 'BANK',
              status: 'PAID',
              paid_at: new Date().toISOString(),
              notes: `Gerado pela compra de lote ${newPurchaseId}`,
              created_at: new Date().toISOString(),
            });
          }
          if (freight > 0) {
            finances.expenses.unshift({
              id: `exp-${Date.now()}-f`,
              date: purchaseDate,
              description: `Frete da Remessa de Roupas (${pieces} peças)`,
              category: 'SHIPPING',
              amount: freight,
              payment_method: 'CARD',
              status: 'PAID',
              paid_at: new Date().toISOString(),
              notes: `Frete rateado para lote ${newPurchaseId}`,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      await writeFinances(finances);
      return NextResponse.json({ success: true, finances });
    }

    // 6. Excluir Compra de Roupas
    if (action === 'delete_clothing_purchase') {
      const { purchase_id } = body;
      if (!purchase_id) {
        return NextResponse.json({ success: false, error: 'ID da compra obrigatório.' }, { status: 400 });
      }
      if (finances.clothingPurchases) {
        finances.clothingPurchases = finances.clothingPurchases.filter((p) => p.id !== purchase_id);
      }
      await writeFinances(finances);
      return NextResponse.json({ success: true, finances });
    }

    return NextResponse.json({ success: false, error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
