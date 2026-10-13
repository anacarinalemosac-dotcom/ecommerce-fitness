'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import {
  ShoppingBag,
  Sparkles,
  Globe,
  Search,
  Package,
  Menu,
  X,
  ChevronRight,
  User,
} from 'lucide-react';

export function SiteHeader() {
  const { lang, setLang, t } = useLanguage();
  const { siteInfo, siteImages } = useStoreSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [customerUser, setCustomerUser] = useState<any | null>(null);

  const updateCartAndUser = () => {
    try {
      const savedCart = localStorage.getItem('ana_cart_item');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCartCount(Number(parsed.quantity) || 1);
      } else {
        setCartCount(0);
      }

      const savedCust = localStorage.getItem('ana_customer_session');
      if (savedCust) {
        setCustomerUser(JSON.parse(savedCust));
      } else {
        setCustomerUser(null);
      }
    } catch (e) {
      setCartCount(0);
      setCustomerUser(null);
    }
  };

  useEffect(() => {
    updateCartAndUser();
    window.addEventListener('ana_cart_updated', updateCartAndUser);
    window.addEventListener('ana_customer_updated', updateCartAndUser);
    window.addEventListener('storage', updateCartAndUser);
    return () => {
      window.removeEventListener('ana_cart_updated', updateCartAndUser);
      window.removeEventListener('ana_customer_updated', updateCartAndUser);
      window.removeEventListener('storage', updateCartAndUser);
    };
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Ticker Superior de Luxo (Preto e Dourado) */}
      <div className="bg-deep-black text-white text-[11px] font-bold tracking-widest uppercase py-2 px-4 border-b border-gold/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Slogan & Frete Fixo Dinâmico */}
          <div className="flex items-center gap-4 text-center sm:text-left flex-wrap justify-center">
            <span className="flex items-center gap-1.5 text-gold font-black">
              <Sparkles className="w-3.5 h-3.5 text-gold" /> {siteInfo.tickerSlogan || t('ticker.slogan')}
            </span>
            <span className="hidden md:inline text-white/30">•</span>
            <span className="text-white/90 font-medium">
              {siteInfo.tickerShipping || t('ticker.shipping')}
            </span>
            <span className="hidden lg:inline text-white/30">•</span>
            <span className="hidden lg:inline text-gold font-black">
              {t('ticker.delivery')}
            </span>
          </div>

          {/* Chaveador de Idioma: Inglês (Principal) / Português */}
          <div className="flex items-center gap-1 shrink-0 bg-white/10 px-2 py-0.5 border border-gold/30">
            <Globe className="w-3 h-3 text-gold mr-1" />
            <button
              onClick={() => setLang('en')}
              className={`px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider transition ${
                lang === 'en'
                  ? 'bg-gold text-deep-black shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
              title="Switch language to English (US)"
            >
              🇺🇸 EN
            </button>
            <span className="text-white/30 text-[9px]">|</span>
            <button
              onClick={() => setLang('pt')}
              className={`px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider transition ${
                lang === 'pt'
                  ? 'bg-gold text-deep-black shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
              title="Mudar idioma para Português"
            >
              🇧🇷 PT
            </button>
          </div>
        </div>
      </div>

      {/* Header Fixo/Colado no Topo (100% focado no cliente final) */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-deep-black/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between">
          {/* Botão de Menu Hambúrguer Mobile (Topo à Esquerda) */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-2 text-deep-black hover:text-gold transition focus:outline-none"
              aria-label="Abrir menu de navegação"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo Oficial ANA FITNESS WEAR */}
          <Link href="/" onClick={closeMobileMenu} className="group flex items-center gap-3">
            <img
              src={siteImages.logoUrl || '/logo-ana-fitness.png'}
              alt={siteInfo.storeName || 'ANA FITNESS WEAR'}
              className="h-12 sm:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Menu de Categorias Desktop em Caixa Alta */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-black tracking-widest uppercase">
            <Link
              href="/?cat=all"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('ana_filter_category', { detail: 'all' }));
                }
              }}
              className="text-deep-black hover:text-gold transition py-1 border-b-2 border-transparent hover:border-deep-black"
            >
              {t('nav.new')}
            </Link>
            <Link
              href="/?cat=sets"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('ana_filter_category', { detail: 'sets' }));
                }
              }}
              className="text-deep-black hover:text-gold transition py-1 border-b-2 border-transparent hover:border-deep-black"
            >
              {t('nav.sets')}
            </Link>
            <Link
              href="/?cat=jumpsuits"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('ana_filter_category', { detail: 'jumpsuits' }));
                }
              }}
              className="text-deep-black hover:text-gold transition py-1 border-b-2 border-transparent hover:border-deep-black"
            >
              {t('nav.jumpsuits')}
            </Link>
            <Link
              href="/?cat=rompers"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('ana_filter_category', { detail: 'rompers' }));
                }
              }}
              className="text-deep-black hover:text-gold transition py-1 border-b-2 border-transparent hover:border-deep-black"
            >
              {t('nav.rompers')}
            </Link>
            <Link
              href="/?cat=tops"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('ana_filter_category', { detail: 'tops' }));
                }
              }}
              className="text-deep-black hover:text-gold transition py-1 border-b-2 border-transparent hover:border-deep-black"
            >
              {t('nav.tops')}
            </Link>
            <Link
              href="/?cat=preorder"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('ana_filter_category', { detail: 'preorder' }));
                }
              }}
              className="text-gold font-black hover:text-deep-black transition py-1 border-b-2 border-transparent hover:border-gold flex items-center gap-1.5"
            >
              <span>{t('nav.preorder')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-ping"></span>
            </Link>
          </nav>

          {/* Ações do Cliente: Meus Pedidos, Pesquisa e Sacola */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => {
                const el = document.getElementById('vitrine');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-2 text-deep-black hover:text-gold transition hidden sm:flex items-center"
              title="Search Catalog"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Minha Conta / Login do Cliente */}
            <Link
              href="/conta"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-white text-deep-black border border-deep-black/30 hover:border-gold hover:text-gold transition"
              title="Minha Conta / Customer Portal"
            >
              <User className="w-3.5 h-3.5 text-gold" />
              <span className="hidden md:inline">
                {customerUser
                  ? `OLÁ, ${(customerUser.name || 'CLIENTE').split(' ')[0].toUpperCase()}`
                  : (lang === 'pt' ? 'MINHA CONTA' : 'MY ACCOUNT')}
              </span>
            </Link>

            {/* Rastrear Pedido (USPS) */}
            <Link
              href="/pedidos"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-white text-deep-black border border-deep-black/30 hover:border-gold hover:text-gold transition hidden sm:flex"
              title="Track Order / Rastrear Pedidos"
            >
              <Package className="w-3.5 h-3.5 text-gold" />
              <span>{lang === 'pt' ? 'RASTREAR' : 'TRACK'}</span>
            </Link>

            {/* Sacola de Compras */}
            <Link
              href="/checkout"
              className="relative p-2.5 bg-deep-black text-white hover:bg-gold hover:text-deep-black transition shadow-sm"
              aria-label="Shopping Bag"
              title="Sacola de Compras"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-deep-black text-[9px] font-black flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Menu Dropdown Mobile no Topo (Aberto pelo Hambúrguer) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-deep-black/10 bg-white/98 backdrop-blur-md px-6 py-6 space-y-4 shadow-luxury animate-fadeIn">
            <nav className="flex flex-col space-y-3 text-xs font-black tracking-widest uppercase">
              <Link
                href="/?cat=all"
                onClick={() => {
                  closeMobileMenu();
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('ana_filter_category', { detail: 'all' }));
                  }
                }}
                className="flex items-center justify-between py-2 border-b border-deep-black/5 hover:text-gold transition text-deep-black"
              >
                <span>{t('nav.new')}</span>
                <ChevronRight className="w-4 h-4 text-gold" />
              </Link>
              <Link
                href="/?cat=sets"
                onClick={() => {
                  closeMobileMenu();
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('ana_filter_category', { detail: 'sets' }));
                  }
                }}
                className="flex items-center justify-between py-2 border-b border-deep-black/5 hover:text-gold transition text-deep-black"
              >
                <span>{t('nav.sets')}</span>
                <ChevronRight className="w-4 h-4 text-gold" />
              </Link>
              <Link
                href="/?cat=jumpsuits"
                onClick={() => {
                  closeMobileMenu();
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('ana_filter_category', { detail: 'jumpsuits' }));
                  }
                }}
                className="flex items-center justify-between py-2 border-b border-deep-black/5 hover:text-gold transition text-deep-black"
              >
                <span>{t('nav.jumpsuits')}</span>
                <ChevronRight className="w-4 h-4 text-gold" />
              </Link>
              <Link
                href="/?cat=rompers"
                onClick={() => {
                  closeMobileMenu();
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('ana_filter_category', { detail: 'rompers' }));
                  }
                }}
                className="flex items-center justify-between py-2 border-b border-deep-black/5 hover:text-gold transition text-deep-black"
              >
                <span>{t('nav.rompers')}</span>
                <ChevronRight className="w-4 h-4 text-gold" />
              </Link>
              <Link
                href="/?cat=tops"
                onClick={() => {
                  closeMobileMenu();
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('ana_filter_category', { detail: 'tops' }));
                  }
                }}
                className="flex items-center justify-between py-2 border-b border-deep-black/5 hover:text-gold transition text-deep-black"
              >
                <span>{t('nav.tops')}</span>
                <ChevronRight className="w-4 h-4 text-gold" />
              </Link>
              <Link
                href="/?cat=preorder"
                onClick={() => {
                  closeMobileMenu();
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('ana_filter_category', { detail: 'preorder' }));
                  }
                }}
                className="flex items-center justify-between py-2 border-b border-deep-black/5 text-gold font-black transition"
              >
                <span className="flex items-center gap-2">
                  <span>{t('nav.preorder')}</span>
                  <span className="w-2 h-2 rounded-full bg-gold animate-ping"></span>
                </span>
                <ChevronRight className="w-4 h-4 text-gold" />
              </Link>
              <Link
                href="/conta"
                onClick={closeMobileMenu}
                className="flex items-center justify-between py-2 border-b border-deep-black/5 hover:text-gold transition text-deep-black"
              >
                <span className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gold" />
                  <span>
                    {customerUser
                      ? `${lang === 'pt' ? 'MINHA CONTA' : 'MY ACCOUNT'} (${customerUser.name?.split(' ')[0]})`
                      : (lang === 'pt' ? 'MINHA CONTA / ENTRAR' : 'MY ACCOUNT / SIGN IN')}
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-gold" />
              </Link>
              <Link
                href="/pedidos"
                onClick={closeMobileMenu}
                className="flex items-center justify-between py-2 border-b border-deep-black/5 hover:text-gold transition text-deep-black"
              >
                <span className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-gold" />
                  <span>{lang === 'pt' ? 'RASTREAR MEU PEDIDO (USPS)' : 'TRACK MY ORDER (USPS)'}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gold" />
              </Link>
            </nav>

            {/* Chaveador de Idioma no Menu Mobile */}
            <div className="pt-2 flex items-center justify-between text-[10px] font-black uppercase text-deep-black/60">
              <span>{lang === 'pt' ? 'IDIOMA DA LOJA:' : 'STORE LANGUAGE:'}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-3 py-1.5 ${lang === 'en' ? 'bg-deep-black text-gold' : 'bg-gray-100 text-deep-black'}`}
                >
                  🇺🇸 ENGLISH
                </button>
                <button
                  type="button"
                  onClick={() => setLang('pt')}
                  className={`px-3 py-1.5 ${lang === 'pt' ? 'bg-deep-black text-gold' : 'bg-gray-100 text-deep-black'}`}
                >
                  🇧🇷 PORTUGUÊS
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
