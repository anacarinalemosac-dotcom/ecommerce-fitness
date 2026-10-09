'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { ArrowRight, MapPin, Phone, Instagram, ShieldCheck, DollarSign } from 'lucide-react';

export function SiteFooter() {
  const { lang, t } = useLanguage();
  const { siteInfo, siteImages } = useStoreSettings();

  return (
    <footer className="bg-deep-black text-white border-t border-gold/20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
        {/* Newsletter VIP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-white/10 pb-12">
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-2">
              <img src="/symbol-ana-fitness.png" alt="Emblema Ana Fitness" className="w-8 h-8 object-contain" />
              <span className="text-[10px] font-black tracking-widest text-gold uppercase">
                {t('footer.vipTitle')}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
              {lang === 'pt' ? 'RECEBA OS NOVOS DROPS ANTES DE TODOS' : 'GET ACCESS TO NEW DROPS FIRST'}
            </h3>
            <p className="text-xs text-white/60 max-w-md uppercase tracking-wider">
              {t('footer.vipDesc')}
            </p>
          </div>

          <div className="lg:col-span-6">
            <form onSubmit={(e) => { e.preventDefault(); alert(lang === 'pt' ? 'Obrigado por se inscrever!' : 'Thank you for subscribing!'); }} className="flex flex-col sm:flex-row gap-2 max-w-md lg:ml-auto">
              <input
                type="email"
                placeholder={t('footer.emailPlaceholder')}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/20 text-white text-xs placeholder:text-white/40 uppercase tracking-wider focus:outline-none focus:border-gold rounded-none"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gold hover:bg-gold/90 text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
              >
                <span>{t('footer.subscribe')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Links Institucionais, Contato e Pagamentos */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-xs">
          {/* Coluna 1: Marca & Endereço Real */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <img
              src={siteImages.logoUrl || '/logo-ana-fitness.png'}
              alt={siteInfo.storeName || 'ANA FITNESS WEAR'}
              className="h-12 w-auto object-contain"
            />
            <p className="text-[11px] text-white/60 uppercase tracking-wider leading-relaxed">
              {t('footer.about')}
            </p>
            <div className="space-y-1.5 text-[10px] text-white/70 uppercase tracking-wider font-bold">
              <div className="flex items-center gap-1.5 text-gold">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{siteInfo.address || 'Leominster, MA 01453 • USA'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>{siteInfo.phone || '+1 (978) 313-9452'}</span>
              </div>
              <a
                href={siteInfo.instagramUrl || 'https://www.instagram.com/anafitnessweareua'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-gold transition"
              >
                <Instagram className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>{siteInfo.instagram || '@anafitnessweareua'}</span>
              </a>
            </div>
          </div>

          {/* Coluna 2: Coleções */}
          <div className="space-y-4">
            <h4 className="font-black uppercase tracking-widest text-gold text-xs">
              {lang === 'pt' ? 'COLEÇÕES' : 'COLLECTIONS'}
            </h4>
            <ul className="space-y-2.5 uppercase tracking-wider text-white/70 font-medium text-[11px]">
              <li><Link href="/#vitrine" className="hover:text-gold transition">{t('nav.rompers')}</Link></li>
              <li><Link href="/#vitrine" className="hover:text-gold transition">{t('nav.sets')}</Link></li>
              <li><Link href="/#vitrine" className="hover:text-gold transition">{t('nav.jumpsuits')}</Link></li>
              <li><Link href="/#vitrine" className="hover:text-gold transition">{t('nav.tops')}</Link></li>
              <li><Link href="/#vitrine" className="hover:text-gold transition text-gold font-bold">{t('nav.preorder')}</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Institucional & Políticas Reais */}
          <div className="space-y-4">
            <h4 className="font-black uppercase tracking-widest text-gold text-xs">
              {lang === 'pt' ? 'INSTITUCIONAL' : 'STORE INFO'}
            </h4>
            <ul className="space-y-2.5 uppercase tracking-wider text-white/70 font-medium text-[11px]">
              <li><Link href="/pedidos" className="hover:text-gold transition text-gold font-bold">{lang === 'pt' ? 'Rastrear Meu Pedido (USPS)' : 'Track My Order (USPS)'}</Link></li>
              <li><Link href="/contato" className="hover:text-gold transition">{t('nav.contact')}</Link></li>
              <li><Link href="/trocas-e-devolucoes" className="hover:text-gold transition">{lang === 'pt' ? 'Trocas e Devoluções (30 Dias)' : '30-Day Returns'}</Link></li>
              <li><Link href="/politica-de-envio" className="hover:text-gold transition">{lang === 'pt' ? 'Frete Fixo $9.99 (EUA)' : 'Flat Rate Shipping $9.99'}</Link></li>
              <li><a href="https://www.anafitwear.com" target="_blank" rel="noreferrer" className="hover:text-gold transition">Site Oficial: anafitwear.com</a></li>
            </ul>
          </div>

          {/* Coluna 4: Sistema Omnichannel */}
          <div className="space-y-4">
            <h4 className="font-black uppercase tracking-widest text-gold text-xs">
              {lang === 'pt' ? 'SISTEMA & PDV' : 'POS & ERP'}
            </h4>
            <ul className="space-y-2.5 uppercase tracking-wider text-white/70 font-medium text-[11px]">
              <li><Link href="/vendedora" className="hover:text-gold transition text-gold font-bold">{lang === 'pt' ? 'Portal da Vendedora (Login)' : 'Seller / Affiliate Login'}</Link></li>
              <li><Link href="/pos" className="hover:text-gold transition">{t('nav.pos')}</Link></li>
              <li><Link href="/backoffice?tab=sales" className="hover:text-gold transition font-bold text-gold">{lang === 'pt' ? '📦 Pedidos dos Clientes & ERP' : '📦 Customer Orders & ERP'}</Link></li>
              <li><span className="text-white/40">Moeda: USD ($) Only</span></li>
              <li><span className="text-white/40">USPS Tracking: Ativo</span></li>
            </ul>
          </div>

          {/* Coluna 5: Formas de Pagamento dos EUA */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <h4 className="font-black uppercase tracking-widest text-gold text-xs">
              {lang === 'pt' ? 'PAGAMENTOS ACEITOS' : 'PAYMENT METHODS'}
            </h4>
            <p className="text-[11px] text-white/60 leading-relaxed uppercase tracking-wider">
              {lang === 'pt'
                ? 'Pagamentos oficiais via Zelle, Venmo, Cartão de Crédito e Débito.'
                : 'Official payments via Zelle, Venmo, Credit and Debit Cards.'}
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase text-white/90">
              <span className="px-2.5 py-1 bg-white/10 border border-white/20 font-bold">APPLE PAY</span>
              <span className="px-2.5 py-1 bg-white/10 border border-gold/40 text-gold font-mono">ZELLE</span>
              <span className="px-2.5 py-1 bg-white/10 border border-gold/40 text-gold font-mono">VENMO</span>
              <span className="px-2 py-1 bg-white/10 border border-white/20">VISA</span>
              <span className="px-2 py-1 bg-white/10 border border-white/20">MASTERCARD</span>
              <span className="px-2 py-1 bg-white/10 border border-white/20">AMEX</span>
              <span className="px-2 py-1 bg-white/10 border border-white/20">DISCOVER</span>
            </div>
            <div className="pt-2 text-[10px] text-gold font-black uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-gold" />
              <span>TODOS OS PREÇOS EM DÓLAR (USD)</span>
            </div>
          </div>
        </div>

        {/* Rodapé - Seção Interna / Colaboradores */}
        <div className="pt-8 mt-8 border-t border-neutral-800 text-xs text-neutral-400 flex flex-wrap gap-4 items-center justify-between">
          <p>© {new Date().getFullYear()} Ana Fitness Wear LLC • Leominster, MA. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 text-[11px]">
            <Link href="/backoffice?tab=sales" className="text-gold font-black hover:text-white transition-colors">📦 Pedidos dos Clientes (ERP)</Link>
            <Link href="/admin" className="hover:text-gold transition-colors">Personalizar Loja</Link>
            <Link href="/pos" className="hover:text-gold transition-colors">PDV Balcão</Link>
            <Link href="/vendedora" className="hover:text-gold transition-colors">Portal da Vendedora</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
