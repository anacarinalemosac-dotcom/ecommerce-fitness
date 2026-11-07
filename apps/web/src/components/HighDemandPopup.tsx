'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import {
  Sparkles,
  Flame,
  MessageCircle,
  X,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';

export function HighDemandPopup() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (!pathname) return;
    const clean = pathname.toLowerCase();
    // Do not show in backoffice, pos, or system routes
    if (
      clean.includes('/backoffice') ||
      clean.includes('/pos') ||
      clean.includes('/admin') ||
      clean.includes('/vendedora') ||
      clean.includes('/api') ||
      clean === '/links' ||
      clean === '/bio'
    ) {
      return;
    }

    try {
      const dismissed = sessionStorage.getItem('ana_dismissed_high_demand_popup');
      if (!dismissed) {
        // Show after 1.2s delay for a smooth entrance
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, [pathname]);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('ana_dismissed_high_demand_popup', 'true');
    } catch (_) {}
  };

  if (!mounted || !isOpen) return null;

  const isPt = lang === 'pt';
  const whatsappUrl = isPt
    ? 'https://wa.me/19783139452?text=Ol%C3%A1%21%20Vi%20o%20aviso%20de%20alta%20demanda%20no%20site.%20Gostaria%20de%20saber%20quais%20produtos%20e%20tamanhos%20est%C3%A3o%20dispon%C3%ADveis%20%C3%A0%20pronta%20entrega.'
    : 'https://wa.me/19783139452?text=Hello%21%20I%20saw%20the%20high-demand%20notice%20on%20the%20website.%20I%20would%20like%20to%20know%20which%20pieces%20and%20sizes%20are%20currently%20available.';

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 sm:p-6 transition-all duration-300">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Modal Card / Bottom Drawer */}
      <div
        className="relative w-full max-w-lg bg-[#0F0F0F] text-white border-2 border-gold/70 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.3)] rounded-2xl overflow-hidden z-10 animate-in slide-in-from-bottom-8 duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Gold Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-gold to-yellow-300" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-20 cursor-pointer"
          aria-label={isPt ? 'Fechar aviso' : 'Close notice'}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/15 text-gold border border-gold/40 text-[10px] font-black uppercase tracking-widest rounded-full">
              <Flame className="w-3.5 h-3.5 text-gold animate-pulse" />
              {isPt ? 'COMUNICADO OFICIAL • ALTA DEMANDA' : 'OFFICIAL NOTICE • HIGH DEMAND'}
            </span>
          </div>

          {/* Heading */}
          <div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase leading-snug">
              {isPt ? (
                <>Estoque Rotativo & <span className="text-gold">Alta Demanda de Vendas</span></>
              ) : (
                <>Fast-Selling Inventory & <span className="text-gold">High Sales Demand</span></>
              )}
            </h3>
          </div>

          {/* User's Exact Message Quote in Luxury Callout */}
          <div className="p-4 bg-white/[0.04] border-l-4 border-gold rounded-r-xl shadow-inner">
            <p className="text-sm sm:text-base text-gray-100 leading-relaxed font-semibold">
              &ldquo;{isPt
                ? 'Não estamos conseguindo atualizar nossos produtos no site devido à alta demanda de venda. Entre em contato com nosso WhatsApp para saber mais sobre quais produtos temos disponível: (978) 313-9452'
                : 'Due to high order volume, we are unable to update all products on the site in real-time. Please contact our WhatsApp to check available inventory: (978) 313-9452'
              }&rdquo;
            </p>
          </div>

          {/* Bullet points explaining the benefits */}
          <div className="grid grid-cols-1 gap-2 pt-1">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <span>{isPt ? 'Peças e lançamentos exclusivos esgotam antes de subir ao site.' : 'Exclusive pieces and new releases sell out fast before going live.'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <span>{isPt ? 'Vídeos e fotos em tempo real de todas as peças à pronta-entrega.' : 'Real-time photos & video previews of all in-stock pieces.'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <span>{isPt ? 'Envio imediato no mesmo dia dos EUA com frete fixo de $9.99.' : 'Instant same-day shipping across all 50 US States with flat $9.99 rate.'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDismiss}
              className="flex-1 inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 px-5 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center"
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              <span>{isPt ? 'Falar no WhatsApp • (978) 313-9452' : 'Chat on WhatsApp • (978) 313-9452'}</span>
            </a>

            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs uppercase tracking-wider font-bold rounded-xl transition-colors border border-white/10 text-center cursor-pointer"
            >
              {isPt ? 'Continuar no Site' : 'Browse Site'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
