'use client';

import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Users,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  BarChart3,
  Factory,
  ChevronRight,
} from 'lucide-react';

interface DashboardMetricsViewProps {
  salesData: any;
  products: any[];
  sellers?: any[];
  liveVisitors: number;
  onNavigateTab: (tab: any) => void;
}

export function DashboardMetricsView({
  salesData,
  products = [],
  sellers = [],
  liveVisitors = 0,
  onNavigateTab,
}: DashboardMetricsViewProps) {
  const sales = salesData?.sales || [];

  // 1. Resumo de Vendas: Dia, Semana, Mês
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let salesToday = 0;
  let salesWeek = 0;
  let salesMonth = 0;
  let totalGross = 0;
  let totalNetProfit = 0;

  let paidOrdersCount = 0;
  let pendingOrdersCount = 0;
  let inProductionOrdersCount = 0;
  let cancelledOrdersCount = 0;

  sales.forEach((s: any) => {
    const saleDate = new Date(s.created_at).getTime();
    const gross = (Number(s.subtotal_products) || 0) + (Number(s.shipping_fee) || 0) - (Number(s.discount_amount) || 0);
    const net = Number(s.net_profit) || 0;

    totalGross += gross;
    totalNetProfit += net;

    if (saleDate >= startOfDay) salesToday += gross;
    if (saleDate >= startOfWeek) salesWeek += gross;
    if (saleDate >= startOfMonth) salesMonth += gross;

    const st = (s.status || '').toUpperCase();
    if (st === 'COMPLETED' || st === 'PAID' || st === 'DELIVERED' || st === 'SHIPPED') {
      paidOrdersCount++;
    } else if (st === 'IN_PRODUCTION') {
      inProductionOrdersCount++;
    } else if (st === 'CANCELLED') {
      cancelledOrdersCount++;
    } else {
      pendingOrdersCount++;
    }
  });

  const totalOrders = sales.length;
  const avgTicket = paidOrdersCount > 0 ? totalGross / paidOrdersCount : (totalOrders > 0 ? totalGross / totalOrders : 0);
  const conversionRate = liveVisitors > 0 ? Math.min(100, ((totalOrders / Math.max(totalOrders + liveVisitors, 10)) * 100)).toFixed(1) : '0.0';

  // 2. Alertas Operacionais de Estoque
  const outOfStockItems: any[] = [];
  const lowStockItems: any[] = [];

  products.forEach((p) => {
    const stockQty = Number(p.stock !== undefined ? p.stock : (p.stock_quantity ?? 0));
    if (stockQty <= 0) {
      outOfStockItems.push(p);
    } else if (stockQty <= 3) {
      lowStockItems.push(p);
    }
  });

  // 3. Pré-Vendas / Encomendas em confecção
  const preOrdersInProduction = sales.filter((s: any) => 
    s.status === 'IN_PRODUCTION' || 
    (s.items && s.items.some((i: any) => (i.title || '').toLowerCase().includes('pré-venda') || (i.title || '').toLowerCase().includes('pre-order')))
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner de Boas-Vindas e Resumo Geral */}
      <div className="bg-deep-black text-white p-6 sm:p-8 border-2 border-gold shadow-luxury flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-white/10 text-[9px] font-black uppercase tracking-widest text-gold border border-gold/40">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span>CENTRO DE CONTROLE OPERACIONAL • ANA FITNESS WEAR</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-gold" />
            <span>DASHBOARD EXECUTIVO & PERFORMANCE EM TEMPO REAL</span>
          </h2>
          <p className="text-xs text-white/70 uppercase tracking-wider max-w-2xl">
            Acompanhe o faturamento, volume de pedidos, alertas operacionais de estoque e prazos de encomendas sob medida sem tocar em código.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('catalog')}
            className="px-4 py-2.5 bg-white/10 hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider border border-white/20 transition flex items-center gap-2"
          >
            <Package className="w-4 h-4 text-gold" />
            <span>Gerenciar Catálogo</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="px-4 py-2.5 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-wider shadow transition flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-deep-black" />
            <span>Ver Pedidos</span>
          </button>
        </div>
      </div>

      {/* 1. RESUMO DE VENDAS (HOJE, SEMANA, MÊS, LUCRO LÍQUIDO) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gold" />
            <span>1. RESUMO DE VENDAS EM TEMPO REAL (USD)</span>
          </h3>
          <span className="text-[10px] text-deep-black/60 uppercase font-mono font-bold">
            Atualizado automaticamente
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Vendas Hoje */}
          <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-sm hover:border-gold transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60">
                FATURAMENTO HOJE
              </span>
              <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[9px] font-black uppercase">
                DIA ATUAL
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-deep-black font-mono">
              ${salesToday.toFixed(2)}
            </div>
            <p className="text-[10px] text-deep-black/60 uppercase font-bold">
              Total bruto faturado nas últimas 24h
            </p>
          </div>

          {/* Vendas Semana */}
          <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-sm hover:border-gold transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60">
                FATURAMENTO SEMANAL
              </span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-black uppercase">
                ÚLTIMOS 7 DIAS
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-deep-black font-mono">
              ${salesWeek.toFixed(2)}
            </div>
            <p className="text-[10px] text-deep-black/60 uppercase font-bold">
              Receita consolidada da semana
            </p>
          </div>

          {/* Vendas Mês */}
          <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-sm hover:border-gold transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60">
                FATURAMENTO DO MÊS
              </span>
              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[9px] font-black uppercase">
                MÊS CORRENTE
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-deep-black font-mono">
              ${salesMonth.toFixed(2)}
            </div>
            <p className="text-[10px] text-deep-black/60 uppercase font-bold">
              Receita acumulada do mês em curso
            </p>
          </div>

          {/* Lucro Líquido Real */}
          <div className="bg-deep-black text-white border-2 border-gold p-5 space-y-2 shadow-luxury">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold">
                LUCRO LÍQUIDO REAL NO BOLSO
              </span>
              <Sparkles className="w-3.5 h-3.5 text-gold" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gold font-mono">
              ${totalNetProfit.toFixed(2)}
            </div>
            <p className="text-[10px] text-white/70 uppercase font-bold">
              Após dedução de confecção, taxas e comissões
            </p>
          </div>
        </div>
      </div>

      {/* 2. VOLUME DE PEDIDOS & INDICADORES DE DESEMPENHO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume de Pedidos por Status */}
        <div className="bg-white border-2 border-deep-black p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-gold" />
              <span>VOLUME DE PEDIDOS ({totalOrders} TOTAIS)</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-[10px] font-black uppercase text-gold hover:underline flex items-center gap-1"
            >
              <span>Ver Lista Completa</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-green-50 border border-green-300 text-center space-y-1">
              <span className="text-[9px] font-black uppercase text-green-800 block">PAGOS / ENTREGUES</span>
              <span className="text-xl font-black text-green-900 font-mono block">{paidOrdersCount}</span>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-300 text-center space-y-1">
              <span className="text-[9px] font-black uppercase text-amber-800 block">PENDENTES</span>
              <span className="text-xl font-black text-amber-900 font-mono block">{pendingOrdersCount}</span>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-300 text-center space-y-1">
              <span className="text-[9px] font-black uppercase text-blue-800 block">EM CONFECÇÃO</span>
              <span className="text-xl font-black text-blue-900 font-mono block">{inProductionOrdersCount}</span>
            </div>

            <div className="p-3 bg-red-50 border border-red-300 text-center space-y-1">
              <span className="text-[9px] font-black uppercase text-red-800 block">CANCELADOS</span>
              <span className="text-xl font-black text-red-900 font-mono block">{cancelledOrdersCount}</span>
            </div>
          </div>
        </div>

        {/* Indicadores de Desempenho (Ticket Médio & Conversão) */}
        <div className="bg-white border-2 border-deep-black p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold" />
              <span>INDICADORES DE DESEMPENHO (KPIs)</span>
            </h3>
            <span className="text-[9px] text-deep-black/50 uppercase font-mono">Loja Virtual + PDV</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-deep-black/5 border border-deep-black/20 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 block">
                TICKET MÉDIO POR PEDIDO
              </span>
              <div className="text-2xl font-black text-deep-black font-mono">
                ${avgTicket.toFixed(2)}
              </div>
              <p className="text-[9px] text-deep-black/60 uppercase font-bold">
                Valor médio gasto por cada cliente
              </p>
            </div>

            <div className="p-4 bg-deep-black/5 border border-deep-black/20 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 block">
                TAXA ESTIMADA DE CONVERSÃO
              </span>
              <div className="text-2xl font-black text-deep-black font-mono">
                {conversionRate}%
              </div>
              <p className="text-[9px] text-deep-black/60 uppercase font-bold">
                Proporção de visitantes que finalizam a compra
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ALERTAS OPERACIONAIS: ESTOQUE BAIXO/ZERADO, PRÉ-VENDAS & VENDEDORAS */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span>ALERTAS OPERACIONAIS & ATENÇÃO IMEDIATA</span>
        </h3>

        {/* Alerta de Novas Vendedoras Aguardando Aprovação */}
        {(() => {
          const pendingSellers = (sellers || []).filter((s: any) => s.approval_status === 'PENDING');
          if (pendingSellers.length === 0) return null;
          return (
            <div className="bg-amber-50 border-2 border-amber-500 p-5 space-y-3 shadow-luxury animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500 text-deep-black font-black text-xs shrink-0 rounded">
                    🚨 NOVO CADASTRO
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-950">
                      {pendingSellers.length} NOVA(S) VENDEDORA(S) AGUARDANDO SUA APROVAÇÃO
                    </h4>
                    <p className="text-[11px] text-amber-900 uppercase">
                      Solicitações recebidas pelo site. O cupom e o acesso estão 100% bloqueados até você aprovar.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab('commissions')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider transition shadow shrink-0 flex items-center gap-1.5"
                >
                  <span>Analisar e Aprovar ({pendingSellers.length})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {pendingSellers.map((ps: any) => (
                  <div key={ps.id} className="p-2.5 bg-white border border-amber-300 text-xs flex justify-between items-center shadow-xs">
                    <div>
                      <strong className="text-deep-black uppercase block">{ps.name}</strong>
                      <span className="text-[10px] text-deep-black/60 font-mono">Cupom: {ps.coupon_code}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300">
                      Pendente
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card de Alerta de Estoque Crítico */}
          <div className="bg-white border-2 border-red-600 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-xs font-black uppercase tracking-wider">
                  ESTOQUE BAIXO OU ZERADO ({outOfStockItems.length + lowStockItems.length} PEÇAS)
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('catalog')}
                className="text-[10px] font-black uppercase text-deep-black hover:text-gold underline"
              >
                Reabastecer
              </button>
            </div>

            {outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
              <div className="p-4 bg-green-50 border border-green-300 text-green-900 text-xs font-bold uppercase text-center">
                ✓ Todos os produtos do catálogo estão com estoque saudável!
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                {outOfStockItems.map((item) => (
                  <div
                    key={item.id || item.sku}
                    className="p-2.5 bg-red-50 border border-red-300 flex items-center justify-between text-xs"
                  >
                    <div>
                      <strong className="text-red-900 block uppercase font-black">{item.title}</strong>
                      <span className="text-[10px] text-red-700 font-mono">SKU: {item.sku || 'N/A'}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-red-600 text-white font-black text-[9px] uppercase tracking-wider">
                      ZERADO (0)
                    </span>
                  </div>
                ))}

                {lowStockItems.map((item) => {
                  const q = item.stock !== undefined ? item.stock : (item.stock_quantity ?? 0);
                  return (
                    <div
                      key={item.id || item.sku}
                      className="p-2.5 bg-amber-50 border border-amber-300 flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-amber-900 block uppercase font-black">{item.title}</strong>
                        <span className="text-[10px] text-amber-700 font-mono">SKU: {item.sku || 'N/A'}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-600 text-white font-black text-[9px] uppercase tracking-wider">
                        RESTAM {q} UNID
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card de Alerta de Pré-Vendas Aguardando Produção */}
          <div className="bg-white border-2 border-gold p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-deep-black">
                <Factory className="w-5 h-5 text-gold" />
                <span className="text-xs font-black uppercase tracking-wider">
                  ENCOMENDAS & PRÉ-VENDAS EM PRODUÇÃO ({preOrdersInProduction.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('backorders')}
                className="text-[10px] font-black uppercase text-gold hover:underline"
              >
                Ver Fila de Corte
              </button>
            </div>

            {preOrdersInProduction.length === 0 ? (
              <div className="p-4 bg-deep-black/5 border border-deep-black/10 text-deep-black/70 text-xs font-bold uppercase text-center">
                Nenhuma encomenda sob medida aguardando confecção no momento.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                {preOrdersInProduction.map((order: any) => (
                  <div
                    key={order.id || order.order_id}
                    className="p-2.5 bg-gold/10 border border-gold/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <strong className="text-deep-black block uppercase font-black">
                        #{order.order_id} • {order.customer_name}
                      </strong>
                      <span className="text-[10px] text-deep-black/60 font-mono block">
                        {(order.items || []).map((i: any) => i.title).join(', ')}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-deep-black text-gold font-mono font-black text-[9px] uppercase">
                      30 DIAS
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
