'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import ProductShareModal from '../components/ProductShareModal';
import { addToCart } from '@/lib/cart';
import { translateProductTitle, translateColorName, translateBadgeText, translateDynamicContent } from '../lib/translateFitness';
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
  Share2,
  Filter,
  X,
  Palette,
  Ruler,
  Tag,
  Layers,
  MessageCircle,
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
  categoryKey: 'all' | 'sets' | 'rompers' | 'jumpsuits' | 'tops' | 'jackets' | 'preorder' | 'spoiler';
  fitPt: string;
  fitEn: string;
  price: number;
  originalPrice?: number;
  badgePt: 'BEST SELLER' | 'PRÉ-VENDA' | 'LANÇAMENTO' | 'SPOILER';
  badgeEn: 'BEST SELLER' | 'PRE-ORDER' | 'NEW ARRIVAL' | 'SPOILER';
  badgeStyle: string;
  rating: number;
  reviewsCount: number;
  primaryImage: string;
  secondaryImage: string;
  colors: ColorOption[];
  sizes: string[];
  stock: number;
  allowBackorder: boolean;
  galleryImages?: string[];
  variants?: any[];
  visibleOnline?: boolean;
  isDraft?: boolean;
  status?: string;
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
    categoryKey: 'spoiler',
    fitPt: 'SPOILER EXCLUSIVO • PRÓXIMO LANÇAMENTO',
    fitEn: 'EXCLUSIVE SPOILER • COMING SOON',
    price: 39.9,
    originalPrice: 49.9,
    badgePt: 'SPOILER',
    badgeEn: 'SPOILER',
    badgeStyle: 'bg-deep-black text-gold border border-gold font-black',
    rating: 5.0,
    reviewsCount: 39,
    primaryImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&q=80',
    colors: [
      { name: 'Onyx Black', hex: '#0A0A0A' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 0,
    allowBackorder: false,
    visibleOnline: false,
  },
  {
    id: 'p5',
    title: 'DELUXE ROMPER',
    slug: 'macaquinho-deluxe',
    categoryPt: 'MACAQUINHOS',
    categoryEn: 'ROMPERS',
    categoryKey: 'spoiler',
    fitPt: 'RECORTES ANATÔMICOS • SPOILER ATELIER',
    fitEn: 'ANATOMICAL CONTOUR • ATELIER SPOILER',
    price: 49.9,
    badgePt: 'SPOILER',
    badgeEn: 'SPOILER',
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
    allowBackorder: false,
    visibleOnline: false,
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
    textPt: 'A qualidade das peças da Ana Fitness Wear é surreal! O macaquinho Samanta veste perfeitamente sem ficar nada transparente no agachamento. Comprei aqui em Massachusetts e chegou em 2 dias com o frete de $9.90.',
    textEn: 'The quality of Ana Fitness Wear pieces is surreal! The Samanta romper fits like a dream with zero see-through during deep squats. Ordered here in Massachusetts and arrived in 2 days with the flat $9.90 shipping.',
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

const COLOR_FAMILIES = [
  { id: 'all', namePt: 'Todas as Cores', nameEn: 'All Colors', hex: 'transparent', keywords: [] },
  { id: 'black', namePt: 'Preto Ônix', nameEn: 'Black Onyx', hex: '#0A0A0A', keywords: ['preto', 'black', 'onix', 'ônix'] },
  { id: 'white', namePt: 'Branco & Off', nameEn: 'White & Off', hex: '#FFFFFF', keywords: ['branco', 'white', 'off', 'bege', 'champagne'] },
  { id: 'blue', namePt: 'Azul & Turquesa', nameEn: 'Blue & Turquoise', hex: '#008baf', keywords: ['azul', 'blue', 'turquesa', 'baby blue', 'navy', 'aqua'] },
  { id: 'purple', namePt: 'Roxo & Lilás', nameEn: 'Purple & Lilac', hex: '#681A82', keywords: ['roxo', 'purple', 'lilás', 'lilas', 'violet'] },
  { id: 'wine', namePt: 'Vinho & Marsala', nameEn: 'Wine & Marsala', hex: '#800020', keywords: ['vinho', 'wine', 'marsala', 'bordeaux'] },
  { id: 'green', namePt: 'Verde', nameEn: 'Green', hex: '#2E4F4F', keywords: ['verde', 'green', 'moss', 'leaf', 'militar'] },
  { id: 'yellow', namePt: 'Amarelo & Gold', nameEn: 'Yellow & Gold', hex: '#FBBF24', keywords: ['amarel', 'yellow', 'ouro', 'gold', 'butter'] },
  { id: 'pink', namePt: 'Rosa & Goiaba', nameEn: 'Pink & Guava', hex: '#DB2777', keywords: ['rosa', 'pink', 'goiaba', 'guava', 'fúcsia', 'fucsia'] },
  { id: 'brown', namePt: 'Marrom & Café', nameEn: 'Brown & Coffee', hex: '#4A2C2A', keywords: ['marrom', 'brown', 'café', 'cafe', 'chocolate', 'coffee'] },
  { id: 'red', namePt: 'Vermelho', nameEn: 'Red', hex: '#DC2626', keywords: ['vermelh', 'red'] },
];

const FABRIC_FILTERS = [
  { id: 'all', namePt: 'Todos os Tecidos', nameEn: 'All Fabrics', keywords: [] },
  { id: 'suplex', namePt: 'Suplex Power / Premium', nameEn: 'Suplex Power / Premium', keywords: ['suplex'] },
  { id: 'poliamida', namePt: 'Poliamida (Soft / Fit / Comfy)', nameEn: 'Polyamide (Soft / Fit)', keywords: ['poliamida', 'polyamide'] },
  { id: 'canelado', namePt: 'Canelado (Ribbed)', nameEn: 'Ribbed Fabric', keywords: ['canelado', 'ribbed'] },
  { id: 'jacquard', namePt: 'Jacquard 3D / Texturizado', nameEn: 'Jacquard 3D Textured', keywords: ['jacquard'] },
  { id: 'dryfit', namePt: 'Dry Fit / Tule Mesh', nameEn: 'Dry Fit / Tulle Mesh', keywords: ['dry', 'tule', 'mesh'] },
];

const SIZE_FILTERS = [
  { id: 'all', labelPt: 'Todos', labelEn: 'All', match: [] },
  { id: 'P', labelPt: 'P (S)', labelEn: 'P (S)', match: ['P', 'S', 'SMALL'] },
  { id: 'M', labelPt: 'M (M)', labelEn: 'M (M)', match: ['M', 'MEDIUM'] },
  { id: 'G', labelPt: 'G (L)', labelEn: 'G (L)', match: ['G', 'L', 'LARGE'] },
  { id: 'GG', labelPt: 'GG (XL)', labelEn: 'GG (XL)', match: ['GG', 'XL', 'XG', 'EXTRA LARGE'] },
  { id: 'UN', labelPt: 'Tamanho Único (One Size)', labelEn: 'Tamanho Único (One Size)', match: ['UN', 'ONE SIZE', 'TAMANHO UNICO', 'TAMANHO ÚNICO', 'U'] },
];

export default function HomePage() {
  const { lang, t } = useLanguage();
  const { products: storeProducts, siteInfo, siteImages } = useStoreSettings();
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'sets' | 'rompers' | 'jumpsuits' | 'tops' | 'jackets' | 'preorder' | 'spoiler'>('all');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('all');
  const [selectedFabricFilter, setSelectedFabricFilter] = useState<string>('all');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [quickAddedItem, setQuickAddedItem] = useState<{ id: string; size: string } | null>(null);
  const [recentSoldProducts, setRecentSoldProducts] = useState<any[]>([]);
  const [loadingRecentSold, setLoadingRecentSold] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [shareModalProduct, setShareModalProduct] = useState<any | null>(null);
  const [cardImageOverrides, setCardImageOverrides] = useState<Record<string, string>>({});
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [comboPromo, setComboPromo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/backoffice/combo-promo', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.comboPromo) setComboPromo(data.comboPromo);
      })
      .catch(() => {});
  }, []);

  const isProductInCombo = (p: any): boolean => {
    if (!comboPromo?.active || !p) return false;
    const promoIds = (comboPromo.product_ids || []).map((id: string) => String(id).toLowerCase());
    const promoSlugs = (comboPromo.product_slugs || []).map((s: string) => String(s).toLowerCase());
    const prodId = String(p.id || '').toLowerCase();
    const prodSlug = String(p.slug || '').toLowerCase();

    if (promoIds.length > 0 || promoSlugs.length > 0) {
      return Boolean((prodId && promoIds.includes(prodId)) || (prodSlug && promoSlugs.includes(prodSlug)));
    }
    const tUpper = (p.title || '').toUpperCase();
    return tUpper.includes('SET') || tUpper.includes('CONJUNTO') || tUpper.includes('KIT');
  };

  const activeHeroSlides = (siteInfo.heroBanners && siteInfo.heroBanners.length > 0)
    ? siteInfo.heroBanners.filter((b) => b.active !== false)
    : [];

  useEffect(() => {
    if (activeHeroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % activeHeroSlides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [activeHeroSlides.length]);

  // Escuta filtros disparados pelo menu sem forçar salto brusco para o rodapé
  useEffect(() => {
    const handleCategoryEvent = (e: any) => {
      if (e.detail) {
        const cat = e.detail === 'new' ? 'all' : (e.detail === 'preorder' ? 'spoiler' : e.detail);
        setActiveCategoryFilter(cat);
        const el = document.getElementById('vitrine');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('ana_filter_category', handleCategoryEvent);

    try {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('cat');
      if (cat) {
        const mappedCat = cat === 'new' ? 'all' : (cat === 'preorder' ? 'spoiler' : (cat as any));
        setActiveCategoryFilter(mappedCat);
        setTimeout(() => {
          const el = document.getElementById('vitrine');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    } catch (_) {}

    return () => {
      window.removeEventListener('ana_filter_category', handleCategoryEvent);
    };
  }, []);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickAdd = (id: string, size: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prod = activeProducts.find((p) => p.id === id);
    if (prod) {
      const matchedVariant = Array.isArray(prod.variants)
        ? prod.variants.find(
            (v: any) =>
              String(v.size || '').toUpperCase() === size.toUpperCase() &&
              Number(v.stock_quantity ?? v.stock ?? 0) > 0
          ) || prod.variants[0]
        : null;
      addToCart({
        id: prod.id,
        title: prod.title,
        slug: prod.slug,
        size,
        color: matchedVariant?.color || prod.colors?.[0]?.name || 'Padrão',
        sku: matchedVariant?.sku || `${prod.slug}-${size}`,
        price: Number(matchedVariant?.price || prod.price) || 44.9,
        quantity: 1,
        image: cardImageOverrides[prod.id] || matchedVariant?.image || prod.primaryImage,
        isBackorder: false,
        productionDays: 0,
        is_combo_item: isProductInCombo(prod),
      });
    }
    setQuickAddedItem({ id, size });
    setTimeout(() => {
      setQuickAddedItem(null);
    }, 3000);
  };

  const clearAllFilters = () => {
    setActiveCategoryFilter('all');
    setSelectedColorFilter('all');
    setSelectedSizeFilter('all');
    setSelectedFabricFilter('all');
  };

  const activeFiltersCount =
    (activeCategoryFilter !== 'all' ? 1 : 0) +
    (selectedColorFilter !== 'all' ? 1 : 0) +
    (selectedSizeFilter !== 'all' ? 1 : 0) +
    (selectedFabricFilter !== 'all' ? 1 : 0);

  // Vitrine exibe estritamente produtos que estejam no ar (visibleOnline === true) E que tenham estoque real (> 0)
  const onlineAndInStockProducts = (storeProducts && storeProducts.length > 0 ? storeProducts : FEATURED_PRODUCTS).filter((p) => {
    const isOnline = p.visibleOnline === true && !p.isDraft && (p as any).status !== 'HIDDEN' && (p as any).status !== 'ARCHIVED';
    const totalStock = Number(p.stock ?? (Array.isArray(p.variants) ? p.variants.reduce((acc: number, v: any) => acc + (v.stock_quantity || 0), 0) : 0));
    return isOnline && totalStock > 0;
  });
  const activeProducts = onlineAndInStockProducts;

  // Função auxiliar: identifica se a peça é SPOILER (se zerou o estoque, categoria spoiler/preorder ou badge spoiler)
  const isProductSpoiler = (p: ProductItem) => {
    return (
      p.categoryKey === 'spoiler' ||
      p.categoryKey === 'preorder' ||
      p.badgePt === 'SPOILER' ||
      p.badgePt === 'PRÉ-VENDA' ||
      p.badgeEn === 'SPOILER' ||
      p.badgeEn === 'PRE-ORDER' ||
      Number(p.stock) <= 0
    );
  };

  const spoilerItemsCount = activeProducts.filter(isProductSpoiler).length;

  // Extrai estritamente os tamanhos que possuem estoque real (> 0) neste produto
  const getProductInStockSizes = (p: ProductItem): string[] => {
    const set = new Set<string>();
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      p.variants.forEach((v: any) => {
        const qty = Number(v.stock_quantity ?? v.stock ?? 0);
        if (qty > 0 && v.size) {
          set.add(v.size.trim().toUpperCase());
        }
      });
    }
    if (set.size === 0 && Number(p.stock) > 0) {
      (p.sizes || []).forEach((s) => {
        if (s) set.add(s.trim().toUpperCase());
      });
    }
    const sizeOrder: Record<string, number> = { PP: 1, S: 2, P: 2, M: 3, L: 4, G: 4, XL: 5, GG: 5, 'ONE SIZE': 6, UN: 6 };
    return Array.from(set).sort((a, b) => (sizeOrder[a] || 99) - (sizeOrder[b] || 99));
  };

  // FILTRAGEM MULTI-DIMENSIONAL DA VITRINE: CATEGORIA, TAMANHO, COR E TECIDO
  const filteredProducts = activeProducts.filter((p) => {
    const isSpoiler = isProductSpoiler(p);

    // 1. Aba "SPOILER": exibe EXCLUSIVAMENTE as peças spoiler (sem estoque / prévia)
    if (activeCategoryFilter === 'spoiler' || activeCategoryFilter === 'preorder') {
      if (!isSpoiler) return false;
    } else {
      // 2. QUALQUER OUTRA ABA: Peças spoiler NUNCA aparecem aqui no meio dos produtos com pronta entrega!
      if (isSpoiler) return false;
      if (activeCategoryFilter !== 'all' && p.categoryKey !== activeCategoryFilter) {
        return false;
      }
    }

    // 3. Filtro por Tamanho Disponível em Estoque
    if (selectedSizeFilter !== 'all') {
      const targetSize = SIZE_FILTERS.find((f) => f.id === selectedSizeFilter);
      if (targetSize && targetSize.match.length > 0) {
        const inStockSizes = getProductInStockSizes(p);
        const hasMatch = inStockSizes.some((sz) => targetSize.match.includes(sz));
        if (!hasMatch) return false;
      }
    }

    // 4. Filtro por Cor da Peça
    if (selectedColorFilter !== 'all') {
      const targetColor = COLOR_FAMILIES.find((c) => c.id === selectedColorFilter);
      if (targetColor && targetColor.keywords && targetColor.keywords.length > 0) {
        const colorsText = [
          p.title,
          ...(p.colors || []).map((c) => c.name),
          ...(Array.isArray(p.variants) ? p.variants.map((v: any) => v.color) : []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const hasMatch = targetColor.keywords.some((kw) => colorsText.includes(kw));
        if (!hasMatch) return false;
      }
    }

    // 5. Filtro por Tecido & Tecnologia
    if (selectedFabricFilter !== 'all') {
      const targetFabric = FABRIC_FILTERS.find((f) => f.id === selectedFabricFilter);
      if (targetFabric && targetFabric.keywords && targetFabric.keywords.length > 0) {
        const fabricText = [
          p.title,
          (p as any).composition,
          (p as any).description,
          (p as any).descriptionPt,
          (p as any).descriptionEn,
          ...((p as any).tags || []),
          p.fitPt,
          p.fitEn,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const hasMatch = targetFabric.keywords.some((kw) => fabricText.includes(kw));
        if (!hasMatch) return false;
      }
    }

    return true;
  });

  const categoriesData = [
    { key: 'sets', namePt: 'CONJUNTOS', nameEn: 'SETS', descPt: 'HARMONIA & LUXO', descEn: 'HARMONY & SCULPT', image: siteImages?.categoryImages?.sets || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700&q=80' },
    { key: 'rompers', namePt: 'MACAQUINHOS', nameEn: 'ROMPERS', descPt: 'ALTA PERFORMANCE', descEn: 'HIGH PERFORMANCE', image: siteImages?.categoryImages?.rompers || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80' },
    { key: 'jumpsuits', namePt: 'MACACÕES', nameEn: 'JUMPSUITS', descPt: 'SILHUETA ESCULPIDA', descEn: 'SCULPTED SILHOUETTE', image: siteImages?.categoryImages?.jumpsuits || 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=700&q=80' },
    { key: 'tops', namePt: 'TOPS', nameEn: 'TOPS', descPt: 'SUSTENTAÇÃO TOTAL', descEn: 'MAXIMUM SUPPORT', image: siteImages?.categoryImages?.tops || 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=700&q=80' },
  ];

  const communityPostsData = siteImages?.communityImages && siteImages.communityImages.length > 0
    ? siteImages.communityImages
    : COMMUNITY_POSTS;

  return (
    <div className="space-y-20 sm:space-y-28 bg-white selection:bg-deep-black selection:text-gold">
      {/* =========================================================================
          1. HERO BANNER FULL-BLEED (CARROSSEL DINÂMICO & ALTO IMPACTO ATHLETIC LUXURY)
         ========================================================================= */}
      {(() => {
        const slide = activeHeroSlides.length > 0
          ? activeHeroSlides[currentHeroSlide % activeHeroSlides.length]
          : null;

        const isVideo = slide ? slide.mediaType === 'video' : true;
        const videoSrc = slide?.videoUrl || siteImages.heroVideo || "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-squats-in-a-gym-40502-large.mp4";
        const posterSrc = slide?.imageUrl || siteImages.heroPoster || "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1800&q=80";
        const mobilePosterSrc = slide?.mobileImageUrl || posterSrc;

        const badgeText = translateDynamicContent(slide?.badge || `${t('hero.badge')} • ${lang === 'pt' ? 'FRETE FIXO $9.90 P/ TODOS OS EUA' : 'FLAT $9.90 US SHIPPING'}`, lang);
        const title1Text = translateDynamicContent(slide?.title1 || siteInfo.heroTitle1 || 'WEAR YOUR', lang);
        const title2Text = translateDynamicContent(slide?.title2 || siteInfo.heroTitle2 || 'STRENGTH.', lang);
        const subtitleText = translateDynamicContent(slide?.subtitle || (lang === 'pt'
          ? 'Moda fitness de alta performance sediada em Massachusetts. Zero transparência testada em agachamentos, compressão anatômica 4-way e frete fixo de $9.90 para todos os 50 estados dos EUA.'
          : (siteInfo.heroSubtitle || 'High-performance athletic luxury based in Massachusetts. Lab-verified zero see-through, 4-way anatomical sculpt compression, and flat $9.90 shipping across all 50 US States.')), lang);

        const primaryBtnText = translateDynamicContent(slide?.primaryCtaText || t('hero.cta'), lang);
        const primaryBtnLink = slide?.primaryCtaLink || '#vitrine';
        const secondaryBtnText = translateDynamicContent(slide?.secondaryCtaText || t('hero.preorderCta'), lang);
        const secondaryBtnLink = slide?.secondaryCtaLink || '/?cat=spoiler';

        const handleCtaClick = (link: string) => {
          if (link.startsWith('#')) {
            const id = link.replace('#', '');
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          } else if (link.startsWith('/?cat=')) {
            const cat = link.split('=')[1];
            if (cat) {
              setActiveCategoryFilter(cat as any);
              const el = document.getElementById('vitrine');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
          } else if (link.startsWith('http')) {
            window.open(link, '_blank', 'noopener,noreferrer');
          } else {
            window.location.href = link;
          }
        };

        return (
          <section className="relative min-h-[92vh] w-full overflow-hidden bg-deep-black flex items-center group/hero">
            {/* Fundo de Vídeo ou Imagem Atlética Dinâmica */}
            <div className="absolute inset-0 z-0">
              {isVideo ? (
                <video
                  key={videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-65 scale-105 transition-transform duration-1000"
                  poster={posterSrc}
                >
                  <source src={videoSrc} type="video/mp4" />
                </video>
              ) : (
                <picture className="w-full h-full">
                  {mobilePosterSrc && (
                    <source media="(max-width: 640px)" srcSet={mobilePosterSrc} />
                  )}
                  <img
                    key={posterSrc}
                    src={posterSrc}
                    alt={title1Text}
                    className="w-full h-full object-cover opacity-70 scale-105 transition-transform duration-1000 animate-fadeIn"
                  />
                </picture>
              )}
              {/* Gymshark Vignette & Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/35 to-deep-black/60" />
              <div className="absolute inset-0 bg-gradient-to-r from-deep-black/85 via-deep-black/30 to-transparent" />
            </div>

            {/* Conteúdo Hero: Tipografia Condensada Pesada Gymshark */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 w-full text-white py-20 space-y-6 animate-fadeIn">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-gold/40 text-[10px] font-black uppercase tracking-widest text-gold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <span>{badgeText}</span>
              </div>

              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.9] max-w-5xl text-white">
                {title1Text}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gold-light to-gold">
                  {title2Text}
                </span>
              </h1>

              <p className="text-xs sm:text-sm md:text-base text-white/85 uppercase tracking-widest max-w-2xl font-bold leading-relaxed">
                {subtitleText}
              </p>

              {/* Botões Duplos Gymshark Action */}
              <div className="pt-4 flex flex-col sm:flex-row gap-4 max-w-lg">
                <button
                  type="button"
                  onClick={() => handleCtaClick(primaryBtnLink)}
                  className="px-8 py-4 bg-white hover:bg-gold text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-3 shadow-xl group border border-white cursor-pointer"
                >
                  <span>{primaryBtnText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition" />
                </button>

                {secondaryBtnText && (
                  <button
                    type="button"
                    onClick={() => handleCtaClick(secondaryBtnLink)}
                    className="px-8 py-4 bg-deep-black/90 hover:bg-white hover:text-deep-black text-gold text-xs font-black uppercase tracking-widest border border-gold/70 transition flex items-center justify-center gap-2 backdrop-blur-sm shadow-xl cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span>{secondaryBtnText}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Setas de Navegação do Carrossel (Se houver mais de 1 slide) */}
            {activeHeroSlides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentHeroSlide((prev) =>
                      prev === 0 ? activeHeroSlides.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-deep-black/60 hover:bg-gold hover:text-deep-black text-white border border-white/20 transition-all opacity-0 group-hover/hero:opacity-100 cursor-pointer backdrop-blur-sm"
                  aria-label="Slide anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentHeroSlide((prev) => (prev + 1) % activeHeroSlides.length)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-deep-black/60 hover:bg-gold hover:text-deep-black text-white border border-white/20 transition-all opacity-0 group-hover/hero:opacity-100 cursor-pointer backdrop-blur-sm"
                  aria-label="Próximo slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Bolinhas Indicadoras */}
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                  {activeHeroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentHeroSlide(idx)}
                      className={`h-2 transition-all cursor-pointer ${
                        idx === currentHeroSlide % activeHeroSlides.length
                          ? 'w-8 bg-gold'
                          : 'w-2 bg-white/40 hover:bg-white'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Faixa de Pilares Gymshark no Rodapé do Hero */}
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-deep-black/90 backdrop-blur-md border-t border-white/10 py-3.5 px-6">
              <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-6 text-[10px] font-black uppercase tracking-widest text-white/80 scrollbar-none">
                <span className="flex items-center gap-2 shrink-0 text-gold">
                  <ShieldCheck className="w-4 h-4 text-gold" /> {lang === 'pt' ? '100% ZERO TRANSPARÊNCIA (À PROVA DE AGACHAMENTO)' : '100% SQUAT-PROOF (ZERO SEE-THROUGH)'}
                </span>
                <span className="hidden sm:inline text-white/20">•</span>
                <span className="flex items-center gap-2 shrink-0 text-white">
                  <Truck className="w-4 h-4 text-gold" /> {lang === 'pt' ? 'FRETE FIXO $9.90 (TODOS OS 50 ESTADOS DOS EUA)' : 'FLAT RATE $9.90 US SHIPPING (ALL 50 STATES)'}
                </span>
                <span className="hidden sm:inline text-white/20">•</span>
                <span className="flex items-center gap-2 shrink-0 text-gold">
                  <RotateCcw className="w-4 h-4 text-gold" /> {lang === 'pt' ? '30 DIAS PARA TROCA OU DEVOLUÇÃO' : '30-DAY HASSLE-FREE RETURNS'}
                </span>
                <span className="hidden md:inline text-white/20">•</span>
                <span className="hidden md:flex items-center gap-2 shrink-0 text-white">
                  <Sparkles className="w-4 h-4 text-gold" /> {lang === 'pt' ? 'ATELIER EM LEOMINSTER, MA' : 'CRAFTED IN LEOMINSTER, MA'}
                </span>
              </div>
            </div>
          </section>
        );
      })()}

      {/* =========================================================================
          BANNER OFICIAL • BLACK FRIDAY NOVEMBRO (TODOS OS PRODUTOS NA PROMOÇÃO)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 -mt-8 sm:-mt-12 relative z-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black via-[#111111] to-[#1a1202] border-2 border-gold/80 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_45px_rgba(212,175,55,0.35)] p-6 sm:p-10">
          {/* Subtle animated ambient gold and red glows */}
          <div className="absolute -right-24 -top-24 w-80 h-80 bg-gold/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 flex-1 w-full">
              {/* Badges de Destaque */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[11px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 shadow-lg animate-pulse">
                  <Flame className="w-4 h-4 text-white fill-white" />
                  <span>BLACK FRIDAY NOVEMBRO</span>
                </span>
                <span className="px-3 py-1 bg-gold/20 text-gold border border-gold/50 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  {lang === 'pt' ? 'OFERTA POR TEMPO LIMITADO' : 'LIMITED TIME OFFER'}
                </span>
                <span className="text-white/60 text-[11px] font-mono font-bold uppercase tracking-wider">
                  {lang === 'pt' ? 'ESTOQUE ATELIER LEOMINSTER, MA' : 'LEOMINSTER, MA'}
                </span>
              </div>

              {/* Título Principal de Impacto */}
              <div className="space-y-2">
                <h3 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                  BLACK FRIDAY <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-amber-200 to-gold">NOVEMBRO</span>
                </h3>
                <h4 className="text-lg sm:text-2xl font-black text-amber-400 uppercase tracking-tight">
                  {lang === 'pt'
                    ? 'TODOS OS PRODUTOS NA PROMOÇÃO POR TEMPO LIMITADO OU ENQUANTO DURAR O ESTOQUE!'
                    : 'ALL PRODUCTS ON SALE FOR A LIMITED TIME OR WHILE SUPPLIES LAST!'}
                </h4>
              </div>

              <p className="text-sm sm:text-base font-medium text-gray-300 max-w-3xl leading-relaxed">
                {lang === 'pt'
                  ? 'Aproveite descontos especiais em todos os nossos conjuntos fitness de compressão anatômica, macacões sem costura e tops. Peças exclusivas com estoque limitado e envio expresso para todos os EUA.'
                  : 'Take advantage of special discounts on all our anatomical compression fitness sets, seamless jumpsuits, and sports bras. Exclusive pieces with limited stock and fast express shipping across the US.'}
              </p>

              {/* Pilares com Ícones */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-bold text-white/90">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5">
                  <Tag className="w-4 h-4 text-gold shrink-0" />
                  <span>{lang === 'pt' ? 'Até 50% OFF' : 'Up to 50% OFF'}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5">
                  <Truck className="w-4 h-4 text-gold shrink-0" />
                  <span>{lang === 'pt' ? 'Frete Fixo $9.90' : 'Flat $9.90 Shipping'}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5">
                  <Zap className="w-4 h-4 text-gold shrink-0" />
                  <span>{lang === 'pt' ? '4x Sem Juros' : '4x Interest-Free'}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5">
                  <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                  <span>{lang === 'pt' ? 'Zero Transparência' : '100% Squat-Proof'}</span>
                </div>
              </div>
            </div>

            {/* Ações / Botões */}
            <div className="shrink-0 w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3">
              <a
                href="#vitrine"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById('vitrine');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-gold via-amber-400 to-gold text-deep-black font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-[0_8px_30px_rgba(212,175,55,0.4)] transition-all hover:scale-[1.03] active:scale-[0.98] text-center cursor-pointer"
              >
                <Flame className="w-5 h-5 text-deep-black fill-deep-black" />
                <span>{lang === 'pt' ? 'VER PRODUTOS EM PROMOÇÃO' : 'SHOP BLACK FRIDAY DEALS'}</span>
              </a>

              <Link
                href="/combo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-amber-400 hover:bg-amber-300 text-deep-black font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-[0_6px_20px_rgba(251,191,36,0.35)] transition-all hover:scale-[1.03] active:scale-[0.98] text-center"
              >
                <Sparkles className="w-5 h-5 text-deep-black shrink-0" />
                <span>{lang === 'pt' ? '⚡ MONTE SEU COMBO (3 CONJUNTOS) →' : '⚡ BUILD YOUR COMBO (3 SETS) →'}</span>
              </Link>

              <a
                href={lang === 'pt'
                  ? 'https://wa.me/19783139452?text=Ol%C3%A1%21%20Quero%20aproveitar%20a%20Black%20Friday%20de%20Novembro%20da%20Ana%20Fitness%21%20Quais%20produtos%20est%C3%A3o%20na%20promo%C3%A7%C3%A3o%3F'
                  : 'https://wa.me/19783139452?text=Hello%21%20I%20want%20to%20take%20advantage%20of%20the%20November%20Black%20Friday%20sale%21%20Which%20items%20are%20available%3F'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-[0_6px_25px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.03] active:scale-[0.98] text-center"
              >
                <MessageCircle className="w-5 h-5 shrink-0" />
                <span>{lang === 'pt' ? 'PEDIR NO WHATSAPP • (978) 313-9452' : 'ORDER ON WHATSAPP • (978) 313-9452'}</span>
              </a>
            </div>
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
              {lang === 'pt' ? 'ESCOLHA POR MODELAGEM' : 'SHOP BY SILHOUETTE'}
            </h2>
          </div>
          <button
            onClick={() => {
              setActiveCategoryFilter('all');
              const el = document.getElementById('vitrine');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-[11px] font-black uppercase tracking-widest text-deep-black hover:text-gold flex items-center gap-2 transition group"
          >
            <span>{lang === 'pt' ? 'VER TODA A COLEÇÃO' : 'VIEW ALL SILHOUETTES'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
                {lang === 'pt' ? 'COLEÇÃO PRINCIPAL' : 'CORE COLLECTION'}
              </h2>
            </div>
            
            <div className="text-[11px] font-black uppercase tracking-wider text-gold bg-deep-black px-4 py-2 border border-gold inline-flex items-center gap-2 self-start md:self-auto shadow-sm">
              <Truck className="w-3.5 h-3.5 text-gold" />
              <span>{lang === 'pt' ? 'FRETE FIXO: $9.90 (TODOS OS EUA)' : 'FLAT RATE: $9.90 SHIPPING (ALL US)'}</span>
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
              { id: 'jackets', labelPt: 'CASACOS & JAQUETAS', labelEn: 'JACKETS' },
              { id: 'spoiler', labelPt: '👀 SPOILERS (EM BREVE)', labelEn: '👀 SPOILERS' },
            ].map((filter) => {
              const isActive = activeCategoryFilter === filter.id || (filter.id === 'spoiler' && activeCategoryFilter === 'preorder');
              const isSpoilerPill = filter.id === 'spoiler';
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveCategoryFilter(filter.id as any)}
                  className={`px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all shrink-0 border flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? isSpoilerPill
                        ? 'bg-gold text-deep-black border-gold shadow-md'
                        : 'bg-deep-black text-white border-deep-black shadow-md'
                      : isSpoilerPill
                      ? 'bg-gold/10 text-gold border-gold/60 hover:bg-gold hover:text-deep-black'
                      : 'bg-white text-deep-black/80 border-deep-black/20 hover:border-deep-black hover:text-deep-black'
                  }`}
                >
                  {isSpoilerPill && <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />}
                  <span>{lang === 'pt' ? filter.labelPt : filter.labelEn}</span>
                  {isSpoilerPill && spoilerItemsCount > 0 && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                        isActive ? 'bg-deep-black text-gold' : 'bg-gold text-deep-black'
                      }`}
                    >
                      {spoilerItemsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Barra de Filtros Mobile (Aparece apenas em Telas Pequenas) */}
        <div className="lg:hidden flex items-center justify-between gap-2 p-3 bg-gray-50 border border-gray-200">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="flex-1 py-2.5 px-4 bg-deep-black text-gold font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-gold" />
            <span>{lang === 'pt' ? 'Filtros (Cor, Tamanho, Tecido)' : 'Filters (Color, Size, Fabric)'}</span>
            {activeFiltersCount > 0 && (
              <span className="bg-gold text-deep-black text-[10px] font-black px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="p-2.5 bg-white border border-gray-300 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
              title={lang === 'pt' ? 'Limpar filtros' : 'Clear filters'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Drawer de Filtros Mobile */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileFiltersOpen(false)}
            />
            <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-slideRight overflow-hidden">
              <div className="p-4 bg-deep-black text-white flex items-center justify-between border-b border-gold/40">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gold" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-gold">
                    {lang === 'pt' ? 'Filtros de Busca' : 'Search Filters'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1 text-white hover:text-gold cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto space-y-6">
                {/* 1. Tamanho */}
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-gold" />
                    <span>{lang === 'pt' ? 'Tamanho em Estoque' : 'In-Stock Size'}</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SIZE_FILTERS.map((sf) => (
                      <button
                        key={sf.id}
                        type="button"
                        onClick={() => setSelectedSizeFilter(sf.id)}
                        className={`py-2 px-1 text-center text-[10px] font-black uppercase border transition cursor-pointer ${
                          selectedSizeFilter === sf.id
                            ? 'bg-deep-black text-gold border-deep-black shadow-xs ring-1 ring-gold'
                            : 'bg-white text-deep-black/80 border-gray-200'
                        }`}
                      >
                        {lang === 'pt' ? sf.labelPt : sf.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Cor */}
                <div className="space-y-2.5 pt-4 border-t border-gray-100">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-gold" />
                    <span>{lang === 'pt' ? 'Cor da Peça' : 'Color'}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {COLOR_FAMILIES.map((cf) => (
                      <button
                        key={cf.id}
                        type="button"
                        onClick={() => setSelectedColorFilter(cf.id)}
                        className={`flex items-center gap-2 p-1.5 border text-left transition cursor-pointer ${
                          selectedColorFilter === cf.id
                            ? 'bg-deep-black text-white border-deep-black shadow-xs ring-1 ring-gold'
                            : 'bg-white text-deep-black/80 border-gray-200'
                        }`}
                      >
                        {cf.id === 'all' ? (
                          <span className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 shrink-0" />
                        ) : (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                            style={{ backgroundColor: cf.hex }}
                          />
                        )}
                        <span className="text-[10px] font-bold uppercase truncate">
                          {lang === 'pt' ? cf.namePt : cf.nameEn}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Tecido */}
                <div className="space-y-2.5 pt-4 border-t border-gray-100">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-gold" />
                    <span>{lang === 'pt' ? 'Tecido & Tecnologia' : 'Fabric & Tech'}</span>
                  </h4>
                  <div className="space-y-1">
                    {FABRIC_FILTERS.map((ff) => (
                      <button
                        key={ff.id}
                        type="button"
                        onClick={() => setSelectedFabricFilter(ff.id)}
                        className={`w-full flex items-center justify-between p-2 text-left text-[10px] font-black uppercase tracking-wider border transition cursor-pointer ${
                          selectedFabricFilter === ff.id
                            ? 'bg-deep-black text-gold border-deep-black shadow-xs'
                            : 'bg-white text-deep-black/75 border-gray-200'
                        }`}
                      >
                        <span>{lang === 'pt' ? ff.namePt : ff.nameEn}</span>
                        {selectedFabricFilter === ff.id && <Check className="w-3 h-3 text-gold" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="py-2.5 px-3 bg-white border border-gray-300 text-deep-black text-xs font-bold uppercase tracking-wider"
                >
                  {lang === 'pt' ? 'Limpar' : 'Clear'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-gold text-deep-black text-xs font-black uppercase tracking-wider shadow-sm"
                >
                  {lang === 'pt' ? `Ver ${filteredProducts.length} Peças` : `View ${filteredProducts.length} Pieces`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner Informativo Exclusivo da Aba Spoiler (Sem Reserva) */}
        {(activeCategoryFilter === 'spoiler' || activeCategoryFilter === 'preorder') && (
          <div className="p-5 bg-deep-black text-white border-2 border-gold flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gold text-deep-black shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gold flex items-center gap-2">
                  <span>{lang === 'pt' ? '👀 SPOILER EXCLUSIVO • PRÓXIMAS PEÇAS DO ATELIER' : '👀 EXCLUSIVE SPOILERS • UPCOMING ATELIER STYLES'}</span>
                  <span className="text-[9px] px-2 py-0.5 bg-gold/20 text-gold border border-gold/40">
                    {lang === 'pt' ? 'PRÉVIA • SEM RESERVA' : 'PREVIEW ONLY'}
                  </span>
                </h4>
                <p className="text-[11px] text-white/80 uppercase">
                  {lang === 'pt'
                    ? 'Confira em primeira mão as próximas peças que estão chegando. As peças abaixo são spoilers para você conhecer as fotos, modelagens e detalhes (não disponíveis para reserva no momento).'
                    : 'Get a first look at what is arriving next in our atelier. These styles are previews for you to see photos, fit and details (not available for reservation at this time).'}
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto px-3.5 py-1.5 bg-gold text-deep-black text-[10px] font-black uppercase tracking-widest shrink-0 border border-gold">
              {filteredProducts.length} {lang === 'pt' ? (filteredProducts.length === 1 ? 'SPOILER DISPONÍVEL' : 'SPOILERS DISPONÍVEIS') : 'SPOILERS AVAILABLE'}
            </span>
          </div>
        )}

        {/* =========================================================================
            LAYOUT PRINCIPAL: BARRA LATERAL ESQUERDA (DESKTOP) + COLUNA DO GRID
           ========================================================================= */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* BARRA LATERAL ESQUERDA DE FILTROS (DESKTOP) */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-24 bg-white border border-deep-black/15 p-5 shadow-xs space-y-6">
            {/* Cabeçalho do Filtro */}
            <div className="flex items-center justify-between pb-3 border-b border-deep-black/10">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gold" />
                <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
                  {lang === 'pt' ? 'Filtros' : 'Filters'}
                </h3>
                {activeFiltersCount > 0 && (
                  <span className="text-[10px] font-black bg-gold text-deep-black px-1.5 py-0.2 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[10px] font-black text-red-600 hover:text-red-700 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === 'pt' ? 'Limpar' : 'Clear'}</span>
                </button>
              )}
            </div>

            {/* 1. FILTRO POR TAMANHO EM ESTOQUE */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-gold" />
                  <span>{lang === 'pt' ? 'Tamanho em Estoque' : 'In-Stock Size'}</span>
                </h4>
                {selectedSizeFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedSizeFilter('all')}
                    className="text-[9px] font-bold text-gray-500 hover:text-black uppercase cursor-pointer"
                  >
                    {lang === 'pt' ? 'Todos' : 'All'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {SIZE_FILTERS.map((sf) => {
                  const isSelected = selectedSizeFilter === sf.id;
                  return (
                    <button
                      key={sf.id}
                      type="button"
                      onClick={() => setSelectedSizeFilter(sf.id)}
                      className={`py-2 px-1 text-center text-[10px] font-black uppercase tracking-wider border transition cursor-pointer ${
                        isSelected
                          ? 'bg-deep-black text-gold border-deep-black shadow-xs ring-1 ring-gold'
                          : 'bg-white text-deep-black/80 border-gray-200 hover:border-deep-black hover:text-deep-black'
                      }`}
                    >
                      {lang === 'pt' ? sf.labelPt : sf.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. FILTRO POR COR DA PEÇA */}
            <div className="space-y-2.5 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-gold" />
                  <span>{lang === 'pt' ? 'Cor da Peça' : 'Color'}</span>
                </h4>
                {selectedColorFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedColorFilter('all')}
                    className="text-[9px] font-bold text-gray-500 hover:text-black uppercase cursor-pointer"
                  >
                    {lang === 'pt' ? 'Todas' : 'All'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {COLOR_FAMILIES.map((cf) => {
                  const isSelected = selectedColorFilter === cf.id;
                  return (
                    <button
                      key={cf.id}
                      type="button"
                      onClick={() => setSelectedColorFilter(cf.id)}
                      className={`flex items-center gap-2 p-1.5 border text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-deep-black text-white border-deep-black shadow-xs ring-1 ring-gold'
                          : 'bg-white text-deep-black/80 border-gray-200 hover:border-deep-black'
                      }`}
                    >
                      {cf.id === 'all' ? (
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 shrink-0" />
                      ) : (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                          style={{ backgroundColor: cf.hex }}
                        />
                      )}
                      <span className="text-[10px] font-bold uppercase truncate">
                        {lang === 'pt' ? cf.namePt : cf.nameEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. FILTRO POR TECIDO & TECNOLOGIA */}
            <div className="space-y-2.5 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-gold" />
                  <span>{lang === 'pt' ? 'Tecido & Tecnologia' : 'Fabric & Tech'}</span>
                </h4>
                {selectedFabricFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedFabricFilter('all')}
                    className="text-[9px] font-bold text-gray-500 hover:text-black uppercase cursor-pointer"
                  >
                    {lang === 'pt' ? 'Todos' : 'All'}
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {FABRIC_FILTERS.map((ff) => {
                  const isSelected = selectedFabricFilter === ff.id;
                  return (
                    <button
                      key={ff.id}
                      type="button"
                      onClick={() => setSelectedFabricFilter(ff.id)}
                      className={`w-full flex items-center justify-between p-2 text-left text-[10px] font-black uppercase tracking-wider border transition cursor-pointer ${
                        isSelected
                          ? 'bg-deep-black text-gold border-deep-black shadow-xs'
                          : 'bg-white text-deep-black/75 border-gray-200 hover:border-deep-black hover:text-deep-black'
                      }`}
                    >
                      <span>{lang === 'pt' ? ff.namePt : ff.nameEn}</span>
                      {isSelected && <Check className="w-3 h-3 text-gold" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resumo de Peças Encontradas */}
            <div className="pt-3 border-t border-gray-100 text-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase">
                {filteredProducts.length} {filteredProducts.length === 1 ? (lang === 'pt' ? 'peça encontrada' : 'piece found') : (lang === 'pt' ? 'peças encontradas' : 'pieces found')}
              </span>
            </div>
          </aside>

          {/* COLUNA DIREITA: BARRA DE FILTROS ATIVOS + GRID DE PRODUTOS */}
          <div className="flex-1 min-w-0 space-y-6 w-full">
            {/* Chips de Filtros Ativos */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap p-3 bg-gold/10 border border-gold/40 animate-fadeIn">
                <span className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                  {lang === 'pt' ? 'Filtros Ativos:' : 'Active Filters:'}
                </span>
                {selectedSizeFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-deep-black text-gold text-[10px] font-black uppercase">
                    <span>{lang === 'pt' ? 'Tam' : 'Size'}: {SIZE_FILTERS.find((f) => f.id === selectedSizeFilter)?.labelPt}</span>
                    <button type="button" onClick={() => setSelectedSizeFilter('all')} className="hover:text-white cursor-pointer">✕</button>
                  </span>
                )}
                {selectedColorFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-deep-black text-gold text-[10px] font-black uppercase">
                    <span>{lang === 'pt' ? 'Cor' : 'Color'}: {COLOR_FAMILIES.find((c) => c.id === selectedColorFilter)?.namePt}</span>
                    <button type="button" onClick={() => setSelectedColorFilter('all')} className="hover:text-white cursor-pointer">✕</button>
                  </span>
                )}
                {selectedFabricFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-deep-black text-gold text-[10px] font-black uppercase">
                    <span>{lang === 'pt' ? 'Tecido' : 'Fabric'}: {FABRIC_FILTERS.find((f) => f.id === selectedFabricFilter)?.namePt}</span>
                    <button type="button" onClick={() => setSelectedFabricFilter('all')} className="hover:text-white cursor-pointer">✕</button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="ml-auto text-[10px] font-black text-red-600 hover:underline uppercase tracking-wider cursor-pointer"
                >
                  {lang === 'pt' ? 'Limpar Tudo' : 'Clear All'}
                </button>
              </div>
            )}

            {/* Grid de Produtos Gymshark: Aspect 4:5, Hover Swap, Quick Add Drawer */}
            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-deep-black/20 p-12 bg-deep-black/5 space-y-4">
                <ShoppingBag className="w-12 h-12 text-gold mx-auto" />
                <h3 className="text-base font-black uppercase tracking-wider text-deep-black">
                  {lang === 'pt' ? 'Nenhuma peça encontrada com estes filtros' : 'No pieces found matching these filters'}
                </h3>
                <p className="text-xs text-deep-black/60 max-w-md mx-auto uppercase">
                  {lang === 'pt'
                    ? 'Tente remover alguns filtros ou selecionar outras cores e tamanhos para ver mais opções.'
                    : 'Try clearing some filters or selecting different colors and sizes to view more options.'}
                </p>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-deep-black text-gold text-xs font-black uppercase tracking-wider hover:bg-gold hover:text-deep-black transition shadow-sm cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{lang === 'pt' ? 'Limpar Todos os Filtros' : 'Clear All Filters'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7">
                {filteredProducts.map((product) => {
                  const isHovered = hoveredProduct === product.id;
                  const isSpoiler = isProductSpoiler(product);
                  const isFavorited = !!wishlist[product.id];
                  const wasJustAdded = quickAddedItem?.id === product.id;

                  // Badges promocionais: nunca exibe sobre spoiler
                  const showTopPromoBadge = !isSpoiler && Boolean(product.badgeEn && product.badgeEn !== 'PRE-ORDER' && product.badgePt !== 'PRÉ-VENDA' && product.badgePt !== 'SPOILER');

                  // Extrai estritamente os tamanhos com estoque real disponível (> 0)
                  const inStockSizes = getProductInStockSizes(product);
                  const isOutOfStock = !isSpoiler && inStockSizes.length === 0;

                  return (
                    <div
                      key={product.id}
                      onMouseEnter={() => setHoveredProduct(product.id)}
                      onMouseLeave={() => {
                        setHoveredProduct(null);
                        setCardImageOverrides((prev) => {
                          if (!prev[product.id]) return prev;
                          const next = { ...prev };
                          delete next[product.id];
                          return next;
                        });
                      }}
                      className="group flex flex-col bg-white border border-deep-black/15 transition-all hover:border-deep-black hover:shadow-luxury"
                    >
                      {/* 1. Imagem do Produto em Proporção Atlética 4:5 */}
                      <div className="relative aspect-[4/5] bg-deep-black/5 overflow-hidden">
                        <Link href={`/produto/${product.slug}`} className="block w-full h-full">
                          {/* Imagem Frontal com Crossfade para Pose de Ação */}
                          <img
                            src={cardImageOverrides[product.id] || (isHovered ? product.secondaryImage : product.primaryImage)}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </Link>

                        {/* Tag ESGOTADO em Vermelho ou Badges Promocionais no Topo Esquerdo */}
                        {isOutOfStock && (
                          <div className="absolute top-3 left-3 z-10 pointer-events-none">
                            <span className="text-[9.5px] uppercase tracking-widest px-2.5 py-1 font-black shadow-md bg-red-600 text-white border border-red-700">
                              {lang === 'pt' ? 'ESGOTADO' : 'SOLD OUT'}
                            </span>
                          </div>
                        )}
                        {showTopPromoBadge && !isOutOfStock && (
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                            <span
                              className={`text-[9px] uppercase tracking-widest px-2.5 py-1 font-black shadow-sm ${product.badgeStyle}`}
                            >
                              {translateBadgeText(lang === 'pt' ? product.badgePt : product.badgeEn, lang)}
                            </span>
                          </div>
                        )}

                        {/* Botões do Topo Direito (Favoritos e Compartilhar Peça) */}
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShareModalProduct(product);
                            }}
                            className="p-2 bg-white/90 hover:bg-gold hover:text-deep-black text-deep-black backdrop-blur-md rounded-full shadow-sm transition-all hover:scale-110"
                            title={lang === 'pt' ? 'Compartilhar produto' : 'Share product'}
                            aria-label={lang === 'pt' ? 'Compartilhar produto' : 'Share product'}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleWishlist(product.id);
                            }}
                            className="p-2 bg-white/90 hover:bg-white text-deep-black backdrop-blur-md rounded-full shadow-sm transition-all hover:scale-110"
                            aria-label="Save to Wishlist"
                          >
                            <Heart
                              className={`w-4 h-4 transition ${
                                isFavorited ? 'fill-gold text-gold' : 'text-deep-black'
                              }`}
                            />
                          </button>
                        </div>

                        {/* ASSINATURA GYMSHARK: GAVETA DE QUICK ADD DE TAMANHOS NO HOVER */}
                        <div
                          className={`absolute bottom-0 left-0 right-0 z-20 bg-deep-black/95 backdrop-blur-md border-t border-gold/30 p-3 transition-all duration-300 transform ${
                            isHovered || wasJustAdded
                              ? 'translate-y-0 opacity-100'
                              : 'translate-y-full opacity-0 pointer-events-none'
                          }`}
                        >
                          {isSpoiler ? (
                            <div className="text-center py-1">
                              <Link
                                href={`/produto/${product.slug}`}
                                className="py-2.5 px-3 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition text-center cursor-pointer shadow-xs"
                              >
                                <span>{lang === 'pt' ? '👀 VER SPOILER DA PEÇA' : '👀 VIEW SPOILER'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          ) : wasJustAdded ? (
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
                                <span>{lang === 'pt' ? 'GRADE EM ESTOQUE' : 'IN STOCK SIZES'}</span>
                              </div>

                              {/* Botões de Tamanhos Rápidos: SOMENTE TAMANHOS COM ESTOQUE */}
                              <div className="grid grid-cols-3 gap-1.5">
                                {inStockSizes.map((size) => {
                                  const upperSz = size.toUpperCase();
                                  const displaySz = lang === 'pt'
                                    ? (upperSz === 'S' || upperSz === 'P' ? 'P' : upperSz === 'M' ? 'M' : upperSz === 'L' || upperSz === 'G' ? 'G' : upperSz === 'XL' || upperSz === 'GG' ? 'GG' : size)
                                    : size;
                                  return (
                                    <button
                                      key={size}
                                      onClick={(e) => handleQuickAdd(product.id, size, e)}
                                      className="py-1.5 text-xs font-black uppercase bg-white/10 hover:bg-gold hover:text-deep-black text-white border border-white/20 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                                      title={`Add size ${size} directly to bag`}
                                    >
                                      {displaySz}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Informações do Produto com GRADE DE TAMANHO EM DESTAQUE */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                        <div>
                          {/* Swatches de Cores (Bolinhas) */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              {product.colors.map((color, cIdx) => {
                                const matchingVar = Array.isArray(product.variants)
                                  ? product.variants.find(
                                      (v: any) =>
                                        v.color?.toLowerCase() === color.name.toLowerCase() &&
                                        (v.image || (Array.isArray(v.images) && v.images.length > 0))
                                    )
                                  : null;
                                const colorImg = matchingVar
                                  ? (Array.isArray(matchingVar.images) && matchingVar.images.length > 0 ? matchingVar.images[0] : matchingVar.image)
                                  : null;

                                return (
                                  <span
                                    key={cIdx}
                                    onMouseEnter={() => {
                                      if (colorImg) {
                                        setCardImageOverrides((prev) => ({ ...prev, [product.id]: colorImg }));
                                      }
                                    }}
                                    onClick={(e) => {
                                      if (colorImg) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setCardImageOverrides((prev) => ({ ...prev, [product.id]: colorImg }));
                                      }
                                    }}
                                    className="w-3.5 h-3.5 rounded-full border border-deep-black/30 shadow-xs cursor-pointer transition hover:scale-125"
                                    style={{ backgroundColor: color.hex }}
                                    title={translateColorName(color.name, lang)}
                                  />
                                );
                              })}
                            </div>

                            <div className="flex items-center gap-1 text-[11px] font-bold text-deep-black/60">
                              <Star className="w-3 h-3 fill-gold text-gold" />
                              <span className="text-deep-black font-black">{product.rating.toFixed(1)}</span>
                              <span>({product.reviewsCount})</span>
                            </div>
                          </div>

                          {/* Título do Produto */}
                          <Link href={`/produto/${product.slug}`}>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              {isOutOfStock && (
                                <span className="px-1.5 py-0.5 bg-red-600 text-white text-[8.5px] font-black uppercase tracking-wider shrink-0 shadow-xs">
                                  {lang === 'pt' ? 'ESGOTADO' : 'SOLD OUT'}
                                </span>
                              )}
                              <h3 className="text-sm font-black uppercase tracking-wider text-deep-black group-hover:text-gold transition line-clamp-1">
                              {translateProductTitle(product.title, lang)}
                              </h3>
                            </div>
                          </Link>

                          {/* TAMANHOS DISPONÍVEIS EM ESTOQUE (Exibição Imediata na Vitrine) */}
                          <div className="mt-2.5 pt-2 border-t border-deep-black/10 flex items-center justify-between gap-1 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-black uppercase tracking-wider text-deep-black/60">
                                {lang === 'pt' ? 'Tamanhos:' : 'Sizes:'}
                              </span>
                              {inStockSizes.length > 0 ? (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {inStockSizes.map((sz) => {
                                    const displaySz = lang === 'pt'
                                      ? (sz === 'S' ? 'P' : sz === 'L' ? 'G' : sz === 'XL' ? 'GG' : sz)
                                      : sz;
                                    return (
                                      <span
                                        key={sz}
                                        className="text-[9.5px] font-black px-2 py-0.5 border border-deep-black bg-deep-black text-gold shadow-2xs uppercase tracking-wider rounded-xs"
                                        title={`${lang === 'pt' ? 'Disponível no tamanho' : 'Available in size'} ${displaySz}`}
                                      >
                                        {displaySz}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-[9px] font-bold text-red-600 uppercase">
                                  {lang === 'pt' ? 'Esgotado' : 'Sold out'}
                                </span>
                              )}
                            </div>

                            {inStockSizes.length > 0 && !isSpoiler && (
                              <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 uppercase tracking-tight shrink-0">
                                {lang === 'pt' ? 'Pronta Entrega' : 'In Stock'}
                              </span>
                            )}
                          </div>
                        </div>

                        {isProductInCombo(product) && !isSpoiler && !isOutOfStock && (
                          <Link
                            href={`/produto/${product.slug}`}
                            className="p-2.5 bg-emerald-50 border-2 border-emerald-500 text-emerald-950 block space-y-1 hover:bg-emerald-100/80 transition"
                          >
                            <div className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-emerald-800">
                              <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{translateBadgeText(comboPromo?.badge_text || 'COMBO 3 PEÇAS', lang)}</span>
                            </div>
                            <p className="text-[10.5px] font-bold text-emerald-950 leading-snug">
                              {lang === 'pt'
                                ? `Esta peça participa da promoção: ${Number(comboPromo?.required_quantity) || 3} peças pelo valor $${Number(comboPromo?.bundle_price || 120).toFixed(2)}. Adicione essa peça na sua sacola e faltará pouco para você participar da promoção.`
                                : `This piece is part of our promo: ${Number(comboPromo?.required_quantity) || 3} pieces for $${Number(comboPromo?.bundle_price || 120).toFixed(2)}. Add this piece to your bag and you're close to unlocking the deal!`}
                            </p>
                          </Link>
                        )}

                        {/* Preço em Dólar ($) e Frete Fixo $9.90 */}
                        <div className="pt-2.5 border-t border-deep-black/10 flex items-baseline justify-between">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-base font-black text-deep-black uppercase tracking-wider">
                                ${product.price.toFixed(2)}
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-deep-black/40 line-through font-bold">
                                    ${product.originalPrice.toFixed(2)}
                                  </span>
                                  <span className="text-[8.5px] font-black bg-red-600 text-white px-1.5 py-0.5">
                                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] block text-deep-black/60 font-bold uppercase tracking-wider">
                              $9.90 FLAT RATE US SHIPPING
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-bold tracking-wide px-2.5 py-1 border shrink-0 ${
                              isSpoiler
                                ? 'bg-deep-black text-gold border-gold shadow-sm font-black'
                                : 'bg-white text-deep-black border-deep-black'
                            }`}
                          >
                            {isSpoiler
                              ? (lang === 'pt' ? '👀 Spoiler • Em breve' : '👀 Spoiler • Coming soon')
                              : (lang === 'pt' ? 'Em estoque' : 'In stock')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          BANNER PROMOCIONAL DE MEIO DE PÁGINA (CAMPAIGN BANNER EDITÁVEL)
         ========================================================================= */}
      {siteInfo.promoBanner?.active && (
        <section className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="relative overflow-hidden border-2 border-gold/40 shadow-2xl min-h-[340px] flex items-center bg-deep-black">
            {siteInfo.promoBanner.bgImage && (
              <picture className="absolute inset-0 w-full h-full">
                {siteInfo.promoBanner.mobileBgImage && (
                  <source media="(max-width: 640px)" srcSet={siteInfo.promoBanner.mobileBgImage} />
                )}
                <img
                  src={siteInfo.promoBanner.bgImage}
                  alt={siteInfo.promoBanner.title}
                  className="w-full h-full object-cover opacity-40 scale-105 transition-transform duration-1000"
                />
              </picture>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-deep-black via-deep-black/85 to-transparent" />

            <div className="relative z-10 p-6 sm:p-12 max-w-2xl text-white space-y-4">
              {siteInfo.promoBanner.badge && (
                <span className="inline-block px-3 py-1 bg-gold text-deep-black text-[10px] font-black uppercase tracking-widest">
                  {translateDynamicContent(siteInfo.promoBanner.badge, lang)}
                </span>
              )}

              <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                {translateDynamicContent(siteInfo.promoBanner.title, lang)}
              </h3>

              {siteInfo.promoBanner.subtitle && (
                <p className="text-xs sm:text-sm text-white/80 uppercase tracking-wider leading-relaxed font-medium">
                  {translateDynamicContent(siteInfo.promoBanner.subtitle, lang)}
                </p>
              )}

              {siteInfo.promoBanner.ctaText && (
                <div className="pt-2">
                  <a
                    href={siteInfo.promoBanner.ctaLink || '#vitrine'}
                    target={siteInfo.promoBanner.ctaLink?.startsWith('http') ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-widest transition shadow-lg group border border-gold"
                  >
                    <span>{translateDynamicContent(siteInfo.promoBanner.ctaText, lang)}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          4. GYMSHARK EDITORIAL TECH SPLIT ("CONDITIONING & FABRIC ENGINEERING")
         ========================================================================= */}
      {(siteInfo.techSection?.active ?? true) && (
        <section className="bg-deep-black text-white py-20 px-4 sm:px-8 border-y-2 border-gold/30">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Lado Esquerdo: Tipografia Editorial Gymshark */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-gold/40 text-[10px] font-black uppercase tracking-widest text-gold">
                <Zap className="w-3.5 h-3.5 text-gold" />
                <span>{translateDynamicContent(siteInfo.techSection?.badge || 'SQUAT-PROOF LAB CERTIFICATION', lang)}</span>
              </div>

              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[0.95] text-white">
                {translateDynamicContent(siteInfo.techSection?.title1 || 'ENGINEERED FOR SQUATS.', lang)}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gold-light to-gold">
                  {translateDynamicContent(siteInfo.techSection?.title2 || 'SCULPTED FOR STRENGTH.', lang)}
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-white/80 uppercase tracking-widest leading-relaxed font-medium">
                {lang === 'pt'
                  ? (siteInfo.techSection?.descriptionPt || 'Confeccionado com poliamida brasileira de alta tenacidade e elastano premium. Não marca, não escorrega e garante cobertura 100% opaca mesmo sob iluminação direta e extensão máxima.')
                  : (siteInfo.techSection?.descriptionEn || 'Crafted with premium high-tenacity polyamide and elastic compression. Glides with your motion, never slips down, and guarantees 100% opaque squat coverage even under harsh studio lighting.')}
              </p>

              {/* Grid 2x2 de Especificações Técnicas */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                {(siteInfo.techSection?.specs || [
                  { value: '100%', title: 'ZERO SEE-THROUGH', subtitlePt: 'Testado em agachamento profundo', subtitleEn: 'Deep squat tested & verified' },
                  { value: '4-WAY', title: 'MUSCLE COMPRESSION', subtitlePt: 'Modela sem prender a circulação', subtitleEn: 'Contours without restricting' },
                  { value: 'REMOVABLE', title: 'MOLDED BRA CUPS', subtitlePt: 'Bojo anatômico com suporte', subtitleEn: 'Customizable shape & support' },
                  { value: 'FLATLOCK', title: 'ANTI-CHAFING SEAMS', subtitlePt: 'Costura plana sem atrito', subtitleEn: 'Zero skin friction in training' },
                ]).map((spec, sIdx) => (
                  <div key={sIdx} className="space-y-1">
                    <span className="text-2xl sm:text-3xl font-black text-gold block">{spec.value}</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">{translateDynamicContent(spec.title, lang)}</h4>
                    <p className="text-[10px] text-white/60 uppercase font-medium">
                      {lang === 'pt' ? spec.subtitlePt : spec.subtitleEn}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <a
                  href={siteInfo.techSection?.ctaLink || '#vitrine'}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-widest transition shadow-lg"
                >
                  <span>{translateDynamicContent(siteInfo.techSection?.ctaText || 'EXPLORE TECHNICAL SPECS', lang)}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Lado Direito: Imagem Atlética com Selo Oficial ANA FITNESS WEAR */}
            <div className="lg:col-span-6 relative aspect-[4/5] overflow-hidden border-2 border-gold/30 shadow-2xl">
              <img
                src={siteInfo.techSection?.image || siteImages.techSectionImage || "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80"}
                alt="Tecnologia Têxtil Ana Fitness"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-transparent to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-deep-black/95 backdrop-blur-md border border-gold/40 flex items-center justify-between text-xs font-black uppercase tracking-widest">
                <span className="flex items-center gap-2.5">
                  <img src={siteImages.symbolUrl || "/symbol-ana-fitness.png"} alt="Selo Oficial" className="w-6 h-6 object-contain" />
                  <span className="text-white">{siteInfo.storeName || 'ANA FITNESS ATELIER'} • {siteInfo.address ? siteInfo.address.split('•')[0].trim() : 'LEOMINSTER, MA'}</span>
                </span>
                <span className="text-gold">{lang === 'pt' ? '✨VISTA SUA FORÇA✨' : '✨WEAR YOUR STRENGTH✨'}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          5. SEÇÃO ATLETAS ANA FITNESS • ÚLTIMOS PRODUTOS VENDIDOS
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-deep-black pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-ultra text-gold block">
                {lang === 'pt' ? 'PROVA SOCIAL • VENDAS EM TEMPO REAL NOS EUA' : 'SOCIAL PROOF • REAL-TIME US DELIVERIES'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-deep-black mt-0.5">
              {lang === 'pt' ? 'ATLETAS ANA FITNESS • ÚLTIMOS PRODUTOS VENDIDOS' : 'ANA FITNESS ATHLETES • RECENTLY SOLD'}
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

        {/* Grid dos Últimos Produtos Vendidos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {(recentSoldProducts.length > 0 ? recentSoldProducts.slice(0, 12) : communityPostsData).map((post: any, idx: number) => {
            const isSoldProduct = Boolean(post.soldAt || post.slug);
            const productHref = post.slug ? `/produto/${post.slug}` : (siteInfo.instagramUrl || "https://www.instagram.com/anafitnessweareua");
            const customerLabel = post.customerName ? `${lang === 'pt' ? 'Comprado por' : 'Purchased by'} ${post.customerName}` : post.user;
            const locationLabel = post.location || (lang === 'pt' ? 'EUA' : 'USA');
            const sizeLabel = post.size ? `${lang === 'pt' ? 'TAM' : 'SIZE'} ${post.size}` : '';

            return (
              <Link
                key={post.id || idx}
                href={productHref}
                className="group relative aspect-square overflow-hidden bg-stone-100 border border-deep-black/15 hover:border-gold hover:shadow-xl transition-all block"
              >
                <img
                  src={post.image}
                  alt={post.title || post.user || 'Produto Vendido'}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-700"
                />

                {/* Badge Superior "Vendido" */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-deep-black/90 text-gold border border-gold/40 text-[9px] font-black uppercase tracking-wider shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{lang === 'pt' ? 'VENDIDO' : 'SOLD'} {sizeLabel ? `• ${sizeLabel}` : ''}</span>
                </div>

                {/* Overlay Inferior com Detalhes */}
                <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-white">
                  <span className="text-[10px] font-black uppercase tracking-wider block text-white line-clamp-1">
                    {translateProductTitle(post.title || post.piece, lang)}
                  </span>
                  <div className="flex items-center justify-between text-[9px] font-bold text-gold mt-0.5">
                    <span>{customerLabel}</span>
                    {post.price && <span>${post.price.toFixed(2)}</span>}
                  </div>
                  <span className="text-[8px] text-white/70 uppercase block">
                    📍 {locationLabel}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Botão de Ver Todo o Catálogo / Seguir */}
        <div className="text-center pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition shadow-md border border-deep-black"
          >
            <ShoppingBag className="w-4 h-4 text-gold group-hover:text-deep-black" />
            <span>{lang === 'pt' ? 'EXPLORAR CATÁLOGO COMPLETO' : 'EXPLORE FULL CATALOG'}</span>
          </Link>
          <a
            href={siteInfo.instagramUrl || "https://www.instagram.com/anafitnessweareua"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-deep-black text-deep-black hover:text-white text-xs font-black uppercase tracking-widest transition shadow-sm border border-deep-black"
          >
            <Instagram className="w-4 h-4 text-gold" />
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

        {/* Card do Depoimento com Contraste Gymshark Dinâmico */}
        {(() => {
          const testimonialsList = (siteInfo.testimonialsList && siteInfo.testimonialsList.length > 0)
            ? siteInfo.testimonialsList
            : TESTIMONIALS;
          const currentT = testimonialsList[activeTestimonial % testimonialsList.length] || testimonialsList[0];

          return (
            <div className="bg-white border-2 border-deep-black p-8 sm:p-12 relative shadow-luxury">
              <p className="text-base sm:text-xl font-bold uppercase tracking-wide text-deep-black leading-relaxed text-center italic">
                "{lang === 'pt' ? currentT.textPt : (currentT.textEn || currentT.textPt)}"
              </p>

              <div className="mt-8 text-center space-y-1 border-t border-deep-black/10 pt-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-deep-black">
                  {currentT.author}
                </h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-gold">
                  {currentT.location} • VERIFIED US BUYER
                </p>
              </div>

              {/* Navegação do Carrossel */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  type="button"
                  onClick={() =>
                    setActiveTestimonial((prev) => (prev === 0 ? testimonialsList.length - 1 : prev - 1))
                  }
                  className="p-2 border border-deep-black text-deep-black hover:bg-deep-black hover:text-white transition cursor-pointer"
                  aria-label="Previous Testimonial"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-2">
                  {testimonialsList.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveTestimonial(i)}
                      className={`h-2 transition-all cursor-pointer ${
                        i === activeTestimonial % testimonialsList.length ? 'bg-gold w-6' : 'bg-deep-black/20 w-2'
                      }`}
                      aria-label={`Go to testimonial ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setActiveTestimonial((prev) => (prev === testimonialsList.length - 1 ? 0 : prev + 1))
                  }
                  className="p-2 border border-deep-black text-deep-black hover:bg-deep-black hover:text-white transition cursor-pointer"
                  aria-label="Next Testimonial"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}
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

      {/* Modal de Compartilhamento de Produto Universal */}
      <ProductShareModal
        isOpen={Boolean(shareModalProduct)}
        onClose={() => setShareModalProduct(null)}
        product={shareModalProduct}
        lang={lang}
      />
    </div>
  );
}
