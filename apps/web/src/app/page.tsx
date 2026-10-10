'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import {
  Sparkles,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Truck,
  RotateCcw,
  Heart,
  Check,
  Instagram,
  Eye,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';

interface ColorOption {
  name: string;
  hex: string;
}

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  categoryPt: string;
  categoryEn: string;
  categoryKey: 'all' | 'sets' | 'rompers' | 'jumpsuits' | 'tops' | 'preorder';
  fitPt: string;
  fitEn: string;
  price: number;
  originalPrice?: number;
  badgePt: 'BEST SELLER' | 'PRÉ-VENDA' | 'LANÇAMENTO';
  badgeEn: 'BEST SELLER' | 'PRE-ORDER' | 'NEW ARRIVAL';
  badgeStyle: string;
  rating: number;
  reviewsCount: number;
  primaryImage: string;
  secondaryImage: string;
  colors: ColorOption[];
  sizes: string[];
  stock: number;
  allowBackorder: boolean;
}

const FEATURED_PRODUCTS: ProductItem[] = [
  {
    id: 'p1',
    title: 'SAMANTA ROMPER',
    slug: 'samanta-romper',
    categoryPt: 'MACAQUINHOS',
    categoryEn: 'ROMPERS',
    categoryKey: 'rompers',
    fitPt: 'ALTA SUSTENTAÇÃO • SEAMLESS SCULPT',
    fitEn: 'HIGH SUPPORT • SEAMLESS SCULPT',
    price: 44.9,
    originalPrice: 49.9,
    badgePt: 'LANÇAMENTO',
    badgeEn: 'NEW ARRIVAL',
    badgeStyle: 'bg-gold text-deep-black font-black',
    rating: 5.0,
    reviewsCount: 48,
    primaryImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
    colors: [
      { name: 'Onyx Black', hex: '#0A0A0A' },
      { name: 'Champagne Gold', hex: '#D4AF37' },
      { name: 'Pure White', hex: '#FFFFFF' },
    ],
    sizes: ['S', 'M', 'L'],
    stock: 10,
    allowBackorder: true,
  },
  {
    id: 'p2',
    title: 'BAILARINA TOP',
    slug: 'blusa-bailarina',
    categoryPt: 'TOPS',
    categoryEn: 'TOPS',
    categoryKey: 'tops',
    fitPt: 'MÉDIO IMPACTO • BOJO REMOVÍVEL',
    fitEn: 'MEDIUM IMPACT • REMOVABLE CUPS',
    price: 34.9,
    badgePt: 'BEST SELLER',
    badgeEn: 'BEST SELLER',
    badgeStyle: 'bg-deep-black text-gold border border-gold font-black',
    rating: 5.0,
    reviewsCount: 86,
    primaryImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    colors: [
      { name: 'Onyx Black', hex: '#0A0A0A' },
      { name: 'Pure White', hex: '#FFFFFF' },
    ],
    sizes: ['S', 'M', 'L'],
    stock: 15,
    allowBackorder: true,
  },
  {
    id: 'p3',
    title: 'MONIQUE FLARE PANTS SET',
    slug: 'monique-flare-pants-set',
    categoryPt: 'CONJUNTOS',
    categoryEn: 'SETS',
    categoryKey: 'sets',
    fitPt: 'CÓS DUPLO ANATÔMICO • ZERO TRANSPARÊNCIA',
    fitEn: 'DOUBLE SCULPT WAISTBAND • ZERO SEE-THROUGH',
    price: 49.9,
    badgePt: 'BEST SELLER',
    badgeEn: 'BEST SELLER',
    badgeStyle: 'bg-gold text-deep-black font-black',
    rating: 4.9,
    reviewsCount: 112,
    primaryImage: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80',
    colors: [
      { name: 'Onyx Black', hex: '#0A0A0A' },
      { name: 'Gold Champagne', hex: '#D4AF37' },
    ],
    sizes: ['S', 'M', 'L'],
    stock: 7,
    allowBackorder: true,
  },
  {
    id: 'p4',
    title: 'KELY PANTS SET',
    slug: 'conjunto-calca-kely',
    categoryPt: 'CONJUNTOS',
    categoryEn: 'SETS',
    categoryKey: 'preorder',
    fitPt: 'CONFECCIONADO SOB MEDIDA (5-7 DIAS)',
    fitEn: 'MADE-TO-ORDER ATELIER (5-7 DAYS)',
    price: 39.9,
    originalPrice: 49.9,
    badgePt: 'PRÉ-VENDA',
    badgeEn: 'PRE-ORDER',
    badgeStyle: 'bg-deep-black text-gold border border-gold font-black',
    rating: 5.0,
    reviewsCount: 39,
    primaryImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&q=80',
    colors: [
      { name: 'Onyx Black', hex: '#0A0A0A' },
    ],
    sizes: ['S', 'M', 'L'],
    stock: 0,
    allowBackorder: true,
  },
  {
    id: 'p5',
    title: 'DELUXE ROMPER',
    slug: 'macaquinho-deluxe',
    categoryPt: 'MACAQUINHOS',
    categoryEn: 'ROMPERS',
    categoryKey: 'preorder',
    fitPt: 'RECORTES ANATÔMICOS • ULTRA COMPRESSÃO',
    fitEn: 'ANATOMICAL CONTOUR • ULTRA COMPRESSION',
    price: 49.9,
    badgePt: 'PRÉ-VENDA',
    badgeEn: 'PRE-ORDER',
    badgeStyle: 'bg-deep-black text-gold border border-gold font-black',
    rating: 4.9,
    reviewsCount: 61,
    primaryImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
    colors: [
      { name: 'Onyx Black', hex: '#0A0A0A' },
      { name: 'Gold Champagne', hex: '#D4AF37' },
    ],
    sizes: ['S', 'M', 'L'],
    stock: 0,
    allowBackorder: true,
  },
  {
    id: 'p6',
    title: 'RAISSA JUMPSUIT',
    slug: 'macacao-raissa',
    categoryPt: 'MACACÕES',
    categoryEn: 'JUMPSUITS',
    categoryKey: 'jumpsuits',
    fitPt: 'BODYSUIT TOTAL • COBERTURA 100% SQUAT-PROOF',
    fitEn: 'FULL BODYSUIT • 100% SQUAT-PROOF COVERAGE',
    price: 39.9,
    originalPrice: 49.9,
    badgePt: 'LANÇAMENTO',
    badgeEn: 'NEW ARRIVAL',
    badgeStyle: 'bg-white text-deep-black border border-deep-black font-black',
    rating: 5.0,
    reviewsCount: 54,
    primaryImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80',
    colors: [
      { name: 'Onyx Black', hex: '#0A0A0A' },
    ],
    sizes: ['S', 'M', 'L'],
    stock: 5,
    allowBackorder: true,
  },
  {
    id: 'p7',
    title: 'MESH TANK',
    slug: 'mesh-tank',
    categoryPt: 'TOPS',
    categoryEn: 'TOPS',
    categoryKey: 'tops',
    fitPt: 'RESPIRABILIDADE DRY-FIT • TECIDO LEVE',
    fitEn: 'DRY-FIT BREATHABILITY • ULTRA LIGHT',
    price: 24.9,
    badgePt: 'BEST SELLER',
    badgeEn: 'BEST SELLER',
    badgeStyle: 'bg-gold text-deep-black font-black',
    rating: 4.8,
    reviewsCount: 32,
    primaryImage: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    colors: [
      { name: 'Pure White', hex: '#FFFFFF' },
      { name: 'Onyx Black', hex: '#0A0A0A' },
    ],
    sizes: ['S', 'M', 'L'],
    stock: 12,
    allowBackorder: true,
  },
  {
    id: 'p8',
    title: 'MELISSA COMFY JACKET',
    slug: 'casaco-melissa',
    categoryPt: 'CASACOS & JAQUETAS',
    categoryEn: 'JACKETS & COATS',
    categoryKey: 'sets',
    fitPt: 'ZÍPER FRONTAL REFORÇADO • MODELAGEM SLIM',
    fitEn: 'REINFORCED FRONT ZIP • ATHLETIC SLIM FIT',
    price: 49.9,
    badgePt: 'LANÇAMENTO',
    badgeEn: 'NEW ARRIVAL',
    badgeStyle: 'bg-deep-black text-white font-black',
    rating: 5.0,
    reviewsCount: 28,
    primaryImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&q=80',
    colors: [
      { name: 'Onyx Black', hex: '#0A0A0A' },
    ],
    sizes: ['S', 'M', 'L'],
    stock: 8,
    allowBackorder: true,
  },
];

const CATEGORIES = [
  { key: 'sets', namePt: 'CONJUNTOS', nameEn: 'SETS', descPt: 'HARMONIA & LUXO', descEn: 'HARMONY & SCULPT', image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700&q=80' },
  { key: 'rompers', namePt: 'MACAQUINHOS', nameEn: 'ROMPERS', descPt: 'ALTA PERFORMANCE', descEn: 'HIGH PERFORMANCE', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80' },
  { key: 'jumpsuits', namePt: 'MACACÕES', nameEn: 'JUMPSUITS', descPt: 'SILHUETA ESCULPIDA', descEn: 'SCULPTED SILHOUETTE', image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=700&q=80' },
  { key: 'tops', namePt: 'TOPS', nameEn: 'TOPS', descPt: 'SUSTENTAÇÃO TOTAL', descEn: 'MAXIMUM SUPPORT', image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=700&q=80' },
  { key: 'preorder', namePt: 'PRÉ-VENDA', nameEn: 'PRE-ORDERS', descPt: 'SOB MEDIDA ATELIER', descEn: 'MADE-TO-ORDER ATELIER', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80' },
];

const COMMUNITY_POSTS = [
  { image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80', user: '@marianasalles_fit', piece: 'Samanta Romper' },
  { image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80', user: '@beatriz_fitness', piece: 'Bailarina Top' },
  { image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80', user: '@carol_almeida_us', piece: 'Monique Set' },
  { image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80', user: '@juliana_bostonfit', piece: 'Kely Pants Set' },
  { image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80', user: '@vanessa_conditioning', piece: 'Raissa Jumpsuit' },
  { image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&q=80', user: '@camila_athlete_ma', piece: 'Deluxe Romper' },
];

const TESTIMONIALS = [
  {
    author: 'MARIANA SALLES',
    location: 'Boston, MA',
    rating: 5,
    textPt: 'A qualidade das peças da Ana Fitness Wear é surreal! O macaquinho Samanta veste perfeitamente sem ficar nada transparente no agachamento. Comprei aqui em Massachusetts e chegou em 2 dias com o frete de $9.99.',
    textEn: 'The quality of Ana Fitness Wear pieces is surreal! The Samanta romper fits like a dream with zero see-through during deep squats. Ordered here in Massachusetts and arrived in 2 days with the flat $9.99 shipping.',
  },
  {
    author: 'BEATRIZ FIGUEIREDO',
    location: 'Miami, FL',
    rating: 5,
    textPt: 'Fiz a encomenda do conjunto Kely sob medida porque meu tamanho estava esgotado. A confecção cumpriu o prazo certinho e o bojo removível dá uma sustentação maravilhosa. Vale cada centavo.',
    textEn: 'I pre-ordered the Kely pants set because my size was out of stock. Production was on time and the removable cups provide wonderful support. Worth every penny.',
  },
  {
    author: 'CAROLINA ALMEIDA',
    location: 'Orlando, FL',
    rating: 5,
    textPt: 'O top Bailarina é o melhor top que já usei na vida. Não machuca os ombros e segura perfeitamente na corrida. A equipe pelo WhatsApp me ajudou com as medidas exatas.',
    textEn: 'The Bailarina Top is hands-down the best top I have ever owned. Doesn’t dig into shoulders and provides high support for running. Concierge on WhatsApp helped me pick the right size.',
  },
];

export default function HomePage() {
  const { lang, t } = useLanguage();
  const { products: storeProducts, siteInfo, siteImages } = useStoreSettings();
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'sets' | 'rompers' | 'jumpsuits' | 'tops' | 'preorder'>('all');
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [quickAddedItem, setQuickAddedItem] = useState<{ id: string; size: string } | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickAdd = (id: string, size: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickAddedItem({ id, size });
    setTimeout(() => {
      setQuickAddedItem(null);
    }, 3000);
  };

  const activeProducts = storeProducts && storeProducts.length > 0 ? storeProducts : FEATURED_PRODUCTS;
  const filteredProducts = activeCategoryFilter === 'all'
    ? activeProducts
    : activeProducts.filter((p) => p.categoryKey === activeCategoryFilter);

  const categoriesData = [
    { key: 'sets', namePt: 'CONJUNTOS', nameEn: 'SETS', descPt: 'HARMONIA & LUXO', descEn: 'HARMONY & SCULPT', image: siteImages?.categoryImages?.sets || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700&q=80' },
    { key: 'rompers', namePt: 'MACAQUINHOS', nameEn: 'ROMPERS', descPt: 'ALTA PERFORMANCE', descEn: 'HIGH PERFORMANCE', image: siteImages?.categoryImages?.rompers || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80' },
    { key: 'jumpsuits', namePt: 'MACACÕES', nameEn: 'JUMPSUITS', descPt: 'SILHUETA ESCULPIDA', descEn: 'SCULPTED SILHOUETTE', image: siteImages?.categoryImages?.jumpsuits || 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=700&q=80' },
    { key: 'tops', namePt: 'TOPS', nameEn: 'TOPS', descPt: 'SUSTENTAÇÃO TOTAL', descEn: 'MAXIMUM SUPPORT', image: siteImages?.categoryImages?.tops || 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=700&q=80' },
    { key: 'preorder', namePt: 'PRÉ-VENDA', nameEn: 'PRE-ORDERS', descPt: 'SOB MEDIDA ATELIER', descEn: 'MADE-TO-ORDER ATELIER', image: siteImages?.categoryImages?.preorder || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80' },
  ];

  const communityPostsData = siteImages?.communityImages && siteImages.communityImages.length > 0
    ? siteImages.communityImages
    : COMMUNITY_POSTS;

  return (
    <div className="space-y-20 sm:space-y-28 bg-white selection:bg-deep-black selection:text-gold">
      {/* =========================================================================
          1. HERO BANNER FULL-BLEED (GYMSHARK 80% AESTHETIC: HIGH IMPACT & CONTRAST)
         ========================================================================= */}
      <section className="relative min-h-[92vh] w-full overflow-hidden bg-deep-black flex items-center">
        {/* Fundo de Vídeo / Fotografia Atlética Cinematográfica Dinâmica */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-65 scale-105 transition-transform duration-1000"
            poster={siteImages.heroPoster || "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1800&q=80"}
          >
            <source
              src={siteImages.heroVideo || "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-squats-in-a-gym-40502-large.mp4"}
              type="video/mp4"
            />
          </video>
          {/* Gymshark Vignette & Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/35 to-deep-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-deep-black/80 via-deep-black/20 to-transparent" />
        </div>

        {/* Conteúdo Hero: Tipografia Condensada Pesada Gymshark */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 w-full text-white py-20 space-y-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-gold/40 text-[10px] font-black uppercase tracking-widest text-gold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span>{t('hero.badge')} • FLAT ${siteInfo.flatShippingRate?.toFixed(2) || '9.99'} US SHIPPING</span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.9] max-w-5xl text-white">
            {siteInfo.heroTitle1 || 'WEAR YOUR'}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gold-light to-gold">
              {siteInfo.heroTitle2 || 'STRENGTH.'}
            </span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-white/85 uppercase tracking-widest max-w-2xl font-bold leading-relaxed">
            {siteInfo.heroSubtitle || (lang === 'pt'
              ? 'Moda fitness de alta performance sediada em Massachusetts. Zero transparência testada em agachamentos, compressão anatômica 4-way e frete fixo de $9.99 para todos os 50 estados dos EUA.'
              : 'High-performance athletic luxury based in Massachusetts. Lab-verified zero see-through, 4-way anatomical sculpt compression, and flat $9.99 shipping across all 50 US States.')}
          </p>

          {/* Botões Duplos Gymshark Action */}
          <div className="pt-4 flex flex-col sm:flex-row gap-4 max-w-lg">
            <Link
              href="#vitrine"
              className="px-8 py-4 bg-white hover:bg-gold text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-3 shadow-xl group border border-white"
            >
              <span>{t('hero.cta')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition" />
            </Link>

            <Link
              href="/produto/samanta-romper"
              className="px-8 py-4 bg-deep-black/90 hover:bg-white hover:text-deep-black text-gold text-xs font-black uppercase tracking-widest border border-gold/70 transition flex items-center justify-center gap-2 backdrop-blur-sm shadow-xl"
            >
              <Sparkles className="w-4 h-4 text-gold" />
              <span>{t('hero.preorderCta')}</span>
            </Link>
          </div>
        </div>

        {/* Faixa de Pilares Gymshark no Rodapé do Hero */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-deep-black/90 backdrop-blur-md border-t border-white/10 py-3.5 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-6 text-[10px] font-black uppercase tracking-widest text-white/80 scrollbar-none">
            <span className="flex items-center gap-2 shrink-0 text-gold">
              <ShieldCheck className="w-4 h-4 text-gold" /> 100% SQUAT-PROOF (ZERO SEE-THROUGH)
            </span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="flex items-center gap-2 shrink-0 text-white">
              <Truck className="w-4 h-4 text-gold" /> FLAT RATE $9.99 US SHIPPING (ALL 50 STATES)
            </span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="flex items-center gap-2 shrink-0 text-gold">
              <RotateCcw className="w-4 h-4 text-gold" /> 30-DAY HASSLE-FREE RETURNS
            </span>
            <span className="hidden md:inline text-white/20">•</span>
            <span className="hidden md:flex items-center gap-2 shrink-0 text-white">
              <Sparkles className="w-4 h-4 text-gold" /> CRAFTED IN LEOMINSTER, MA
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. GYMSHARK CATEGORY VISUAL RAIL (TALL CARDS WITH GRADIENT & ATHLETIC POSE)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-deep-black pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-ultra text-gold block">
              {t('cat.title')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-deep-black mt-0.5">
              SHOP BY SILHOUETTE
            </h2>
          </div>
          <Link
            href="#vitrine"
            className="text-[11px] font-black uppercase tracking-widest text-deep-black hover:text-gold flex items-center gap-2 transition group"
          >
            <span>{lang === 'pt' ? 'VER TODA A COLEÇÃO' : 'VIEW ALL SILHOUETTES'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {categoriesData.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                setActiveCategoryFilter(cat.key as any);
                const el = document.getElementById('vitrine');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group relative aspect-[4/5] overflow-hidden bg-deep-black text-left border border-deep-black/10 transition-all hover:border-gold hover:shadow-luxury cursor-pointer"
            >
              <img
                src={cat.image}
                alt={lang === 'pt' ? cat.namePt : cat.nameEn}
                className="absolute inset-0 w-full h-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/30 to-transparent" />
              
              <div className="relative z-10 h-full flex flex-col justify-end p-4 text-white space-y-1">
                <span className="text-[9px] font-black tracking-widest text-gold uppercase block">
                  {lang === 'pt' ? cat.descPt : cat.descEn}
                </span>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-tight group-hover:text-gold transition">
                  {lang === 'pt' ? cat.namePt : cat.nameEn}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* =========================================================================
          3. GYMSHARK SIGNATURE PRODUCT GRID (QUICK-ADD SIZE BAR, HOVER SWAP, SWATCHES)
         ========================================================================= */}
      <section id="vitrine" className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8 scroll-mt-24">
        {/* Cabeçalho da Vitrine + Barra de Filtros Rápidos Estilo Gymshark */}
        <div className="space-y-6 border-b-2 border-deep-black pb-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-ultra text-gold block">
                {t('prod.featured')}
              </span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deep-black">
                CORE COLLECTION
              </h2>
            </div>
            
            <div className="text-[11px] font-black uppercase tracking-wider text-gold bg-deep-black px-4 py-2 border border-gold inline-flex items-center gap-2 self-start md:self-auto shadow-sm">
              <Truck className="w-3.5 h-3.5 text-gold" />
              <span>FLAT RATE: $9.99 SHIPPING (ALL US)</span>
            </div>
          </div>

          {/* Gymshark Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'all', labelPt: 'TODAS AS PEÇAS', labelEn: 'ALL PIECES' },
              { id: 'sets', labelPt: 'CONJUNTOS', labelEn: 'SETS' },
              { id: 'rompers', labelPt: 'MACAQUINHOS', labelEn: 'ROMPERS' },
              { id: 'jumpsuits', labelPt: 'MACACÕES', labelEn: 'JUMPSUITS' },
              { id: 'tops', labelPt: 'TOPS', labelEn: 'TOPS' },
              { id: 'preorder', labelPt: 'PRÉ-VENDA', labelEn: 'PRE-ORDERS' },
            ].map((filter) => {
              const isActive = activeCategoryFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveCategoryFilter(filter.id as any)}
                  className={`px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all shrink-0 border ${
                    isActive
                      ? 'bg-deep-black text-white border-deep-black shadow-md'
                      : 'bg-white text-deep-black/80 border-deep-black/20 hover:border-deep-black hover:text-deep-black'
                  }`}
                >
                  {lang === 'pt' ? filter.labelPt : filter.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de Produtos Gymshark: Aspect 4:5, Hover Swap, Quick Add Drawer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {filteredProducts.map((product) => {
            const isHovered = hoveredProduct === product.id;
            const isBackorder = product.stock === 0 && product.allowBackorder;
            const isFavorited = !!wishlist[product.id];
            const wasJustAdded = quickAddedItem?.id === product.id;

            return (
              <div
                key={product.id}
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
                className="group flex flex-col bg-white border border-deep-black/15 transition-all hover:border-deep-black hover:shadow-luxury"
              >
                {/* 1. Imagem do Produto em Proporção Atlética 4:5 */}
                <div className="relative aspect-[4/5] bg-deep-black/5 overflow-hidden">
                  <Link href={`/produto/${product.slug}`} className="block w-full h-full">
                    {/* Imagem Frontal com Crossfade para Pose de Ação */}
                    <img
                      src={isHovered ? product.secondaryImage : product.primaryImage}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>

                  {/* Badges Minimalistas Gymshark (Top Left) */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                    <span
                      className={`text-[9px] uppercase tracking-widest px-2.5 py-1 font-black shadow-sm ${product.badgeStyle}`}
                    >
                      {lang === 'pt' ? product.badgePt : product.badgeEn}
                    </span>
                    {isBackorder && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-deep-black text-gold border border-gold">
                        {lang === 'pt' ? 'SOB ENCOMENDA' : 'MADE-TO-ORDER'}
                      </span>
                    )}
                  </div>

                  {/* Botão de Wishlist / Coração (Top Right) */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlist(product.id);
                    }}
                    className="absolute top-3 right-3 z-10 p-2 bg-white/90 hover:bg-white text-deep-black backdrop-blur-md rounded-full shadow-sm transition-all hover:scale-110"
                    aria-label="Save to Wishlist"
                  >
                    <Heart
                      className={`w-4 h-4 transition ${
                        isFavorited ? 'fill-gold text-gold' : 'text-deep-black'
                      }`}
                    />
                  </button>

                  {/* =========================================================
                      ASSINATURA GYMSHARK: GAVETA DE QUICK ADD DE TAMANHOS NO HOVER
                     ========================================================= */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 z-20 bg-deep-black/95 backdrop-blur-md border-t border-gold/30 p-3 transition-all duration-300 transform ${
                      isHovered || wasJustAdded
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-full opacity-0 pointer-events-none'
                    }`}
                  >
                    {wasJustAdded ? (
                      <div className="text-center py-1 space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-gold text-xs font-black uppercase tracking-wider">
                          <Check className="w-4 h-4 text-gold stroke-[3]" />
                          <span>{quickAddedItem.size} {t('gymshark.addedToBag')}</span>
                        </div>
                        <Link
                          href="/checkout"
                          className="text-[9px] font-black uppercase tracking-widest text-white hover:text-gold block underline underline-offset-2"
                        >
                          {t('gymshark.viewBag')} →
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/70">
                          <span className="text-gold flex items-center gap-1">
                            <Zap className="w-3 h-3 text-gold" /> {t('gymshark.quickAdd')}
                          </span>
                          <span>US SIZING</span>
                        </div>

                        {/* Botões de Tamanhos Rápidos Gymshark */}
                        <div className="grid grid-cols-3 gap-1.5">
                          {product.sizes.map((size) => (
                            <button
                              key={size}
                              onClick={(e) => handleQuickAdd(product.id, size, e)}
                              className="py-1.5 text-xs font-black uppercase bg-white/10 hover:bg-gold hover:text-deep-black text-white border border-white/20 transition-all active:scale-95 flex items-center justify-center"
                              title={`Add size ${size} directly to bag`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Informações do Produto (Estilo Gymshark) */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                  <div>
                    {/* Swatches de Cores (Bolinhas) */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {product.colors.map((color, cIdx) => (
                          <span
                            key={cIdx}
                            className="w-3.5 h-3.5 rounded-full border border-deep-black/30 shadow-xs cursor-pointer transition hover:scale-125"
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-deep-black/60">
                        <Star className="w-3 h-3 fill-gold text-gold" />
                        <span className="text-deep-black font-black">{product.rating.toFixed(1)}</span>
                        <span>({product.reviewsCount})</span>
                      </div>
                    </div>

                    {/* Fit & Tecnologia em Caixa Alta Pequena */}
                    <span className="text-[9px] font-black uppercase tracking-wider text-gold block mb-1">
                      {lang === 'pt' ? product.fitPt : product.fitEn}
                    </span>

                    {/* Título do Produto */}
                    <Link href={`/produto/${product.slug}`}>
                      <h3 className="text-sm font-black uppercase tracking-wider text-deep-black group-hover:text-gold transition line-clamp-1">
                        {product.title}
                      </h3>
                    </Link>
                  </div>

                  {/* Preço em Dólar ($) e Frete Fixo $9.99 */}
                  <div className="pt-2.5 border-t border-deep-black/10 flex items-baseline justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-deep-black uppercase tracking-wider">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-deep-black/40 line-through font-bold">
                            ${product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] block text-deep-black/60 font-bold uppercase tracking-wider">
                        $9.99 FLAT RATE US SHIPPING
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border ${
                        isBackorder
                          ? 'bg-deep-black text-gold border-gold'
                          : 'bg-white text-deep-black border-deep-black'
                      }`}
                    >
                      {isBackorder ? 'PRE-ORDER' : (lang === 'pt' ? 'EM ESTOQUE' : 'IN STOCK')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          4. GYMSHARK EDITORIAL TECH SPLIT ("CONDITIONING & FABRIC ENGINEERING")
         ========================================================================= */}
      <section className="bg-deep-black text-white py-20 px-4 sm:px-8 border-y-2 border-gold/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Lado Esquerdo: Tipografia Editorial Gymshark */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-gold/40 text-[10px] font-black uppercase tracking-widest text-gold">
              <Zap className="w-3.5 h-3.5 text-gold" />
              <span>SQUAT-PROOF LAB CERTIFICATION</span>
            </div>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[0.95] text-white">
              ENGINEERED FOR SQUATS.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gold-light to-gold">
                SCULPTED FOR STRENGTH.
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-white/80 uppercase tracking-widest leading-relaxed font-medium">
              {lang === 'pt'
                ? 'Confeccionado com poliamida brasileira de alta tenacidade e elastano premium. Não marca, não escorrega e garante cobertura 100% opaca mesmo sob iluminação direta e extensão máxima.'
                : 'Crafted with premium high-tenacity polyamide and elastic compression. Glides with your motion, never slips down, and guarantees 100% opaque squat coverage even under harsh studio lighting.'}
            </p>

            {/* Grid 2x2 de Especificações Técnicas */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-gold block">100%</span>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">ZERO SEE-THROUGH</h4>
                <p className="text-[10px] text-white/60 uppercase font-medium">
                  {lang === 'pt' ? 'Testado em agachamento profundo' : 'Deep squat tested & verified'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-white block">4-WAY</span>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">MUSCLE COMPRESSION</h4>
                <p className="text-[10px] text-white/60 uppercase font-medium">
                  {lang === 'pt' ? 'Modela sem prender a circulação' : 'Contours without restricting'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-gold block">REMOVABLE</span>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">MOLDED BRA CUPS</h4>
                <p className="text-[10px] text-white/60 uppercase font-medium">
                  {lang === 'pt' ? 'Bojo anatômico com suporte' : 'Customizable shape & support'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-white block">FLATLOCK</span>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">ANTI-CHAFING SEAMS</h4>
                <p className="text-[10px] text-white/60 uppercase font-medium">
                  {lang === 'pt' ? 'Costura plana sem atrito' : 'Zero skin friction in training'}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/produto/samanta-romper"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-widest transition shadow-lg"
              >
                <span>EXPLORE TECHNICAL SPECS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Lado Direito: Imagem Atlética com Selo Oficial ANA FITNESS WEAR */}
          <div className="lg:col-span-6 relative aspect-[4/5] overflow-hidden border-2 border-gold/30 shadow-2xl">
            <img
              src={siteImages.techSectionImage || "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80"}
              alt="Tecnologia Têxtil Ana Fitness"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-transparent to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 p-4 bg-deep-black/95 backdrop-blur-md border border-gold/40 flex items-center justify-between text-xs font-black uppercase tracking-widest">
              <span className="flex items-center gap-2.5">
                <img src={siteImages.symbolUrl || "/symbol-ana-fitness.png"} alt="Selo Oficial" className="w-6 h-6 object-contain" />
                <span className="text-white">{siteInfo.storeName || 'ANA FITNESS ATELIER'} • {siteInfo.address ? siteInfo.address.split('•')[0].trim() : 'LEOMINSTER, MA'}</span>
              </span>
              <span className="text-gold">✨WEAR YOUR STRENGTH✨</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. GYMSHARK COMMUNITY ATHLETES GRID ("#ANAFITNESSWEAR")
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-deep-black pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-ultra text-gold block">
              {t('gymshark.communitySubtitle')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-deep-black mt-0.5">
              {t('gymshark.communityTitle')}
            </h2>
          </div>

          <a
            href={siteInfo.instagramUrl || "https://www.instagram.com/anafitnessweareua"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-black uppercase tracking-widest text-deep-black hover:text-gold flex items-center gap-2 transition group"
          >
            <Instagram className="w-4 h-4 text-gold group-hover:scale-110 transition" />
            <span>{siteInfo.instagram ? siteInfo.instagram.toUpperCase() : '@ANAFITNESSWEAREUA'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </a>
        </div>

        {/* Grid de Fotos dos Atletas da Comunidade Dinâmico */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {communityPostsData.map((post, idx) => (
            <a
              key={idx}
              href={siteInfo.instagramUrl || "https://www.instagram.com/anafitnessweareua"}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden bg-deep-black border border-deep-black/15 hover:border-gold transition-all"
            >
              <img
                src={post.image}
                alt={post.user}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-deep-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-white">
                <Instagram className="w-4 h-4 text-gold mb-1" />
                <span className="text-[10px] font-black uppercase tracking-wider block text-white">
                  {post.user}
                </span>
                <span className="text-[9px] font-bold text-gold uppercase block">
                  {post.piece}
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Botão de Seguir no Instagram */}
        <div className="text-center pt-2">
          <a
            href={siteInfo.instagramUrl || "https://www.instagram.com/anafitnessweareua"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition shadow-md border border-deep-black"
          >
            <Instagram className="w-4 h-4 text-gold group-hover:text-deep-black" />
            <span>{t('gymshark.followInsta')}</span>
          </a>
        </div>
      </section>

      {/* =========================================================================
          6. PROVA SOCIAL & DEPOIMENTOS DE CLIENTES DOS EUA
         ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-gold flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> 5.0 RATED BY ATHLETES & CLIENTS ACROSS THE US
          </span>
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-deep-black">
            {lang === 'pt' ? 'O QUE NOSSA COMUNIDADE ESTÁ DIZENDO' : 'REAL ATHLETE EXPERIENCES'}
          </h2>
          <div className="flex justify-center gap-1 text-gold pt-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-gold text-gold" />
            ))}
          </div>
        </div>

        {/* Card do Depoimento com Contraste Gymshark */}
        <div className="bg-white border-2 border-deep-black p-8 sm:p-12 relative shadow-luxury">
          <p className="text-base sm:text-xl font-bold uppercase tracking-wide text-deep-black leading-relaxed text-center italic">
            "{lang === 'pt' ? TESTIMONIALS[activeTestimonial].textPt : TESTIMONIALS[activeTestimonial].textEn}"
          </p>

          <div className="mt-8 text-center space-y-1 border-t border-deep-black/10 pt-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-deep-black">
              {TESTIMONIALS[activeTestimonial].author}
            </h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-gold">
              {TESTIMONIALS[activeTestimonial].location} • VERIFIED US BUYER
            </p>
          </div>

          {/* Navegação do Carrossel */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() =>
                setActiveTestimonial((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1))
              }
              className="p-2 border border-deep-black text-deep-black hover:bg-deep-black hover:text-white transition"
              aria-label="Previous Testimonial"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-2 transition-all ${
                    i === activeTestimonial ? 'bg-gold w-6' : 'bg-deep-black/20 w-2'
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() =>
                setActiveTestimonial((prev) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1))
              }
              className="p-2 border border-deep-black text-deep-black hover:bg-deep-black hover:text-white transition"
              aria-label="Next Testimonial"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. GYMSHARK 4-PILLAR SERVICE BADGES (BOTTOM OF PAGE)
         ========================================================================= */}
      <section className="bg-deep-black text-white py-12 px-4 sm:px-8 border-t-2 border-gold/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 text-gold border border-gold/30 shrink-0">
              <Truck className="w-5 h-5 text-gold" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">
                FLAT RATE ${siteInfo.flatShippingRate?.toFixed(2) || '9.99'} SHIPPING
              </h4>
              <p className="text-[10px] text-white/70 uppercase leading-relaxed">
                Standard domestic delivery across all 50 US States via USPS (1-5 business days).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 text-gold border border-gold/30 shrink-0">
              <RotateCcw className="w-5 h-5 text-gold" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">
                {siteInfo.returnDays || 30}-DAY EASY RETURNS
              </h4>
              <p className="text-[10px] text-white/70 uppercase leading-relaxed">
                Try on with peace of mind. Easy returns and exchanges within {siteInfo.returnDays || 30} days of delivery.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 text-gold border border-gold/30 shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">100% SQUAT-PROOF GUARANTEE</h4>
              <p className="text-[10px] text-white/70 uppercase leading-relaxed">
                Engineered with high-density polyamide fabric for total zero see-through opacity.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 text-gold border border-gold/30 shrink-0">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">
                {siteInfo.address ? siteInfo.address.split('•')[0].trim().toUpperCase() : 'LEOMINSTER, MA ATELIER'}
              </h4>
              <p className="text-[10px] text-white/70 uppercase leading-relaxed">
                Headquarters and showroom based in {siteInfo.address || 'Leominster, MA 01453'}. WhatsApp: {siteInfo.phone || '+1 (978) 313-9452'}.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
