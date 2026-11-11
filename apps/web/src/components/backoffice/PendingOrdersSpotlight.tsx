'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Globe,
  MapPin,
  Package,
  Phone,
  Store,
  Truck,
} from 'lucide-react';
import {
  formatOrderAddressText,
  getOrderItemsList,
  isOnlineWebsiteSale,
  isOrderPendingShipping,
  sortOrdersPendingFirst,
} from '@/lib/orderPriority';
import { computeSaleFinancials } from '@/lib/salesFinancials';

interface PendingOrdersSpotlightProps {
  sales: any[];
  onUpdateFulfillmentStatus?: (orderId: string, newStatus: string, trackingCode?: string) => void;
  onSelectOrder?: (sale: any) => void;
  onViewAllSales?: () => void;
  showEmptyBanner?: boolean;
}

export function PendingOrdersSpotlight({
  sales,
  onUpdateFulfillmentStatus,
  onSelectOrder,
  onViewAllSales,
  showEmptyBanner = true,
}: PendingOrdersSpotlightProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pendingOrders = sortOrdersPendingFirst(
    (sales || []).filter(isOrderPendingShipping)
  );

  const handleCopyAddress = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (pendingOrders.length === 0) {
    if (!showEmptyBanner) return null;
    return (
      <div className="bg-emerald-50 border-2 border-emerald-500/50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-950">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>✅ NENHUM PEDIDO PENDENTE DE ENVIO NO MOMENTO</span>
        </div>
        {onViewAllSales ? (
          <button
            type="button"
            onClick={onViewAllSales}
            className="text-[11px] font-black uppercase text-emerald-900 hover:text-deep-black underline cursor-pointer"
          >
            Ver todos os pedidos →
          </button>
        ) : (
          <Link
            href="/backoffice?tab=sales"
            className="text-[11px] font-black uppercase text-emerald-900 hover:text-deep-black underline"
          >
            Ver todos os pedidos →
          </Link>
        )}
      </div>
    );
  }

  return (
    <section
      aria-label="Pedidos Pendentes de Envio"
      className="bg-amber-50 border-4 border-red-600 p-3.5 sm:p-5 shadow-luxury space-y-4 animate-fadeIn"
    >
      {/* Faixa de Alerta Máximo em Primeiro Lugar (Celular e Computador) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-red-600/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600 text-white rounded shrink-0 shadow-sm">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest">
                AÇÃO IMEDIATA • TOPO DO PAINEL
              </span>
              <span className="text-xs sm:text-base font-black text-red-950 uppercase tracking-tight">
                {pendingOrders.length}{' '}
                {pendingOrders.length === 1
                  ? 'PEDIDO PENDENTE DE ENVIO!'
                  : 'PEDIDOS PENDENTES DE ENVIO!'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-red-900/90 font-semibold mt-0.5">
              Vendas aguardando separação e postagem aparecem sempre em 1º lugar aqui no celular e no computador.
            </p>
          </div>
        </div>

        {onViewAllSales ? (
          <button
            type="button"
            onClick={onViewAllSales}
            className="w-full sm:w-auto px-4 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-gold text-xs font-black uppercase tracking-wider transition border border-gold shadow-sm cursor-pointer shrink-0 text-center"
          >
            ABRIR LISTA DE VENDAS →
          </button>
        ) : (
          <Link
            href="/backoffice?tab=sales"
            className="w-full sm:w-auto px-4 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-gold text-xs font-black uppercase tracking-wider transition border border-gold shadow-sm shrink-0 text-center"
          >
            ABRIR PAINEL DE VENDAS →
          </Link>
        )}
      </div>

      {/* Cards Responsivos de Todos os Pedidos Pendentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {pendingOrders.map((order: any) => {
          const orderId = order.order_id || order.id?.slice(0, 8);
          const isOnline = isOnlineWebsiteSale(order);
          const items = getOrderItemsList(order);
          const addressText = formatOrderAddressText(order);
          const fin = computeSaleFinancials(order);
          const cleanPhone = String(order.customer_phone || '').replace(/\D/g, '');
          const waPhone = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;

          return (
            <div
              key={order.id || orderId}
              className="bg-white border-2 border-deep-black p-3.5 sm:p-4 shadow-sm space-y-3 flex flex-col justify-between"
            >
              {/* Cabeçalho do Card */}
              <div className="space-y-2 border-b border-deep-black/10 pb-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-black text-xs bg-deep-black text-gold px-2 py-0.5">
                      #{orderId}
                    </span>
                    {isOnline ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black uppercase">
                        <Globe className="w-3 h-3" />
                        <span>VENDA NO SITE</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold/25 text-deep-black border border-gold text-[10px] font-black uppercase">
                        <Store className="w-3 h-3" />
                        <span>BALCÃO</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono font-bold text-deep-black/60">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-black text-sm sm:text-base text-deep-black uppercase truncate">
                      {order.customer_name || 'Cliente'}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5">
                        {order.payment_method || 'CARD'}
                      </span>
                      {waPhone && (
                        <a
                          href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Olá ${order.customer_name || 'linda'}! 🥰 Aqui é da Ana Fitness Wear sobre seu pedido #${orderId}.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-base sm:text-lg text-deep-black">
                      ${fin.totalGross.toFixed(2)}
                    </div>
                    <span className="text-[9px] font-mono text-emerald-700 font-bold block">
                      Lucro: ${fin.netProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Peças Compradas com Foto Miniatura + SKU + Tamanho + Cor */}
              <div className="bg-neutral-50 border border-deep-black/15 p-2.5 space-y-2">
                <div className="text-[10px] font-black uppercase text-deep-black/70 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-gold" />
                  <span>PEÇAS PARA SEPARAR ({items.length}):</span>
                </div>
                <div className="space-y-2">
                  {items.map((it: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2.5 bg-white p-1.5 border border-deep-black/10">
                      {it.image ? (
                        <img
                          src={it.image}
                          alt={it.title}
                          className="w-11 h-14 object-cover rounded border border-deep-black/20 shrink-0 bg-neutral-100"
                        />
                      ) : (
                        <div className="w-11 h-14 rounded border border-dashed border-deep-black/20 shrink-0 bg-neutral-100 flex items-center justify-center text-[8px] font-bold text-deep-black/40">
                          FOTO
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-black text-deep-black uppercase truncate">
                          {it.quantity || 1}x {it.title}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-deep-black/80 mt-0.5">
                          TAM: <span className="text-deep-black font-black">{it.size || '-'}</span> • COR: {it.color || '-'}
                        </div>
                        {it.sku && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-amber-100 border border-amber-400 text-amber-950 font-mono font-black text-[9px]">
                            SKU: {it.sku}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Endereço de Entrega / Retirada */}
              {addressText && (
                <div className="flex items-center justify-between gap-2 bg-neutral-100 border border-deep-black/15 px-2.5 py-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span className="font-mono text-deep-black uppercase truncate" title={addressText}>
                      {addressText}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyAddress(String(order.id || orderId), addressText)}
                    className="px-2 py-1 bg-deep-black text-gold text-[9px] font-black uppercase shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === String(order.id || orderId) ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === String(order.id || orderId) ? 'COPIADO' : 'COPIAR'}</span>
                  </button>
                </div>
              )}

              {/* Ações Diretas de Despacho */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {onUpdateFulfillmentStatus && (
                  <>
                    <button
                      type="button"
                      onClick={() => onUpdateFulfillmentStatus(order.order_id || order.id, 'SHIPPED')}
                      className="flex-1 min-w-[135px] py-2 px-3 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[10px] font-black uppercase tracking-wider border border-deep-black transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5 text-gold" />
                      <span>DESPACHAR (RASTREIO)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateFulfillmentStatus(order.order_id || order.id, 'DELIVERED')}
                      className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ENTREGUE</span>
                    </button>
                  </>
                )}
                {onSelectOrder ? (
                  <button
                    type="button"
                    onClick={() => onSelectOrder(order)}
                    className="py-2 px-3 bg-white hover:bg-neutral-100 text-deep-black border border-deep-black text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>VER / EDITAR</span>
                  </button>
                ) : (
                  <Link
                    href="/backoffice?tab=sales"
                    className="py-2 px-3 bg-white hover:bg-neutral-100 text-deep-black border border-deep-black text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>VER NO PAINEL</span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
