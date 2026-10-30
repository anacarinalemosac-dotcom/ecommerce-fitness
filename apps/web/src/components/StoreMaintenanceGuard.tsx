'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useStoreSettings } from '../context/StoreSettingsContext';
import {
  Lock,
  Clock,
  MessageCircle,
  Instagram,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

export function StoreMaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const { siteInfo, adminUser, updateSiteInfo } = useStoreSettings();
  const [isAdminState, setIsAdminState] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    try {
      const isLogged =
        adminUser?.isLoggedIn ||
        localStorage.getItem('ana_is_admin') === 'true' ||
        sessionStorage.getItem('ana_is_admin') === 'true' ||
        (typeof document !== 'undefined' && document.cookie.includes('ana_is_admin=1'));
      setIsAdminState(Boolean(isLogged));
    } catch (_) {
      setIsAdminState(false);
    }
  }, [adminUser?.isLoggedIn]);

  // Se a rota for do painel de administração ou APIs, NUNCA bloqueia!
  if (
    pathname.startsWith('/backoffice') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin')
  ) {
    return <>{children}</>;
  }

  // Se a loja NÃO estiver em modo fora do ar / manutenção, exibe normalmente
  if (!siteInfo?.storeOffline) {
    return <>{children}</>;
  }

  // Se a administradora estiver logada, permite navegar na loja exibindo uma barra de alerta no topo
  if (isAdminState) {
    return (
      <>
        {/* Barra fixa no topo para a administradora */}
        <div className="bg-red-600 text-white px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 sticky top-0 z-[9999] shadow-lg border-b-2 border-red-800 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span className="font-black uppercase tracking-wider text-xs">
              ⚠️ MODO MANUTENÇÃO ATIVO — LOJA FORA DO AR PARA O PÚBLICO
            </span>
            <span className="hidden md:inline text-white/90 text-[11px]">
              (Visitantes comuns estão vendo a tela de manutenção. Você está navegando como Administradora)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/backoffice?tab=settings"
              className="px-3 py-1 bg-white text-red-700 hover:bg-gold hover:text-deep-black font-black uppercase text-[10px] tracking-wider transition shadow-sm"
            >
              Configurar no Backoffice
            </Link>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja reativar a loja e colocá-la ONLINE agora para todos os clientes?')) {
                  updateSiteInfo({ storeOffline: false });
                }
              }}
              className="px-3 py-1 bg-green-500 hover:bg-green-400 text-white font-black uppercase text-[10px] tracking-wider transition shadow-sm"
            >
              ✓ Colocar Loja no Ar Agora
            </button>
          </div>
        </div>

        {children}
      </>
    );
  }

  // TELA DE MANUTENÇÃO LUXURY PARA CLIENTES E VISITANTES COMUNS
  const cleanWhatsapp = (siteInfo.whatsapp || '19783139452').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
    'Olá! Vi que o site da Ana Fitness Wear está em manutenção e gostaria de tirar uma dúvida sobre os produtos.'
  )}`;
  const instagramUrl = siteInfo.instagramUrl || 'https://www.instagram.com/anafitnessweareua';

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col justify-between selection:bg-gold selection:text-deep-black relative overflow-hidden">
      {/* Background radial luxury lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full border-b border-gold/20 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/symbol-ana-fitness.png"
            alt="Ana Fitness Wear"
            className="w-8 h-8 object-contain filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
          />
          <span className="font-black text-sm uppercase tracking-widest text-white">
            ANA FITNESS WEAR
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-gold/80 tracking-widest border border-gold/30 px-2.5 py-1 bg-gold/5">
          <Sparkles className="w-3 h-3 text-gold" />
          <span>LEOMINSTER, MA • USA</span>
        </div>
      </header>

      {/* Main Maintenance Box */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 py-16 sm:py-24 text-center flex flex-col items-center justify-center my-auto">
        {/* Pulsing Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/60 border border-red-500/40 text-red-400 text-[11px] font-black uppercase tracking-widest mb-6 shadow-lg shadow-red-900/20">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>LOJA TEMPORARIAMENTE FORA DO AR</span>
        </div>

        {/* Big Headline */}
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4 leading-tight">
          {siteInfo.maintenanceTitle || 'Estamos Preparando Novidades!'}
        </h1>

        {/* Message */}
        <p className="text-sm sm:text-base text-stone-300 max-w-xl font-medium leading-relaxed mb-8">
          {siteInfo.maintenanceMessage ||
            'Nossa loja online está passando por uma breve manutenção e preparando uma nova coleção exclusiva. Em breve estaremos de volta com novidades incríveis!'}
        </p>

        {/* Previsão de Retorno (se informada pela lojista) */}
        {siteInfo.maintenanceEstimatedReturn && siteInfo.maintenanceEstimatedReturn.trim() && (
          <div className="mb-8 inline-flex items-center gap-2.5 px-4 py-2.5 bg-gold/10 border border-gold/40 text-gold text-xs font-black uppercase tracking-wider">
            <Clock className="w-4 h-4 text-gold shrink-0" />
            <span>PREVISÃO DE RETORNO: {siteInfo.maintenanceEstimatedReturn}</span>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
          {siteInfo.maintenanceShowContact !== false && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#25D366]/20 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Atendimento via WhatsApp</span>
            </a>
          )}

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-gold hover:text-deep-black text-white border border-gold/40 font-black text-xs uppercase tracking-wider transition cursor-pointer"
          >
            <Instagram className="w-4 h-4 text-gold group-hover:text-deep-black" />
            <span>Seguir no Instagram</span>
          </a>
        </div>
      </main>

      {/* Footer & Admin Login Link */}
      <footer className="relative z-10 w-full border-t border-white/10 py-6 px-6 text-center text-xs text-stone-500 space-y-3">
        <p className="text-[11px] uppercase tracking-wider">
          © {new Date().getFullYear()} ANA FITNESS WEAR LLC • All Rights Reserved
        </p>
        <div>
          <Link
            href="/backoffice"
            className="inline-flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-widest text-stone-500 hover:text-gold transition"
          >
            <Lock className="w-3 h-3 text-gold/70" />
            <span>Área Restrita da Lojista (Backoffice)</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
