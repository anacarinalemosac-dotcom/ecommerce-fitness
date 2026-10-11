'use client';

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Type,
  FileText,
  Save,
  CheckCircle2,
  ExternalLink,
  Eye,
  RefreshCw,
  Video,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { ImageUploadBox } from '../ImageUploadBox';

interface AppearanceCmsViewProps {
  initialSubTab?: 'media' | 'categories' | 'colors' | 'typography' | 'pages';
}

export function AppearanceCmsView({ initialSubTab }: AppearanceCmsViewProps = {}) {
  const { siteInfo, siteImages, updateSiteInfo, updateSiteImages } = useStoreSettings();

  const [activeSubTab, setActiveSubTab] = useState<'media' | 'categories' | 'colors' | 'typography' | 'pages'>(initialSubTab || 'media');
  const [activePageTab, setActivePageTab] = useState<'about' | 'returns' | 'shipping' | 'contact'>('about');

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [formData, setFormData] = useState({
    heroTitle1: siteInfo.heroTitle1 || 'WEAR YOUR',
    heroTitle2: siteInfo.heroTitle2 || 'STRENGTH.',
    heroSubtitle: siteInfo.heroSubtitle || 'High-performance athletic luxury based in Massachusetts. Lab-verified zero see-through, 4-way anatomical sculpt compression, and flat $9.99 shipping across all 50 US States.',
    tickerSlogan: siteInfo.tickerSlogan || '✨ WEAR YOUR STRENGTH ✨',
    tickerShipping: siteInfo.tickerShipping || 'FLAT RATE SHIPPING $9.99 ACROSS ALL 50 US STATES',
    heroVideo: siteImages.heroVideo || 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-squats-in-a-gym-40502-large.mp4',
    heroPoster: siteImages.heroPoster || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1800&q=80',
    primaryColor: siteInfo.primaryColor || '#0A0A0A',
    secondaryColor: siteInfo.secondaryColor || '#D4AF37',
    backgroundColor: siteInfo.backgroundColor || '#FFFFFF',
    ctaColor: siteInfo.ctaColor || '#0A0A0A',
    headingFont: siteInfo.headingFont || 'Montserrat',
    bodyFont: siteInfo.bodyFont || 'Inter',
    aboutUsText: siteInfo.aboutUsText || 'A ANA FITNESS WEAR LLC nasceu em Leominster, Massachusetts, criada para atender a mulher que busca performance atlética sem abrir mão da sofisticação e elegância. Peças com zero transparência, compressão anatômica 4-way e tecidos tecnológicos de padrão internacional.',
    returnPolicyText: siteInfo.returnPolicyText || 'Você tem até 30 dias corridos após o recebimento para solicitar troca ou devolução. As peças devem estar em perfeito estado, sem uso, com as etiquetas originais afixadas e na embalagem original.',
    shippingPolicyText: siteInfo.shippingPolicyText || 'Enviamos para todos os 50 estados dos Estados Unidos via USPS Priority Mail com taxa fixa de $9.99. O prazo de postagem para pronta-entrega é de até 24h úteis. Peças confeccionadas sob medida possuem prazo de produção informado na compra.',
    contactText: siteInfo.contactText || 'Nosso atendimento oficial está disponível de Segunda a Sexta, das 9h às 18h (EST). WhatsApp: +1 (978) 313-9452 • E-mail: anafitweareua@gmail.com • Leominster, MA.',
  });

  const [categoryImages, setCategoryImages] = useState({
    sets: siteImages?.categoryImages?.sets || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700&q=80',
    rompers: siteImages?.categoryImages?.rompers || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80',
    jumpsuits: siteImages?.categoryImages?.jumpsuits || 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=700&q=80',
    tops: siteImages?.categoryImages?.tops || 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=700&q=80',
    preorder: siteImages?.categoryImages?.preorder || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80',
  });

  useEffect(() => {
    if (siteImages?.categoryImages) {
      setCategoryImages((prev) => ({
        sets: siteImages.categoryImages?.sets || prev.sets,
        rompers: siteImages.categoryImages?.rompers || prev.rompers,
        jumpsuits: siteImages.categoryImages?.jumpsuits || prev.jumpsuits,
        tops: siteImages.categoryImages?.tops || prev.tops,
        preorder: siteImages.categoryImages?.preorder || prev.preorder,
      }));
    }
  }, [siteImages?.categoryImages]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteInfo({
      heroTitle1: formData.heroTitle1,
      heroTitle2: formData.heroTitle2,
      heroSubtitle: formData.heroSubtitle,
      tickerSlogan: formData.tickerSlogan,
      tickerShipping: formData.tickerShipping,
      primaryColor: formData.primaryColor,
      secondaryColor: formData.secondaryColor,
      backgroundColor: formData.backgroundColor,
      ctaColor: formData.ctaColor,
      headingFont: formData.headingFont,
      bodyFont: formData.bodyFont,
      aboutUsText: formData.aboutUsText,
      returnPolicyText: formData.returnPolicyText,
      shippingPolicyText: formData.shippingPolicyText,
      contactText: formData.contactText,
    });

    updateSiteImages({
      heroVideo: formData.heroVideo,
      heroPoster: formData.heroPoster,
      categoryImages: categoryImages,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header do CMS Visual */}
      <div className="bg-white border-2 border-deep-black p-6 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              GESTÃO VISUAL COMPLETA (SEM MEXER EM CÓDIGO)
            </span>
            <h2 className="text-lg font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
              <Palette className="w-5 h-5 text-gold" />
              <span>5. APARÊNCIA DA LOJA • CMS VISUAL</span>
            </h2>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Ver Loja ao Vivo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <p className="text-xs text-deep-black/70 uppercase tracking-wide">
          Altere banners hero, vídeos de impacto, cores oficiais, tipografia e os textos institucionais da sua marca.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-50 border-2 border-green-600 text-green-900 text-xs font-black uppercase tracking-wider flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-green-700" />
          <span>✓ Todas as alterações visuais foram salvas e já estão ativas na vitrine da loja!</span>
        </div>
      )}

      {/* Sub-navegação do CMS */}
      <div className="flex border-b border-deep-black/20 gap-3 text-xs font-black uppercase tracking-wider overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('media')}
          className={`pb-2.5 px-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeSubTab === 'media'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Video className="w-4 h-4 text-gold" />
          <span>Banners & Vídeos (Hero)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('categories')}
          className={`pb-2.5 px-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeSubTab === 'categories'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Layers className="w-4 h-4 text-gold" />
          <span>Capas das Categorias</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('colors')}
          className={`pb-2.5 px-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeSubTab === 'colors'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Palette className="w-4 h-4 text-gold" />
          <span>Paleta de Cores</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('typography')}
          className={`pb-2.5 px-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeSubTab === 'typography'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Type className="w-4 h-4 text-gold" />
          <span>Tipografia (Fontes)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('pages')}
          className={`pb-2.5 px-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeSubTab === 'pages'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <FileText className="w-4 h-4 text-gold" />
          <span>Páginas Institucionais</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SUB-ABA 1: BANNERS E VÍDEOS */}
        {activeSubTab === 'media' && (
          <div className="bg-white border-2 border-deep-black p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
              <Video className="w-4 h-4 text-gold" />
              <span>BANNER PRINCIPAL (HERO) & VÍDEO DE ENTRADA</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  URL DO VÍDEO HERO (MP4)
                </label>
                <input
                  type="url"
                  value={formData.heroVideo}
                  onChange={(e) => setFormData({ ...formData, heroVideo: e.target.value })}
                  placeholder="https://exemplo.com/video.mp4"
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono focus:outline-none focus:border-deep-black"
                />
                <span className="text-[9px] text-deep-black/60 uppercase block">
                  Vídeo reproduzido em loop silencioso no topo do site.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  URL DA IMAGEM POSTER (CAPA)
                </label>
                <input
                  type="url"
                  value={formData.heroPoster}
                  onChange={(e) => setFormData({ ...formData, heroPoster: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono focus:outline-none focus:border-deep-black"
                />
                <span className="text-[9px] text-deep-black/60 uppercase block">
                  Imagem exibida enquanto o vídeo carrega ou no mobile.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  TÍTULO PRINCIPAL (LINHA 1)
                </label>
                <input
                  type="text"
                  value={formData.heroTitle1}
                  onChange={(e) => setFormData({ ...formData, heroTitle1: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  TÍTULO PRINCIPAL (LINHA 2)
                </label>
                <input
                  type="text"
                  value={formData.heroTitle2}
                  onChange={(e) => setFormData({ ...formData, heroTitle2: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase focus:outline-none focus:border-deep-black"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                SUBTÍTULO DE IMPACTO
              </label>
              <textarea
                rows={3}
                value={formData.heroSubtitle}
                onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                className="w-full px-3 py-2 border border-deep-black/30 text-xs font-medium focus:outline-none focus:border-deep-black"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-deep-black/10">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  FRASE DO TICKER SUPERIOR (SLOGAN)
                </label>
                <input
                  type="text"
                  value={formData.tickerSlogan}
                  onChange={(e) => setFormData({ ...formData, tickerSlogan: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold uppercase focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  FRASE DO TICKER SUPERIOR (FRETE)
                </label>
                <input
                  type="text"
                  value={formData.tickerShipping}
                  onChange={(e) => setFormData({ ...formData, tickerShipping: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold uppercase focus:outline-none focus:border-deep-black"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUB-ABA: CAPAS DAS CATEGORIAS */}
        {activeSubTab === 'categories' && (
          <div className="bg-white border-2 border-deep-black p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-deep-black/10">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gold" />
                  <span>FOTOS DE CAPA DAS CATEGORIAS (VITRINE PRINCIPAL)</span>
                </h3>
                <p className="text-[11px] text-deep-black/60 uppercase mt-1">
                  Substitua as fotos de capa dos 5 cards principais da página inicial. Proporção recomendada: 4:5 vertical atlética.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 1. CONJUNTOS (SETS) */}
              <div className="p-4 border-2 border-deep-black/20 bg-neutral-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                    1. CONJUNTOS (SETS)
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-gold/20 text-deep-black">
                    HARMONIA & LUXO
                  </span>
                </div>
                <ImageUploadBox
                  label="Foto de Capa - Conjuntos"
                  helperText="Exibida no 1º card da vitrine"
                  value={categoryImages.sets}
                  onChange={(url) => setCategoryImages((prev) => ({ ...prev, sets: url }))}
                  aspectRatio="aspect-[4/5]"
                />
              </div>

              {/* 2. MACAQUINHOS (ROMPERS) */}
              <div className="p-4 border-2 border-deep-black/20 bg-neutral-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                    2. MACAQUINHOS (ROMPERS)
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-gold/20 text-deep-black">
                    ALTA PERFORMANCE
                  </span>
                </div>
                <ImageUploadBox
                  label="Foto de Capa - Macaquinhos"
                  helperText="Exibida no 2º card da vitrine"
                  value={categoryImages.rompers}
                  onChange={(url) => setCategoryImages((prev) => ({ ...prev, rompers: url }))}
                  aspectRatio="aspect-[4/5]"
                />
              </div>

              {/* 3. MACACÕES (JUMPSUITS) */}
              <div className="p-4 border-2 border-deep-black/20 bg-neutral-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                    3. MACACÕES (JUMPSUITS)
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-gold/20 text-deep-black">
                    SILHUETA ESCULPIDA
                  </span>
                </div>
                <ImageUploadBox
                  label="Foto de Capa - Macacões"
                  helperText="Exibida no 3º card da vitrine"
                  value={categoryImages.jumpsuits}
                  onChange={(url) => setCategoryImages((prev) => ({ ...prev, jumpsuits: url }))}
                  aspectRatio="aspect-[4/5]"
                />
              </div>

              {/* 4. TOPS */}
              <div className="p-4 border-2 border-deep-black/20 bg-neutral-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                    4. TOPS
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-gold/20 text-deep-black">
                    SUSTENTAÇÃO TOTAL
                  </span>
                </div>
                <ImageUploadBox
                  label="Foto de Capa - Tops"
                  helperText="Exibida no 4º card da vitrine"
                  value={categoryImages.tops}
                  onChange={(url) => setCategoryImages((prev) => ({ ...prev, tops: url }))}
                  aspectRatio="aspect-[4/5]"
                />
              </div>

              {/* 5. PRÉ-VENDA (PRE-ORDERS) */}
              <div className="p-4 border-2 border-deep-black/20 bg-neutral-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                    5. PRÉ-VENDA (PRE-ORDERS)
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-gold/20 text-deep-black">
                    SOB MEDIDA ATELIER
                  </span>
                </div>
                <ImageUploadBox
                  label="Foto de Capa - Pré-Venda"
                  helperText="Exibida no 5º card da vitrine"
                  value={categoryImages.preorder}
                  onChange={(url) => setCategoryImages((prev) => ({ ...prev, preorder: url }))}
                  aspectRatio="aspect-[4/5]"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUB-ABA 2: PALETA DE CORES */}
        {activeSubTab === 'colors' && (
          <div className="bg-white border-2 border-deep-black p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
              <Palette className="w-4 h-4 text-gold" />
              <span>PALETA DE CORES DO TEMA OFICIAL</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Cor Primária */}
              <div className="p-4 border-2 border-deep-black space-y-3 bg-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                  COR PRIMÁRIA (DEEP BLACK)
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-12 h-10 border border-deep-black cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 border border-deep-black/30 text-xs font-mono font-bold uppercase"
                  />
                </div>
                <div
                  className="h-10 border border-deep-black/20 flex items-center justify-center text-[10px] font-bold text-white uppercase"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  Prévia Primária
                </div>
              </div>

              {/* Cor Secundária (Dourado) */}
              <div className="p-4 border-2 border-gold space-y-3 bg-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  COR SECUNDÁRIA (DOURADO NOBRE)
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-12 h-10 border border-deep-black cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 border border-deep-black/30 text-xs font-mono font-bold uppercase"
                  />
                </div>
                <div
                  className="h-10 border border-deep-black/20 flex items-center justify-center text-[10px] font-bold text-deep-black uppercase"
                  style={{ backgroundColor: formData.secondaryColor }}
                >
                  Prévia Dourado
                </div>
              </div>

              {/* Cor de Fundo */}
              <div className="p-4 border-2 border-deep-black/30 space-y-3 bg-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/70 block">
                  COR DE FUNDO (BACKGROUND)
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    className="w-12 h-10 border border-deep-black cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 border border-deep-black/30 text-xs font-mono font-bold uppercase"
                  />
                </div>
                <div
                  className="h-10 border border-deep-black/20 flex items-center justify-center text-[10px] font-bold text-deep-black uppercase"
                  style={{ backgroundColor: formData.backgroundColor }}
                >
                  Prévia Fundo
                </div>
              </div>

              {/* Cor do Botão CTA */}
              <div className="p-4 border-2 border-deep-black space-y-3 bg-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                  BOTÕES DE COMPRA (CTA)
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.ctaColor}
                    onChange={(e) => setFormData({ ...formData, ctaColor: e.target.value })}
                    className="w-12 h-10 border border-deep-black cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.ctaColor}
                    onChange={(e) => setFormData({ ...formData, ctaColor: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 border border-deep-black/30 text-xs font-mono font-bold uppercase"
                  />
                </div>
                <div
                  className="h-10 flex items-center justify-center text-[10px] font-black text-gold uppercase shadow"
                  style={{ backgroundColor: formData.ctaColor }}
                >
                  COMPRAR AGORA ($)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-ABA 3: TIPOGRAFIA */}
        {activeSubTab === 'typography' && (
          <div className="bg-white border-2 border-deep-black p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
              <Type className="w-4 h-4 text-gold" />
              <span>FAMÍLIAS TIPOGRÁFICAS (FONTES DO SITE)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 border border-deep-black/20 bg-white">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                  FONTE DOS TÍTULOS (HEADINGS)
                </label>
                <select
                  value={formData.headingFont}
                  onChange={(e) => setFormData({ ...formData, headingFont: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase focus:outline-none focus:border-deep-black"
                >
                  <option value="Montserrat">Montserrat (Moderno • Luxo Atlético)</option>
                  <option value="Playfair Display">Playfair Display (Serif Clássico • Alta Moda)</option>
                  <option value="Cinzel">Cinzel (Atelier Editorial • Sofisticado)</option>
                  <option value="Bebas Neue">Bebas Neue (Impacto Imersivo • Bold)</option>
                  <option value="Inter">Inter (Minimalista • Tecnológico)</option>
                </select>

                <div className="p-4 bg-deep-black text-white text-center space-y-1">
                  <span className="text-[9px] text-gold font-bold uppercase block">PRÉVIA DE TÍTULO:</span>
                  <h4 className="text-xl font-black uppercase tracking-wider" style={{ fontFamily: formData.headingFont }}>
                    WEAR YOUR STRENGTH.
                  </h4>
                </div>
              </div>

              <div className="space-y-3 p-4 border border-deep-black/20 bg-white">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                  FONTE DOS TEXTOS (CORPO)
                </label>
                <select
                  value={formData.bodyFont}
                  onChange={(e) => setFormData({ ...formData, bodyFont: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold focus:outline-none focus:border-deep-black"
                >
                  <option value="Inter">Inter (Excelente legibilidade em qualquer tela)</option>
                  <option value="Roboto">Roboto (Padrão moderno)</option>
                  <option value="Open Sans">Open Sans (Limpo e elegante)</option>
                  <option value="Lato">Lato (Neutro e harmonioso)</option>
                </select>

                <div className="p-4 bg-deep-black/5 text-deep-black space-y-1">
                  <span className="text-[9px] text-deep-black/50 font-bold uppercase block">PRÉVIA DE TEXTO:</span>
                  <p className="text-xs leading-relaxed" style={{ fontFamily: formData.bodyFont }}>
                    Compressão anatômica 4-way sculpt, zero transparência comprovada em testes laboratoriais e conforto absoluto para o seu treino diário.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-ABA 4: PÁGINAS INSTITUCIONAIS */}
        {activeSubTab === 'pages' && (
          <div className="bg-white border-2 border-deep-black p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold" />
              <span>EDITOR DE PÁGINAS INSTITUCIONAIS FIXAS</span>
            </h3>

            {/* Abas das páginas */}
            <div className="flex border-b border-deep-black/20 gap-2 text-xs font-black uppercase tracking-wider overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActivePageTab('about')}
                className={`px-3 py-1.5 transition ${
                  activePageTab === 'about'
                    ? 'bg-deep-black text-white font-black'
                    : 'bg-deep-black/5 text-deep-black hover:bg-deep-black/10'
                }`}
              >
                1. Sobre a Marca
              </button>
              <button
                type="button"
                onClick={() => setActivePageTab('returns')}
                className={`px-3 py-1.5 transition ${
                  activePageTab === 'returns'
                    ? 'bg-deep-black text-white font-black'
                    : 'bg-deep-black/5 text-deep-black hover:bg-deep-black/10'
                }`}
              >
                2. Trocas e Devoluções
              </button>
              <button
                type="button"
                onClick={() => setActivePageTab('shipping')}
                className={`px-3 py-1.5 transition ${
                  activePageTab === 'shipping'
                    ? 'bg-deep-black text-white font-black'
                    : 'bg-deep-black/5 text-deep-black hover:bg-deep-black/10'
                }`}
              >
                3. Prazos de Envio
              </button>
              <button
                type="button"
                onClick={() => setActivePageTab('contact')}
                className={`px-3 py-1.5 transition ${
                  activePageTab === 'contact'
                    ? 'bg-deep-black text-white font-black'
                    : 'bg-deep-black/5 text-deep-black hover:bg-deep-black/10'
                }`}
              >
                4. Fale Conosco
              </button>
            </div>

            {/* Conteúdo de cada página */}
            {activePageTab === 'about' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                  CONTEÚDO: SOBRE A MARCA (/sobre)
                </label>
                <textarea
                  rows={8}
                  value={formData.aboutUsText}
                  onChange={(e) => setFormData({ ...formData, aboutUsText: e.target.value })}
                  className="w-full p-4 border border-deep-black/30 text-xs leading-relaxed focus:outline-none focus:border-deep-black"
                />
              </div>
            )}

            {activePageTab === 'returns' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                  CONTEÚDO: POLÍTICAS DE TROCA E DEVOLUÇÃO (/trocas-e-devolucoes)
                </label>
                <textarea
                  rows={8}
                  value={formData.returnPolicyText}
                  onChange={(e) => setFormData({ ...formData, returnPolicyText: e.target.value })}
                  className="w-full p-4 border border-deep-black/30 text-xs leading-relaxed focus:outline-none focus:border-deep-black"
                />
              </div>
            )}

            {activePageTab === 'shipping' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                  CONTEÚDO: PRAZOS E POLÍTICA DE ENVIO (/politica-de-envio)
                </label>
                <textarea
                  rows={8}
                  value={formData.shippingPolicyText}
                  onChange={(e) => setFormData({ ...formData, shippingPolicyText: e.target.value })}
                  className="w-full p-4 border border-deep-black/30 text-xs leading-relaxed focus:outline-none focus:border-deep-black"
                />
              </div>
            )}

            {activePageTab === 'contact' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                  CONTEÚDO: CANAIS DE ATENDIMENTO E CONTATO (/contato)
                </label>
                <textarea
                  rows={8}
                  value={formData.contactText}
                  onChange={(e) => setFormData({ ...formData, contactText: e.target.value })}
                  className="w-full p-4 border border-deep-black/30 text-xs leading-relaxed focus:outline-none focus:border-deep-black"
                />
              </div>
            )}
          </div>
        )}

        {/* Botão de Salvar Alterações */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-deep-black/10">
          <button
            type="submit"
            className="px-6 py-3 bg-gold hover:bg-deep-black hover:text-gold text-deep-black font-black uppercase tracking-widest text-xs transition shadow flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>SALVAR TODAS AS ALTERAÇÕES VISUAIS</span>
          </button>
        </div>
      </form>
    </div>
  );
}
