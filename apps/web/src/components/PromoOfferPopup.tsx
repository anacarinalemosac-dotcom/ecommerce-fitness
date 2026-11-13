'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Truck,
  Sparkles,
  Zap,
  X,
  ArrowRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useStoreSettings, DEFAULT_PROMO_POPUP } from '@/context/StoreSettingsContext';
import { useLanguage } from '@/context/LanguageContext';

function shouldShowPromoPopup(pathname: string): boolean {
  if (!pathname) return false;
  const clean = pathname.toLowerCase().split('?')[0].split('#')[0];

  // Nunca exibir em áreas administrativas, checkout ou APIs
  if (
    clean.includes('/backoffice') ||
    clean.includes('/pos') ||
    clean.includes('/admin') ||
    clean.includes('/vendedora') ||
    clean.includes('/checkout') ||
    clean.includes('/api') ||
    clean === '/links' ||
    clean === '/bio'
  ) {
    return false;
  }

  return true;
}

export function PromoOfferPopup() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const { siteInfo } = useStoreSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

  const popupConfig = siteInfo.promoOfferPopup || DEFAULT_PROMO_POPUP;

  // Atualiza o cronômetro a cada 1 segundo
  useEffect(() => {
    setHasMounted(true);

    const calculateRemaining = () => {
      const expiresAtMs = new Date(popupConfig.expiresAt || '2026-11-15T23:59:59-05:00').getTime();
      const now = Date.now();
      const diff = Math.max(0, expiresAtMs - now);

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        setIsOpen(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, totalMs: diff });
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [popupConfig.expiresAt]);

  // Gerencia a exibição suave após carregamento
  useEffect(() => {
    if (!hasMounted) return;

    const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
    if (!shouldShowPromoPopup(currentPath)) {
      setIsOpen(false);
      return;
    }

    if (!popupConfig.active) {
      setIsOpen(false);
      return;
    }

    const expiresAtMs = new Date(popupConfig.expiresAt || '2026-11-15T23:59:59-05:00').getTime();
    if (Date.now() >= expiresAtMs) {
      setIsOpen(false);
      return;
    }

    // Verifica se já foi dispensado nesta sessão do navegador
    try {
      const dismissed = sessionStorage.getItem('ana_dismissed_promo_popup_v1');
      if (dismissed) {
        return;
      }
    } catch {}

    // Delay de 1.5 segundos para o visitante ver o site primeiro e então o pop-up surgir elegantemente
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasMounted, pathname, popupConfig.active, popupConfig.expiresAt]);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('ana_dismissed_promo_popup_v1', 'true');
    } catch {}
  };

  const handleCtaClick = () => {
    handleDismiss();
    const vitrineEl = document.getElementById('vitrine');
    if (vitrineEl) {
      vitrineEl.scrollIntoView({ behavior: 'smooth' });
    } else if (typeof window !== 'undefined') {
      window.location.href = '/#vitrine';
    }
  };

  if (!hasMounted || !isOpen || timeLeft.totalMs <= 0 || !popupConfig.active) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#0A0A0A] text-white border-2 border-gold max-w-lg w-full p-6 sm:p-8 relative shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden animate-scaleUp">
        
        {/* Detalhe dourado de fundo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        {/* Botão Fechar (X) */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-gold hover:text-deep-black text-white/80 transition flex items-center justify-center cursor-pointer z-10"
          aria-label="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-5 text-center relative z-1">
          {/* Badge de Oferta Relâmpago */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/20 border border-gold/40 text-gold text-[10px] font-black uppercase tracking-widest rounded-full">
            <Zap className="w-3.5 h-3.5 text-gold animate-pulse" />
            <span>
              {lang === 'pt'
                ? (popupConfig.badge || '⚡ OFERTA RELÂMPAGO • ATÉ DOMINGO')
                : '⚡ LIMITED-TIME FLASH DEAL'}
            </span>
          </div>

          {/* Título Principal */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white font-mono leading-tight">
              {lang === 'pt'
                ? (popupConfig.title || 'FRETE GRÁTIS EM COMPRAS ACIMA DE $100!')
                : 'FREE SHIPPING ON ORDERS OVER $100!'}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium max-w-md mx-auto">
              {lang === 'pt'
                ? (popupConfig.description ||
                  'Válido para todos os 50 estados dos EUA via USPS Priority. Oferta especial por tempo limitado: encerra neste domingo à meia-noite (horário dos EUA)! Aproveite para garantir seus conjuntos favoritos.')
                : 'USPS Priority delivery across all 50 US states. Limited time offer ending this Sunday at midnight (US Eastern Time)! Unlock free shipping on any order over $100.'}
            </p>
          </div>

          {/* Cronômetro Regressivo em Tempo Real */}
          {popupConfig.showCountdown !== false && (
            <div className="pt-1">
              <div className="text-[10px] uppercase font-black tracking-widest text-gold/90 mb-2 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gold" />
                <span>
                  {lang === 'pt'
                    ? 'ESTA OFERTA ENCERRA EM:'
                    : 'THIS SPECIAL OFFER ENDS IN:'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
                <div className="bg-white/5 border border-gold/40 p-2 sm:p-2.5 rounded text-center">
                  <span className="text-lg sm:text-2xl font-black text-gold font-mono block">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[8.5px] uppercase font-bold text-white/60 tracking-wider">
                    {lang === 'pt' ? 'DIAS' : 'DAYS'}
                  </span>
                </div>

                <div className="bg-white/5 border border-gold/40 p-2 sm:p-2.5 rounded text-center">
                  <span className="text-lg sm:text-2xl font-black text-gold font-mono block">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[8.5px] uppercase font-bold text-white/60 tracking-wider">
                    {lang === 'pt' ? 'HORAS' : 'HOURS'}
                  </span>
                </div>

                <div className="bg-white/5 border border-gold/40 p-2 sm:p-2.5 rounded text-center">
                  <span className="text-lg sm:text-2xl font-black text-gold font-mono block">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[8.5px] uppercase font-bold text-white/60 tracking-wider">
                    {lang === 'pt' ? 'MIN' : 'MIN'}
                  </span>
                </div>

                <div className="bg-white/5 border border-gold/40 p-2 sm:p-2.5 rounded text-center">
                  <span className="text-lg sm:text-2xl font-black text-gold font-mono block animate-pulse">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[8.5px] uppercase font-bold text-white/60 tracking-wider">
                    {lang === 'pt' ? 'SEG' : 'SEC'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Destaques de Confiança */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-white/70 uppercase font-bold pt-1">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-gold" />
              <span>USPS Priority</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-gold" />
              <span>Zero Transparência</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
              <span>Todos os 50 Estados</span>
            </span>
          </div>

          {/* Botão de Chamada para Ação */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleCtaClick}
              className="w-full py-4 px-6 bg-gold hover:bg-white text-deep-black font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-xl border-2 border-gold cursor-pointer"
            >
              <span>{lang === 'pt' ? (popupConfig.ctaText || 'GARANTIR MEU FRETE GRÁTIS') : 'CLAIM MY FREE SHIPPING NOW'}</span>
              <ArrowRight className="w-4 h-4 text-deep-black" />
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-[11px] text-white/50 hover:text-white uppercase font-bold transition cursor-pointer"
            >
              {lang === 'pt' ? 'Continuar navegando sem a oferta' : 'Continue browsing'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
