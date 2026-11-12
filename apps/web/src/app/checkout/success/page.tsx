'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, Phone, ShieldCheck, Download } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { trackEvent } from '../../../lib/tracking';
import { clearCart } from '@/lib/cart';
import { downloadOrderPdf } from '@/lib/orderPdf';

function StripeSuccessContent() {
  const searchParams = useSearchParams();
  const { lang } = useLanguage();

  const [orderId, setOrderId] = useState<string>('ANA-CONFIRMADO');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const oId = searchParams.get('order_id');
    const sId = searchParams.get('session_id');
    if (oId) setOrderId(oId);

    const loadOrderSummary = async () => {
      try {
        const savedSnapshot = localStorage.getItem('ana_last_order_snapshot');
        if (savedSnapshot) {
          const parsed = JSON.parse(savedSnapshot);
          if (!oId || parsed?.order_id === oId) {
            setOrderDetails(parsed);
          }
        }
      } catch (_) {}

      if (sId) {
        setSessionId(sId);
        try {
          await fetch(`/api/checkout/stripe/verify?session_id=${encodeURIComponent(sId)}`);
        } catch (_) {}
      }

      if (oId) {
        try {
          const lookupRes = await fetch(`/api/orders/lookup?order_id=${encodeURIComponent(oId)}`);
          if (lookupRes.ok) {
            const lookupData = await lookupRes.json();
            if (lookupData?.order) {
              setOrderDetails(lookupData.order);
            }
          }
        } catch (_) {}
      }
    };

    loadOrderSummary();

    // Dispara Purchase nos Pixels e limpa carrinho local
    try {
      const savedCart = localStorage.getItem('ana_cart_item');
      if (savedCart) {
        const item = JSON.parse(savedCart);
        trackEvent.purchase({
          orderId: oId || 'ANA-STRIPE-ORDER',
          value: (Number(item.price || 0) * Number(item.quantity || 1)) + 9.90,
          currency: 'USD',
          items: [
            {
              id: item.sku || item.slug || 'cart-item',
              title: item.title,
              price: Number(item.price || 0),
              quantity: Number(item.quantity || 1),
            },
          ],
        });
      } else {
        trackEvent.purchase({
          orderId: oId || 'ANA-STRIPE-ORDER',
          value: 54.89,
          currency: 'USD',
        });
      }
      clearCart();
    } catch (e) {}
  }, [searchParams]);

  const handleDownloadPdf = async () => {
    if (downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const fallbackOrder = orderDetails || {
        order_id: orderId,
        created_at: new Date().toISOString(),
        payment_method: 'CARD',
        items: [],
      };
      await downloadOrderPdf(fallbackOrder, { lang });
    } catch (err) {
      console.error('Erro ao baixar PDF do pedido:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8 animate-fadeIn">
      {/* Emblema de Sucesso */}
      <div className="w-20 h-20 bg-gold text-deep-black rounded-full flex items-center justify-center mx-auto shadow-luxury">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/15 text-deep-black text-[10px] font-black uppercase tracking-widest border border-gold/40">
          <ShieldCheck className="w-3.5 h-3.5 text-gold" />
          <span>{lang === 'pt' ? 'PAGAMENTO STRIPE CONFIRMADO' : 'STRIPE PAYMENT VERIFIED'}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deep-black">
          {lang === 'pt' ? 'OBRIGADO PELO SEU PEDIDO!' : 'THANK YOU FOR YOUR ORDER!'}
        </h1>

        <p className="text-sm font-mono font-black uppercase tracking-widest text-gold bg-deep-black py-2 px-4 inline-block">
          {lang === 'pt' ? `NÚMERO DO PEDIDO: #${orderId}` : `ORDER NUMBER: #${orderId}`}
        </p>

        <p className="text-xs text-deep-black/70 uppercase max-w-md mx-auto pt-2">
          {lang === 'pt'
            ? 'Seu pagamento com cartão / Apple Pay foi processado com segurança pela Stripe. Sua encomenda já entrou na nossa fila de despacho imediato em Leominster, MA.'
            : 'Your card / Apple Pay payment was processed securely by Stripe. Your order is queued for immediate dispatch from Leominster, MA.'}
        </p>
      </div>

      {/* Resumo das Peças Compradas + Botão PDF */}
      {orderDetails?.items && Array.isArray(orderDetails.items) && orderDetails.items.length > 0 && (
        <div className="p-6 bg-white border-2 border-deep-black text-left space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="flex items-center justify-between border-b border-deep-black/10 pb-2 gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
              {lang === 'pt'
                ? `PEÇAS COMPRADAS (${orderDetails.items.length})`
                : `PURCHASED PIECES (${orderDetails.items.length})`}
            </h3>
            <span className="text-xs font-mono font-black text-gold bg-deep-black px-2 py-0.5">
              TOTAL: ${Number(orderDetails.total_amount ?? orderDetails.total ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="divide-y divide-deep-black/10 max-h-64 overflow-y-auto pr-1">
            {orderDetails.items.map((it: any, idx: number) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {it.image && (
                    <img
                      src={it.image}
                      alt={it.title}
                      className="w-11 h-14 object-cover border border-deep-black/20 shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-deep-black truncate">{it.title}</p>
                    <p className="text-[10px] font-mono text-deep-black/60 uppercase">
                      TAM {it.size} • {it.color} • {it.quantity || 1}x
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-black text-deep-black shrink-0">
                  ${((Number(it.unit_price ?? it.price) || 0) * (Number(it.quantity) || 1)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cartão de Detalhes do Recebimento */}
      <div className="p-6 bg-white border-2 border-deep-black text-left space-y-4 max-w-xl mx-auto shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-deep-black border-b border-deep-black/10 pb-2 flex items-center justify-between">
          <span>{lang === 'pt' ? 'DETALHES DO RECEBIMENTO DO PEDIDO' : 'ORDER FULFILLMENT DETAILS'}</span>
          <span className="text-[10px] text-gold font-mono font-bold">SHOWROOM OU USPS</span>
        </h3>
        <div className="text-xs space-y-2 text-deep-black/80 uppercase font-medium">
          <p><strong>{lang === 'pt' ? 'Status' : 'Status'}:</strong> <span className="text-green-700 font-bold">✓ PAGO & EM PREPARAÇÃO</span></p>
          <p><strong>{lang === 'pt' ? 'Retirada no Showroom' : 'Showroom Pickup'}:</strong> 126 First St, Apt 01, Leominster, MA 01453 (Sem frete)</p>
          <p><strong>{lang === 'pt' ? 'Entrega no Endereço' : 'Home Delivery'}:</strong> USPS Priority Mail / Ground Advantage (1 a 5 dias úteis)</p>
          <div className="pt-2 border-t border-deep-black/10 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
            <span>✉</span>
            <span>
              {lang === 'pt'
                ? 'E-mail de confirmação enviado para você! Se escolheu retirada no showroom, avisaremos no WhatsApp (+1 978 313-9452) assim que suas peças estiverem prontas. Se escolheu entrega, você receberá o código de rastreamento USPS.'
                : 'Confirmation email sent! If you selected showroom pickup, we will notify you on WhatsApp (+1 978 313-9452) when ready. If delivery was selected, your USPS tracking code will follow.'}
            </span>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center pt-4">
        <button
          type="button"
          disabled={downloadingPdf}
          onClick={handleDownloadPdf}
          className="px-6 py-4 bg-deep-black text-gold hover:bg-gold hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-luxury border-2 border-deep-black cursor-pointer disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          <span>
            {downloadingPdf
              ? (lang === 'pt' ? 'GERANDO PDF...' : 'GENERATING PDF...')
              : (lang === 'pt' ? 'BAIXAR PEDIDO EM PDF' : 'DOWNLOAD ORDER PDF')}
          </span>
        </button>
        <Link
          href={`/pedidos?order=${encodeURIComponent(orderId)}`}
          className="px-6 py-4 bg-gold text-deep-black hover:bg-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow border border-gold"
        >
          <Package className="w-4 h-4 text-deep-black" />
          <span>{lang === 'pt' ? 'RASTREAR MEU PEDIDO EM TEMPO REAL' : 'TRACK THIS ORDER LIVE'}</span>
        </Link>
        <Link
          href="/"
          className="px-6 py-4 bg-white border-2 border-deep-black text-deep-black hover:bg-deep-black hover:text-white text-xs font-black uppercase tracking-widest transition"
        >
          {lang === 'pt' ? 'VOLTAR À LOJA' : 'RETURN TO SHOP'}
        </Link>
        <a
          href={`https://wa.me/19783139452?text=Hello%2C%20I%20just%20placed%20order%20%23${orderId}%20via%20Stripe.`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-4 border-2 border-deep-black text-deep-black hover:bg-deep-black hover:text-white text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
        >
          <Phone className="w-4 h-4" />
          <span>WHATSAPP CONCIERGE</span>
        </a>
      </div>
    </div>
  );
}

export default function StripeSuccessPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-black uppercase">CARREGANDO DETALHES DO PEDIDO...</div>}>
      <StripeSuccessContent />
    </Suspense>
  );
}
