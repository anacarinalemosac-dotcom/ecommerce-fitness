'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Phone,
  FileText,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  MapPin,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react';

export default function OrderLookupPage() {
  const { lang } = useLanguage();
  const [orderQuery, setOrderQuery] = useState('');
  const [emailQuery, setEmailQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [recentOrderIds, setRecentOrderIds] = useState<string[]>(['ANA-928104', 'ANA-927552']);

  useEffect(() => {
    // Carrega último pedido realizado no navegador se houver
    try {
      const saved = localStorage.getItem('ana_cart_item');
      if (saved) {
        // Se houver pedido recente no checkout
      }
    } catch (e) {}
  }, []);

  const handleSearchOrder = async (e?: React.FormEvent, directId?: string) => {
    if (e) e.preventDefault();
    const queryToUse = (directId || orderQuery).trim();
    if (!queryToUse && !emailQuery.trim()) {
      setErrorMsg(
        lang === 'pt'
          ? 'Por favor, digite o número do seu pedido ou seu e-mail cadastrado.'
          : 'Please enter your order number or registered email address.'
      );
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setOrderData(null);

    try {
      let url = '/api/orders/lookup?';
      if (queryToUse) url += `order_id=${encodeURIComponent(queryToUse)}&`;
      if (emailQuery) url += `query=${encodeURIComponent(emailQuery.trim())}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(
          lang === 'pt'
            ? 'Pedido não encontrado. Verifique se o código ou e-mail foram digitados corretamente.'
            : 'Order not found. Please double-check your order number or email.'
        );
      }

      const data = await res.json();
      if (data.order) {
        setOrderData(data.order);
      } else if (data.orders && data.orders.length > 0) {
        setOrderData(data.orders[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao consultar pedido.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 space-y-12 bg-white selection:bg-deep-black selection:text-gold min-h-[85vh]">
      {/* Top Banner Institucional */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/15 border border-gold/40 text-[10px] font-black uppercase tracking-widest text-deep-black">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span>ANA FITNESS WEAR • CUSTOMER CONCIERGE</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deep-black">
          {lang === 'pt' ? 'RASTREAMENTO DE PEDIDOS' : 'TRACK YOUR ORDER'}
        </h1>
        <p className="text-xs sm:text-sm uppercase tracking-wider text-deep-black/60 font-medium">
          {lang === 'pt'
            ? 'Acompanhe a confecção sob medida, despacho USPS e status de entrega em tempo real.'
            : 'Live updates on made-to-order tailoring, USPS domestic dispatch, and delivery progress.'}
        </p>
      </div>

      {/* Caixa de Busca de Pedido (Sem Necessidade de Senha) */}
      <div className="bg-white border-2 border-deep-black p-6 sm:p-8 shadow-luxury space-y-5">
        <div className="border-b border-deep-black/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
            <Search className="w-4 h-4 text-gold" />
            <span>{lang === 'pt' ? 'CONSULTAR STATUS DO PEDIDO' : 'SEARCH ORDER STATUS'}</span>
          </h2>
          <span className="text-[10px] font-bold text-deep-black/60 uppercase">
            {lang === 'pt' ? 'CONSULTA RÁPIDA E SEGURA' : 'FAST & SECURE LOOKUP'}
          </span>
        </div>

        <form onSubmit={(e) => handleSearchOrder(e)} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
              {lang === 'pt' ? 'NÚMERO DO PEDIDO (ORDER #):' : 'ORDER NUMBER (EX: ANA-928104):'}
            </label>
            <input
              type="text"
              placeholder="EX: ANA-928104"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              className="w-full px-3.5 py-3 text-xs uppercase tracking-wider font-mono font-bold border border-deep-black/20 focus:outline-none focus:border-deep-black"
            />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
              {lang === 'pt' ? 'OU E-MAIL DO COMPRADOR:' : 'OR BUYER EMAIL ADDRESS:'}
            </label>
            <input
              type="email"
              placeholder="customer@email.com"
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              className="w-full px-3.5 py-3 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow"
            >
              {loading ? (
                <span>{lang === 'pt' ? 'CONSULTANDO...' : 'SEARCHING...'}</span>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>{lang === 'pt' ? 'RASTREAR' : 'TRACK'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Atalhos de Demonstração / Pedidos Recentes */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-deep-black/10 text-[10px] font-bold text-deep-black/60 uppercase">
          <span>{lang === 'pt' ? 'PEDIDOS RECENTES:' : 'TEST DEMO ORDERS:'}</span>
          {recentOrderIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setOrderQuery(id);
                handleSearchOrder(undefined, id);
              }}
              className="px-2 py-0.5 bg-deep-black/5 hover:bg-gold hover:text-deep-black border border-deep-black/20 font-mono transition"
            >
              #{id}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border-2 border-red-500 text-red-700 text-xs font-black uppercase tracking-wider animate-fadeIn">
          ⚠ {errorMsg}
        </div>
      )}

      {/* DETALHES DO PEDIDO ENCONTRADO */}
      {orderData && (
        <div className="bg-white border-2 border-deep-black shadow-luxury space-y-8 p-6 sm:p-10 animate-fadeIn">
          {/* Cabeçalho do Pedido */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-deep-black pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-deep-black px-2 py-0.5">
                  PEDIDO CONFIRMADO
                </span>
                <span className="text-xs font-mono text-deep-black/50 font-bold">
                  {new Date(orderData.created_at).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-deep-black font-mono mt-1">
                PEDIDO #{orderData.order_id}
              </h2>
              <p className="text-xs text-deep-black/70 uppercase">
                {lang === 'pt' ? 'Cliente' : 'Customer'}: <strong>{orderData.customer_name}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 border border-deep-black hover:bg-deep-black hover:text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{lang === 'pt' ? 'IMPRIMIR RECIBO' : 'PRINT INVOICE'}</span>
              </button>
              <a
                href={`https://wa.me/19783139452?text=Hello%2C%20I%20have%20a%20question%20about%20my%20order%20%23${orderData.order_id}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-gold hover:bg-deep-black hover:text-gold text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WHATSAPP SUPPORT</span>
              </a>
            </div>
          </div>

          {/* LINHA DO TEMPO DE PROGRESSO (ORDER STATUS PROGRESS BAR) */}
          <div className="space-y-3 bg-deep-black text-white p-6 border border-gold/40">
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              STATUS ATUAL DA SUA ENCOMENDA:
            </span>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs uppercase tracking-wider pt-2">
              {/* Etapa 1: Confirmado */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gold font-black">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span>1. PAGAMENTO APROVADO</span>
                </div>
                <p className="text-[10px] text-white/60">Pedido registrado no sistema</p>
              </div>

              {/* Etapa 2: Confecção / Separação */}
              <div className="space-y-1">
                <div className={`flex items-center gap-2 font-black ${
                  orderData.status === 'IN_PRODUCTION' || orderData.status === 'SHIPPED' || orderData.status === 'DELIVERED'
                    ? 'text-gold'
                    : 'text-white/40'
                }`}>
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>2. CONFECÇÃO & ATELIER</span>
                </div>
                <p className="text-[10px] text-white/60">Corte & costura sob medida</p>
              </div>

              {/* Etapa 3: Rastreamento USPS */}
              <div className="space-y-1">
                <div className={`flex items-center gap-2 font-black ${
                  orderData.status === 'SHIPPED' || orderData.status === 'DELIVERED'
                    ? 'text-gold'
                    : 'text-white/40'
                }`}>
                  <Truck className="w-4 h-4 shrink-0" />
                  <span>3. ENVIADO VIA USPS</span>
                </div>
                <p className="text-[10px] text-white/60">Código de rastreamento emitido</p>
              </div>

              {/* Etapa 4: Entregue */}
              <div className="space-y-1">
                <div className={`flex items-center gap-2 font-black ${
                  orderData.status === 'DELIVERED' ? 'text-gold' : 'text-white/40'
                }`}>
                  <Package className="w-4 h-4 shrink-0" />
                  <span>4. ENTREGUE AO DESTINO</span>
                </div>
                <p className="text-[10px] text-white/60">Recebido em mãos</p>
              </div>
            </div>
          </div>

          {/* DADOS DE RASTREAMENTO USPS */}
          {orderData.tracking_code && (
            <div className="p-5 border-2 border-gold bg-gold/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-deep-black block">
                  CÓDIGO DE RASTREIO OFICIAL DOS CORREIOS AMERICANOS (USPS):
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base sm:text-lg font-black text-deep-black">
                    {orderData.tracking_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(orderData.tracking_code)}
                    className="p-1.5 border border-deep-black/30 hover:bg-deep-black hover:text-white transition text-[10px] font-black uppercase flex items-center gap-1"
                    title="Copiar código"
                  >
                    {copiedTracking ? <Check className="w-3.5 h-3.5 text-green-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTracking ? 'COPIADO' : 'COPIAR'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-deep-black/70 uppercase font-bold">
                  TRANSPORTADORA: {orderData.carrier || 'USPS Priority Mail ($9.99)'}
                </p>
              </div>

              {orderData.tracking_code.startsWith('9400') && (
                <a
                  href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${orderData.tracking_code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shrink-0 shadow"
                >
                  <span>RASTREAR NO SITE DA USPS</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* ITENS DO PEDIDO & ENDEREÇO DE ENTREGA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Lista de Peças */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-deep-black border-b border-deep-black/10 pb-2">
                PEÇAS COMPRADAS ({orderData.items?.length || 0})
              </h3>

              <div className="divide-y divide-deep-black/10">
                {(orderData.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-14 h-18 object-cover border border-deep-black/20"
                        />
                      )}
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-deep-black">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-deep-black/60 font-mono uppercase">
                          TAM {item.size} • COR: {item.color} • QTD: {item.quantity}x
                        </p>
                        <span className="text-[9px] text-gold font-black uppercase font-mono">
                          SKU: {item.sku || 'ANA-ITEM'}
                        </span>
                      </div>
                    </div>

                    <span className="text-sm font-black font-mono text-deep-black">
                      ${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Endereço & Resumo Financeiro */}
            <div className="lg:col-span-5 bg-deep-black/5 p-6 border border-deep-black/10 space-y-5">
              {/* Endereço */}
              <div className="space-y-1 text-xs uppercase tracking-wider">
                <span className="text-[9px] font-black text-deep-black/50 block">ENDEREÇO DE ENTREGA:</span>
                <p className="font-black text-deep-black">{orderData.customer_name}</p>
                <p className="text-deep-black/70">
                  {orderData.shipping_address?.address} {orderData.shipping_address?.apt}
                </p>
                <p className="text-deep-black/70">
                  {orderData.shipping_address?.city}, {orderData.shipping_address?.state} {orderData.shipping_address?.zip}
                </p>
                {orderData.customer_phone && (
                  <p className="text-[10px] font-mono text-deep-black/60 mt-1">{orderData.customer_phone}</p>
                )}
              </div>

              {/* Resumo Financeiro */}
              <div className="border-t border-deep-black/10 pt-3 space-y-1.5 text-xs uppercase tracking-wider">
                <div className="flex justify-between text-deep-black/70">
                  <span>SUBTOTAL:</span>
                  <span className="font-mono">${Number(orderData.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-deep-black/70">
                  <span>FRETE DOMÉSTICO (USPS):</span>
                  <span className="font-mono">${Number(orderData.shipping_fee || 9.99).toFixed(2)}</span>
                </div>
                {orderData.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>DESCONTO:</span>
                    <span className="font-mono">-${Number(orderData.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-deep-black border-t border-deep-black/10 pt-2">
                  <span>TOTAL PAGO:</span>
                  <span className="font-mono text-gold text-base">${Number(orderData.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-deep-black/60 uppercase text-center font-bold">
                🔒 GARANTIA DE 30 DIAS PARA TROCAS E DEVOLUÇÕES ATIVA
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
