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
  Megaphone,
  Plus,
  Trash2,
  Edit3,
  Star,
  Instagram,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import {
  useStoreSettings,
  HeroBannerSlide,
  AnnouncementBarConfig,
  PromoBannerConfig,
  TechSectionConfig,
  CommunityPostItem,
  TestimonialItem,
  DEFAULT_HERO_BANNERS,
  DEFAULT_ANNOUNCEMENT_BAR,
  DEFAULT_PROMO_BANNER,
  DEFAULT_TECH_SECTION,
  DEFAULT_TESTIMONIALS,
} from '../../context/StoreSettingsContext';
import { ImageUploadBox } from '../ImageUploadBox';

export type CmsSubTab =
  | 'hero'
  | 'announcement'
  | 'categories'
  | 'promo'
  | 'tech'
  | 'community'
  | 'testimonials'
  | 'branding'
  | 'pages'
  | 'media'
  | 'colors'
  | 'typography';

interface AppearanceCmsViewProps {
  initialSubTab?: CmsSubTab;
}

export function AppearanceCmsView({ initialSubTab }: AppearanceCmsViewProps = {}) {
  const { siteInfo, siteImages, updateSiteInfo, updateSiteImages } = useStoreSettings();

  const normalizeSubTab = (tab?: CmsSubTab): 'hero' | 'announcement' | 'categories' | 'promo' | 'tech' | 'community' | 'testimonials' | 'branding' | 'pages' => {
    if (!tab) return 'hero';
    if (tab === 'media') return 'hero';
    if (tab === 'colors' || tab === 'typography') return 'branding';
    return tab;
  };

  const [activeSubTab, setActiveSubTab] = useState<
    'hero' | 'announcement' | 'categories' | 'promo' | 'tech' | 'community' | 'testimonials' | 'branding' | 'pages'
  >(normalizeSubTab(initialSubTab));

  const [activePageTab, setActivePageTab] = useState<'about' | 'returns' | 'shipping' | 'contact'>('about');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(normalizeSubTab(initialSubTab));
    }
  }, [initialSubTab]);

  // 1. Banners Hero (Carrossel)
  const [heroBanners, setHeroBanners] = useState<HeroBannerSlide[]>(
    siteInfo.heroBanners && siteInfo.heroBanners.length > 0
      ? siteInfo.heroBanners
      : DEFAULT_HERO_BANNERS
  );
  const [editingSlide, setEditingSlide] = useState<HeroBannerSlide | null>(null);
  const [isNewSlide, setIsNewSlide] = useState(false);

  // 2. Faixa de Topo (Announcement Bar)
  const [announcementBar, setAnnouncementBar] = useState<AnnouncementBarConfig>(
    siteInfo.announcementBar || DEFAULT_ANNOUNCEMENT_BAR
  );

  // 3. Capas das Categorias
  const [categoryImages, setCategoryImages] = useState({
    sets: siteImages?.categoryImages?.sets || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700&q=80',
    rompers: siteImages?.categoryImages?.rompers || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80',
    jumpsuits: siteImages?.categoryImages?.jumpsuits || 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=700&q=80',
    tops: siteImages?.categoryImages?.tops || 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=700&q=80',
    preorder: siteImages?.categoryImages?.preorder || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80',
  });

  // 4. Banner Promocional de Campanha
  const [promoBanner, setPromoBanner] = useState<PromoBannerConfig>(
    siteInfo.promoBanner || DEFAULT_PROMO_BANNER
  );

  // 5. Seção de Tecnologia (Squat-Proof)
  const [techSection, setTechSection] = useState<TechSectionConfig>(
    siteInfo.techSection || DEFAULT_TECH_SECTION
  );

  // 6. Comunidade Instagram (6 fotos)
  const [communityPosts, setCommunityPosts] = useState<CommunityPostItem[]>(
    siteImages.communityImages && siteImages.communityImages.length > 0
      ? siteImages.communityImages
      : [
          { image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80', user: '@marianasalles_fit', piece: 'Samanta Romper' },
          { image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80', user: '@beatriz_fitness', piece: 'Bailarina Top' },
          { image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80', user: '@carol_almeida_us', piece: 'Monique Set' },
          { image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80', user: '@juliana_bostonfit', piece: 'Kely Pants Set' },
          { image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80', user: '@vanessa_conditioning', piece: 'Raissa Jumpsuit' },
          { image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&q=80', user: '@camila_athlete_ma', piece: 'Deluxe Romper' },
        ]
  );

  // 7. Depoimentos de Clientes
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(
    siteInfo.testimonialsList && siteInfo.testimonialsList.length > 0
      ? siteInfo.testimonialsList
      : DEFAULT_TESTIMONIALS
  );
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);
  const [isNewTestimonial, setIsNewTestimonial] = useState(false);

  // 8. Cores, Fontes e Páginas Institucionais
  const [brandingData, setBrandingData] = useState({
    primaryColor: siteInfo.primaryColor || '#0A0A0A',
    secondaryColor: siteInfo.secondaryColor || '#D4AF37',
    backgroundColor: siteInfo.backgroundColor || '#FFFFFF',
    ctaColor: siteInfo.ctaColor || '#0A0A0A',
    headingFont: siteInfo.headingFont || 'Montserrat',
    bodyFont: siteInfo.bodyFont || 'Inter',
    tickerSlogan: siteInfo.tickerSlogan || '✨ WEAR YOUR STRENGTH ✨',
    tickerShipping: siteInfo.tickerShipping || 'FLAT RATE SHIPPING $9.99 ACROSS ALL 50 US STATES',
    aboutUsText: siteInfo.aboutUsText || 'A ANA FITNESS WEAR LLC nasceu em Leominster, Massachusetts, criada para atender a mulher que busca performance atlética sem abrir mão da sofisticação e elegância. Peças com zero transparência, compressão anatômica 4-way e tecidos tecnológicos de padrão internacional.',
    returnPolicyText: siteInfo.returnPolicyText || 'Você tem até 30 dias corridos após o recebimento para solicitar troca ou devolução. As peças devem estar em perfeito estado, sem uso, com as etiquetas originais afixadas e na embalagem original.',
    shippingPolicyText: siteInfo.shippingPolicyText || 'Enviamos para todos os 50 estados dos Estados Unidos via USPS Priority Mail com taxa fixa de $9.99. O prazo de postagem para pronta-entrega é de até 24h úteis. Peças confeccionadas sob medida possuem prazo de produção informado na compra.',
    contactText: siteInfo.contactText || 'Nosso atendimento oficial está disponível de Segunda a Sexta, das 9h às 18h (EST). WhatsApp: +1 (978) 313-9452 • E-mail: anafitweareua@gmail.com • Leominster, MA.',
  });

  // Atualiza estados locais quando siteInfo/siteImages forem atualizados pelo servidor
  useEffect(() => {
    if (siteInfo.heroBanners && siteInfo.heroBanners.length > 0) {
      setHeroBanners(siteInfo.heroBanners);
    }
    if (siteInfo.announcementBar) {
      setAnnouncementBar(siteInfo.announcementBar);
    }
    if (siteInfo.promoBanner) {
      setPromoBanner(siteInfo.promoBanner);
    }
    if (siteInfo.techSection) {
      setTechSection(siteInfo.techSection);
    }
    if (siteInfo.testimonialsList && siteInfo.testimonialsList.length > 0) {
      setTestimonials(siteInfo.testimonialsList);
    }
    if (siteImages?.categoryImages) {
      setCategoryImages((prev) => ({ ...prev, ...siteImages.categoryImages }));
    }
    if (siteImages?.communityImages && siteImages.communityImages.length > 0) {
      setCommunityPosts(siteImages.communityImages);
    }
  }, [siteInfo, siteImages]);

  // Salvar alterações
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Atualizar siteInfo
    updateSiteInfo({
      heroBanners,
      announcementBar,
      promoBanner,
      techSection,
      testimonialsList: testimonials,
      primaryColor: brandingData.primaryColor,
      secondaryColor: brandingData.secondaryColor,
      backgroundColor: brandingData.backgroundColor,
      ctaColor: brandingData.ctaColor,
      headingFont: brandingData.headingFont,
      bodyFont: brandingData.bodyFont,
      tickerSlogan: brandingData.tickerSlogan,
      tickerShipping: brandingData.tickerShipping,
      aboutUsText: brandingData.aboutUsText,
      returnPolicyText: brandingData.returnPolicyText,
      shippingPolicyText: brandingData.shippingPolicyText,
      contactText: brandingData.contactText,
    });

    // 2. Atualizar siteImages
    updateSiteImages({
      categoryImages,
      communityImages: communityPosts,
      techSectionImage: techSection.image,
      heroPoster: heroBanners[0]?.imageUrl || siteImages.heroPoster,
      heroVideo: heroBanners[0]?.videoUrl || siteImages.heroVideo,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4500);
  };

  // Funções para gerenciar Slides do Hero
  const handleToggleSlideActive = (id: string) => {
    setHeroBanners((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handleDeleteSlide = (id: string) => {
    if (heroBanners.length <= 1) {
      alert('A vitrine precisa ter pelo menos 1 slide cadastrado.');
      return;
    }
    if (confirm('Deseja excluir este banner do carrossel?')) {
      setHeroBanners((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleSaveSlideModal = (slide: HeroBannerSlide) => {
    if (isNewSlide) {
      setHeroBanners((prev) => [...prev, slide]);
    } else {
      setHeroBanners((prev) => prev.map((s) => (s.id === slide.id ? slide : s)));
    }
    setEditingSlide(null);
    setIsNewSlide(false);
  };

  // Funções para gerenciar Depoimentos
  const handleDeleteTestimonial = (id: string) => {
    if (confirm('Deseja remover este depoimento?')) {
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleSaveTestimonialModal = (item: TestimonialItem) => {
    if (isNewTestimonial) {
      setTestimonials((prev) => [...prev, item]);
    } else {
      setTestimonials((prev) => prev.map((t) => (t.id === item.id ? item : t)));
    }
    setEditingTestimonial(null);
    setIsNewTestimonial(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header do CMS Vitrine */}
      <div className="bg-white border-2 border-deep-black p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-deep-black px-2 py-0.5">
                AUTONOMIA 100% VISUAL
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 border border-green-200">
                ✓ NUVEM SUPABASE
              </span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider text-deep-black flex items-center gap-2 mt-1">
              <Palette className="w-5 h-5 text-gold" />
              <span>GERENCIADOR VISUAL DE BANNERS & VITRINE (CMS)</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-white hover:bg-gray-100 text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 border-2 border-deep-black shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Loja ao Vivo</span>
            </a>

            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="px-6 py-2.5 bg-gold hover:bg-deep-black hover:text-gold text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center gap-2 border-2 border-deep-black shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>SALVAR TODAS AS ALTERAÇÕES</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-deep-black/70 uppercase tracking-wide">
          Altere banners hero da capa, faixa de avisos do topo, capas de categorias, fotos da comunidade e textos sem precisar de código ou programação.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-600 text-white text-xs font-black uppercase tracking-wider flex items-center justify-between gap-2 shadow-lg animate-fadeIn border-2 border-deep-black">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>✓ Todas as alterações visuais foram salvas no Supabase e já estão ativas na vitrine da loja!</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5">AO VIVO</span>
        </div>
      )}

      {/* Sub-navegação das Abas do CMS */}
      <div className="flex border-b-2 border-deep-black/20 gap-2 text-xs font-black uppercase tracking-wider overflow-x-auto pb-1 scrollbar-none bg-white p-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('hero')}
          className={`pb-2 px-3 flex items-center gap-1.5 transition border-b-2 shrink-0 cursor-pointer ${
            activeSubTab === 'hero'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Video className="w-4 h-4 text-gold" />
          <span>1. Banners da Capa (Hero)</span>
          <span className="text-[8px] bg-deep-black/10 px-1.5 py-0.5 rounded-full">
            {heroBanners.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('announcement')}
          className={`pb-2 px-3 flex items-center gap-1.5 transition border-b-2 shrink-0 cursor-pointer ${
            activeSubTab === 'announcement'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Megaphone className="w-4 h-4 text-gold" />
          <span>2. Faixa de Topo (Avisos)</span>
          {announcementBar.active && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('categories')}
          className={`pb-2 px-3 flex items-center gap-1.5 transition border-b-2 shrink-0 cursor-pointer ${
            activeSubTab === 'categories'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Layers className="w-4 h-4 text-gold" />
          <span>3. Capas das Categorias</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('promo')}
          className={`pb-2 px-3 flex items-center gap-1.5 transition border-b-2 shrink-0 cursor-pointer ${
            activeSubTab === 'promo'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Sparkles className="w-4 h-4 text-gold" />
          <span>4. Banner de Campanha</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tech')}
          className={`pb-2 px-3 flex items-center gap-1.5 transition border-b-2 shrink-0 cursor-pointer ${
            activeSubTab === 'tech'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Zap className="w-4 h-4 text-gold" />
          <span>5. Tecnologia (Squat-Proof)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('community')}
          className={`pb-2 px-3 flex items-center gap-1.5 transition border-b-2 shrink-0 cursor-pointer ${
            activeSubTab === 'community'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Instagram className="w-4 h-4 text-pink-500" />
          <span>6. Instagram (#ANAFITNESSWEAR)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('testimonials')}
          className={`pb-2 px-3 flex items-center gap-1.5 transition border-b-2 shrink-0 cursor-pointer ${
            activeSubTab === 'testimonials'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Star className="w-4 h-4 text-gold" />
          <span>7. Depoimentos (Reviews)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('branding')}
          className={`pb-2 px-3 flex items-center gap-1.5 transition border-b-2 shrink-0 cursor-pointer ${
            activeSubTab === 'branding' || activeSubTab === 'pages'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Palette className="w-4 h-4 text-gold" />
          <span>8. Cores, Fontes & Páginas</span>
        </button>
      </div>

      {/* =========================================================================
          ABA 1: BANNERS HERO DA CAPA (CARROSSEL)
         ========================================================================= */}
      {activeSubTab === 'hero' && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-deep-black p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-deep-black/10">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                  <Video className="w-4 h-4 text-gold" />
                  <span>BANNERS & VÍDEOS DE CAPA (CARROSSEL HERO)</span>
                </h3>
                <p className="text-[11px] text-deep-black/70 uppercase mt-0.5">
                  Adicione quantos banners quiser. Se houver mais de um banner ativo, o site criará um carrossel rotativo automático de alto impacto.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingSlide({
                    id: `hero-${Date.now()}`,
                    active: true,
                    mediaType: 'image',
                    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1800&q=80',
                    mobileImageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
                    badge: 'NOVA COLEÇÃO • FRETE FIXO $9.99',
                    title1: 'NOVA COLEÇÃO',
                    title2: 'FIT LUXURY.',
                    subtitle: 'Peças com zero transparência, compressão anatômica 4-way e tecidos tecnológicos de padrão internacional.',
                    primaryCtaText: 'COMPRAR AGORA',
                    primaryCtaLink: '#vitrine',
                    secondaryCtaText: 'PRÉ-ORDER ATELIER',
                    secondaryCtaLink: '/?cat=preorder',
                  });
                  setIsNewSlide(true);
                }}
                className="px-4 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-gold" />
                <span>+ Adicionar Novo Banner</span>
              </button>
            </div>

            {/* Lista dos Slides Cadastrados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {heroBanners.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`border-2 p-4 transition-all relative ${
                    slide.active
                      ? 'border-deep-black bg-white shadow-sm'
                      : 'border-dashed border-gray-300 bg-gray-50 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail Preview */}
                    <div className="w-24 h-28 bg-deep-black border border-deep-black shrink-0 relative overflow-hidden">
                      {slide.mediaType === 'video' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white bg-deep-black/80">
                          <Video className="w-6 h-6 text-gold mb-1" />
                          <span className="text-[8px] font-black uppercase text-gold">VÍDEO MP4</span>
                        </div>
                      ) : (
                        <img
                          src={slide.imageUrl}
                          alt={slide.title1}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <span className="absolute top-1 left-1 bg-deep-black/80 text-white text-[9px] font-black px-1.5 py-0.5">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Dados do Slide */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-gold/20 text-deep-black">
                          {slide.mediaType === 'video' ? 'VÍDEO EM LOOP' : 'FOTO / BANNER'}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 ${
                            slide.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {slide.active ? 'ATIVO NA LOJA' : 'PAUSADO'}
                        </span>
                      </div>

                      <h4 className="text-sm font-black uppercase tracking-tight text-deep-black truncate">
                        {slide.title1} {slide.title2}
                      </h4>
                      <p className="text-[11px] text-deep-black/70 line-clamp-2 uppercase font-medium">
                        {slide.subtitle}
                      </p>

                      <div className="text-[10px] text-deep-black/50 uppercase font-mono pt-1">
                        Botão: <span className="font-bold text-deep-black">{slide.primaryCtaText}</span> → {slide.primaryCtaLink}
                      </div>
                    </div>
                  </div>

                  {/* Ações do Card */}
                  <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-deep-black/10">
                    <button
                      type="button"
                      onClick={() => handleToggleSlideActive(slide.id)}
                      className={`text-[10px] font-black uppercase px-2.5 py-1 border cursor-pointer transition ${
                        slide.active
                          ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
                          : 'border-green-600 bg-green-50 text-green-700'
                      }`}
                    >
                      {slide.active ? 'Pausar Slide' : 'Ativar Slide'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSlide({ ...slide });
                          setIsNewSlide(false);
                        }}
                        className="px-3 py-1 bg-white hover:bg-deep-black hover:text-white text-deep-black text-[10px] font-black uppercase tracking-wider border border-deep-black transition flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-gold" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="p-1 hover:bg-red-50 text-red-600 border border-transparent hover:border-red-300 transition cursor-pointer"
                        title="Excluir este banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 2: FAIXA DE TOPOS E AVISOS (ANNOUNCEMENT BAR)
         ========================================================================= */}
      {activeSubTab === 'announcement' && (
        <div className="bg-white border-2 border-deep-black p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-deep-black/10">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-gold" />
                <span>FAIXA DE AVISO & MENSAGEM DO TOPO (ANNOUNCEMENT BAR)</span>
              </h3>
              <p className="text-[11px] text-deep-black/70 uppercase mt-0.5">
                Exibida no topo absoluto de todas as páginas da loja para anunciar frete grátis, cupons ou lançamentos.
              </p>
            </div>

            {/* Toggle Ativo */}
            <label className="flex items-center gap-3 cursor-pointer self-start sm:self-auto p-2 bg-gray-50 border border-gray-200">
              <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                Status da Faixa:
              </span>
              <input
                type="checkbox"
                checked={announcementBar.active}
                onChange={(e) =>
                  setAnnouncementBar((prev) => ({ ...prev, active: e.target.checked }))
                }
                className="w-4 h-4 accent-gold cursor-pointer"
              />
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 ${
                  announcementBar.active ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'
                }`}
              >
                {announcementBar.active ? 'LIGADA (VISÍVEL)' : 'DESLIGADA'}
              </span>
            </label>
          </div>

          {/* Prévia ao Vivo da Faixa */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
              PRÉVIA EM TEMPO REAL:
            </span>
            <div
              className="py-2.5 px-4 text-[11px] font-bold tracking-widest uppercase flex items-center justify-between gap-3 border shadow-sm transition-colors"
              style={{
                backgroundColor: announcementBar.bgColor || '#0A0A0A',
                color: announcementBar.textColor || '#D4AF37',
              }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                {announcementBar.badgeText && (
                  <span className="px-2 py-0.5 bg-white/20 text-current text-[9px] font-black uppercase tracking-wider rounded-xs">
                    {announcementBar.badgeText}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{announcementBar.textPt || 'Digite sua mensagem de aviso abaixo...'}</span>
                </span>
              </div>
              <span className="text-[9px] opacity-75 font-mono">🇺🇸 EN | 🇧🇷 PT</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                MENSAGEM EM PORTUGUÊS (PT)
              </label>
              <textarea
                rows={2}
                value={announcementBar.textPt}
                onChange={(e) =>
                  setAnnouncementBar((prev) => ({ ...prev, textPt: e.target.value }))
                }
                placeholder="Ex: ✨ FRETE FIXO DE $9.99 P/ TODOS OS EUA • FRETE GRÁTIS ACIMA DE $75 ✨"
                className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold focus:outline-none focus:border-deep-black"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                MENSAGEM EM INGLÊS (EN)
              </label>
              <textarea
                rows={2}
                value={announcementBar.textEn}
                onChange={(e) =>
                  setAnnouncementBar((prev) => ({ ...prev, textEn: e.target.value }))
                }
                placeholder="Ex: ✨ FLAT RATE $9.99 US SHIPPING • FREE SHIPPING OVER $75 WITH CODE FRETEGRATIS ✨"
                className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold focus:outline-none focus:border-deep-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-deep-black/10">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                TAG / BADGE DE DESTAQUE
              </label>
              <input
                type="text"
                value={announcementBar.badgeText || ''}
                onChange={(e) =>
                  setAnnouncementBar((prev) => ({ ...prev, badgeText: e.target.value }))
                }
                placeholder="Ex: PROMOÇÃO, NOVO, CUPOM"
                className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase focus:outline-none focus:border-deep-black"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                LINK DE DESTINO AO CLICAR
              </label>
              <input
                type="text"
                value={announcementBar.link || ''}
                onChange={(e) =>
                  setAnnouncementBar((prev) => ({ ...prev, link: e.target.value }))
                }
                placeholder="Ex: #vitrine, /checkout, /links"
                className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono focus:outline-none focus:border-deep-black"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                COR DE FUNDO DA FAIXA
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={announcementBar.bgColor}
                  onChange={(e) =>
                    setAnnouncementBar((prev) => ({ ...prev, bgColor: e.target.value }))
                  }
                  className="w-10 h-8 border border-deep-black cursor-pointer"
                />
                <input
                  type="text"
                  value={announcementBar.bgColor}
                  onChange={(e) =>
                    setAnnouncementBar((prev) => ({ ...prev, bgColor: e.target.value }))
                  }
                  className="flex-1 px-2.5 py-1.5 border border-deep-black/30 text-xs font-mono font-bold uppercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                COR DO TEXTO DA FAIXA
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={announcementBar.textColor}
                  onChange={(e) =>
                    setAnnouncementBar((prev) => ({ ...prev, textColor: e.target.value }))
                  }
                  className="w-10 h-8 border border-deep-black cursor-pointer"
                />
                <input
                  type="text"
                  value={announcementBar.textColor}
                  onChange={(e) =>
                    setAnnouncementBar((prev) => ({ ...prev, textColor: e.target.value }))
                  }
                  className="flex-1 px-2.5 py-1.5 border border-deep-black/30 text-xs font-mono font-bold uppercase"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 3: CAPAS DAS CATEGORIAS (VITRINE PRINCIPAL)
         ========================================================================= */}
      {activeSubTab === 'categories' && (
        <div className="bg-white border-2 border-deep-black p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-deep-black/10">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                <Layers className="w-4 h-4 text-gold" />
                <span>FOTOS DE CAPA DAS CATEGORIAS (VITRINE PRINCIPAL)</span>
              </h3>
              <p className="text-[11px] text-deep-black/60 uppercase mt-1">
                Substitua as fotos de capa dos cards atléticos na Home. Proporção vertical recomendada: 4:5.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. CONJUNTOS */}
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

            {/* 2. MACAQUINHOS */}
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

            {/* 3. MACACÕES */}
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
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 4: BANNER PROMOCIONAL DE CAMPANHA (MEIO DE PÁGINA)
         ========================================================================= */}
      {activeSubTab === 'promo' && (
        <div className="bg-white border-2 border-deep-black p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-deep-black/10">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <span>BANNER PROMOCIONAL DE CAMPANHA (MEIO DE PÁGINA)</span>
              </h3>
              <p className="text-[11px] text-deep-black/60 uppercase mt-0.5">
                Banner largo exibido logo após a vitrine de produtos para divulgar encomendas, lançamentos sazonais ou coleções especiais.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer self-start sm:self-auto p-2 bg-gray-50 border border-gray-200">
              <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                Exibir na Loja:
              </span>
              <input
                type="checkbox"
                checked={promoBanner.active}
                onChange={(e) =>
                  setPromoBanner((prev) => ({ ...prev, active: e.target.checked }))
                }
                className="w-4 h-4 accent-gold cursor-pointer"
              />
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 ${
                  promoBanner.active ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'
                }`}
              >
                {promoBanner.active ? 'ATIVADO' : 'DESATIVADO'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  BADGE SUPERIOR (CALLOUT)
                </label>
                <input
                  type="text"
                  value={promoBanner.badge}
                  onChange={(e) => setPromoBanner({ ...promoBanner, badge: e.target.value })}
                  placeholder="Ex: DESTAQUE EXCLUSIVO • ATELIER LEOMINSTER"
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  TÍTULO PRINCIPAL DA CAMPANHA
                </label>
                <input
                  type="text"
                  value={promoBanner.title}
                  onChange={(e) => setPromoBanner({ ...promoBanner, title: e.target.value })}
                  placeholder="Ex: ENCOMENDAS SOB MEDIDA & PEÇAS PRONTA ENTREGA"
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  SUBTÍTULO / TEXTO EXPLICATIVO
                </label>
                <textarea
                  rows={3}
                  value={promoBanner.subtitle}
                  onChange={(e) => setPromoBanner({ ...promoBanner, subtitle: e.target.value })}
                  placeholder="Descreva o benefício ou a promoção..."
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-medium focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    TEXTO DO BOTÃO
                  </label>
                  <input
                    type="text"
                    value={promoBanner.ctaText}
                    onChange={(e) => setPromoBanner({ ...promoBanner, ctaText: e.target.value })}
                    placeholder="Ex: ENCOMENDAR VIA WHATSAPP"
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase focus:outline-none focus:border-deep-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    LINK DO BOTÃO
                  </label>
                  <input
                    type="text"
                    value={promoBanner.ctaLink}
                    onChange={(e) => setPromoBanner({ ...promoBanner, ctaLink: e.target.value })}
                    placeholder="Ex: https://wa.me/19783139452 ou /checkout"
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono focus:outline-none focus:border-deep-black"
                  />
                </div>
              </div>
            </div>

            {/* Upload de Imagem de Fundo */}
            <div className="space-y-4">
              <ImageUploadBox
                label="Foto de Fundo do Banner (Desktop)"
                helperText="Proporção horizontal de cinema recomendada (16:9 ou 21:9)"
                value={promoBanner.bgImage}
                onChange={(url) => setPromoBanner({ ...promoBanner, bgImage: url })}
                aspectRatio="aspect-[16/9]"
              />

              <ImageUploadBox
                label="Foto de Fundo Mobile (Opcional)"
                helperText="Encaixe ideal para telas de celular (aspect 4:5 ou quadrado)"
                value={promoBanner.mobileBgImage || ''}
                onChange={(url) => setPromoBanner({ ...promoBanner, mobileBgImage: url })}
                aspectRatio="aspect-[4/5]"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 5: TECNOLOGIA & TECIDOS (SQUAT-PROOF)
         ========================================================================= */}
      {activeSubTab === 'tech' && (
        <div className="bg-white border-2 border-deep-black p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-deep-black/10">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                <Zap className="w-4 h-4 text-gold" />
                <span>SEÇÃO EDITORIAL DE TECNOLOGIA & TECIDOS (SQUAT-PROOF)</span>
              </h3>
              <p className="text-[11px] text-deep-black/60 uppercase mt-0.5">
                Apresentação técnica dos tecidos, testes de transparência em agachamento e compressão muscular anatômica.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer self-start sm:self-auto p-2 bg-gray-50 border border-gray-200">
              <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                Status na Home:
              </span>
              <input
                type="checkbox"
                checked={techSection.active}
                onChange={(e) =>
                  setTechSection((prev) => ({ ...prev, active: e.target.checked }))
                }
                className="w-4 h-4 accent-gold cursor-pointer"
              />
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 ${
                  techSection.active ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'
                }`}
              >
                {techSection.active ? 'ATIVADO' : 'DESATIVADO'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  BADGE SUPERIOR
                </label>
                <input
                  type="text"
                  value={techSection.badge}
                  onChange={(e) => setTechSection({ ...techSection, badge: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    TÍTULO LINHA 1
                  </label>
                  <input
                    type="text"
                    value={techSection.title1}
                    onChange={(e) => setTechSection({ ...techSection, title1: e.target.value })}
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase focus:outline-none focus:border-deep-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    TÍTULO LINHA 2 (DOURADO)
                  </label>
                  <input
                    type="text"
                    value={techSection.title2}
                    onChange={(e) => setTechSection({ ...techSection, title2: e.target.value })}
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase focus:outline-none focus:border-deep-black"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  DESCRIÇÃO EM PORTUGUÊS (PT)
                </label>
                <textarea
                  rows={3}
                  value={techSection.descriptionPt}
                  onChange={(e) => setTechSection({ ...techSection, descriptionPt: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-medium focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  DESCRIÇÃO EM INGLÊS (EN)
                </label>
                <textarea
                  rows={3}
                  value={techSection.descriptionEn}
                  onChange={(e) => setTechSection({ ...techSection, descriptionEn: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-medium focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    BOTÃO
                  </label>
                  <input
                    type="text"
                    value={techSection.ctaText}
                    onChange={(e) => setTechSection({ ...techSection, ctaText: e.target.value })}
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase focus:outline-none focus:border-deep-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    LINK DO BOTÃO
                  </label>
                  <input
                    type="text"
                    value={techSection.ctaLink}
                    onChange={(e) => setTechSection({ ...techSection, ctaLink: e.target.value })}
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono focus:outline-none focus:border-deep-black"
                  />
                </div>
              </div>
            </div>

            {/* Imagem Atlética e 4 Especificações */}
            <div className="space-y-4">
              <ImageUploadBox
                label="Foto de Demonstração Tecnológica"
                helperText="Foto atlética em ação (agachamento ou treino) proporção 4:5"
                value={techSection.image}
                onChange={(url) => setTechSection({ ...techSection, image: url })}
                aspectRatio="aspect-[4/5]"
              />

              <div className="space-y-2 pt-2 border-t border-deep-black/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                  4 PILARES TÉCNICOS EDITÁVEIS:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {techSection.specs.map((spec, sIdx) => (
                    <div key={sIdx} className="p-2.5 border border-deep-black/20 bg-gray-50 space-y-1">
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => {
                          const updated = [...techSection.specs];
                          updated[sIdx].value = e.target.value;
                          setTechSection({ ...techSection, specs: updated });
                        }}
                        className="w-full font-black text-gold text-xs px-1 py-0.5 border border-gray-300 bg-white uppercase"
                      />
                      <input
                        type="text"
                        value={spec.title}
                        onChange={(e) => {
                          const updated = [...techSection.specs];
                          updated[sIdx].title = e.target.value;
                          setTechSection({ ...techSection, specs: updated });
                        }}
                        className="w-full font-bold text-deep-black text-[10px] px-1 py-0.5 border border-gray-300 bg-white uppercase"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 6: COMUNIDADE INSTAGRAM (#ANAFITNESSWEAR)
         ========================================================================= */}
      {activeSubTab === 'community' && (
        <div className="bg-white border-2 border-deep-black p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-deep-black/10">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-500" />
                <span>COMUNIDADE & ATLETAS (#ANAFITNESSWEAR)</span>
              </h3>
              <p className="text-[11px] text-deep-black/60 uppercase mt-1">
                Personalize os 6 cards da galeria do Instagram na página inicial.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {communityPosts.map((post, idx) => (
              <div key={idx} className="p-4 border-2 border-deep-black/20 bg-neutral-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                    Foto #{idx + 1}
                  </span>
                  <span className="text-[9px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 border border-pink-200 uppercase">
                    Instagram Feed
                  </span>
                </div>

                <ImageUploadBox
                  label={`Foto da Atleta ${idx + 1}`}
                  helperText="Formato quadrado (1:1)"
                  value={post.image}
                  onChange={(url) => {
                    const next = [...communityPosts];
                    next[idx].image = url;
                    setCommunityPosts(next);
                  }}
                  aspectRatio="aspect-square"
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold uppercase text-deep-black">@USUÁRIO</label>
                    <input
                      type="text"
                      value={post.user}
                      onChange={(e) => {
                        const next = [...communityPosts];
                        next[idx].user = e.target.value;
                        setCommunityPosts(next);
                      }}
                      className="w-full px-2 py-1 border border-deep-black/30 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold uppercase text-deep-black">PEÇA VESTIDA</label>
                    <input
                      type="text"
                      value={post.piece}
                      onChange={(e) => {
                        const next = [...communityPosts];
                        next[idx].piece = e.target.value;
                        setCommunityPosts(next);
                      }}
                      className="w-full px-2 py-1 border border-deep-black/30 text-xs font-bold uppercase"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 7: DEPOIMENTOS DE CLIENTES (REVIEWS & PROVA SOCIAL)
         ========================================================================= */}
      {activeSubTab === 'testimonials' && (
        <div className="bg-white border-2 border-deep-black p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-deep-black/10">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span>DEPOIMENTOS & AVALIAÇÕES DE CLIENTES (PROVA SOCIAL)</span>
              </h3>
              <p className="text-[11px] text-deep-black/60 uppercase mt-1">
                Depoimentos exibidos no carrossel de avaliações da Home.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingTestimonial({
                  id: `t-${Date.now()}`,
                  author: 'NOVA CLIENTE',
                  location: 'Boston, MA',
                  rating: 5,
                  textPt: 'Amei as peças! Veste perfeitamente e não fica transparente.',
                  textEn: 'Loved the pieces! Fits like a dream with zero see-through.',
                });
                setIsNewTestimonial(true);
              }}
              className="px-4 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-gold" />
              <span>+ Adicionar Depoimento</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t, idx) => (
              <div key={t.id || idx} className="p-4 border-2 border-deep-black bg-white space-y-3 relative shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gold">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
                    ))}
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-gold/20 text-deep-black">
                    VERIFICADO
                  </span>
                </div>

                <p className="text-xs italic font-medium text-deep-black line-clamp-3">
                  "{t.textPt}"
                </p>

                <div className="pt-2 border-t border-deep-black/10 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-black uppercase text-deep-black">{t.author}</h5>
                    <span className="text-[10px] text-gold font-bold uppercase">{t.location}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTestimonial({ ...t });
                        setIsNewTestimonial(false);
                      }}
                      className="p-1 hover:bg-gray-100 border border-gray-300 text-deep-black transition cursor-pointer"
                      title="Editar depoimento"
                    >
                      <Edit3 className="w-3 h-3 text-gold" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTestimonial(t.id)}
                      className="p-1 hover:bg-red-50 border border-transparent hover:border-red-300 text-red-600 transition cursor-pointer"
                      title="Excluir depoimento"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 8: CORES, FONTES & PÁGINAS INSTITUCIONAIS
         ========================================================================= */}
      {(activeSubTab === 'branding' || activeSubTab === 'pages') && (
        <div className="bg-white border-2 border-deep-black p-6 space-y-6">
          <div className="flex items-center gap-4 border-b border-deep-black/10 pb-3">
            <button
              type="button"
              onClick={() => setActivePageTab('about')}
              className={`pb-1 text-xs font-black uppercase tracking-wider transition ${
                activePageTab === 'about' ? 'text-deep-black border-b-2 border-gold' : 'text-deep-black/50'
              }`}
            >
              Sobre a Marca
            </button>
            <button
              type="button"
              onClick={() => setActivePageTab('returns')}
              className={`pb-1 text-xs font-black uppercase tracking-wider transition ${
                activePageTab === 'returns' ? 'text-deep-black border-b-2 border-gold' : 'text-deep-black/50'
              }`}
            >
              Política de Trocas
            </button>
            <button
              type="button"
              onClick={() => setActivePageTab('shipping')}
              className={`pb-1 text-xs font-black uppercase tracking-wider transition ${
                activePageTab === 'shipping' ? 'text-deep-black border-b-2 border-gold' : 'text-deep-black/50'
              }`}
            >
              Política de Envio
            </button>
            <button
              type="button"
              onClick={() => setActivePageTab('contact')}
              className={`pb-1 text-xs font-black uppercase tracking-wider transition ${
                activePageTab === 'contact' ? 'text-deep-black border-b-2 border-gold' : 'text-deep-black/50'
              }`}
            >
              Canais de Contato
            </button>
          </div>

          {/* Textos das Páginas */}
          {activePageTab === 'about' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                HISTÓRIA & PROPÓSITO DA MARCA (SOBRE NÓS)
              </label>
              <textarea
                rows={5}
                value={brandingData.aboutUsText}
                onChange={(e) => setBrandingData({ ...brandingData, aboutUsText: e.target.value })}
                className="w-full px-3 py-2 border border-deep-black/30 text-xs font-medium focus:outline-none focus:border-deep-black"
              />
            </div>
          )}

          {activePageTab === 'returns' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                POLÍTICA DE TROCAS & DEVOLUÇÕES (30 DIAS)
              </label>
              <textarea
                rows={5}
                value={brandingData.returnPolicyText}
                onChange={(e) => setBrandingData({ ...brandingData, returnPolicyText: e.target.value })}
                className="w-full px-3 py-2 border border-deep-black/30 text-xs font-medium focus:outline-none focus:border-deep-black"
              />
            </div>
          )}

          {activePageTab === 'shipping' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                POLÍTICA DE ENVIO & PRAZOS (USPS PRIORITY MAIL)
              </label>
              <textarea
                rows={5}
                value={brandingData.shippingPolicyText}
                onChange={(e) => setBrandingData({ ...brandingData, shippingPolicyText: e.target.value })}
                className="w-full px-3 py-2 border border-deep-black/30 text-xs font-medium focus:outline-none focus:border-deep-black"
              />
            </div>
          )}

          {activePageTab === 'contact' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                INFORMAÇÕES DE ATENDIMENTO & LOCALIZAÇÃO
              </label>
              <textarea
                rows={5}
                value={brandingData.contactText}
                onChange={(e) => setBrandingData({ ...brandingData, contactText: e.target.value })}
                className="w-full px-3 py-2 border border-deep-black/30 text-xs font-medium focus:outline-none focus:border-deep-black"
              />
            </div>
          )}

          {/* Seletor de Cores */}
          <div className="pt-4 border-t border-deep-black/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-deep-black block mb-3">
              PALETA DE CORES DA MARCA:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-deep-black">COR PRIMÁRIA (DEEP BLACK)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandingData.primaryColor}
                    onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
                    className="w-10 h-8 border border-deep-black cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingData.primaryColor}
                    onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
                    className="flex-1 px-2 py-1 border border-deep-black/30 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-deep-black">COR SECUNDÁRIA (DOURADO NOBRE)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandingData.secondaryColor}
                    onChange={(e) => setBrandingData({ ...brandingData, secondaryColor: e.target.value })}
                    className="w-10 h-8 border border-deep-black cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingData.secondaryColor}
                    onChange={(e) => setBrandingData({ ...brandingData, secondaryColor: e.target.value })}
                    className="flex-1 px-2 py-1 border border-deep-black/30 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-deep-black">COR DE FUNDO</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandingData.backgroundColor}
                    onChange={(e) => setBrandingData({ ...brandingData, backgroundColor: e.target.value })}
                    className="w-10 h-8 border border-deep-black cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingData.backgroundColor}
                    onChange={(e) => setBrandingData({ ...brandingData, backgroundColor: e.target.value })}
                    className="flex-1 px-2 py-1 border border-deep-black/30 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-deep-black">COR DOS BOTÕES (CTA)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandingData.ctaColor}
                    onChange={(e) => setBrandingData({ ...brandingData, ctaColor: e.target.value })}
                    className="w-10 h-8 border border-deep-black cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingData.ctaColor}
                    onChange={(e) => setBrandingData({ ...brandingData, ctaColor: e.target.value })}
                    className="flex-1 px-2 py-1 border border-deep-black/30 text-xs font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão de Salvar Flutuante ou no Rodapé */}
      <div className="bg-deep-black text-white p-4 border-2 border-gold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-luxury">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gold text-deep-black">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-gold">
              PRONTO PARA PUBLICAR AS ALTERAÇÕES VISUAIS?
            </h4>
            <p className="text-[11px] text-white/80 uppercase">
              As alterações serão salvas imediatamente no Supabase e refletidas na vitrine em tempo real.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSaveAll()}
          className="px-8 py-3 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border-2 border-gold cursor-pointer shadow-md self-start sm:self-auto"
        >
          <Save className="w-4 h-4 stroke-[3]" />
          <span>SALVAR TODAS AS ALTERAÇÕES</span>
        </button>
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE SLIDE HERO */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-deep-black w-full max-w-2xl my-8 p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-deep-black pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                <Video className="w-4 h-4 text-gold" />
                <span>{isNewSlide ? 'NOVO BANNER HERO (CAPA)' : 'EDITAR BANNER HERO'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                className="text-xs font-black hover:text-red-600 uppercase px-2 py-1 cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Tipo de Mídia */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  TIPO DE MÍDIA DO BANNER
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingSlide({ ...editingSlide, mediaType: 'video' })}
                    className={`py-2 px-3 text-xs font-black uppercase border transition cursor-pointer flex items-center justify-center gap-2 ${
                      editingSlide.mediaType === 'video'
                        ? 'bg-deep-black text-gold border-deep-black'
                        : 'bg-white text-deep-black/60 border-gray-300'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Vídeo em Loop (MP4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingSlide({ ...editingSlide, mediaType: 'image' })}
                    className={`py-2 px-3 text-xs font-black uppercase border transition cursor-pointer flex items-center justify-center gap-2 ${
                      editingSlide.mediaType === 'image'
                        ? 'bg-deep-black text-gold border-deep-black'
                        : 'bg-white text-deep-black/60 border-gray-300'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Foto / Banner Estático</span>
                  </button>
                </div>
              </div>

              {/* URL do Vídeo (se vídeo) */}
              {editingSlide.mediaType === 'video' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    URL DO VÍDEO (MP4)
                  </label>
                  <input
                    type="url"
                    value={editingSlide.videoUrl || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, videoUrl: e.target.value })}
                    placeholder="https://assets.mixkit.co/videos/...mp4"
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono"
                  />
                </div>
              )}

              {/* Upload de Imagem Desktop & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUploadBox
                  label={editingSlide.mediaType === 'video' ? 'Foto Poster (Carregamento / Capa)' : 'Foto do Banner (Desktop)'}
                  helperText="Recomendado: 1920x1080 horizontal"
                  value={editingSlide.imageUrl}
                  onChange={(url) => setEditingSlide({ ...editingSlide, imageUrl: url })}
                  aspectRatio="aspect-video"
                />

                <ImageUploadBox
                  label="Foto Otimizada para Celular (Mobile)"
                  helperText="Recomendado: 800x1000 vertical"
                  value={editingSlide.mobileImageUrl || ''}
                  onChange={(url) => setEditingSlide({ ...editingSlide, mobileImageUrl: url })}
                  aspectRatio="aspect-[4/5]"
                />
              </div>

              {/* Títulos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    TÍTULO LINHA 1 (BRANCO)
                  </label>
                  <input
                    type="text"
                    value={editingSlide.title1}
                    onChange={(e) => setEditingSlide({ ...editingSlide, title1: e.target.value })}
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    TÍTULO LINHA 2 (DOURADO)
                  </label>
                  <input
                    type="text"
                    value={editingSlide.title2}
                    onChange={(e) => setEditingSlide({ ...editingSlide, title2: e.target.value })}
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  BADGE SUPERIOR (CALLOUT)
                </label>
                <input
                  type="text"
                  value={editingSlide.badge}
                  onChange={(e) => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  SUBTÍTULO / FRASE DE IMPACTO
                </label>
                <textarea
                  rows={2}
                  value={editingSlide.subtitle}
                  onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-medium"
                />
              </div>

              {/* Botões do Slide */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    BOTÃO PRINCIPAL (TEXTO)
                  </label>
                  <input
                    type="text"
                    value={editingSlide.primaryCtaText}
                    onChange={(e) => setEditingSlide({ ...editingSlide, primaryCtaText: e.target.value })}
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    BOTÃO PRINCIPAL (LINK)
                  </label>
                  <input
                    type="text"
                    value={editingSlide.primaryCtaLink}
                    onChange={(e) => setEditingSlide({ ...editingSlide, primaryCtaLink: e.target.value })}
                    placeholder="Ex: #vitrine ou /checkout"
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    BOTÃO SECUNDÁRIO (TEXTO)
                  </label>
                  <input
                    type="text"
                    value={editingSlide.secondaryCtaText || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, secondaryCtaText: e.target.value })}
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-black uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    BOTÃO SECUNDÁRIO (LINK)
                  </label>
                  <input
                    type="text"
                    value={editingSlide.secondaryCtaLink || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, secondaryCtaLink: e.target.value })}
                    placeholder="Ex: /?cat=preorder"
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-deep-black/10">
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                className="px-4 py-2 border border-gray-300 text-xs font-black uppercase hover:bg-gray-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveSlideModal(editingSlide)}
                className="px-6 py-2 bg-gold hover:bg-deep-black hover:text-gold text-deep-black text-xs font-black uppercase tracking-wider transition border-2 border-deep-black cursor-pointer shadow-sm"
              >
                Confirmar Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE DEPOIMENTO */}
      {editingTestimonial && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-deep-black w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-deep-black pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span>{isNewTestimonial ? 'NOVO DEPOIMENTO' : 'EDITAR DEPOIMENTO'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTestimonial(null)}
                className="text-xs font-black hover:text-red-600 uppercase px-2 py-1 cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    NOME DA CLIENTE
                  </label>
                  <input
                    type="text"
                    value={editingTestimonial.author}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, author: e.target.value })}
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    CIDADE / ESTADO (EUA)
                  </label>
                  <input
                    type="text"
                    value={editingTestimonial.location}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, location: e.target.value })}
                    placeholder="Ex: Boston, MA"
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  TEXTO EM PORTUGUÊS (PT)
                </label>
                <textarea
                  rows={3}
                  value={editingTestimonial.textPt}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, textPt: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  TEXTO EM INGLÊS (EN - OPCIONAL)
                </label>
                <textarea
                  rows={2}
                  value={editingTestimonial.textEn}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, textEn: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-deep-black/10">
              <button
                type="button"
                onClick={() => setEditingTestimonial(null)}
                className="px-4 py-2 border border-gray-300 text-xs font-black uppercase hover:bg-gray-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveTestimonialModal(editingTestimonial)}
                className="px-6 py-2 bg-gold hover:bg-deep-black hover:text-gold text-deep-black text-xs font-black uppercase tracking-wider transition border-2 border-deep-black cursor-pointer shadow-sm"
              >
                Confirmar Depoimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppearanceCmsView;
