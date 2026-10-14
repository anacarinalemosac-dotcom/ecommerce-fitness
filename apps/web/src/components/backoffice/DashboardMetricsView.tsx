'use client';

import React, { useState } from 'react';
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
  Wallet,
  Truck,
  MapPin,
  Activity,
  Copy,
  Check,
  Phone,
  Radio,
  ExternalLink,
  Calendar,
} from 'lucide-react';

interface DashboardMetricsViewProps {
  salesData: any;
  products: any[];
  sellers?: any[];
  liveVisitors: number;
  liveFeed?: any;
  onNavigateTab: (tab: any) => void;
  onUpdateOrderStatus?: (orderId: string, status: string, tracking?: string) => void;
}

export function DashboardMetricsView({
  salesData,
  products = [],
  sellers = [],
  liveVisitors = 0,
  liveFeed,
  onNavigateTab,
  onUpdateOrderStatus,
}: DashboardMetricsViewProps) {
  const sales = salesData?.sales || [];
  const [salesMode, setSalesMode] = useState<'today' | 'all'>('today');
  const [copiedAddressId, setCopiedAddressId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [shippingModalOrder, setShippingModalOrder] = useState<any | null>(null);
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [isSubmittingShipping, setIsSubmittingShipping] = useState(false);

  const handleOpenShippingModal = (order: any) => {
    setShippingModalOrder(order);
    setTrackingCodeInput(order.tracking_code || '');
  };

  const handleConfirmShipping = async () => {
    if (!shippingModalOrder || !onUpdateOrderStatus) return;
    setIsSubmittingShipping(true);
    try {
      const finalCode = trackingCodeInput.trim() || ('9400' + Math.floor(100000000000000000 + Math.random() * 900000000000000000));
      await onUpdateOrderStatus(shippingModalOrder.order_id || shippingModalOrder.id, 'SHIPPED', finalCode);
      setShippingModalOrder(null);
      setTrackingCodeInput('');
    } finally {
      setIsSubmittingShipping(false);
    }
  };

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

  // Helper para fuso horário de Massachusetts (EDT/EST)
  const getNYDateStr = (dateInput: string | Date | number) => {
    try {
      const d = new Date(dateInput);
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
    } catch {
      return new Date(dateInput).toISOString().split('T')[0];
    }
  };

  const todayDateStr = getNYDateStr(new Date());
  const nowMs = Date.now();

  // Pedidos de hoje: criados na data de hoje no fuso local ou nas últimas 24 horas
  const todayOrders = sales.filter((s: any) => {
    if (!s.created_at) return false;
    const orderDateStr = getNYDateStr(s.created_at);
    const orderMs = new Date(s.created_at).getTime();
    return orderDateStr === todayDateStr || (nowMs - orderMs <= 24 * 60 * 60 * 1000);
  });

  const getOrderItems = (order: any) => {
    if (Array.isArray(order.items) && order.items.length > 0) return order.items;
    if (Array.isArray(order.shipping_address?.items)) return order.shipping_address.items;
    return [];
  };

  // Itens e Pedidos Entregues / Concluídos
  const deliveredSales = sales.filter((s: any) => {
    const st = (s.status || '').toUpperCase();
    return st === 'DELIVERED' || st === 'COMPLETED';
  });
  const totalDeliveredPieces = deliveredSales.reduce((acc: number, s: any) => {
    const items = getOrderItems(s);
    const count = items.reduce((pAcc: number, it: any) => pAcc + (Number(it.quantity) || 1), 0);
    return acc + (count > 0 ? count : 1);
  }, 0);
  const totalDeliveredOrders = deliveredSales.length;

  const getOrderAddress = (order: any) => {
    const addr = order.shipping_address;
    if (!addr) return null;
    if (typeof addr === 'string') return addr;
    if (addr.address || addr.city) {
      const parts = [
        addr.address,
        addr.apt ? `Apt ${addr.apt}` : '',
        addr.city,
        addr.state,
        addr.zip,
      ].filter(Boolean);
      return parts.join(', ');
    }
    return null;
  };

  const handleCopyAddress = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedAddressId(id);
      setTimeout(() => setCopiedAddressId(null), 2500);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* =========================================================================
          0. CENTRAL DO DIA MOBILE: VISITANTES ONLINE NO SITE & PEDIDOS DE HOJE
         ========================================================================= */}
      <section className="bg-white border-2 border-deep-black shadow-luxury p-5 sm:p-6 space-y-6">
        {/* Barra Superior da Central do Dia com Alternador */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-deep-black pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-deep-black text-gold border border-gold shrink-0">
              <Truck className="w-5 h-5 text-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-deep-black px-2 py-0.5 border border-gold">
                  PRIORIDADE MÓVEL
                </span>
                <span className="text-xs sm:text-sm font-black uppercase text-deep-black">
                  CENTRAL DE EXPEDIÇÃO & TRÁFEGO AO VIVO
                </span>
              </div>
              <p className="text-[11px] text-deep-black/70 uppercase font-medium mt-0.5">
                Organize os envios das clientes e acompanhe quem está navegando na loja neste momento.
              </p>
            </div>
          </div>

          {/* Alternador de Visualização: Pedidos de Hoje vs Vendas Geral */}
          <div className="inline-flex rounded-none border-2 border-deep-black p-0.5 bg-deep-black/5 text-xs font-black uppercase tracking-wider self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSalesMode('today')}
              className={`px-4 py-2 transition flex items-center gap-1.5 ${
                salesMode === 'today'
                  ? 'bg-deep-black text-gold shadow-sm'
                  : 'text-deep-black hover:text-gold'
              }`}
            >
              <Package className="w-4 h-4 text-gold" />
              <span>PEDIDOS DE HOJE ({todayOrders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSalesMode('all')}
              className={`px-4 py-2 transition flex items-center gap-1.5 ${
                salesMode === 'all'
                  ? 'bg-deep-black text-white shadow-sm'
                  : 'text-deep-black hover:text-gold'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>VER VENDAS GERAL ({sales.length})</span>
            </button>
          </div>
        </div>

        {/* 1. CARD: SE TEM ALGUÉM ONLINE NO SITE AGORA */}
        <div className="bg-deep-black text-white border-2 border-gold p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${liveVisitors > 0 ? 'bg-emerald-400 opacity-75' : 'bg-gold opacity-30'}`} />
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${liveVisitors > 0 ? 'bg-emerald-500' : 'bg-gold'}`} />
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-gold animate-pulse" />
                <span>RADAR AO VIVO • QUEM ESTÁ ONLINE NO SITE AGORA</span>
              </h3>
            </div>
            <span className={`px-2 py-0.5 text-[9px] font-black uppercase ${liveVisitors > 0 ? 'bg-emerald-500 text-deep-black' : 'bg-white/10 text-white/70'}`}>
              {liveVisitors > 0 ? 'CLIENTES ATIVOS' : 'RADAR EM ESPERA'}
            </span>
          </div>

          {liveVisitors > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-2">
                  <span className="text-emerald-400">{liveVisitors}</span>
                  <span className="text-xs sm:text-sm font-bold text-white/90 uppercase">
                    {liveVisitors === 1 ? 'Pessoa navegando no site agora!' : 'Pessoas navegando no site agora!'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('live')}
                  className="text-xs font-black uppercase text-gold hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>Abrir Tela do Radar</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-gold" />
                </button>
              </div>

              {/* Lista dos visitantes ativos no radar */}
              {liveFeed?.activeVisitors && liveFeed.activeVisitors.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {liveFeed.activeVisitors.slice(0, 3).map((vis: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-white/5 border border-white/15 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                          <span className="uppercase">{vis.city}, {vis.region}</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono shrink-0">ONLINE</span>
                      </div>
                      <div className="text-[10px] text-gold/90 font-mono truncate" title={vis.pageTitle || vis.page}>
                        👀 {vis.pageTitle || vis.page}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-white/80 font-medium">
                <span className="w-2 h-2 rounded-full bg-white/40" />
                <span>Nenhum visitante navegando neste instante. O radar continua monitorando em tempo real.</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="text-[10px] font-black uppercase text-gold hover:underline shrink-0"
              >
                Ver Relatório de Visitas Anteriores →
              </button>
            </div>
          )}
        </div>

        {/* 2. CARD: PEDIDOS DE HOJE PARA LOGÍSTICA / ENVIO */}
        {salesMode === 'today' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-deep-black/10 pb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gold" />
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-deep-black">
                  PEDIDOS DO DIA PARA EXPEDIÇÃO & LOGÍSTICA ({todayOrders.length})
                </h3>
              </div>
              <span className="text-xs font-mono font-black text-deep-black bg-gold/20 px-2 py-0.5 border border-gold/40">
                FATURADO HOJE: ${salesToday.toFixed(2)}
              </span>
            </div>

            {todayOrders.length === 0 ? (
              <div className="p-8 bg-deep-black/5 border-2 border-dashed border-deep-black/20 text-center space-y-3">
                <div className="w-12 h-12 bg-white border border-deep-black/20 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-wider text-deep-black">
                    NENHUM PEDIDO NOVO HOJE ATÉ O MOMENTO
                  </h4>
                  <p className="text-xs text-deep-black/60 max-w-md mx-auto uppercase font-medium">
                    Toda a sua logística de expedição está em dia! Assim que uma cliente comprar, o pedido aparecerá aqui com as peças para separar e o endereço para entrega.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSalesMode('all')}
                  className="px-4 py-2 bg-deep-black text-gold text-xs font-black uppercase tracking-widest hover:bg-gold hover:text-deep-black transition border border-gold shadow-xs"
                >
                  VER VENDAS ANTERIORES / HISTÓRICO GERAL
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {todayOrders.map((order: any) => {
                  const items = getOrderItems(order);
                  const addressText = getOrderAddress(order);
                  const orderId = order.order_id || order.id?.substring(0, 8);
                  const timeStr = order.created_at
                    ? new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '--:--';
                  const isPos = order.channel === 'POS' || order.shipping_address?.channel_detail === 'POS_COUNTER';
                  const totalVal = Number(
                    order.total_amount ||
                    (Number(order.subtotal_products || 0) + Number(order.shipping_fee || 0) - Number(order.discount_amount || 0))
                  );

                  return (
                    <div
                      key={order.id || order.order_id}
                      className="bg-white border-2 border-deep-black p-5 shadow-sm space-y-4 hover:border-gold transition flex flex-col justify-between"
                    >
                      {/* Topo do Pedido */}
                      <div className="space-y-2 border-b border-deep-black/10 pb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-black text-gold bg-deep-black px-2 py-0.5">
                            #{orderId}
                          </span>
                          <span className="text-xs font-bold text-deep-black/60 font-mono">
                            Hoje às {timeStr}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-black uppercase tracking-tight text-deep-black">
                              {order.customer_name || 'Cliente'}
                            </h4>
                            <span className="text-[10px] font-bold text-deep-black/60 uppercase block">
                              {isPos ? '🏢 Venda Showroom (PDV Balcão)' : '🌐 Venda Online (E-commerce)'}
                            </span>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-black text-deep-black font-mono">
                              ${totalVal.toFixed(2)}
                            </div>
                            <span className="text-[9px] font-black uppercase text-gold bg-deep-black px-1.5 py-0.2">
                              {order.payment_method || 'PAGO'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Peças para Separar */}
                      <div className="space-y-2 bg-deep-black/5 p-3 border border-deep-black/15">
                        <span className="text-[10px] font-black uppercase tracking-wider text-deep-black/70 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-gold" />
                          <span>PEÇAS A DESPACHAR / SEPARAR ({items.length}):</span>
                        </span>

                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {items.length === 0 ? (
                            <div className="text-xs text-deep-black/60 uppercase">
                              1x Peça do Pedido
                            </div>
                          ) : (
                            items.map((it: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs py-1 border-b border-deep-black/5"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-mono font-black text-deep-black bg-gold/40 px-1.5 py-0.2 text-[10px] shrink-0">
                                    {it.quantity || 1}x
                                  </span>
                                  <span className="font-bold text-deep-black uppercase truncate" title={it.title}>
                                    {it.title}
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono text-deep-black/70 shrink-0 pl-2">
                                  {it.size ? `Tam: ${it.size}` : ''} {it.color ? `• ${it.color}` : ''}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Endereço de Entrega (Logística) */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-deep-black/70 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gold" />
                          <span>DESTINO DA LOGÍSTICA:</span>
                        </span>

                        {addressText ? (
                          <div className="p-2.5 bg-white border border-deep-black/20 flex items-center justify-between gap-2 text-xs">
                            <span className="font-mono text-deep-black/90 uppercase text-[11px] truncate" title={addressText}>
                              {addressText}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyAddress(order.id || orderId, addressText)}
                              className="px-2 py-1 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[9px] font-black uppercase tracking-wider transition shrink-0 flex items-center gap-1"
                              title="Copiar endereço para o envio USPS"
                            >
                              {copiedAddressId === (order.id || orderId) ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>COPIADO!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-gold" />
                                  <span>COPIAR</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="p-2 bg-deep-black/5 text-[11px] text-deep-black/70 font-medium uppercase">
                            Retirada Presencial no Showroom (Leominster, MA)
                          </div>
                        )}
                      </div>

                      {/* Botões Rápidos de Ação de Logística */}
                      <div className="pt-2 border-t border-deep-black/10 flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                          order.status === 'COMPLETED' || order.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : order.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : order.status === 'IN_PRODUCTION'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-gold/20 text-deep-black border-gold'
                        }`}>
                          STATUS: {order.status || 'PAGO'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {onUpdateOrderStatus && order.status !== 'SHIPPED' && order.status !== 'DELIVERED' && (
                            <button
                              type="button"
                              onClick={() => handleOpenShippingModal(order)}
                              className="px-3 py-1.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[10px] font-black uppercase tracking-wider transition border border-deep-black shadow-xs flex items-center gap-1"
                            >
                              <Truck className="w-3 h-3 text-gold" />
                              <span>MARCAR ENVIADO</span>
                            </button>
                          )}
                          {order.status === 'SHIPPED' && onUpdateOrderStatus && (
                            <button
                              type="button"
                              onClick={() => handleOpenShippingModal(order)}
                              className="px-2.5 py-1.5 bg-gold/20 hover:bg-gold hover:text-deep-black text-deep-black text-[10px] font-black uppercase tracking-wider transition border border-gold/60 flex items-center gap-1"
                              title="Atualizar ou reenviar código de rastreio"
                            >
                              <Truck className="w-3 h-3 text-deep-black" />
                              <span>RASTREIO</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onNavigateTab('sales')}
                            className="px-2.5 py-1.5 border border-deep-black hover:bg-deep-black hover:text-white text-deep-black text-[10px] font-black uppercase tracking-wider transition"
                          >
                            DETALHES →
                          </button>
                        </div>
                      </div>

                      {/* Caixa de Rastreio Ativo */}
                      {order.tracking_code && (
                        <div className="mt-2 p-2 bg-gold/15 border border-gold/40 flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-deep-black truncate">
                            USPS: {order.tracking_code}
                          </span>
                          <a
                            href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_code.replace(/\s+/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-deep-black hover:underline font-black text-[10px] uppercase flex items-center gap-1 shrink-0 ml-2"
                          >
                            <span>RASTREAR</span>
                            <ExternalLink className="w-3 h-3 text-gold" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Quando ela clica em 'VER VENDAS GERAL' */
          <div className="p-6 bg-deep-black text-white border-2 border-gold space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold/30 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  HISTÓRICO FINANCEIRO CONSOLIDADO
                </span>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  TODAS AS VENDAS DA LOJA ({sales.length} PEDIDOS TOTAIS)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('sales')}
                className="px-4 py-2 bg-gold hover:bg-white text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>ABRIR TABELA COMPLETA DE PEDIDOS</span>
                <ArrowUpRight className="w-4 h-4 text-deep-black" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-white/60 uppercase block">FATURAMENTO TOTAL</span>
                <span className="text-xl font-black text-white font-mono">${totalGross.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-gold uppercase block font-bold">LUCRO REAL NO BOLSO</span>
                <span className="text-xl font-black text-gold font-mono">${totalNetProfit.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-white/60 uppercase block">PEDIDOS FATURADOS</span>
                <span className="text-xl font-black text-white font-mono">{paidOrdersCount} pedidos</span>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-white/60 uppercase block">TICKET MÉDIO</span>
                <span className="text-xl font-black text-white font-mono">${avgTicket.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </section>

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

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigateTab('finances')}
            className="px-4 py-2.5 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-wider shadow transition flex items-center gap-2"
          >
            <Wallet className="w-4 h-4 text-deep-black" />
            <span>Financeiro & DRE</span>
          </button>
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
            onClick={() => onNavigateTab('sales')}
            className="px-4 py-2.5 bg-white/10 hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider border border-white/20 transition flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-gold" />
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
          {/* 1. VENDA DO DIA */}
          <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-sm hover:border-gold transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  <span>1. VENDA DO DIA</span>
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-black uppercase">
                  HOJE
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-deep-black font-mono mt-1">
                ${salesToday.toFixed(2)}
              </div>
              <p className="text-[10px] text-deep-black/60 uppercase font-bold mt-1">
                {todayOrders.length === 1 ? '1 pedido registrado hoje' : `${todayOrders.length} pedidos registrados hoje`}
              </p>
            </div>
            <div className="pt-2 border-t border-deep-black/10 flex items-center justify-between text-[10px]">
              <span className="text-deep-black/60 font-bold uppercase">Status:</span>
              <span className="font-mono font-black text-emerald-700">Faturado Hoje</span>
            </div>
          </div>

          {/* 2. ACUMULADO DO MÊS */}
          <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-sm hover:border-gold transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-gold" />
                  <span>2. ACUMULADO DO MÊS</span>
                </span>
                <span className="px-1.5 py-0.5 bg-gold/20 text-deep-black border border-gold/40 text-[9px] font-black uppercase font-mono">
                  MÊS ATUAL
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-deep-black font-mono mt-1">
                ${salesMonth.toFixed(2)}
              </div>
              <p className="text-[10px] text-deep-black/60 uppercase font-bold mt-1">
                Receita acumulada do mês corrente
              </p>
            </div>
            <div className="pt-2 border-t border-deep-black/10 flex items-center justify-between text-[10px]">
              <span className="text-deep-black/60 font-bold uppercase">Período:</span>
              <span className="font-mono font-black text-deep-black">Outubro / 2026</span>
            </div>
          </div>

          {/* 3. O MEU LUCRO (DESTAQUE OURO E PRETO) */}
          <div
            onClick={() => onNavigateTab('sales')}
            className="bg-deep-black text-white border-2 border-gold p-5 space-y-2 shadow-luxury cursor-pointer hover:border-white transition flex flex-col justify-between"
            title="Ver detalhamento de lucro no Painel de Vendas"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-gold" />
                  <span>3. O MEU LUCRO</span>
                </span>
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gold text-deep-black text-[9px] font-black uppercase">
                  <Sparkles className="w-2.5 h-2.5 text-deep-black" />
                  <span>LÍQUIDO REAL</span>
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gold font-mono mt-1">
                ${totalNetProfit.toFixed(2)}
              </div>
              <p className="text-[10px] text-white/70 uppercase font-bold mt-1">
                Livre no bolso após custos e taxas
              </p>
            </div>
            <div className="pt-2 border-t border-gold/30 flex items-center justify-between text-[10px]">
              <span className="text-white/60 font-bold uppercase">Margem Líquida:</span>
              <span className="font-mono font-black text-gold">
                {totalGross > 0 ? ((totalNetProfit / totalGross) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>

          {/* 4. ITENS ENTREGUES */}
          <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-sm hover:border-gold transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>4. ITENS ENTREGUES</span>
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-black uppercase">
                  CONCLUÍDOS
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-deep-black font-mono mt-1">
                {totalDeliveredPieces} <span className="text-sm font-black text-deep-black/60 uppercase">peças</span>
              </div>
              <p className="text-[10px] text-deep-black/60 uppercase font-bold mt-1">
                {totalDeliveredOrders === 1 ? '1 pedido entregue com sucesso' : `${totalDeliveredOrders} pedidos entregues com sucesso`}
              </p>
            </div>
            <div className="pt-2 border-t border-deep-black/10 flex items-center justify-between text-[10px]">
              <span className="text-deep-black/60 font-bold uppercase">Conclusão:</span>
              <span className="font-mono font-black text-emerald-700">
                {sales.length > 0 ? `${Math.round((totalDeliveredOrders / sales.length) * 100)}% dos pedidos` : '100%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Atalho Rápido para o Relatório de Acessos */}
      <div
        onClick={() => onNavigateTab('reports')}
        className="bg-white border-2 border-deep-black p-5 shadow-sm hover:border-gold hover:shadow-luxury transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-deep-black text-gold border border-gold group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5 text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-deep-black px-2 py-0.2">
                RELATÓRIOS DO DIA
              </span>
              <span className="text-xs font-black uppercase text-deep-black">
                ACESSOS & TRÁFEGO EM TEMPO REAL
              </span>
            </div>
            <p className="text-xs text-deep-black/70 uppercase mt-0.5 font-medium">
              Consulte de qual cidade vieram as visitas, celular vs computador, páginas navegadas e tempo no site.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('reports')}
          className="px-4 py-2 bg-deep-black text-white group-hover:bg-gold group-hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shrink-0 shadow-xs"
        >
          <span>ABRIR RELATÓRIO DE ACESSOS</span>
          <ChevronRight className="w-3.5 h-3.5 text-gold group-hover:text-deep-black" />
        </button>
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

      {/* =========================================================================
          MODAL DE DESPACHO E RASTREAMENTO USPS
         ========================================================================= */}
      {shippingModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-2 border-deep-black shadow-luxury max-w-lg w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b-2 border-deep-black pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-deep-black text-gold">
                  <Truck className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-deep-black">
                    DESPACHAR PEDIDO #{shippingModalOrder.order_id}
                  </h3>
                  <span className="text-[10px] text-deep-black/60 uppercase font-medium">
                    Envio oficial via USPS (United States Postal Service)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShippingModalOrder(null)}
                className="text-deep-black/60 hover:text-deep-black text-xl font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-deep-black/5 border border-deep-black/10 text-xs space-y-1.5 uppercase font-medium">
              <div><strong>Cliente:</strong> {shippingModalOrder.customer_name}</div>
              <div><strong>E-mail:</strong> <span className="font-mono text-deep-black">{shippingModalOrder.customer_email || 'Não informado'}</span></div>
              <div><strong>Destino:</strong> {getOrderAddress(shippingModalOrder) || 'Leominster Area'}</div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-deep-black block">
                CÓDIGO DE RASTREIO DOS CORREIOS (USPS):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackingCodeInput}
                  onChange={(e) => setTrackingCodeInput(e.target.value)}
                  placeholder="Ex: 9400 1118 9956 2537 1234 56"
                  className="flex-1 p-2.5 border-2 border-deep-black text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-gold"
                />
                <button
                  type="button"
                  onClick={() => setTrackingCodeInput('9400' + Math.floor(100000000000000000 + Math.random() * 900000000000000000))}
                  className="px-3 py-2 bg-deep-black/10 hover:bg-gold hover:text-deep-black text-deep-black text-[10px] font-black uppercase tracking-wider border border-deep-black transition shrink-0"
                  title="Gerar código demonstrativo padrão USPS"
                >
                  GERAR
                </button>
              </div>
              <div className="p-3 bg-gold/15 border border-gold/40 text-[11px] text-deep-black/90 font-medium">
                ✉ <strong>Disparo Automático:</strong> Ao confirmar o envio, o pedido passará para o status <strong>ENVIADO</strong> e um e-mail de notificação de despacho será enviado para a cliente contendo o código e o botão com link direto para o site oficial dos Correios (USPS).
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-deep-black/10">
              <button
                type="button"
                onClick={() => setShippingModalOrder(null)}
                disabled={isSubmittingShipping}
                className="px-4 py-2.5 border border-deep-black text-deep-black hover:bg-deep-black/5 text-xs font-black uppercase tracking-wider transition"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleConfirmShipping}
                disabled={isSubmittingShipping}
                className="px-5 py-2.5 bg-deep-black text-gold hover:bg-gold hover:text-deep-black border border-gold text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow"
              >
                <Truck className="w-4 h-4 text-gold" />
                <span>{isSubmittingShipping ? 'DESPACHANDO...' : 'CONFIRMAR ENVIO & DISPARAR E-MAIL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
