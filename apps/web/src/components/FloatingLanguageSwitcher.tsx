'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export function FloatingLanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      aria-label="Language Selector / Seletor de Idioma"
      className="fixed bottom-5 right-5 z-50 bg-deep-black/95 backdrop-blur-md border-2 border-gold shadow-2xl p-1.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider animate-fadeIn"
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
