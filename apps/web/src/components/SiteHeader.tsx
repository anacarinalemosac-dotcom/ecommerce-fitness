'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { ShoppingBag, Tablet, LayoutDashboard, Sparkles, Globe, Search, Heart, ShieldAlert } from 'lucide-react';

export function SiteHeader() {
  const { lang, setLang, t } = useLanguage();
  const { siteInfo, siteImages, adminUser } = useStoreSettings();

  return (
    <>
      {/* Barra de Notificação quando Administrador está conectado */}
      {adminUser.isLoggedIn && (
        <div className="bg-gold text-deep-black text-[10px] font-black tracking-widest uppercase py-1.5 px-4 flex items-center justify-between border-b border-deep-black/20 shadow-sm">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-deep-black animate-pulse" />
            <span>👑 PERFIL ADMINISTRADOR MASTER ATIVO ({adminUser.name.toUpperCase()})</span>
          </span>
          <Link href="/admin" className="underline hover:text-white font-black flex items-center gap-1">
            <span>GERENCIAR PRODUTOS & SITE</span>
            <span>→</span>
          </Link>
        </div>
      )}

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

      {/* Header Principal com Logotipo Oficial em Dourado Metalizado */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-deep-black/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-24 flex items-center justify-between">
          {/* Logo Oficial ANA FITNESS WEAR Dinâmico */}
          <Link href="/" className="group flex items-center gap-3">
            <img
              src={siteImages.logoUrl || '/logo-ana-fitness.png'}
              alt={siteInfo.storeName || 'ANA FITNESS WEAR'}
              className="h-14 sm:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Menu de Categorias em Caixa Alta (Estilo Gymshark) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-black tracking-widest uppercase">
            <Link
              href="/#vitrine"
              className="text-deep-black hover:text-gold transition py-1 border-b-2 border-transparent hover:border-deep-black"
            >
              {t('nav.new')}
            </Link>
            <Link
              href="/#vitrine"
              className="text-deep-black hover:text-gold transition py-1 border-b-2 border-transparent hover:border-deep-black"
            >
              {t('nav.sets')}
            </Link>
            <Link
              href="/#vitrine"
              className="text-deep-black hover:text-gold transition py-1 border-b-2 border-transparent hover:border-deep-black"
            >
              {t('nav.jumpsuits')}
            </Link>
            <Link
              href="/#vitrine"
              className="text-deep-black hover:text-gold transition py-1 border-b-2 border-transparent hover:border-deep-black"
            >
              {t('nav.rompers')}
            </Link>
            <Link
              href="/#vitrine"
              className="text-deep-black hover:text-gold transition py-1 border-b-2 border-transparent hover:border-deep-black"
            >
              {t('nav.tops')}
            </Link>
            <Link
              href="/#vitrine"
              className="text-gold font-black hover:text-deep-black transition py-1 border-b-2 border-transparent hover:border-gold flex items-center gap-1.5"
            >
              <span>{t('nav.preorder')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-ping"></span>
            </Link>
          </nav>

          {/* Ações Rápidas: Pesquisa, ADMIN, PDV, ERP e Sacola */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Chaveador compacto mobile */}
            <div className="flex lg:hidden items-center border border-deep-black/20 text-[9px] font-black">
              <button
                onClick={() => setLang('en')}
                className={`px-1.5 py-1 ${lang === 'en' ? 'bg-deep-black text-gold' : 'text-deep-black'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('pt')}
                className={`px-1.5 py-1 ${lang === 'pt' ? 'bg-deep-black text-gold' : 'text-deep-black'}`}
              >
                PT
              </button>
            </div>

            <Link
              href="/#vitrine"
              className="p-2 text-deep-black hover:text-gold transition hidden sm:flex items-center"
              title="Search Catalog"
            >
              <Search className="w-4 h-4" />
            </Link>

            <Link
              href="/#vitrine"
              className="p-2 text-deep-black hover:text-gold transition hidden sm:flex items-center"
              title="Wishlist"
            >
              <Heart className="w-4 h-4" />
            </Link>

            {/* BOTÃO DEDICADO DO PORTAL ADMINISTRADOR DE ANA */}
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition border ${
                adminUser.isLoggedIn
                  ? 'bg-gold text-deep-black border-gold shadow-sm hover:bg-deep-black hover:text-gold'
                  : 'bg-white text-deep-black border-deep-black hover:bg-gold hover:text-deep-black'
              }`}
              title="Portal Administrador (Cadastrar Produtos, Editar Imagens e Informações)"
            >
              <span>👑 ADMIN</span>
            </Link>

            <Link
              href="/pos"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-white text-deep-black border border-deep-black hover:bg-deep-black hover:text-gold transition"
              title="Acesso Rápido ao Terminal de Vendas Balcão"
            >
              <Tablet className="w-3.5 h-3.5 text-gold" />
              <span>{t('nav.pos')}</span>
            </Link>

            <Link
              href="/backoffice"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-deep-black text-white hover:bg-gold hover:text-deep-black transition"
              title="Painel Financeiro"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{t('nav.erp')}</span>
            </Link>

            <Link
              href="/checkout"
              className="relative p-2.5 bg-deep-black text-white hover:bg-gold hover:text-deep-black transition shadow-sm"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-deep-black text-[9px] font-black flex items-center justify-center">
                1
              </span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
