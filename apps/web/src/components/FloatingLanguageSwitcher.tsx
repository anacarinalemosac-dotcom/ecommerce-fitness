'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

function isCustomerFacingPage(path: string): boolean {
  if (!path) return false;
  const clean = path.toLowerCase().split('?')[0].split('#')[0];
  if (
    clean.includes('/backoffice') ||
    clean.includes('/pos') ||
    clean.includes('/admin') ||
    clean.includes('/vendedora') ||
    clean.includes('/api') ||
    clean === '/links' ||
    clean === '/bio'
  ) {
    return false;
  }
  return (
    clean === '/' ||
    clean.startsWith('/catalogo') ||
    clean.startsWith('/produto') ||
    clean.startsWith('/checkout') ||
    clean.startsWith('/contato') ||
    clean.startsWith('/trocas-e-devolucoes') ||
    clean.startsWith('/politica-de-envio') ||
    clean.startsWith('/conta') ||
    clean.startsWith('/pedidos') ||
    clean.startsWith('/avaliar') ||
    clean.startsWith('/review')
  );
}

export function FloatingLanguageSwitcher() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');

  if (!mounted || !isCustomerFacingPage(currentPath)) {
    return null;
  }

  const { lang, setLang } = useLanguage();

  return (
    <div
      aria-label="Language Selector / Seletor de Idioma"
      className="fixed bottom-5 left-5 z-40 bg-deep-black/95 backdrop-blur-md border-2 border-gold shadow-2xl p-1.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider animate-fadeIn"
    >
      <div className="flex items-center gap-1 pl-1 pr-1.5 text-gold hidden sm:flex">
        <Globe className="w-3.5 h-3.5 text-gold" />
        <span className="text-[9px] text-white/70">LANG:</span>
      </div>

      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 transition flex items-center gap-1 ${
          lang === 'en'
            ? 'bg-gold text-deep-black font-black shadow-sm'
            : 'text-white/70 hover:text-white'
        }`}
        title="Switch store language to English (US)"
      >
        <span>🇺🇸</span>
        <span>ENGLISH</span>
      </button>

      <span className="text-white/30 text-[10px]">|</span>

      <button
        type="button"
        onClick={() => setLang('pt')}
        className={`px-2.5 py-1 transition flex items-center gap-1 ${
          lang === 'pt'
            ? 'bg-gold text-deep-black font-black shadow-sm'
            : 'text-white/70 hover:text-white'
        }`}
        title="Traduzir loja inteira para Português"
      >
        <span>🇧🇷</span>
        <span>PORTUGUÊS</span>
      </button>
    </div>
  );
}
