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
  ChevronRight,
  ArrowDown,
  Download,
  Mail,
  Instagram,
  Lock,
  Calendar,
} from 'lucide-react';

// Ícone SVG oficial do Telegram
function TelegramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

// Ícone SVG oficial do WhatsApp
function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// Ícone SVG oficial do TikTok
function TikTokIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.16 1.18 2.09 2.35 2.3 1.05.2 2.16-.08 2.94-.78.59-.53.94-1.28 1-2.07.03-3.09.02-6.18.02-9.28V.02h.04z" />
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
  const { siteInfo, siteImages } = useStoreSettings();
  const searchParams = useSearchParams();

  const [copiedLink, setCopiedLink] = useState(false);
  const [showConsultantsModal, setShowConsultantsModal] = useState(false);

  // Detecta se o link veio com indicação de vendedora (ex: ?ref=BEATRIZ10)
  const refCode = (searchParams.get('ref') || searchParams.get('cupom') || searchParams.get('seller') || '').trim().toUpperCase();
  const matchedSeller = OFFICIAL_SELLERS.find((s) => s.coupon.toUpperCase() === refCode);

  // Links dinâmicos da loja
  const rawWhatsApp = (siteInfo.whatsapp || '+19783139452').replace(/[^0-9]/g, '');
  const telegramTrainingUrl = (siteInfo as any).telegramUrl || 'https://t.me/+anafitness_treinamento';
  const instagramUrl = siteInfo.instagramUrl || 'https://www.instagram.com/anafitnessweareua';
  const emailContact = 'anafitweareua@gmail.com';

  const handleCopyPageUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const shopUrlWithRef = refCode ? `/?ref=${refCode}` : '/';

  return (
    <div className="min-h-screen bg-[#070504] text-[#f4efe8] flex flex-col items-center justify-between p-4 sm:p-8 font-sans relative overflow-x-hidden selection:bg-[#d4af37] selection:text-black">
      
      {/* =========================================================================
          BACKGROUND DE ALTO LUXO: ARCOS DOURADOS CONCÊNTRICOS & ILUMINAÇÃO SUAVE
         ========================================================================= */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] pointer-events-none -z-0">
        {/* Glow central quente */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full bg-gradient-to-b from-[#b8860b]/25 via-[#8b6508]/15 to-transparent blur-3xl" />
        
        {/* Arcos concêntricos dourados de alto luxo (idênticos à referência) */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full border border-[#d4af37]/20 shadow-[0_0_50px_rgba(212,175,55,0.08)]" />
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[460px] h-[460px] rounded-full border border-[#d4af37]/15" />
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full border border-[#d4af37]/10" />
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[740px] h-[740px] rounded-full border border-[#d4af37]/5" />
      </div>

      {/* Luz ambiente de rodapé */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-t from-[#b8860b]/10 to-transparent blur-3xl pointer-events-none -z-0" />

      {/* Barra Superior Discreta: Chaveador de Idioma & Link para a Loja */}
      <div className="w-full max-w-md flex items-center justify-between py-2 relative z-10 text-[9.5px] uppercase tracking-[0.2em] font-medium text-white/50">
        <Link
          href="/"
          className="hover:text-[#d4af37] transition flex items-center gap-1.5 py-1 px-3 rounded-full bg-white/[0.04] border border-[#d4af37]/20 backdrop-blur-xs"
        >
          <span>&larr;</span>
          <span>{lang === 'pt' ? 'LOJA COMPLETA' : 'FULL STORE'}</span>
        </Link>

        <div className="flex items-center gap-1 bg-white/[0.04] border border-[#d4af37]/20 rounded-full px-2 py-0.5 backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-2 py-0.5 rounded-full transition ${
              lang === 'en' ? 'bg-[#d4af37] text-black font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            EN
          </button>
          <span className="text-white/20">|</span>
          <button
            type="button"
            onClick={() => setLang('pt')}
            className={`px-2 py-0.5 rounded-full transition ${
              lang === 'pt' ? 'bg-[#d4af37] text-black font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            PT
          </button>
        </div>
      </div>

      {/* Container Principal Mobile (Max 440px - Proporção de Tela de Celular) */}
      <div className="w-full max-w-md my-auto py-4 space-y-6 relative z-10">

        {/* =======================================================================
            1. CABEÇALHO DO PERFIL: FOTO CIRCULAR COM ARO DOURADO & TIPOGRAFIA SERIF
           ======================================================================= */}
        <div className="text-center space-y-3 pt-2">
          
          {/* Emblema / Logomarca Oficial com Borda Dourada Metálica e Glow Suave */}
          <div className="relative inline-block mx-auto">
            <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full p-[2px] bg-gradient-to-b from-[#e5c158] via-[#b8860b] to-[#6d4c06] shadow-[0_0_35px_rgba(212,175,55,0.4)] mx-auto">
              <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-[#18120c] to-[#0a0705] relative flex items-center justify-center p-3 sm:p-4">
                <img
                  src={siteImages.symbolUrl || '/symbol-ana-fitness.png'}
                  alt={siteInfo.storeName || 'ANA FITNESS WEAR'}
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(212,175,55,0.45)] transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    (e.target as any).src = '/logo-ana-fitness.png';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Nome da Marca Oficial */}
          <div className="space-y-1 pt-1">
            <h1 
              className="text-2xl sm:text-3xl font-bold tracking-[0.12em] text-[#fbf8f3] uppercase"
              style={{ fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif" }}
            >
              {siteInfo.storeName || 'ANA FITNESS WEAR'}
            </h1>

            <p className="text-[10px] sm:text-[11px] font-medium tracking-[0.25em] uppercase text-[#c9b292]">
              {lang === 'pt' ? 'MODA FITNESS PREMIUM • ESTILO BRASILEIRO NOS EUA' : 'LUXURY ACTIVEWEAR • BRAZILIAN FIT IN THE USA'}
            </p>
          </div>

          {/* Diamante ✦ Separador Clássico */}
          <div className="text-[#d4af37] text-xs opacity-80 pt-0.5">
            ✦
          </div>

          {/* Bio Refinada (Idêntica ao estilo da referência) */}
          <p className="text-xs sm:text-[13px] text-[#e0d6c8]/80 font-light leading-relaxed max-w-sm mx-auto px-4">
            {lang === 'pt'
              ? 'Transformando autoestima em força e elegância com moda fitness de alta compressão, zero transparência e entrega rápida em todos os EUA.'
              : 'Empowering women with high-compression, zero see-through luxury activewear crafted for confidence and performance across the United States.'}
          </p>

          {/* =====================================================================
              2. LINHA DE ÍCONES DE REDES SOCIAIS (MINIMALISTAS E HORIZONTAIS)
             ===================================================================== */}
          <div className="flex items-center justify-center gap-6 pt-1 text-white/80">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#d4af37] transition duration-200"
              title="Instagram"
            >
              <Instagram className="w-5 h-5 stroke-[1.5]" />
            </a>

            <a
              href={`https://wa.me/${rawWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#25D366] transition duration-200"
              title="WhatsApp"
            >
              <WhatsAppIcon className="w-5 h-5" />
            </a>

            <a
              href={telegramTrainingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#29b6f6] transition duration-200"
              title="Telegram VIP"
            >
              <TelegramIcon className="w-5 h-5" />
            </a>

            <a
              href="https://www.tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#ff0050] transition duration-200"
              title="TikTok"
            >
              <TikTokIcon className="w-5 h-5" />
            </a>

            <a
              href={`mailto:${emailContact}`}
              className="hover:text-[#d4af37] transition duration-200"
              title="E-mail"
            >
              <Mail className="w-5 h-5 stroke-[1.5]" />
            </a>
          </div>

        </div>

        {/* Banner de Indicação / Cupom de Vendedora (Se acessou com ?ref=BEATRIZ10) */}
        {refCode && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37]/20 via-[#d4af37]/10 to-transparent border border-[#d4af37]/50 text-white space-y-1 animate-fadeIn backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-bold text-[#e5c158] uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                {lang === 'pt' ? 'INDICAÇÃO VIP DE EMBAIXADORA' : 'VIP AMBASSADOR REFERRAL'}
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#d4af37] text-black px-2 py-0.5 rounded-full">
                {refCode}
              </span>
            </div>
            <p className="text-[11px] text-white/90 font-light">
              {lang === 'pt'
                ? `Você está comprando com a indicação de ${matchedSeller ? matchedSeller.name : 'nossa Embaixadora Oficial'}. Seu desconto de 10% OFF será aplicado no carrinho!`
                : `Referred by ${matchedSeller ? matchedSeller.name : 'our Official Ambassador'}. Your 10% OFF discount will be automatically applied at checkout!`}
            </p>
          </div>
        )}

        {/* =======================================================================
            3. BOTÕES PRINCIPAIS EM FORMATO PÍLULA (IDÊNTICOS À IMAGEM DE REFERÊNCIA)
           ======================================================================= */}
        <div className="space-y-3 pt-2">

          {/* BOTÃO 1: CONHEÇA A COLEÇÃO OFICIAL */}
          <Link
            href={shopUrlWithRef}
            className="w-full py-4 px-6 rounded-full bg-[#15110d]/80 hover:bg-[#201a14]/90 border border-[#b8860b]/40 hover:border-[#d4af37] shadow-[0_0_20px_rgba(184,134,11,0.12)] hover:shadow-[0_0_30px_rgba(212,175,55,0.28)] transition-all duration-300 flex items-center justify-between group backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-[#d4af37] group-hover:scale-110 transition shrink-0" />
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#f0e8dc] group-hover:text-white transition">
                {lang === 'pt' ? 'CONHEÇA A COLEÇÃO OFICIAL' : 'DISCOVER THE COLLECTION'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#d4af37]/70 group-hover:text-[#d4af37] group-hover:translate-x-1 transition shrink-0" />
          </Link>

          {/* BOTÃO 2: COMPRAR NA LOJA ONLINE */}
          <Link
            href={shopUrlWithRef}
            className="w-full py-4 px-6 rounded-full bg-[#15110d]/80 hover:bg-[#201a14]/90 border border-[#b8860b]/40 hover:border-[#d4af37] shadow-[0_0_20px_rgba(184,134,11,0.12)] hover:shadow-[0_0_30px_rgba(212,175,55,0.28)] transition-all duration-300 flex items-center justify-between group backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4 text-[#d4af37] group-hover:scale-110 transition shrink-0" />
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#f0e8dc] group-hover:text-white transition">
                {lang === 'pt' ? 'COMPRAR NA LOJA ONLINE' : 'SHOP ONLINE STORE'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#d4af37]/70 group-hover:text-[#d4af37] group-hover:translate-x-1 transition shrink-0" />
          </Link>

          {/* BOTÃO 3: GRUPO VIP TELEGRAM (TREINAMENTO DE VENDEDORAS) */}
          <a
            href={telegramTrainingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#111922]/90 via-[#15110d]/90 to-[#111922]/90 hover:from-[#162230] hover:to-[#1a2533] border border-[#0088cc]/60 hover:border-[#29b6f6] shadow-[0_0_25px_rgba(0,136,204,0.18)] hover:shadow-[0_0_35px_rgba(0,136,204,0.35)] transition-all duration-300 flex items-center justify-between group backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <TelegramIcon className="w-4 h-4 text-[#29b6f6] group-hover:scale-110 transition shrink-0" />
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#f0e8dc] group-hover:text-white transition">
                {lang === 'pt' ? 'GRUPO TELEGRAM (TREINAMENTO)' : 'VIP TELEGRAM TRAINING GROUP'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#29b6f6]/80 group-hover:text-[#29b6f6] group-hover:translate-x-1 transition shrink-0" />
          </a>

          {/* BOTÃO 4: FAÇA PARTE DO TIME DE VENDEDORAS */}
          <a
            href={`https://wa.me/${rawWhatsApp}?text=${encodeURIComponent(
              lang === 'pt'
                ? 'Olá, Ana Carina! Quero ser uma revendedora da ANA Fitness Wear, ter meu cupom e participar dos treinamentos!'
                : 'Hello Ana Carina! I would like to become an ANA Fitness Wear Brand Ambassador with my own promo code and training access.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 rounded-full bg-[#15110d]/80 hover:bg-[#201a14]/90 border border-[#b8860b]/40 hover:border-[#d4af37] shadow-[0_0_20px_rgba(184,134,11,0.12)] hover:shadow-[0_0_30px_rgba(212,175,55,0.28)] transition-all duration-300 flex items-center justify-between group backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-[#d4af37] group-hover:scale-110 transition shrink-0" />
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#f0e8dc] group-hover:text-white transition">
                {lang === 'pt' ? 'SEJA UMA REVENDEDORA / EMBAIXADORA' : 'BECOME A BRAND AMBASSADOR'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#d4af37]/70 group-hover:text-[#d4af37] group-hover:translate-x-1 transition shrink-0" />
          </a>

          {/* BOTÃO 5: ÁREA DA VENDEDORA (LOGIN & COMISSÕES) */}
          <Link
            href="/vendedora"
            className="w-full py-4 px-6 rounded-full bg-[#15110d]/80 hover:bg-[#201a14]/90 border border-[#b8860b]/40 hover:border-[#d4af37] shadow-[0_0_20px_rgba(184,134,11,0.12)] hover:shadow-[0_0_30px_rgba(212,175,55,0.28)] transition-all duration-300 flex items-center justify-between group backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-[#d4af37] group-hover:scale-110 transition shrink-0" />
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#f0e8dc] group-hover:text-white transition">
                {lang === 'pt' ? 'ÁREA DA VENDEDORA (LOGIN)' : 'AMBASSADOR PORTAL (LOGIN)'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#d4af37]/70 group-hover:text-[#d4af37] group-hover:translate-x-1 transition shrink-0" />
          </Link>

          {/* BOTÃO 6: RASTREAR MEU PEDIDO NOS CORREIOS (USPS) */}
          <Link
            href="/pedidos"
            className="w-full py-4 px-6 rounded-full bg-[#15110d]/80 hover:bg-[#201a14]/90 border border-[#b8860b]/40 hover:border-[#d4af37] shadow-[0_0_20px_rgba(184,134,11,0.12)] hover:shadow-[0_0_30px_rgba(212,175,55,0.28)] transition-all duration-300 flex items-center justify-between group backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-[#d4af37] group-hover:scale-110 transition shrink-0" />
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#f0e8dc] group-hover:text-white transition">
                {lang === 'pt' ? 'RASTREAR PEDIDO NOS CORREIOS' : 'TRACK MY USPS PACKAGE'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#d4af37]/70 group-hover:text-[#d4af37] group-hover:translate-x-1 transition shrink-0" />
          </Link>

          {/* BOTÃO 7: FALE COMIGO NO WHATSAPP */}
          <a
            href={`https://wa.me/${rawWhatsApp}?text=${encodeURIComponent(
              lang === 'pt'
                ? 'Olá, Ana Carina! Acessei seu link da bio e gostaria de tirar uma dúvida.'
                : 'Hello Ana Carina! I found your bio link and would like to chat with you.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 rounded-full bg-[#15110d]/80 hover:bg-[#201a14]/90 border border-[#b8860b]/40 hover:border-[#d4af37] shadow-[0_0_20px_rgba(184,134,11,0.12)] hover:shadow-[0_0_30px_rgba(212,175,55,0.28)] transition-all duration-300 flex items-center justify-between group backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4 text-[#d4af37] group-hover:scale-110 transition shrink-0" />
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#f0e8dc] group-hover:text-white transition">
                {lang === 'pt' ? 'FALE DIRETAMENTE COMIGO' : 'CHAT DIRECTLY WITH ME'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#d4af37]/70 group-hover:text-[#d4af37] group-hover:translate-x-1 transition shrink-0" />
          </a>

        </div>

        {/* =======================================================================
            4. CARD DESTAQUE INFERIOR COM MINI LOOKBOOK E BOTÃO DE DOWNLOAD
               (IDÊNTICO AO 'BAIXE MEU GUIA PRÁTICO' DA IMAGEM DE REFERÊNCIA)
           ======================================================================= */}
        <div className="pt-2">
          <Link
            href="/backoffice/catalogo-pdf"
            className="block w-full p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#1c1611]/90 via-[#15110e]/95 to-[#1c1611]/90 border border-[#b8860b]/40 hover:border-[#d4af37] shadow-[0_0_35px_rgba(184,134,11,0.15)] hover:shadow-[0_0_45px_rgba(212,175,55,0.3)] transition-all duration-300 group backdrop-blur-md relative overflow-hidden"
          >
            <div className="flex items-center gap-4">
              
              {/* Leque de 3 mini livretos / cartões (Lookbook físico fanning) */}
              <div className="relative w-16 h-20 shrink-0 flex items-center justify-center">
                {/* Livreto 1 (Inclinado para a esquerda) */}
                <div className="absolute w-11 h-16 bg-[#0a0807] border border-[#d4af37]/50 rounded-xs -rotate-12 -translate-x-2 shadow-md flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-cover bg-center opacity-70" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&q=80')" }} />
                </div>
                {/* Livreto 2 (Inclinado para a direita) */}
                <div className="absolute w-11 h-16 bg-[#0a0807] border border-[#d4af37]/50 rounded-xs rotate-12 translate-x-2 shadow-md flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-cover bg-center opacity-70" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=300&q=80')" }} />
                </div>
                {/* Livreto Principal no Centro */}
                <div className="relative w-12 h-18 bg-[#ece5d8] text-[#1c1611] rounded-xs shadow-xl border border-[#d4af37] p-1 flex flex-col items-center justify-between text-center z-10">
                  <span className="text-[5.5px] font-black tracking-widest uppercase">ANA FIT</span>
                  <div className="my-auto">
                    <span className="text-[6.5px] font-serif font-black block leading-tight">CATÁLOGO</span>
                    <span className="text-[5px] tracking-widest uppercase text-[#8b6508]">LOOKBOOK</span>
                  </div>
                  <span className="text-[6px] text-[#b8860b]">✦</span>
                </div>
              </div>

              {/* Informações Centrais do Card */}
              <div className="flex-1 space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full border border-[#d4af37]/60 bg-[#d4af37]/15 text-[#e5c158] text-[8.5px] font-mono font-bold tracking-widest uppercase">
                  {lang === 'pt' ? 'GRATUITO' : 'FREE PDF'}
                </span>

                <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-white group-hover:text-[#e5c158] transition uppercase">
                  {lang === 'pt' ? 'BAIXE NOSSO CATÁLOGO COMPLETO' : 'DOWNLOAD OUR COMPLETE LOOKBOOK'}
                </h3>

                <p className="text-[10.5px] text-white/60 font-light leading-snug">
                  {lang === 'pt'
                    ? 'Fotos em alta resolução de todas as peças e lançamentos.'
                    : 'High-res photos of all sets, rompers and new arrivals.'}
                </p>
              </div>

              {/* Botão Circular com Seta de Download (Idêntico ao da imagem) */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#d4af37]/70 text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-black flex items-center justify-center shrink-0 transition-all duration-300 shadow-md">
                <Download className="w-4 h-4 stroke-[1.75]" />
              </div>

            </div>
          </Link>
        </div>

        {/* 5. Rodapé Sofisticado */}
        <div className="pt-4 text-center space-y-2">
          <button
            type="button"
            onClick={handleCopyPageUrl}
            className="inline-flex items-center gap-1.5 text-[9.5px] tracking-[0.2em] uppercase text-white/40 hover:text-[#d4af37] transition py-1"
          >
            <Share2 className="w-3 h-3" />
            <span>{copiedLink ? (lang === 'pt' ? '✓ LINK COPIADO!' : '✓ COPIED!') : (lang === 'pt' ? 'COMPARTILHAR ESTA PÁGINA' : 'SHARE THIS PAGE')}</span>
          </button>

          <p className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-light">
            LEOMINSTER, MASSACHUSETTS &bull; UNITED STATES
          </p>
          <p className="text-[8.5px] uppercase tracking-widest text-white/20">
            &copy; {new Date().getFullYear()} ANA FITNESS WEAR LLC
          </p>
        </div>

      </div>

    </div>
  );
}

export default function LinksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070504] text-[#f4efe8] flex items-center justify-center p-6 text-xs font-mono uppercase tracking-[0.3em] text-[#d4af37]">
        CARREGANDO ANA CARINA LINKS...
      </div>
    }>
      <LinksContent />
    </Suspense>
  );
}
