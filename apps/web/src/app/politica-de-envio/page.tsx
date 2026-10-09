'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { Truck, Clock, MapPin, Search, CheckCircle2, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function PoliticaDeEnvioPage() {
  const { lang, t } = useLanguage();
  const [zip, setZip] = useState('');
  const [shippingResult, setShippingResult] = useState<null | {
    standard: { days: string; price: number };
    priority: { days: string; price: number };
    pickup: { days: string; price: number };
  }>(null);

  const handleCalculateZip = (e: React.FormEvent) => {
    e.preventDefault();
    if (zip.length >= 5) {
      setShippingResult({
        standard: { days: '1 - 5', price: 9.99 },
        priority: { days: '1 - 2', price: 19.99 },
        pickup: { days: '0 (Same day)', price: 0.0 },
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-16">
      {/* Header Institucional */}
      <div className="text-center space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
          ANA FITNESS WEAR • US SHIPPING
        </span>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-wider text-deep-black">
          {t('ship.title')}
        </h1>
        <p className="text-xs sm:text-sm uppercase tracking-wider text-deep-black/60 font-medium max-w-xl mx-auto leading-relaxed">
          {t('ship.subtitle')}
        </p>
      </div>

      {/* Destaque da Taxa Fixa de $9.99 */}
      <div className="bg-deep-black text-white p-8 border border-gold/40 space-y-4 shadow-luxury">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              STANDARD US DELIVERY
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white mt-1">
              {t('ship.flatRateTitle')}
            </h2>
          </div>
          <span className="text-4xl sm:text-5xl font-black text-gold font-mono">
            $9.99
          </span>
        </div>
        <p className="text-xs sm:text-sm text-white/80 uppercase tracking-wider leading-relaxed">
          {t('ship.flatRateDesc')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] font-bold uppercase tracking-wider text-white/90">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
            <span>{lang === 'pt' ? 'Todos os 50 Estados Americanos' : 'All 50 US States Covered'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
            <span>{lang === 'pt' ? 'Envio via USPS com Rastreio' : 'USPS Shipping with Tracking'}</span>
          </div>
        </div>
      </div>

      {/* Simulador Interativo por ZIP Code Americano */}
      <div className="bg-white border-2 border-deep-black p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
            {lang === 'pt' ? 'SIMULADOR DE ENVIO' : 'SHIPPING CALCULATOR'}
          </span>
          <h3 className="text-lg font-black uppercase tracking-wider text-deep-black mt-1">
            {lang === 'pt' ? 'CONSULTE O PRAZO PARA O SEU ZIP CODE' : 'CHECK DELIVERY TIME FOR YOUR ZIP CODE'}
          </h3>
        </div>

        <form onSubmit={handleCalculateZip} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              maxLength={10}
              placeholder={lang === 'pt' ? 'DIGITE SEU ZIP CODE (EX: 01453 OU 33101)' : 'ENTER ZIP CODE (E.G. 01453 OR 33101)'}
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className="w-full px-4 py-3 text-xs uppercase tracking-wider font-mono border border-deep-black/20 bg-white focus:outline-none focus:border-deep-black"
              required
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{lang === 'pt' ? 'CALCULAR' : 'CALCULATE'}</span>
          </button>
        </form>

        {shippingResult && (
          <div className="pt-4 border-t border-deep-black/10 space-y-3 animate-fadeIn">
            <h4 className="text-xs font-black uppercase tracking-wider text-deep-black">
              {lang === 'pt' ? 'OPÇÕES DISPONÍVEIS:' : 'AVAILABLE OPTIONS:'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 border-2 border-gold bg-gold/5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                  USPS STANDARD (FLAT RATE)
                </span>
                <p className="text-xl font-black text-deep-black font-mono">${shippingResult.standard.price.toFixed(2)}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-deep-black/70">
                  {lang === 'pt' ? `Entrega em ${shippingResult.standard.days} dias úteis` : `Delivery in ${shippingResult.standard.days} business days`}
                </p>
              </div>

              <div className="p-4 border border-deep-black/20 bg-white space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-deep-black/60 block">
                  USPS PRIORITY EXPRESS
                </span>
                <p className="text-xl font-black text-deep-black font-mono">${shippingResult.priority.price.toFixed(2)}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-deep-black/70">
                  {lang === 'pt' ? `Entrega em ${shippingResult.priority.days} dias úteis` : `Delivery in ${shippingResult.priority.days} business days`}
                </p>
              </div>

              <div className="p-4 border border-deep-black/20 bg-white space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-gold block">
                  PICKUP (LEOMINSTER, MA)
                </span>
                <p className="text-xl font-black text-deep-black font-mono">FREE ($0.00)</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-deep-black/70">
                  {lang === 'pt' ? 'Retirada no mesmo dia' : 'Same day showroom pickup'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prazos de Envio e Preparação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-deep-black/15 space-y-3">
          <Clock className="w-5 h-5 text-gold" />
          <h3 className="text-sm font-black uppercase tracking-wider text-deep-black">
            {t('ship.prepTitle')}
          </h3>
          <p className="text-xs text-deep-black/70 font-medium uppercase tracking-wide leading-relaxed">
            {t('ship.prepDesc')}
          </p>
        </div>

        <div className="p-6 bg-white border border-deep-black/15 space-y-3">
          <Sparkles className="w-5 h-5 text-gold" />
          <h3 className="text-sm font-black uppercase tracking-wider text-deep-black">
            {lang === 'pt' ? 'PRAZOS DE PRÉ-VENDA' : 'PRE-ORDER TIMELINE'}
          </h3>
          <p className="text-xs text-deep-black/70 font-medium uppercase tracking-wide leading-relaxed">
            {lang === 'pt'
              ? 'Modelos sob encomenda levam de 5 a 7 dias úteis para confecção antes do envio prioritário.'
              : 'Made-to-order silhouettes take 5 to 7 business days for atelier cutting and sewing before dispatch.'}
          </p>
        </div>
      </div>
    </div>
  );
}
