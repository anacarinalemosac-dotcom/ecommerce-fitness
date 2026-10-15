'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Check, X } from 'lucide-react';

interface ActiveReferral {
  sellerName: string;
  coupon: string;
  discountPct: number;
}

function AffiliateLinkTrackerContent() {
  const searchParams = useSearchParams();
  const [referralInfo, setReferralInfo] = useState<ActiveReferral | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 1. Verifica se a URL contém um parâmetro de indicação / cupom
    const refCode =
      searchParams?.get('ref') ||
      searchParams?.get('cupom') ||
      searchParams?.get('c') ||
      searchParams?.get('code') ||
      searchParams?.get('vendedora');

    const checkCoupon = async (code: string) => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) return;

      try {
        const res = await fetch(`/api/backoffice/sellers?coupon=${encodeURIComponent(cleanCode)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.coupon?.code) {
            const seller = data.coupon;
            const refData: ActiveReferral = {
              sellerName: seller.seller_name || 'Consultora Oficial',
              coupon: seller.code,
              discountPct: Number(seller.customer_discount_pct) || 0,
            };

            // Salva no localStorage para auto-aplicar no checkout mesmo se a cliente navegar entre páginas
            localStorage.setItem('ana_applied_coupon', refData.coupon);
            localStorage.setItem('ana_seller_name', refData.sellerName);
            localStorage.setItem('ana_coupon_discount', refData.discountPct.toString());
            window.dispatchEvent(new Event('ana_coupon_updated'));

            setReferralInfo(refData);
            setVisible(true);
            return;
          }
        }
      } catch (err) {
        console.warn('Erro ao validar cupom da URL:', err);
      }
    };

    if (refCode) {
      checkCoupon(refCode);
    } else {
      // Se não veio na URL agora, verifica se já foi ativado previamente na sessão
      try {
        const savedCoupon = localStorage.getItem('ana_applied_coupon');
        const savedName = localStorage.getItem('ana_seller_name');
        const savedDiscount = Number(localStorage.getItem('ana_coupon_discount')) || 0;
        if (savedCoupon && savedName) {
          setReferralInfo({
            sellerName: savedName,
            coupon: savedCoupon,
            discountPct: savedDiscount,
          });
          // Mostra discretamente se já estava ativo
          setVisible(true);
        }
      } catch (_) {}
    }
  }, [searchParams]);

  if (!visible || !referralInfo) return null;

  return (
    <div className="bg-deep-black text-white border-b border-gold/40 py-2 px-4 text-xs shadow-md transition-all animate-fadeIn relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-5 h-5 rounded-full bg-gold/20 text-gold flex items-center justify-center shrink-0">
            <Sparkles className="w-3 h-3 text-gold" />
          </span>
          <span className="font-medium text-white/90">
            Você está comprando com a consultora{' '}
            <strong className="text-gold uppercase tracking-wider font-bold">
              {referralInfo.sellerName}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1 bg-gold/15 text-gold border border-gold/40 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
            <Check className="w-3 h-3" />
            CUPOM {referralInfo.coupon} ATIVADO
          </span>
          {referralInfo.discountPct > 0 && (
            <span className="bg-green-500/20 text-green-400 border border-green-500/40 px-2 py-0.5 rounded text-[11px] font-bold">
              +{referralInfo.discountPct}% OFF NO CHECKOUT
            </span>
          )}
        </div>

        <button
          onClick={() => setVisible(false)}
          className="text-white/60 hover:text-white p-1 rounded transition shrink-0"
          title="Fechar aviso"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function AffiliateLinkTracker() {
  return (
    <Suspense fallback={null}>
      <AffiliateLinkTrackerContent />
    </Suspense>
  );
}
