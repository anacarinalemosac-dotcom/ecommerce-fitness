'use client';

import React from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  X,
  Receipt,
  DollarSign,
  TrendingUp,
  Percent,
  CreditCard,
  Users,
  Tag,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface SaleItem {
  title: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
}

interface SaleRecord {
  id?: string;
  order_id: string;
  created_at: string;
  channel: 'ONLINE' | 'POS_COUNTER' | 'WRITE_OFF';
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  seller_name?: string;
  payment_method: string;
  subtotal_products: number;
  discount_amount: number;
  shipping_fee: number;
  shipping_cost: number;
  payment_fee: number;
  commission_amount: number;
  cost_of_goods: number;
  net_profit: number;
  profit_margin_pct: number;
  fulfillment_status?: string;
  payment_status?: string;
  status?: string;
  items: SaleItem[];
  crediario?: any;
}

interface SalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: SaleRecord[];
  totals: {
    count: number;
    totalSalesGross: number;
    totalCogs: number;
    totalDiscounts: number;
    totalFees: number;
    totalCommissions: number;
    totalShippingCollected: number;
    totalShippingCost: number;
    totalProfit: number;
    marginPct: number;
  };
  periodLabel: string;
  onExportCsv: () => void;
  onPrintReport: () => void;
}

export function SalesReportModal({
  isOpen,
  onClose,
  sales,
  totals,
  periodLabel,
  onExportCsv,
  onPrintReport,
}: SalesReportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-deep-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border-4 border-gold w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl animate-fadeIn">
        {/* Header do Relatório */}
        <div className="p-5 sm:p-6 bg-deep-black text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-gold shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-gold/20 text-gold text-[10px] font-black uppercase tracking-widest border border-gold/40">
              <Receipt className="w-3.5 h-3.5" />
              <span>RELATÓRIO GERENCIAL & EXTRATO DE VENDAS • ANA FITNESS WEAR</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>FECHAMENTO DE VENDAS & DRE DE LUCRO</span>
            </h2>
            <p className="text-xs text-white/70 uppercase font-mono">
              PERÍODO: <strong className="text-gold">{periodLabel}</strong> • {totals.count} {totals.count === 1 ? 'VENDA CONSOLIDADA' : 'VENDAS CONSOLIDADAS'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onPrintReport}
              className="px-4 py-2.5 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>IMPRIMIR / SALVAR PDF</span>
            </button>

            <button
              type="button"
              onClick={onExportCsv}
              className="px-4 py-2.5 bg-white/10 hover:bg-white hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-2 border border-white/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>BAIXAR EXCEL (CSV)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            CARDS DOS TOTAIS: SOMA DE CADA ITEM SOLICITADO
            1. Total de Venda | 2. Total de Juro/Taxas | 3. Total de Lucro | 4. Total de Comissão | 5. Total de Tudo
           ========================================================================= */}
        <div className="p-4 sm:p-6 bg-deep-black/5 border-b border-deep-black/10 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. TOTAL DE VENDA */}
            <div className="p-3 bg-white border-2 border-deep-black space-y-1 shadow-2xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-deep-black/60 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-gold" />
                <span>TOTAL DE VENDA</span>
              </span>
              <p className="text-lg sm:text-xl font-black text-deep-black font-mono">
                ${totals.totalSalesGross.toFixed(2)}
              </p>
              <span className="text-[8px] text-deep-black/50 uppercase font-bold block">
                Faturamento Bruto
              </span>
            </div>

            {/* TOTAL DE CUSTO */}
            <div className="p-3 bg-white border border-deep-black/20 space-y-1 shadow-2xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-deep-black/60 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-deep-black/60" />
                <span>TOTAL DE CUSTO</span>
              </span>
              <p className="text-lg sm:text-xl font-black text-deep-black font-mono">
                -${totals.totalCogs.toFixed(2)}
              </p>
              <span className="text-[8px] text-deep-black/50 uppercase font-bold block">
                Custo de Confecção
              </span>
            </div>

            {/* TOTAL DE DESCONTO */}
            <div className="p-3 bg-white border border-deep-black/20 space-y-1 shadow-2xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-deep-black/60 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>TOTAL DESCONTOS</span>
              </span>
              <p className="text-lg sm:text-xl font-black text-amber-700 font-mono">
                -${totals.totalDiscounts.toFixed(2)}
              </p>
              <span className="text-[8px] text-deep-black/50 uppercase font-bold block">
                Cupons & Balcão
              </span>
            </div>

            {/* 2. TOTAL DE JURO / TAXAS */}
            <div className="p-3 bg-white border-2 border-red-500/30 space-y-1 shadow-2xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-red-600 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-red-500" />
                <span>TOTAL TAXAS / JUROS</span>
              </span>
              <p className="text-lg sm:text-xl font-black text-red-600 font-mono">
                -${totals.totalFees.toFixed(2)}
              </p>
              <span className="text-[8px] text-red-500/70 uppercase font-bold block">
                Gateways & Máquinas
              </span>
            </div>

            {/* 3. TOTAL DE COMISSÃO */}
            <div className="p-3 bg-white border border-deep-black/20 space-y-1 shadow-2xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-deep-black/60 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gold" />
                <span>TOTAL COMISSÃO</span>
              </span>
              <p className="text-lg sm:text-xl font-black text-deep-black font-mono">
                -${totals.totalCommissions.toFixed(2)}
              </p>
              <span className="text-[8px] text-deep-black/50 uppercase font-bold block">
                Equipe de Vendas
              </span>
            </div>

            {/* 4. TOTAL DE LUCRO & 5. TOTAL DE TUDO */}
            <div className="p-3 bg-deep-black text-white border-2 border-gold space-y-1 shadow-2xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-gold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-gold" />
                <span>TOTAL DE LUCRO (REAL)</span>
              </span>
              <p className="text-lg sm:text-xl font-black text-gold font-mono">
                ${totals.totalProfit.toFixed(2)}
              </p>
              <span className="text-[8px] text-white/70 uppercase font-bold block">
                Margem Retida: {totals.marginPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Tabela do Relatório com Rolagem Interna */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="border-2 border-deep-black overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs uppercase tracking-wider border-collapse font-sans">
              <thead className="bg-deep-black text-white text-[9px] font-black border-b-2 border-gold font-mono">
                <tr>
                  <th className="p-3">PEDIDO # / DATA</th>
                  <th className="p-3">CANAL & VENDEDORA</th>
                  <th className="p-3">CLIENTE</th>
                  <th className="p-3">FORMA PGTO</th>
                  <th className="p-3 text-right">VALOR VENDA</th>
                  <th className="p-3 text-right">VALOR CUSTO</th>
                  <th className="p-3 text-right">TAXAS / JUROS</th>
                  <th className="p-3 text-right">COMISSÃO PAGA</th>
                  <th className="p-3 text-right">DESCONTO</th>
                  <th className="p-3 text-right">LUCRO REAL</th>
                  <th className="p-3 text-center">ENTREGA</th>
                  <th className="p-3 text-center">PAGAMENTO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10 text-[11px]">
                {sales.map((sale) => {
                  const isOnline = sale.channel === 'ONLINE';
                  const saleGross = Number(sale.subtotal_products) + Number(sale.shipping_fee);
                  const isCancelled = sale.status === 'CANCELLED';

                  return (
                    <tr
                      key={sale.id || sale.order_id}
                      className={`hover:bg-deep-black/5 ${isCancelled ? 'opacity-50 line-through bg-red-50/30' : ''}`}
                    >
                      {/* Pedido / Data */}
                      <td className="p-3 font-mono">
                        <strong className="text-deep-black block">{sale.order_id}</strong>
                        <span className="text-[9px] text-deep-black/60">
                          {sale.created_at
                            ? new Date(sale.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </td>

                      {/* Canal & Vendedora */}
                      <td className="p-3">
                        <span className="text-[9px] font-black text-deep-black block">
                          {isOnline ? '🌐 ONLINE' : '🏬 PDV BALCÃO'}
                        </span>
                        <span className="text-[9px] text-deep-black/60 truncate max-w-[120px] block">
                          {sale.seller_name || 'Loja Oficial'}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="p-3">
                        <span className="font-bold text-deep-black block">{sale.customer_name}</span>
                        {sale.customer_phone && (
                          <span className="text-[9px] text-deep-black/50 block font-mono">
                            {sale.customer_phone}
                          </span>
                        )}
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[8px] font-black font-mono border inline-block ${
                          sale.payment_method === 'ZELLE'
                            ? 'bg-green-100 text-green-900 border-green-300'
                            : sale.payment_method === 'VENMO'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : sale.payment_method === 'CARD'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : sale.payment_method === 'CREDIARIO'
                            ? 'bg-amber-500 text-deep-black border-amber-600'
                            : 'bg-gray-100 text-gray-800 border-gray-300'
                        }`}>
                          {sale.payment_method}
                        </span>
                      </td>

                      {/* Valor Venda */}
                      <td className="p-3 text-right font-mono font-black text-deep-black">
                        ${saleGross.toFixed(2)}
                      </td>

                      {/* Valor Custo */}
                      <td className="p-3 text-right font-mono text-deep-black/70">
                        ${Number(sale.cost_of_goods || 0).toFixed(2)}
                      </td>

                      {/* Taxas Pagas / Juros */}
                      <td className="p-3 text-right font-mono text-red-600 font-bold">
                        {Number(sale.payment_fee || 0) > 0 ? `-$${Number(sale.payment_fee).toFixed(2)}` : '$0.00'}
                      </td>

                      {/* Comissão Paga */}
                      <td className="p-3 text-right font-mono text-deep-black/70">
                        {Number(sale.commission_amount || 0) > 0 ? (
                          <span className="text-red-700 font-bold">-${Number(sale.commission_amount).toFixed(2)}</span>
                        ) : (
                          <span className="text-deep-black/40">$0.00</span>
                        )}
                      </td>

                      {/* Desconto Efetuado */}
                      <td className="p-3 text-right font-mono">
                        {Number(sale.discount_amount || 0) > 0 ? (
                          <span className="text-amber-700 font-bold">-${Number(sale.discount_amount).toFixed(2)}</span>
                        ) : (
                          <span className="text-deep-black/40">$0.00</span>
                        )}
                      </td>

                      {/* Lucro Real */}
                      <td className={`p-3 text-right font-mono font-black ${
                        Number(sale.net_profit) < 0 ? 'text-red-600' : 'text-emerald-700'
                      }`}>
                        ${Number(sale.net_profit || 0).toFixed(2)}
                      </td>

                      {/* Situação Entrega */}
                      <td className="p-3 text-center">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-deep-black/5 border border-deep-black/20 inline-block">
                          {sale.fulfillment_status === 'DELIVERED'
                            ? '🛍️ ENTREGUE'
                            : sale.fulfillment_status === 'SHIPPED'
                            ? '📦 DESPACHADA'
                            : sale.fulfillment_status === 'IN_PRODUCTION'
                            ? '✂️ SEPARANDO'
                            : '🕒 AGUARDANDO'}
                        </span>
                      </td>

                      {/* Situação Pagamento */}
                      <td className="p-3 text-center">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 border inline-block ${
                          sale.payment_status === 'PAID' || sale.payment_status === 'COMPLETED'
                            ? 'bg-green-100 text-green-900 border-green-300'
                            : sale.payment_status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : sale.payment_status === 'CANCELLED'
                            ? 'bg-red-100 text-red-900 border-red-300'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}>
                          {sale.payment_status === 'PAID' || sale.payment_status === 'COMPLETED'
                            ? '✓ QUITADO'
                            : sale.payment_status === 'PARTIAL'
                            ? '🟡 PARCIAL'
                            : sale.payment_status === 'CANCELLED'
                            ? '✕ CANCELADO'
                            : '⏳ EM ABERTO'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* =========================================================================
                  RODAPÉ DO RELATÓRIO COM A SOMA EXATA DE TUDO
                 ========================================================================= */}
              <tfoot className="bg-deep-black text-white font-mono text-xs border-t-4 border-gold">
                <tr>
                  <td colSpan={4} className="p-3 font-black text-gold uppercase tracking-wider">
                    SOMA TOTAL ({totals.count} VENDAS NO PERÍODO):
                  </td>
                  <td className="p-3 text-right font-black text-gold">
                    ${totals.totalSalesGross.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-white/80">
                    -${totals.totalCogs.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-red-400">
                    -${totals.totalFees.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-white/80">
                    -${totals.totalCommissions.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-amber-300">
                    -${totals.totalDiscounts.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-black text-gold text-sm">
                    ${totals.totalProfit.toFixed(2)}
                  </td>
                  <td colSpan={2} className="p-3 text-center text-gold font-bold text-[10px]">
                    MARGEM: {totals.marginPct.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Resumo Final de Conciliação "TOTAL DE TUDO" */}
          <div className="bg-deep-black text-white p-5 border-2 border-gold space-y-3">
            <div className="flex items-center justify-between border-b border-white/20 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-gold" />
                <span>FECHAMENTO DE RESULTADO CONSOLIDADO (TOTAL DE TUDO)</span>
              </span>
              <span className="text-[10px] font-mono text-white/60">
                ANA FITNESS WEAR • LEOMINSTER/MA
              </span>
            </div>

            <div className="text-xs font-mono space-y-1.5 leading-relaxed">
              <div className="flex justify-between border-b border-white/10 pb-1">
                <span>(+) TOTAL DE VENDA (FATURAMENTO BRUTO):</span>
                <strong className="text-white">${totals.totalSalesGross.toFixed(2)} USD</strong>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1 text-white/70">
                <span>(-) TOTAL DE CUSTO DAS PEÇAS (CONFECÇÃO):</span>
                <span>-${totals.totalCogs.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1 text-amber-300">
                <span>(-) TOTAL DE DESCONTO EFETUADO:</span>
                <span>-${totals.totalDiscounts.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1 text-red-400">
                <span>(-) TOTAL DE JUROS / TAXAS PAGAS (GATEWAYS):</span>
                <span>-${totals.totalFees.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1 text-white/70">
                <span>(-) TOTAL DE COMISSÃO PAGA (VENDEDORAS):</span>
                <span>-${totals.totalCommissions.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-black text-gold">
                <span>(=) TOTAL DE LUCRO LÍQUIDO REAL:</span>
                <span>${totals.totalProfit.toFixed(2)} USD ({totals.marginPct.toFixed(1)}% margem)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="p-4 bg-deep-black text-white border-t border-deep-black/10 flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono text-white/60">
            Relatório gerado em tempo real com conciliação financeira de vendas.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-wider transition"
          >
            FECHAR
          </button>
        </div>
      </div>
    </div>
  );
}
