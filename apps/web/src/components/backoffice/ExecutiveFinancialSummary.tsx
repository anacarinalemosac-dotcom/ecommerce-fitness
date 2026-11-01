'use client';

import React from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  QrCode,
  Banknote,
  Sparkles,
  Calendar,
  Clock,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { computeSaleFinancials } from '@/lib/salesFinancials';

interface ExecutiveFinancialSummaryProps {
  sales: any[];
}

function classifyPaymentMethod(methodStr: any): 'VENMO' | 'ZELLE' | 'CASH' | 'CARD' {
  const norm = String(methodStr || '').toUpperCase().trim();
  if (norm.includes('VENMO')) return 'VENMO';
  if (norm.includes('ZELLE')) return 'ZELLE';
  if (norm.includes('CASH') || norm.includes('DINHEIRO') || norm.includes('ESPECIE')) return 'CASH';
  return 'CARD';
}

function getSaleMonthStr(dateInput: any): string {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(d).substring(0, 7);
  } catch {
    return '';
  }
}

export function ExecutiveFinancialSummary({ sales }: ExecutiveFinancialSummaryProps) {
  // Fuso horário oficial de Massachusetts (EDT / EST)
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const currentMonthStr = todayStr.substring(0, 7); // 'YYYY-MM'
  const currentMonthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

  const activeSales = (sales || []).filter((s: any) => s.status !== 'CANCELLED');

  let totalSalesAfterDiscountAllTime = 0;
  let totalSalesAfterDiscountThisMonth = 0;

  let totalReceivedAllTime = 0;
  let totalPendingAllTime = 0;

  let zelleReceived = 0;
  let venmoReceived = 0;
  let cashReceived = 0;
  let cardReceived = 0;

  let totalProfitAllTime = 0;
  let totalProfitThisMonth = 0;

  let totalCostOfGoodsAllTime = 0;
  let totalCostOfGoodsThisMonth = 0;

  let totalCrediarioPendingAllTime = 0;
  let totalCrediarioPendingThisMonth = 0;

  const allocateReceived = (amount: number, method: any) => {
    if (amount <= 0) return;
    const bucket = classifyPaymentMethod(method);
    if (bucket === 'VENMO') venmoReceived += amount;
    else if (bucket === 'ZELLE') zelleReceived += amount;
    else if (bucket === 'CASH') cashReceived += amount;
    else cardReceived += amount;
  };

  activeSales.forEach((s: any) => {
    const fin = computeSaleFinancials(s);
    const saleMonth = getSaleMonthStr(s.created_at);
    const isThisMonth = saleMonth === currentMonthStr;

    // 1 & 2. Venda total acumulada após desconto & Venda do mês após desconto
    totalSalesAfterDiscountAllTime += fin.afterDiscount;
    if (isThisMonth) {
      totalSalesAfterDiscountThisMonth += fin.afterDiscount;
    }

    // 5. Lucro total acumulado & Lucro do mês
    totalProfitAllTime += fin.netProfit;
    if (isThisMonth) {
      totalProfitThisMonth += fin.netProfit;
    }

    // 6. Custo de mercadoria total & Custo do mês
    totalCostOfGoodsAllTime += fin.costOfGoods;
    if (isThisMonth) {
      totalCostOfGoodsThisMonth += fin.costOfGoods;
    }

    // 3 & 4 & 7. Recebido, Pendente, Meios de Pagamento e Crediário
    const m = (s.payment_method || '').toUpperCase();
    const isCrediario = m === 'CREDIARIO' || !!s.crediario;

    if (isCrediario) {
      const downPay = Math.max(0, Number(s.crediario?.down_payment) || 0);
      const paymentsList = Array.isArray(s.payments)
        ? s.payments
        : (Array.isArray(s.crediario?.payments) ? s.crediario.payments : []);
      const installments = Array.isArray(s.crediario?.installments) ? s.crediario.installments : [];

      let credPaid = 0;

      // Entrada paga na hora da venda:
      if (downPay > 0) {
        credPaid += downPay;
        allocateReceived(downPay, s.crediario?.down_payment_method || 'CASH');
      }

      // Baixas de parcelas ou pagamentos parciais:
      if (paymentsList.length > 0) {
        paymentsList.forEach((p: any) => {
          const pAmt = Number(p.amount) || 0;
          credPaid += pAmt;
          allocateReceived(pAmt, p.payment_method || 'CASH');
        });
      } else if (installments.length > 0) {
        installments.forEach((inst: any) => {
          if (inst.status === 'PAID') {
            const instAmt = Number(inst.amount) || 0;
            credPaid += instAmt;
            allocateReceived(instAmt, inst.payment_method || s.crediario?.down_payment_method || 'CASH');
          }
        });
      } else if (s.amount_paid !== undefined && Number(s.amount_paid) > downPay) {
        const extraPaid = Number(s.amount_paid) - downPay;
        credPaid += extraPaid;
        allocateReceived(extraPaid, 'CASH');
      }

      totalReceivedAllTime += credPaid;

      // Saldo devedor pendente:
      let credPending = 0;
      if (s.remaining_balance !== undefined && !isNaN(Number(s.remaining_balance))) {
        credPending = Math.max(0, Number(s.remaining_balance));
      } else {
        credPending = Math.max(0, fin.afterDiscount - credPaid);
      }

      totalPendingAllTime += credPending;
      totalCrediarioPendingAllTime += credPending;

      // Crediário pendente do mês corrente:
      if (installments.length > 0) {
        installments.forEach((inst: any) => {
          if (inst.status === 'PENDING') {
            const dueMonth = getSaleMonthStr(inst.due_date);
            if (dueMonth === currentMonthStr) {
              totalCrediarioPendingThisMonth += (Number(inst.amount) || 0);
            }
          }
        });
      } else if (isThisMonth) {
        totalCrediarioPendingThisMonth += credPending;
      }
    } else {
      // Venda normal à vista (Não é crediário)
      const isWaiting = s.payment_status === 'WAITING_PAYMENT' || s.status === 'WAITING_PAYMENT';
      if (isWaiting) {
        totalPendingAllTime += fin.afterDiscount;
      } else {
        totalReceivedAllTime += fin.afterDiscount;
        allocateReceived(fin.afterDiscount, s.payment_method);
      }
    }
  });

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Banner de Identificação */}
      <div className="flex items-center justify-between border-b-2 border-deep-black pb-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-gold inline-block" />
          <h3 className="text-sm font-black uppercase tracking-wider text-deep-black">
            RESUMO FINANCEIRO EXECUTIVO • SOLICITADO PELA LOJISTA
          </h3>
        </div>
        <span className="text-[10px] font-mono text-gold bg-deep-black px-2 py-0.5 font-black uppercase">
          MOEDA: DÓLAR ($ USD) • SEMPRE APÓS DESCONTO
        </span>
      </div>

      {/* =========================================================================
          SEÇÃO 1: VENDA TOTAL ACUMULADA vs VENDA TOTAL DO MÊS
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Venda Total Acumulada (Todos os Meses) */}
        <div className="bg-deep-black text-white p-5 border-2 border-gold shadow-luxury flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-gold" />
                <span>VENDA TOTAL ACUMULADA</span>
              </span>
              <span className="px-2 py-0.5 bg-gold text-deep-black text-[9px] font-black uppercase font-mono">
                TODOS OS MESES
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-gold font-mono mt-2.5">
              ${totalSalesAfterDiscountAllTime.toFixed(2)}
            </div>
            <p className="text-[11px] text-white/70 uppercase font-bold mt-1">
              Soma total de todos os meses, tirando o desconto sempre.
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-white/20 flex items-center justify-between text-[10px]">
            <span className="text-white/60 font-bold uppercase">Base de Cálculo:</span>
            <span className="font-mono font-black text-gold">
              {activeSales.length} pedidos ativos acumulados
            </span>
          </div>
        </div>

        {/* Card 2: Venda Total do Mês */}
        <div className="bg-white border-2 border-deep-black p-5 shadow-sm hover:border-gold transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/70 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gold" />
                <span>VENDA TOTAL DO MÊS</span>
              </span>
              <span className="px-2 py-0.5 bg-gold/20 text-deep-black border border-gold/40 text-[9px] font-black uppercase font-mono">
                {currentMonthLabel}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-deep-black font-mono mt-2.5">
              ${totalSalesAfterDiscountThisMonth.toFixed(2)}
            </div>
            <p className="text-[11px] text-deep-black/60 uppercase font-bold mt-1">
              Faturamento do mês corrente (sempre após desconto).
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-deep-black/10 flex items-center justify-between text-[10px]">
            <span className="text-deep-black/60 font-bold uppercase">Período:</span>
            <span className="font-mono font-black text-deep-black">
              Mês Atual ({currentMonthStr})
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SEÇÃO 2: VALOR RECEBIDO vs VALOR PENDENTE & BREAKDOWN DE FORMAS DE PAGAMENTO
         ========================================================================= */}
      <div className="bg-white border-2 border-deep-black p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-deep-black/10 pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>FLUXO DE CAIXA: VALOR RECEBIDO vs VALOR PENDENTE</span>
          </span>
          <span className="text-[10px] text-deep-black/60 font-mono font-bold uppercase">
            Discriminação por Zelle, Venmo e Cash
          </span>
        </div>

        {/* Linha com Valor Recebido e Valor Pendente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Valor Recebido Total */}
          <div className="p-4 bg-emerald-50 border-2 border-emerald-500 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>VALOR RECEBIDO TOTAL</span>
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-700 text-white text-[9px] font-black uppercase font-mono">
                NO CAIXA
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono">
              ${totalReceivedAllTime.toFixed(2)}
            </div>
            <p className="text-[10px] text-emerald-800 uppercase font-bold">
              Dinheiro que já entrou (à vista + entradas e parcelas de crediário pagas)
            </p>
          </div>

          {/* Valor Pendente Total */}
          <div className="p-4 bg-amber-50 border-2 border-amber-500 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>VALOR PENDENTE TOTAL</span>
              </span>
              <span className="px-1.5 py-0.5 bg-amber-700 text-white text-[9px] font-black uppercase font-mono">
                A RECEBER
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-950 font-mono">
              ${totalPendingAllTime.toFixed(2)}
            </div>
            <p className="text-[10px] text-amber-800 uppercase font-bold">
              Saldo devedor acumulado a receber de clientes (crediário em aberto)
            </p>
          </div>
        </div>

        {/* Breakdown exato: Venmo, Zelle, Cash e Cartão */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/70 block">
            QUANTO FOI RECEBIDO EM CADA FORMA DE PAGAMENTO:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. ZELLE */}
            <div className="p-3 bg-purple-50 border-2 border-purple-400 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-purple-950 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-purple-700" />
                  <span>ZELLE</span>
                </span>
                <span className="text-[8px] font-mono font-bold text-purple-800 uppercase">0% TAXA</span>
              </div>
              <div className="text-xl font-black text-purple-950 font-mono">
                ${zelleReceived.toFixed(2)}
              </div>
              <span className="text-[9px] text-purple-800 font-bold block uppercase">
                Recebido via Zelle
              </span>
            </div>

            {/* 2. VENMO */}
            <div className="p-3 bg-blue-50 border-2 border-blue-400 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-950 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                  <span>VENMO</span>
                </span>
                <span className="text-[8px] font-mono font-bold text-blue-800 uppercase">APP</span>
              </div>
              <div className="text-xl font-black text-blue-950 font-mono">
                ${venmoReceived.toFixed(2)}
              </div>
              <span className="text-[9px] text-blue-800 font-bold block uppercase">
                Recebido via Venmo
              </span>
            </div>

            {/* 3. CASH (DINHEIRO) */}
            <div className="p-3 bg-green-50 border-2 border-green-500 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-green-950 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-green-700" />
                  <span>CASH (DINHEIRO)</span>
                </span>
                <span className="text-[8px] font-mono font-bold text-green-800 uppercase">ESPÉCIE</span>
              </div>
              <div className="text-xl font-black text-green-950 font-mono">
                ${cashReceived.toFixed(2)}
              </div>
              <span className="text-[9px] text-green-800 font-bold block uppercase">
                Recebido em Dinheiro
              </span>
            </div>

            {/* 4. CARTÃO (STRIPE / CARD) */}
            <div className="p-3 bg-gray-50 border-2 border-gray-300 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-gray-900 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-gray-700" />
                  <span>CARTÃO (CARD)</span>
                </span>
                <span className="text-[8px] font-mono font-bold text-gray-600 uppercase">ONLINE / MAQ</span>
              </div>
              <div className="text-xl font-black text-gray-950 font-mono">
                ${cardReceived.toFixed(2)}
              </div>
              <span className="text-[9px] text-gray-700 font-bold block uppercase">
                Cartão Débito / Crédito
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SEÇÃO 3 & 4 & 5: LUCRO, CUSTO DE MERCADORIA & CREDIÁRIO PENDENTE
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* GRUPO: LUCRO LÍQUIDO */}
        <div className="bg-white border-2 border-deep-black p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-deep-black/10 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>LUCRO LÍQUIDO</span>
            </span>
            <span className="text-[9px] font-mono font-black text-gold bg-deep-black px-1.5 py-0.5">
              NO SEU BOLSO
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Lucro Total Acumulado */}
            <div className="p-2.5 bg-deep-black text-white border border-gold">
              <span className="text-[9px] font-black uppercase text-gold block">
                LUCRO TOTAL ACUMULADO (TODOS OS MESES):
              </span>
              <div className="text-2xl font-black text-gold font-mono mt-0.5">
                ${totalProfitAllTime.toFixed(2)}
              </div>
            </div>

            {/* Lucro do Mês */}
            <div className="p-2.5 bg-gray-50 border border-deep-black/15">
              <span className="text-[9px] font-black uppercase text-deep-black/70 block">
                LUCRO TOTAL DO MÊS ({currentMonthStr}):
              </span>
              <div className="text-xl font-black text-deep-black font-mono mt-0.5">
                ${totalProfitThisMonth.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* GRUPO: CUSTO DE MERCADORIA (COGS) */}
        <div className="bg-white border-2 border-deep-black p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-deep-black/10 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
              <Package className="w-4 h-4 text-gold" />
              <span>CUSTO DE MERCADORIA</span>
            </span>
            <span className="text-[9px] font-mono font-bold text-deep-black/60 uppercase">
              COGS / CONFECÇÃO
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Custo Total Acumulado */}
            <div className="p-2.5 bg-gray-100 border border-deep-black/20">
              <span className="text-[9px] font-black uppercase text-deep-black/70 block">
                CUSTO MERCADORIA TOTAL (TODOS OS MESES):
              </span>
              <div className="text-2xl font-black text-deep-black font-mono mt-0.5">
                ${totalCostOfGoodsAllTime.toFixed(2)}
              </div>
            </div>

            {/* Custo do Mês */}
            <div className="p-2.5 bg-gray-50 border border-deep-black/15">
              <span className="text-[9px] font-black uppercase text-deep-black/70 block">
                CUSTO MERCADORIA DO MÊS ({currentMonthStr}):
              </span>
              <div className="text-xl font-black text-deep-black font-mono mt-0.5">
                ${totalCostOfGoodsThisMonth.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* GRUPO: CREDIÁRIO PENDENTE */}
        <div className="bg-white border-2 border-deep-black p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-deep-black/10 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>CREDIÁRIO PENDENTE</span>
            </span>
            <span className="text-[9px] font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 uppercase border border-amber-300">
              CARNÊ DA LOJA
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Crediário Pendente Total */}
            <div className="p-2.5 bg-amber-50 border border-amber-400">
              <span className="text-[9px] font-black uppercase text-amber-950 block">
                CREDIÁRIO PENDENTE TOTAL (TODOS OS MESES):
              </span>
              <div className="text-2xl font-black text-amber-950 font-mono mt-0.5">
                ${totalCrediarioPendingAllTime.toFixed(2)}
              </div>
              <span className="text-[8px] text-amber-800 font-bold block uppercase mt-0.5">
                Saldo total devedor em aberto
              </span>
            </div>

            {/* Crediário Pendente do Mês */}
            <div className="p-2.5 bg-white border border-amber-300">
              <span className="text-[9px] font-black uppercase text-amber-900 block">
                CREDIÁRIO PENDENTE DO MÊS ({currentMonthStr}):
              </span>
              <div className="text-xl font-black text-amber-900 font-mono mt-0.5">
                ${totalCrediarioPendingThisMonth.toFixed(2)}
              </div>
              <span className="text-[8px] text-amber-700 font-bold block uppercase mt-0.5">
                Parcelas vencendo no mês atual
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
