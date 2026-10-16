'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import {
  ShoppingBag,
  Sparkles,
  Users,
  MessageCircle,
  Package,
  FileText,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Instagram,
  Lock,
} from 'lucide-react';

// Ícone oficial SVG do Telegram
function TelegramIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

// Ícone oficial SVG do WhatsApp
function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// Consultoras Oficiais cadastradas
const OFFICIAL_SELLERS = [
  { name: 'Beatriz Figueredo', coupon: 'BEATRIZ10', city: 'Miami, FL' },
  { name: 'Camila Rocha', coupon: 'CAMILA10', city: 'Orlando, FL' },
  { name: 'Juliana Mendes', coupon: 'JULIANA10', city: 'Framingham, MA' },
  { name: 'Mariana Salles', coupon: 'MARIANA10', city: 'Boston, MA' },
];

function LinksContent() {
  const { lang, setLang } = useLanguage();
  const { siteInfo } = useStoreSettings();
  const searchParams = useSearchParams();

  const [copiedLink, setCopiedLink] = useState(false);
  const [showSellersAccordion, setShowSellersAccordion] = useState(false);

  // Detecta se o link veio com indicação de vendedora (ex: ?ref=BEATRIZ10)
  const refCode = (searchParams.get('ref') || searchParams.get('cupom') || searchParams.get('seller') || '').trim().toUpperCase();
  const matchedSeller = OFFICIAL_SELLERS.find((s) => s.coupon.toUpperCase() === refCode);

  // Links dinâmicos
  const rawWhatsApp = (siteInfo.whatsapp || '+19783139452').replace(/[^0-9]/g, '');
  const telegramTrainingUrl = (siteInfo as any).telegramUrl || 'https://t.me/+anafitness_treinamento';
  const instagramUrl = siteInfo.instagramUrl || 'https://instagram.com/anafitnessweareua';

  const handleCopyPageUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const shopUrlWithRef = refCode ? `/?ref=${refCode}` : '/';

  return (
    <div className="min-h-screen bg-[#070708] text-white flex flex-col items-center justify-between p-4 sm:p-6 selection:bg-gold selection:text-deep-black font-sans relative overflow-x-hidden">
      
      {/* Luzes de Fundo Douradas / Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-gold/15 via-gold/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-gold/5 blur-3xl pointer-events-none rounded-full" />

      {/* Barra Superior: Chaveador de Idioma & Voltar ao Site */}
      <div className="w-full max-w-md flex items-center justify-between py-2 relative z-10 text-[10px] font-black uppercase tracking-widest">
        <Link
          href="/"
          className="text-white/60 hover:text-gold transition flex items-center gap-1.5 py-1 px-2.5 bg-white/5 border border-white/10"
        >
          <span>&larr;</span>
          <span>{lang === 'pt' ? 'VER LOJA COMPLETA' : 'VISIT FULL STORE'}</span>
        </Link>

        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-0.5">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-2 py-1 transition ${
              lang === 'en' ? 'bg-gold text-deep-black font-black' : 'text-white/60 hover:text-white'
            }`}
          >
            🇺🇸 EN
          </button>
          <span className="text-white/20">|</span>
          <button
            type="button"
            onClick={() => setLang('pt')}
            className={`px-2 py-1 transition ${
              lang === 'pt' ? 'bg-gold text-deep-black font-black' : 'text-white/60 hover:text-white'
            }`}
          >
            🇧🇷 PT
          </button>
        </div>
      </div>

      {/* Conteúdo Central (Container Estilo Bio / Linktree) */}
      <div className="w-full max-w-md my-auto py-6 space-y-6 relative z-10">

        {/* 1. Header do Perfil: Avatar com Borda Dourada & Identidade */}
        <div className="text-center space-y-3">
          <div className="relative inline-block mx-auto">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-gold via-amber-200 to-gold/40 shadow-2xl shadow-gold/20 mx-auto">
              <div className="w-full h-full rounded-full bg-deep-black flex items-center justify-center overflow-hidden border border-gold/40">
                <img
                  src="/symbol-ana-fitness.png"
                  alt="ANA Fitness Wear"
                  className="w-16 h-16 object-contain drop-shadow"
                />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-gold text-deep-black p-1 rounded-full shadow-md">
              <CheckCircle2 className="w-4 h-4 fill-gold text-deep-black stroke-2" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                ANA FITNESS WEAR
              </h1>
              <span className="px-1.5 py-0.5 bg-gold/20 text-gold text-[9px] font-black border border-gold/40 tracking-widest">
                OFFICIAL
              </span>
            </div>

            <p className="text-[11px] text-gold font-bold tracking-widest uppercase">
              ✨ WEAR YOUR STRENGTH ✨
            </p>

            <p className="text-xs text-white/70 font-medium leading-relaxed max-w-xs mx-auto">
              {lang === 'pt'
                ? 'Moda Fitness Feminina de Luxo • Zero Transparência • Compressão Anatômica • Envio dos EUA (Leominster, MA)'
                : 'Luxury Activewear for Women • Zero See-Through • Sculpting Compression • US Shipping from Leominster, MA'}
            </p>
          </div>
        </div>

        {/* 2. Banner Dinâmico de Cupom / Vendedora (Se acessou com ?ref=...) */}
        {refCode && (
          <div className="p-3.5 bg-gradient-to-r from-gold/20 via-gold/10 to-transparent border-2 border-gold text-white space-y-1 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                {lang === 'pt' ? 'INDICAÇÃO DE EMBAIXADORA' : 'AMBASSADOR REFERRAL'}
              </span>
              <span className="text-[10px] font-mono font-black bg-gold text-deep-black px-2 py-0.5">
                {refCode}
              </span>
            </div>
            <p className="text-xs text-white/90 font-medium">
              {lang === 'pt'
                ? `Você está navegando com a indicação de ${matchedSeller ? matchedSeller.name : 'nossa Embaixadora Oficial'}. Seu cupom com 10% OFF já está ativo para suas compras!`
                : `You were referred by ${matchedSeller ? matchedSeller.name : 'our Official Ambassador'}. Your 10% OFF discount will be automatically applied at checkout!`}
            </p>
          </div>
        )}

        {/* 3. LISTA DE CARDS & BOTÕES DO LINKTREE */}
        <div className="space-y-3 pt-2">

          {/* =========================================================================
              CARD ESPECIAL 1: GRUPO VIP TELEGRAM • TREINAMENTO DE VENDEDORAS
             ========================================================================= */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0088cc] via-gold to-[#0088cc] rounded-xs opacity-75 group-hover:opacity-100 blur-xs transition duration-300" />
            
            <a
              href={telegramTrainingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block w-full p-4 bg-gradient-to-r from-[#0b1622] via-[#09121a] to-[#0a1017] border border-[#0088cc]/60 hover:border-gold transition-all duration-300 shadow-xl"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#0088cc] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#0088cc]/40 group-hover:scale-105 transition">
                  <TelegramIcon className="w-6 h-6" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#29b6f6] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#29b6f6] animate-ping" />
                      {lang === 'pt' ? 'EXCLUSIVO PARA VENDEDORAS' : 'FOR RESELLERS & AMBASSADORS'}
                    </span>
                    <span className="text-[9px] font-mono text-gold font-bold">VIP ACCESS</span>
                  </div>

                  <h3 className="text-sm font-black uppercase tracking-wide text-white group-hover:text-gold transition">
                    {lang === 'pt' ? 'GRUPO DE TREINAMENTO • TELEGRAM' : 'VIP TELEGRAM TRAINING GROUP'}
                  </h3>

                  <p className="text-[11px] text-white/75 font-medium leading-relaxed">
                    {lang === 'pt'
                      ? 'Aprenda como vender, receba fotos profissionais em alta resolução, dicas de moda fitness e mentoria direta com a Ana Carina.'
                      : 'Learn sales strategies, access high-res model photos, fitness styling tips and direct guidance with Ana Carina.'}
                  </p>

                  <div className="pt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0088cc] group-hover:bg-gold text-white group-hover:text-deep-black text-[10px] font-black uppercase tracking-wider transition">
                      <span>{lang === 'pt' ? 'ENTRAR NO GRUPO TELEGRAM' : 'JOIN TELEGRAM GROUP'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <a
                      href={`https://wa.me/${rawWhatsApp}?text=${encodeURIComponent(
                        lang === 'pt'
                          ? 'Olá, Ana Carina! Gostaria de receber o link oficial do Grupo de Treinamento de Vendedoras no Telegram.'
                          : 'Hello Ana Carina! I would like to receive the official invite link for the Resellers Training Telegram Group.'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-white/60 hover:text-gold underline"
                    >
                      {lang === 'pt' ? 'Pedir no WhatsApp' : 'Request via WhatsApp'}
                    </a>
                  </div>
                </div>
              </div>
            </a>
          </div>

          {/* CARD 2: COMPRAR NA LOJA ONLINE (COLEÇÃO OFICIAL) */}
          <Link
            href={shopUrlWithRef}
            className="block w-full p-4 bg-deep-black border-2 border-gold/70 hover:border-gold hover:bg-gold/10 transition-all duration-300 shadow-lg group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-gold text-deep-black flex items-center justify-center shrink-0 font-black shadow-md group-hover:scale-105 transition">
                <ShoppingBag className="w-5 h-5 text-deep-black" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white group-hover:text-gold transition">
                    {lang === 'pt' ? 'COMPRAR NA LOJA ONLINE' : 'SHOP ONLINE STORE'}
                  </h3>
                  <span className="text-[9px] font-mono font-bold text-gold">$9.99 FLAT SHIPPING</span>
                </div>
                <p className="text-[11px] text-white/60 font-medium">
                  {lang === 'pt'
                    ? 'Conjuntos e Macacões Zero Transparência • Pronta entrega para todos os EUA'
                    : 'Zero See-Through Sets & Rompers • Fast domestic delivery across the US'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gold shrink-0 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* CARD 3: PORTAL DA VENDEDORA (LOGIN & COMISSÕES) */}
          <Link
            href="/vendedora"
            className="block w-full p-3.5 bg-white/5 border border-white/20 hover:border-gold hover:bg-white/10 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 bg-white/10 text-gold flex items-center justify-center shrink-0 border border-gold/30">
                <Lock className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-white group-hover:text-gold transition">
                  {lang === 'pt' ? 'ÁREA DA VENDEDORA (LOGIN & COMISSÕES)' : 'AMBASSADOR PORTAL (LOGIN & EARNINGS)'}
                </h3>
                <p className="text-[10px] text-white/60 font-medium">
                  {lang === 'pt'
                    ? 'Acompanhe vendas em tempo real, cupons e solicite saques via Zelle'
                    : 'Track sales in real time, view coupon analytics & request payouts'}
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-gold group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* CARD 4: SEJA UMA REVENDEDORA / EMBAIXADORA */}
          <a
            href={`https://wa.me/${rawWhatsApp}?text=${encodeURIComponent(
              lang === 'pt'
                ? 'Olá, Ana Carina! Tenho interesse em ser uma Revendedora da ANA Fitness Wear, ter meu próprio cupom e participar dos treinamentos.'
                : 'Hello Ana Carina! I am interested in becoming an ANA Fitness Wear Brand Ambassador with my own promo code and training access.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full p-3.5 bg-white/5 border border-white/20 hover:border-gold hover:bg-white/10 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 bg-gold/15 text-gold flex items-center justify-center shrink-0 border border-gold/40">
                <Sparkles className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-white group-hover:text-gold transition">
                  {lang === 'pt' ? 'SEJA UMA REVENDEDORA / EMBAIXADORA' : 'BECOME A BRAND AMBASSADOR'}
                </h3>
                <p className="text-[10px] text-white/60 font-medium">
                  {lang === 'pt'
                    ? 'Receba comissões, cupons personalizados e material completo de apoio'
                    : 'Earn commissions on every sale with personalized coupon & full support'}
                </p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-gold transition" />
            </div>
          </a>

          {/* CARD 5: ACORDEÃO DE COMPRA COM CONSULTORAS OFICIAIS */}
          <div className="border border-white/15 bg-white/5 transition">
            <button
              type="button"
              onClick={() => setShowSellersAccordion(!showSellersAccordion)}
              className="w-full p-3.5 flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 bg-white/10 text-gold flex items-center justify-center shrink-0 border border-white/20">
                  <Users className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white group-hover:text-gold transition">
                    {lang === 'pt' ? 'COMPRAR COM UMA CONSULTORA OFICIAL' : 'SHOP WITH AN OFFICIAL AMBASSADOR'}
                  </h3>
                  <p className="text-[10px] text-white/60 font-medium">
                    {lang === 'pt' ? 'Escolha sua consultora e ative 10% OFF' : 'Pick your consultant and unlock 10% OFF'}
                  </p>
                </div>
              </div>
              {showSellersAccordion ? (
                <ChevronUp className="w-4 h-4 text-gold shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/60 shrink-0" />
              )}
            </button>

            {showSellersAccordion && (
              <div className="border-t border-white/10 p-3 space-y-2 bg-deep-black/60 animate-fadeIn">
                <p className="text-[10px] text-gold font-bold uppercase tracking-wider">
                  {lang === 'pt' ? 'Selecione abaixo para ativar o cupom na loja:' : 'Select below to activate coupon:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OFFICIAL_SELLERS.map((seller) => (
                    <Link
                      key={seller.coupon}
                      href={`/?ref=${seller.coupon}`}
                      className="p-2.5 bg-white/5 border border-white/15 hover:border-gold hover:bg-gold/10 transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-[11px] font-black uppercase text-white group-hover:text-gold">
                          {seller.name}
                        </div>
                        <div className="text-[9px] text-white/50 uppercase">
                          {seller.city} &bull; Cupom: <strong className="text-gold font-mono">{seller.coupon}</strong>
                        </div>
                      </div>
                      <span className="text-[9px] font-black bg-gold text-deep-black px-1.5 py-0.5 uppercase shrink-0">
                        10% OFF
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CARD 6: FALAR COM A ANA CARINA NO WHATSAPP */}
          <a
            href={`https://wa.me/${rawWhatsApp}?text=${encodeURIComponent(
              lang === 'pt'
                ? 'Olá, Ana Carina! Acessei o link da bio e gostaria de tirar uma dúvida sobre os modelos da ANA Fitness Wear.'
                : 'Hello Ana Carina! I found your bio link and would like to ask a question about ANA Fitness Wear.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full p-3.5 bg-[#25D366]/10 border border-[#25D366]/50 hover:bg-[#25D366]/20 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#25D366] text-deep-black flex items-center justify-center shrink-0 shadow-sm">
                <WhatsAppIcon className="w-5 h-5 text-deep-black" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-white group-hover:text-[#25D366] transition">
                  {lang === 'pt' ? 'FALAR COM A ANA CARINA NO WHATSAPP' : 'CHAT WITH ANA CARINA ON WHATSAPP'}
                </h3>
                <p className="text-[10px] text-white/60 font-medium">
                  {lang === 'pt'
                    ? 'Atendimento personalizado, dúvidas sobre tamanhos e encomendas'
                    : 'Personal concierge, sizing recommendations & custom orders'}
                </p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#25D366] group-hover:translate-x-0.5 transition" />
            </div>
          </a>

          {/* CARD 7: RASTREAR MEU PEDIDO (USPS) */}
          <Link
            href="/pedidos"
            className="block w-full p-3.5 bg-white/5 border border-white/20 hover:border-gold hover:bg-white/10 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 bg-white/10 text-gold flex items-center justify-center shrink-0 border border-white/20">
                <Package className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-white group-hover:text-gold transition">
                  {lang === 'pt' ? 'RASTREAR MEU PEDIDO NOS CORREIOS (USPS)' : 'TRACK MY USPS PACKAGE'}
                </h3>
                <p className="text-[10px] text-white/60 font-medium">
                  {lang === 'pt'
                    ? 'Consulte a localização e entrega do seu pacote em tempo real'
                    : 'Real-time tracking status with your order number or USPS code'}
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-gold group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* CARD 8: VER CATÁLOGO EM PDF COMPLETO */}
          <Link
            href="/backoffice/catalogo-pdf"
            className="block w-full p-3.5 bg-white/5 border border-white/20 hover:border-gold hover:bg-white/10 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 bg-white/10 text-gold flex items-center justify-center shrink-0 border border-white/20">
                <FileText className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-white group-hover:text-gold transition">
                  {lang === 'pt' ? 'BAIXAR CATÁLOGO DIGITAL EM PDF' : 'DIGITAL LOOKBOOK & CATALOG (PDF)'}
                </h3>
                <p className="text-[10px] text-white/60 font-medium">
                  {lang === 'pt'
                    ? 'Confira todos os modelos, fotos reais e detalhes técnicos em alta definição'
                    : 'Download complete photo lookbook with high-res details'}
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-gold group-hover:translate-x-1 transition" />
            </div>
          </Link>

        </div>

        {/* 4. Barra de Redes Sociais & Compartilhar Link */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-center gap-3">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/80 hover:text-gold hover:border-gold hover:bg-gold/10 transition"
              title="Instagram Oficial"
            >
              <Instagram className="w-4 h-4" />
            </a>

            <a
              href={`https://wa.me/${rawWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/80 hover:text-[#25D366] hover:border-[#25D366] hover:bg-[#25D366]/10 transition"
              title="WhatsApp Oficial"
            >
              <WhatsAppIcon className="w-4 h-4" />
            </a>

            <a
              href={telegramTrainingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/80 hover:text-[#0088cc] hover:border-[#0088cc] hover:bg-[#0088cc]/10 transition"
              title="Telegram VIP Vendedoras"
            >
              <TelegramIcon className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={handleCopyPageUrl}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/80 hover:text-gold hover:border-gold hover:bg-gold/10 transition"
              title={lang === 'pt' ? 'Copiar link da página' : 'Copy page link'}
            >
              {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>

          {copiedLink && (
            <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider text-center animate-fadeIn">
              ✓ {lang === 'pt' ? 'Link da página copiado para a área de transferência!' : 'Page link copied to clipboard!'}
            </p>
          )}
        </div>

        {/* 5. Rodapé Institucional */}
        <div className="pt-6 border-t border-white/10 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/50 uppercase tracking-widest font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            <span>LEOMINSTER, MASSACHUSETTS &bull; USA</span>
          </div>

          <p className="text-[10px] text-white/40 uppercase tracking-wider">
            &copy; {new Date().getFullYear()} ANA FITNESS WEAR LLC &bull; ALL RIGHTS RESERVED
          </p>

          <div className="pt-1">
            <Link
              href="/"
              className="text-[10px] font-black uppercase tracking-widest text-gold hover:underline inline-flex items-center gap-1"
            >
              <span>{lang === 'pt' ? 'VISITAR LOJA COMPLETA' : 'EXPLORE OFFICIAL STORE'}</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function LinksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070708] text-white flex items-center justify-center p-6 text-xs font-mono uppercase tracking-widest text-gold">
        CARREGANDO ANA FITNESS WEAR LINKS...
      </div>
    }>
      <LinksContent />
    </Suspense>
  );
}
