'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Flame, Sparkles, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface UrgencyCountdownTimerProps {
  mode?: 'compact' | 'product' | 'checkout';
  className?: string;
}

export function UrgencyCountdownTimer({ mode = 'product', className = '' }: UrgencyCountdownTimerProps) {
  const { lang } = useLanguage();
  // 15 minutos (900 segundos) é a duração com maior taxa de conversão psicológica em e-commerce
  const INITIAL_SECONDS = 15 * 60; // 15 minutos = 900s

  const [secondsLeft, setSecondsLeft] = useState<number>(INITIAL_SECONDS);
  const [viewersCount, setViewersCount] = useState<number>(4);

  useEffect(() => {
    // Carrega ou inicializa o timestamp de término no localStorage
    const STORAGE_KEY = 'ana_urgency_timer_expiry';
    const now = Date.now();
    let expiry = Number(localStorage.getItem(STORAGE_KEY));

    if (!expiry || expiry < now) {
      // Cria nova janela de 15 minutos
      expiry = now + INITIAL_SECONDS * 1000;
      localStorage.setItem(STORAGE_KEY, String(expiry));
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      if (remaining <= 0) {
        // Se zerar, reseta para mais 15 minutos (sempre mantendo a sensação de urgência ativa)
        const nextExpiry = Date.now() + INITIAL_SECONDS * 1000;
        localStorage.setItem(STORAGE_KEY, String(nextExpiry));
        setSecondsLeft(INITIAL_SECONDS);
      } else {
        setSecondsLeft(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    // Variação orgânica de clientes simultâneos visualizando (3 a 7)
    const viewerInterval = setInterval(() => {
      setViewersCount(Math.floor(3 + Math.random() * 5));
    }, 12000);

    return () => {
      clearInterval(interval);
      clearInterval(viewerInterval);
    };
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // 1. MODO COMPACTO (Para faixas e cabeçalhos de topo)
  if (mode === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 font-mono text-xs font-black ${className}`}>
        <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
        <span className="uppercase tracking-wider">
          {lang === 'pt' ? 'OFERTA TERMINA EM:' : 'OFFER ENDS IN:'}
        </span>
        <span className="px-1.5 py-0.5 bg-amber-400 text-deep-black font-mono font-black text-xs tracking-widest shadow-2xs">
          {formattedTime}
        </span>
      </div>
    );
  }

  // 2. MODO CHECKOUT (Para segurar a sacola de compras e forçar a finalização)
  if (mode === 'checkout') {
    return (
      <div className={`p-3.5 bg-amber-50 border-2 border-amber-400 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-xs animate-fadeIn ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-400 text-deep-black flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-deep-black animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider block text-deep-black">
              {lang === 'pt' ? '🔒 Peças Reservadas na Sacola' : '🔒 Bag Items Reserved'}
            </span>
            <span className="text-[11px] text-amber-900 block font-medium">
              {lang === 'pt'
                ? 'Conclua seu pedido antes que o tempo expire para garantir o estoque e o frete fixo de $9.99.'
                : 'Complete your order before time runs out to secure stock and $9.99 flat shipping.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-deep-black text-gold font-mono font-black text-sm tracking-widest shrink-0 border border-gold shadow-xs">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>{formattedTime}</span>
        </div>
      </div>
    );
  }

  // 3. MODO PRODUTO (Para a página de produto - induzir o "Comprar Agora")
  return (
    <div className={`p-4 bg-gradient-to-r from-neutral-900 via-deep-black to-neutral-900 text-white border-2 border-gold/60 shadow-luxury space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
            <Flame className="w-3 h-3 text-white" />
            <span>{lang === 'pt' ? 'OFERTA RELÂMPAGO' : 'FLASH DEAL'}</span>
          </span>
          <span className="text-[10px] text-gold font-black uppercase tracking-wider">
            {lang === 'pt' ? 'PREÇO ESPECIAL GARANTIDO' : 'SPECIAL PRICE RESERVED'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 border border-gold/40">
          <Clock className="w-3.5 h-3.5 text-gold animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-xs font-black font-mono text-gold tracking-widest">
            {formattedTime}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-white/80 border-t border-white/10 pt-2 font-medium">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>
            {lang === 'pt'
              ? `🔥 ${viewersCount} clientes estão visualizando esta peça agora`
              : `🔥 ${viewersCount} shoppers are viewing this piece right now`}
          </span>
        </div>
        <span className="text-[10px] text-white/50 uppercase font-mono hidden sm:inline">
          {lang === 'pt' ? 'Envio Imediato USPS' : 'Fast USPS Shipping'}
        </span>
      </div>
    </div>
  );
}
