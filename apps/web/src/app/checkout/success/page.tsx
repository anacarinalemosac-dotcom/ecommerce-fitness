'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, ArrowRight, Phone, Sparkles, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { trackEvent } from '../../../lib/tracking';

function StripeSuccessContent() {
  const searchParams = useSearchParams();
  const { lang } = useLanguage();

  const [orderId, setOrderId] = useState<string>('ANA-CONFIRMADO');
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const oId = searchParams.get('order_id');
    const sId = searchParams.get('session_id');
    if (oId) setOrderId(oId);
    if (sId) setSessionId(sId);

    // Dispara Purchase nos Pixels e limpa carrinho local
    try {
      const savedCart = localStorage.getItem('ana_cart_item');
      if (savedCart) {
        const item = JSON.parse(savedCart);
        trackEvent.purchase({
          orderId: oId || 'ANA-STRIPE-ORDER',
          value: (Number(item.price || 0) * Number(item.quantity || 1)) + 9.99,
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
      localStorage.removeItem('ana_cart_item');
    } catch (e) {}
  }, [searchParams]);

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

      {/* Cartão de Detalhes do Envio */}
      <div className="p-6 bg-white border-2 border-deep-black text-left space-y-4 max-w-xl mx-auto shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-deep-black border-b border-deep-black/10 pb-2 flex items-center justify-between">
          <span>{lang === 'pt' ? 'DETALHES DO ENVIO DOMÉSTICO (USPS)' : 'DOMESTIC US SHIPPING DETAILS'}</span>
          <span className="text-[10px] text-gold font-mono font-bold">FLAT RATE $9.99</span>
        </h3>
        <div className="text-xs space-y-1.5 text-deep-black/80 uppercase font-medium">
          <p><strong>{lang === 'pt' ? 'Status' : 'Status'}:</strong> <span className="text-green-700 font-bold">✓ PAGO & EM PREPARAÇÃO</span></p>
          <p><strong>{lang === 'pt' ? 'Transportadora' : 'Carrier'}:</strong> USPS Priority Mail / Ground Advantage</p>
          <p><strong>{lang === 'pt' ? 'Prazo Estimado' : 'Estimated Time'}:</strong> 1 a 5 dias úteis com código de rastreamento</p>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Link
          href={`/pedidos`}
          className="px-6 py-4 bg-gold text-deep-black hover:bg-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow border border-gold"
        >
          <Package className="w-4 h-4 text-deep-black" />
          <span>{lang === 'pt' ? 'RASTREAR MEU PEDIDO EM TEMPO REAL' : 'TRACK THIS ORDER LIVE'}</span>
        </Link>
        <Link
          href="/"
          className="px-6 py-4 bg-deep-black text-white hover:bg-gold hover:text-deep-black text-xs font-black uppercase tracking-widest transition"
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
