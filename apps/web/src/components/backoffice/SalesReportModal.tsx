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
  Wallet,
} from 'lucide-react';
import { computeSaleFinancials } from '@/lib/salesFinancials';

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
    totalAfterDiscount?: number;
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
            CARDS DOS TOTAIS: OS 7 VALORES OFICIAIS DO PAINEL DE CONTROLE
            1. Total Venda | 2. Desconto | 3. Após Desconto | 4. Custo | 5. Comissões | 6. Taxas | 7. Valor Final
           ========================================================================= */}
        <div className="p-4 sm:p-6 bg-deep-black/5 border-b border-deep-black/10 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
            {/* 1. TOTAL DE VENDA */}
            <div className="p-3 bg-white border-2 border-deep-black space-y-1 shadow-2xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-deep-black/60 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-gold" />
                <span>1. TOTAL BRUTO</span>
              </span>
              <p className="text-base sm:text-lg font-black text-deep-black font-mono">
                ${totals.totalSalesGross.toFixed(2)}
              </p>
              <span className="text-[8px] text-deep-black/50 uppercase font-bold block truncate">
                Subtotal + Frete
              </span>
            </div>

            {/* 2. TOTAL DE DESCONTO */}
            <div className="p-3 bg-white border border-amber-300 space-y-1 shadow-2xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>2. DESCONTOS</span>
              </span>
              <p className="text-base sm:text-lg font-black text-amber-700 font-mono">
                -${totals.totalDiscounts.toFixed(2)}
              </p>
              <span className="text-[8px] text-amber-700/70 uppercase font-bold block truncate">
                Cupons & Balcão
              </span>
            </div>

            {/* 3. VALOR APÓS DESCONTO */}
            <div className="p-3 bg-white border-2 border-blue-500/40 space-y-1 shadow-2xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-blue-600" />
                <span>3. APÓS DESC.</span>
              </span>
              <p className="text-base sm:text-lg font-black text-blue-900 font-mono">
                ${(totals.totalAfterDiscount ?? (totals.totalSalesGross - totals.totalDiscounts)).toFixed(2)}
              </p>
              <span className="text-[8px] text-blue-700/70 uppercase font-bold block truncate">
                Faturado Líquido
              </span>
            </div>

            {/* 4. TOTAL DE CUSTO */}
            <div className="p-3 bg-white border border-deep-black/20 space-y-1 shadow-2xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-deep-black/60 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-deep-black/60" />
                <span>4. PREÇO CUSTO</span>
              </span>
              <p className="text-base sm:text-lg font-black text-deep-black font-mono">
                -${totals.totalCogs.toFixed(2)}
              </p>
              <span className="text-[8px] text-deep-black/50 uppercase font-bold block truncate">
                Confecção / Peças
              </span>
            </div>

            {/* 5. TOTAL DE COMISSÃO */}
            <div className="p-3 bg-white border border-deep-black/20 space-y-1 shadow-2xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-deep-black/60 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gold" />
                <span>5. COMISSÕES</span>
              </span>
              <p className="text-base sm:text-lg font-black text-deep-black font-mono">
                -${totals.totalCommissions.toFixed(2)}
              </p>
              <span className="text-[8px] text-deep-black/50 uppercase font-bold block truncate">
                Equipe de Vendas
              </span>
            </div>

            {/* 6. TOTAL DE TAXAS */}
            <div className="p-3 bg-white border-2 border-red-500/30 space-y-1 shadow-2xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-red-600 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-red-500" />
                <span>6. TAXAS / JUROS</span>
              </span>
              <p className="text-base sm:text-lg font-black text-red-600 font-mono">
                -${totals.totalFees.toFixed(2)}
              </p>
              <span className="text-[8px] text-red-500/70 uppercase font-bold block truncate">
                Stripe & Cartão
              </span>
            </div>

            {/* 7. TOTAL DE LUCRO / VALOR FINAL */}
            <div className="p-3 bg-deep-black text-white border-2 border-gold space-y-1 shadow-2xs">
              <span className="text-[9px] font-black uppercase tracking-wider text-gold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-gold" />
                <span>7. VALOR FINAL</span>
              </span>
              <p className="text-base sm:text-lg font-black text-gold font-mono">
                ${totals.totalProfit.toFixed(2)}
              </p>
              <span className="text-[8px] text-white/70 uppercase font-bold block truncate">
                Margem: {totals.marginPct.toFixed(1)}%
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
                  <th className="p-3 text-right">1. VALOR TOTAL</th>
                  <th className="p-3 text-right">2. DESCONTO</th>
                  <th className="p-3 text-right">3. APÓS DESC.</th>
                  <th className="p-3 text-right">4. PREÇO CUSTO</th>
                  <th className="p-3 text-right">5. COMISSÕES</th>
                  <th className="p-3 text-right">6. TAXAS</th>
                  <th className="p-3 text-right">7. VALOR FINAL</th>
                  <th className="p-3 text-center">ENTREGA</th>
                  <th className="p-3 text-center">PAGAMENTO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10 text-[11px]">
                {sales.map((sale) => {
                  const isOnline = sale.channel === 'ONLINE';
                  const fin = computeSaleFinancials(sale);
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
                          sale.payment_method === 'AFFIRM'
                            ? 'bg-[#004BFF]/10 text-[#004BFF] border-[#004BFF]/30 font-bold'
                            : sale.payment_method === 'AFTERPAY'
                            ? 'bg-[#b2fce4] text-deep-black border-[#10b981] font-bold'
                            : sale.payment_method === 'ZELLE'
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

                      {/* 1. Valor Total */}
                      <td className="p-3 text-right font-mono font-bold text-deep-black">
                        ${fin.totalGross.toFixed(2)}
                      </td>

                      {/* 2. Valor do Desconto */}
                      <td className="p-3 text-right font-mono text-amber-700">
                        {fin.discount > 0 ? `-$${fin.discount.toFixed(2)}` : '$0.00'}
                      </td>

                      {/* 3. Valor Após Desconto */}
                      <td className="p-3 text-right font-mono font-black text-deep-black bg-stone-50/60">
                        ${fin.afterDiscount.toFixed(2)}
                      </td>

                      {/* 4. Preço de Custo */}
                      <td className="p-3 text-right font-mono text-deep-black/70">
                        ${fin.costOfGoods.toFixed(2)}
                      </td>

                      {/* 5. Comissões */}
                      <td className="p-3 text-right font-mono text-deep-black/70">
                        {fin.commission > 0 ? (
                          <span className="text-red-700 font-bold">-${fin.commission.toFixed(2)}</span>
                        ) : (
                          <span className="text-deep-black/40">$0.00</span>
                        )}
                      </td>

                      {/* 6. Taxas */}
                      <td className="p-3 text-right font-mono text-red-600 font-bold">
                        {fin.fees > 0 ? `-$${fin.fees.toFixed(2)}` : '$0.00'}
                      </td>

                      {/* 7. Valor Final (Lucro) */}
                      <td className={`p-3 text-right font-mono font-black ${
                        fin.netProfit < 0 ? 'text-red-600' : 'text-emerald-700'
                      }`}>
                        ${fin.netProfit.toFixed(2)}
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
                  RODAPÉ DO RELATÓRIO COM A SOMA EXATA DOS 7 VALORES
                 ========================================================================= */}
              <tfoot className="bg-deep-black text-white font-mono text-xs border-t-4 border-gold">
                <tr>
                  <td colSpan={4} className="p-3 font-black text-gold uppercase tracking-wider">
                    SOMA TOTAL ({totals.count} VENDAS NO PERÍODO):
                  </td>
                  <td className="p-3 text-right font-black text-gold">
                    ${totals.totalSalesGross.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-amber-300">
                    -${totals.totalDiscounts.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-black text-white bg-white/10">
                    ${(totals.totalAfterDiscount ?? (totals.totalSalesGross - totals.totalDiscounts)).toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-white/80">
                    -${totals.totalCogs.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-white/80">
                    -${totals.totalCommissions.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-red-400">
                    -${totals.totalFees.toFixed(2)}
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

          {/* Resumo Final de Conciliação "TOTAL DE TUDO - 7 VALORES" */}
          <div className="bg-deep-black text-white p-5 border-2 border-gold space-y-3">
            <div className="flex items-center justify-between border-b border-white/20 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-gold" />
                <span>FECHAMENTO CONSOLIDADO DOS 7 VALORES FINANCEIROS</span>
              </span>
              <span className="text-[10px] font-mono text-white/60">
                ANA FITNESS WEAR • LEOMINSTER/MA
              </span>
            </div>

            <div className="text-xs font-mono space-y-1.5 leading-relaxed">
              <div className="flex justify-between border-b border-white/10 pb-1">
                <span>(+) 1. VALOR TOTAL (BRUTO):</span>
                <strong className="text-white">${totals.totalSalesGross.toFixed(2)} USD</strong>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1 text-amber-300">
                <span>(-) 2. VALOR DO DESCONTO:</span>
                <span>-${totals.totalDiscounts.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1 text-blue-300 font-bold">
                <span>(=) 3. VALOR APÓS DESCONTO:</span>
                <span>${(totals.totalAfterDiscount ?? (totals.totalSalesGross - totals.totalDiscounts)).toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1 text-white/70">
                <span>(-) 4. VALOR DO PREÇO DE CUSTO (CONFECÇÃO/COGS):</span>
                <span>-${totals.totalCogs.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1 text-white/70">
                <span>(-) 5. VALOR DE COMISSÕES (VENDEDORAS):</span>
                <span>-${totals.totalCommissions.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1 text-red-400">
                <span>(-) 6. VALOR DE TAXAS & JUROS (GATEWAYS / STRIPE):</span>
                <span>-${totals.totalFees.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-black text-gold">
                <span>(=) 7. VALOR FINAL (LUCRO LÍQUIDO REAL):</span>
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
