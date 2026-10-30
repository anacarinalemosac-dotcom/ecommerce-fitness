'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translateEnToPt, translatePtToEn, isPortugueseText } from '../lib/translateFitness';

export interface AdminUser {
  isLoggedIn: boolean;
  name: string;
  email: string;
  role: 'owner' | 'manager';
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  passwords: string[];
  role: 'owner' | 'manager';
}

export const DEFAULT_ADMIN_PROFILES: AdminProfile[] = [
  {
    id: 'admin-ana',
    name: 'Ana Carina',
    email: 'anafitweareua@gmail.com',
    passwords: ['ana2026', 'admin123', 'anafit2026', 'anafitwear', '1234'],
    role: 'owner',
  },
  {
    id: 'admin-mayne',
    name: 'Mayne',
    email: 'anacarinalemos.ac@gmail.com',
    passwords: ['Anafit1234', 'anafit1234', 'ana2026', 'admin123'],
    role: 'owner',
  },
];

export interface HeroBannerSlide {
  id: string;
  active: boolean;
  mediaType: 'video' | 'image';
  videoUrl?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  badge: string;
  title1: string;
  title2: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export interface AnnouncementBarConfig {
  active: boolean;
  textPt: string;
  textEn: string;
  link?: string;
  badgeText?: string;
  bgColor: string;
  textColor: string;
}

export interface PromoBannerConfig {
  active: boolean;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bgImage: string;
  mobileBgImage?: string;
  bgColor: string;
}

export interface TechSectionConfig {
  active: boolean;
  badge: string;
  title1: string;
  title2: string;
  descriptionPt: string;
  descriptionEn: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  specs: Array<{
    value: string;
    title: string;
    subtitlePt: string;
    subtitleEn: string;
  }>;
}

export interface CommunityPostItem {
  image: string;
  user: string;
  piece: string;
}

export interface TestimonialItem {
  id: string;
  author: string;
  location: string;
  rating: number;
  textPt: string;
  textEn: string;
}

export interface SiteInfo {
  storeName: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  instagramUrl: string;
  venmo?: string;
  address: string;
  flatShippingRate: number;
  returnDays: number;
  tickerSlogan: string;
  tickerShipping: string;
  heroTitle1: string;
  heroTitle2: string;
  heroSubtitle: string;
  // CMS Vitrine: Banners Hero, Faixa de Topo, Promocional, Tecnologia e Depoimentos
  heroBanners?: HeroBannerSlide[];
  announcementBar?: AnnouncementBarConfig;
  promoBanner?: PromoBannerConfig;
  techSection?: TechSectionConfig;
  communityImages?: CommunityPostItem[];
  testimonialsList?: TestimonialItem[];
  // CMS Visual: Paleta de cores, tipografia e páginas institucionais
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  ctaColor?: string;
  headingFont?: string;
  bodyFont?: string;
  aboutUsText?: string;
  returnPolicyText?: string;
  shippingPolicyText?: string;
  contactText?: string;
  // Pixels de Rastreamento & Analytics
  metaPixelId?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  tiktokPixelId?: string;
  pinterestTagId?: string;
  // TikTok Shop Open API (Sincronização Direta em Tempo Real)
  tiktokShopAppKey?: string;
  tiktokShopAppSecret?: string;
  tiktokShopAccessToken?: string;
  tiktokShopId?: string;
  tiktokShopCipher?: string;
  tiktokShopAutoSync?: boolean;
}

export interface SiteImages {
  heroVideo: string;
  heroPoster: string;
  techSectionImage: string;
  logoUrl: string;
  symbolUrl: string;
  categoryImages: {
    sets: string;
    rompers: string;
    jumpsuits: string;
    tops: string;
    preorder: string;
  };
  communityImages: Array<{
    image: string;
    user: string;
    piece: string;
  }>;
}

export interface ProductItem {
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
  costPrice: number;
  badgePt: 'BEST SELLER' | 'PRÉ-VENDA' | 'LANÇAMENTO' | 'SPOILER';
  badgeEn: 'BEST SELLER' | 'PRE-ORDER' | 'NEW ARRIVAL' | 'SPOILER';
  badgeStyle: string;
  rating: number;
  reviewsCount: number;
  primaryImage: string;
  secondaryImage: string;
  galleryImages?: string[];
  colors: Array<{ name: string; hex: string }>;
  sizes: string[];
  sizeStock?: Record<string, number>;
  stock: number;
  allowBackorder: boolean;
  productionDays: number;
  zeroTransparency: boolean;
  removableCups: boolean;
  hasCups?: boolean;
  cupsType?: 'removable' | 'fixed' | 'none';
  sku: string;
  barcode: string;
  variants?: any[];
  composition?: string;
  sizeGuide?: string;
  tags?: string[];
  visibleOnline?: boolean;
  visiblePos?: boolean;
  ribbon?: string;
  brand?: string;
  comparePrice?: number;
  productType?: string;
  media_list?: any[];
  description?: string;
  descriptionPt?: string;
  descriptionEn?: string;
}

interface StoreSettingsContextType {
  adminUser: AdminUser;
  adminProfiles: AdminProfile[];
  siteInfo: SiteInfo;
  siteImages: SiteImages;
  products: ProductItem[];
  loginAdmin: (email: string, pass: string) => boolean;
  logoutAdmin: () => void;
  changeMasterPassword: (newPass: string) => void;
  updateSiteInfo: (info: Partial<SiteInfo>) => void;
  updateSiteImages: (images: Partial<SiteImages>) => void;
  addProduct: (product: Omit<ProductItem, 'id'>) => ProductItem;
  updateProduct: (id: string, updated: Partial<ProductItem>) => void;
  deleteProduct: (id: string) => void;
  resetToDefaults: () => void;
  refreshProducts: () => Promise<void>;
}

export const DEFAULT_HERO_BANNERS: HeroBannerSlide[] = [
  {
    id: 'hero-1',
    active: true,
    mediaType: 'video',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-squats-in-a-gym-40502-large.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1800&q=80',
    mobileImageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    badge: 'ESTOQUE EUA • FRETE FIXO $9.99 P/ TODOS OS ESTADOS',
    title1: 'WEAR YOUR',
    title2: 'STRENGTH.',
    subtitle: 'Moda fitness de alta performance sediada em Massachusetts. Zero transparência testada em agachamentos, compressão anatômica 4-way e frete fixo de $9.99.',
    primaryCtaText: 'COMPRAR COLEÇÃO',
    primaryCtaLink: '#vitrine',
    secondaryCtaText: 'PRÉ-ORDER ATELIER',
    secondaryCtaLink: '/?cat=preorder',
  },
  {
    id: 'hero-2',
    active: true,
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1800&q=80',
    mobileImageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80',
    badge: 'NOVA COLEÇÃO ATELIER 2026',
    title1: 'HIGH PERFORMANCE',
    title2: 'FIT LUXURY.',
    subtitle: 'Peças exclusivas desenvolvidas com poliamida brasileira de alta tenacidade. Modelagem anatômica que valoriza suas curvas.',
    primaryCtaText: 'VER LANÇAMENTOS',
    primaryCtaLink: '#vitrine',
    secondaryCtaText: 'CONJUNTOS & SETS',
    secondaryCtaLink: '/?cat=sets',
  },
];

export const DEFAULT_ANNOUNCEMENT_BAR: AnnouncementBarConfig = {
  active: true,
  textPt: '✨ FRETE FIXO DE $9.99 PARA TODOS OS 50 ESTADOS DOS EUA • FRETE GRÁTIS EM COMPRAS ACIMA DE $75 COM CUPOM FRETEGRATIS ✨',
  textEn: '✨ FLAT RATE $9.99 SHIPPING ACROSS ALL 50 US STATES • FREE SHIPPING OVER $75 WITH CODE FRETEGRATIS ✨',
  link: '#vitrine',
  badgeText: 'PROMOÇÃO',
  bgColor: '#0A0A0A',
  textColor: '#D4AF37',
};

export const DEFAULT_PROMO_BANNER: PromoBannerConfig = {
  active: true,
  badge: 'DESTAQUE EXCLUSIVO • ATELIER LEOMINSTER',
  title: 'ENCOMENDAS SOB MEDIDA & PEÇAS PRONTA ENTREGA',
  subtitle: 'Não encontrou o seu tamanho disponível? Confeccionamos sob medida especialmente para você em nosso ateliê com entrega em todo território americano.',
  ctaText: 'ENCOMENDAR VIA WHATSAPP',
  ctaLink: 'https://wa.me/19783139452',
  bgImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&q=80',
  mobileBgImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
  bgColor: '#0A0A0A',
};

export const DEFAULT_TECH_SECTION: TechSectionConfig = {
  active: true,
  badge: 'SQUAT-PROOF LAB CERTIFICATION',
  title1: 'ENGINEERED FOR SQUATS.',
  title2: 'SCULPTED FOR STRENGTH.',
  descriptionPt: 'Confeccionado com poliamida brasileira de alta tenacidade e elastano premium. Não marca, não escorrega e garante cobertura 100% opaca mesmo sob iluminação direta e extensão máxima.',
  descriptionEn: 'Crafted with premium high-tenacity polyamide and elastic compression. Glides with your motion, never slips down, and guarantees 100% opaque squat coverage even under harsh studio lighting.',
  image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
  ctaText: 'CONHECER MODELAGENS',
  ctaLink: '#vitrine',
  specs: [
    { value: '100%', title: 'ZERO SEE-THROUGH', subtitlePt: 'Testado em agachamento profundo', subtitleEn: 'Deep squat tested & verified' },
    { value: '4-WAY', title: 'MUSCLE COMPRESSION', subtitlePt: 'Modela sem prender a circulação', subtitleEn: 'Contours without restricting' },
    { value: 'REMOVABLE', title: 'MOLDED BRA CUPS', subtitlePt: 'Bojo anatômico com suporte', subtitleEn: 'Customizable shape & support' },
    { value: 'FLATLOCK', title: 'ANTI-CHAFING SEAMS', subtitlePt: 'Costura plana sem atrito', subtitleEn: 'Zero skin friction in training' },
  ],
};

export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't-1',
    author: 'MARIANA SALLES',
    location: 'Boston, MA',
    rating: 5,
    textPt: 'A qualidade das peças da Ana Fitness Wear é surreal! O macaquinho Samanta veste perfeitamente sem ficar nada transparente no agachamento. Comprei aqui em Massachusetts e chegou em 2 dias com o frete de $9.99.',
    textEn: 'The quality of Ana Fitness Wear pieces is surreal! The Samanta romper fits like a dream with zero see-through during deep squats. Ordered here in Massachusetts and arrived in 2 days with the flat $9.99 shipping.',
  },
  {
    id: 't-2',
    author: 'BEATRIZ FIGUEIREDO',
    location: 'Miami, FL',
    rating: 5,
    textPt: 'Fiz a encomenda do conjunto Kely sob medida porque meu tamanho estava esgotado. A confecção cumpriu o prazo certinho e o bojo removível dá uma sustentação maravilhosa. Vale cada centavo.',
    textEn: 'I pre-ordered the Kely pants set because my size was out of stock. Production was on time and the removable cups provide wonderful support. Worth every penny.',
  },
  {
    id: 't-3',
    author: 'CAROLINA ALMEIDA',
    location: 'Orlando, FL',
    rating: 5,
    textPt: 'O top Bailarina é o melhor top que já usei na vida. Não machuca os ombros e segura perfeitamente na corrida. A equipe pelo WhatsApp me ajudou com as medidas exatas.',
    textEn: 'The Bailarina Top is hands-down the best top I have ever owned. Doesn’t dig into shoulders and provides high support for running. Concierge on WhatsApp helped me pick the right size.',
  },
];

const DEFAULT_SITE_INFO: SiteInfo = {
  storeName: 'ANA FITNESS WEAR',
  phone: '+1 (978) 313-9452',
  whatsapp: '19783139452',
  instagram: '@anafitnessweareua',
  instagramUrl: 'https://www.instagram.com/anafitnessweareua',
  venmo: '@Accleaningproservices',
  address: 'Leominster, MA 01453 • United States',
  flatShippingRate: 9.99,
  returnDays: 30,
  tickerSlogan: '✨ WEAR YOUR STRENGTH ✨',
  tickerShipping: 'FLAT RATE SHIPPING $9.99 ACROSS ALL 50 US STATES',
  heroTitle1: 'WEAR YOUR',
  heroTitle2: 'STRENGTH.',
  heroSubtitle: 'High-performance athletic luxury based in Massachusetts. Lab-verified zero see-through, 4-way anatomical sculpt compression, and flat $9.99 shipping across all 50 US States.',
  heroBanners: DEFAULT_HERO_BANNERS,
  announcementBar: DEFAULT_ANNOUNCEMENT_BAR,
  promoBanner: DEFAULT_PROMO_BANNER,
  techSection: DEFAULT_TECH_SECTION,
  testimonialsList: DEFAULT_TESTIMONIALS,
  primaryColor: '#0A0A0A',
  secondaryColor: '#D4AF37',
  backgroundColor: '#FFFFFF',
  ctaColor: '#0A0A0A',
  headingFont: 'Montserrat',
  bodyFont: 'Inter',
  aboutUsText: 'A ANA FITNESS WEAR LLC nasceu em Leominster, Massachusetts, criada para atender a mulher que busca performance atlética sem abrir mão da sofisticação e elegância. Peças com zero transparência, compressão anatômica 4-way e tecidos tecnológicos de padrão internacional.',
  returnPolicyText: 'Você tem até 30 dias corridos após o recebimento para solicitar troca ou devolução. As peças devem estar em perfeito estado, sem uso, com as etiquetas originais afixadas e na embalagem original.',
  shippingPolicyText: 'Enviamos para todos os 50 estados dos Estados Unidos via USPS Priority Mail com taxa fixa de $9.99. O prazo de postagem para pronta-entrega é de até 24h úteis. Peças confeccionadas sob medida possuem prazo de produção informado na compra.',
  contactText: 'Nosso atendimento oficial está disponível de Segunda a Sexta, das 9h às 18h (EST). WhatsApp: +1 (978) 313-9452 • E-mail: anafitweareua@gmail.com • Leominster, MA.',
  metaPixelId: '',
  googleAnalyticsId: '',
  googleTagManagerId: '',
  tiktokPixelId: '',
  pinterestTagId: '',
  tiktokShopAppKey: '',
  tiktokShopAppSecret: '',
  tiktokShopAccessToken: '',
  tiktokShopId: '7494943021231081116',
  tiktokShopCipher: '',
  tiktokShopAutoSync: false,
};

const DEFAULT_SITE_IMAGES: SiteImages = {
  heroVideo: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-squats-in-a-gym-40502-large.mp4',
  heroPoster: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1800&q=80',
  techSectionImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
  logoUrl: '/logo-ana-fitness.png',
  symbolUrl: '/symbol-ana-fitness.png',
  categoryImages: {
    sets: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700&q=80',
    rompers: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80',
    jumpsuits: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=700&q=80',
    tops: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=700&q=80',
    preorder: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80',
  },
  communityImages: [
    { image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80', user: '@marianasalles_fit', piece: 'Samanta Romper' },
    { image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80', user: '@beatriz_fitness', piece: 'Bailarina Top' },
    { image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80', user: '@carol_almeida_us', piece: 'Monique Set' },
    { image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80', user: '@juliana_bostonfit', piece: 'Kely Pants Set' },
    { image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80', user: '@vanessa_conditioning', piece: 'Raissa Jumpsuit' },
    { image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&q=80', user: '@camila_athlete_ma', piece: 'Deluxe Romper' },
  ],
};

const DEFAULT_PRODUCTS: ProductItem[] = [
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
    costPrice: 16.0,
    badgePt: 'LANÇAMENTO',
    badgeEn: 'NEW ARRIVAL',
    badgeStyle: 'bg-gold text-deep-black font-black',
    rating: 5.0,
    reviewsCount: 48,
    primaryImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&q=80',
    ],
    colors: [
      { name: 'Onyx Black', hex: '#0A0A0A' },
      { name: 'Champagne Gold', hex: '#D4AF37' },
      { name: 'Pure White', hex: '#FFFFFF' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    sizeStock: {
      XS: 0,
      S: 3,
      M: 4,
      L: 3,
      XL: 0,
    },
    stock: 10,
    allowBackorder: true,
    productionDays: 5,
    zeroTransparency: true,
    removableCups: true,
    sku: 'SAM-BLK-S',
    barcode: '789100000001',
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
    costPrice: 12.0,
    badgePt: 'BEST SELLER',
    badgeEn: 'BEST SELLER',
    badgeStyle: 'bg-deep-black text-gold border border-gold font-black',
    rating: 5.0,
    reviewsCount: 86,
    primaryImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
    ],
    colors: [
      { name: 'Onyx Black', hex: '#0A0A0A' },
      { name: 'Pure White', hex: '#FFFFFF' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    sizeStock: {
      XS: 1,
      S: 5,
      M: 5,
      L: 4,
      XL: 0,
    },
    stock: 15,
    allowBackorder: true,
    productionDays: 5,
    zeroTransparency: true,
    removableCups: true,
    sku: 'BAI-BLK-S',
    barcode: '789100000002',
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
    costPrice: 19.0,
    badgePt: 'BEST SELLER',
    badgeEn: 'BEST SELLER',
    badgeStyle: 'bg-gold text-deep-black font-black',
    rating: 4.9,
    reviewsCount: 112,
    primaryImage: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    ],
    colors: [
      { name: 'Onyx Black', hex: '#0A0A0A' },
      { name: 'Gold Champagne', hex: '#D4AF37' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    sizeStock: {
      XS: 0,
      S: 2,
      M: 3,
      L: 2,
      XL: 0,
    },
    stock: 7,
    allowBackorder: true,
    productionDays: 5,
    zeroTransparency: true,
    removableCups: true,
    sku: 'MON-GLD-M',
    barcode: '789100000003',
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
    costPrice: 16.0,
    badgePt: 'SPOILER',
    badgeEn: 'SPOILER',
    badgeStyle: 'bg-deep-black text-gold border border-gold font-black',
    rating: 5.0,
    reviewsCount: 39,
    primaryImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&q=80',
    galleryImages: [],
    colors: [
      { name: 'Onyx Black', hex: '#0A0A0A' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    sizeStock: {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
    },
    stock: 0,
    allowBackorder: false,
    productionDays: 0,
    zeroTransparency: true,
    removableCups: true,
    sku: 'KEL-BLK-M',
    barcode: '789100000004',
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
    costPrice: 18.0,
    badgePt: 'SPOILER',
    badgeEn: 'SPOILER',
    badgeStyle: 'bg-deep-black text-gold border border-gold font-black',
    rating: 4.9,
    reviewsCount: 61,
    primaryImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
    galleryImages: [],
    colors: [
      { name: 'Onyx Black', hex: '#0A0A0A' },
      { name: 'Gold Champagne', hex: '#D4AF37' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    sizeStock: {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
    },
    stock: 0,
    allowBackorder: false,
    productionDays: 0,
    zeroTransparency: true,
    removableCups: true,
    sku: 'DEL-BLK-M',
    barcode: '789100000005',
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
    costPrice: 16.0,
    badgePt: 'LANÇAMENTO',
    badgeEn: 'NEW ARRIVAL',
    badgeStyle: 'bg-white text-deep-black border border-deep-black font-black',
    rating: 5.0,
    reviewsCount: 54,
    primaryImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80',
    galleryImages: [],
    colors: [
      { name: 'Onyx Black', hex: '#0A0A0A' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    sizeStock: {
      XS: 0,
      S: 2,
      M: 2,
      L: 1,
      XL: 0,
    },
    stock: 5,
    allowBackorder: true,
    productionDays: 5,
    zeroTransparency: true,
    removableCups: true,
    sku: 'RAI-BLK-M',
    barcode: '789100000006',
  },
];

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  adminUser: { isLoggedIn: false, name: '', email: '', role: 'owner' },
  adminProfiles: DEFAULT_ADMIN_PROFILES,
  siteInfo: DEFAULT_SITE_INFO,
  siteImages: DEFAULT_SITE_IMAGES,
  products: DEFAULT_PRODUCTS,
  loginAdmin: () => false,
  logoutAdmin: () => {},
  changeMasterPassword: () => {},
  updateSiteInfo: () => {},
  updateSiteImages: () => {},
  addProduct: () => DEFAULT_PRODUCTS[0],
  updateProduct: () => {},
  deleteProduct: () => {},
  resetToDefaults: () => {},
  refreshProducts: async () => {},
});

export const StoreSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser>({
    isLoggedIn: false,
    name: 'Ana Carina',
    email: 'anafitweareua@gmail.com',
    role: 'owner',
  });

  const [adminProfiles, setAdminProfiles] = useState<AdminProfile[]>(DEFAULT_ADMIN_PROFILES);

  const [siteInfo, setSiteInfoState] = useState<SiteInfo>(DEFAULT_SITE_INFO);
  const [siteImages, setSiteImagesState] = useState<SiteImages>(DEFAULT_SITE_IMAGES);
  const [products, setProductsState] = useState<ProductItem[]>(DEFAULT_PRODUCTS);

  const syncProductsFromApi = async () => {
    try {
      const res = await fetch(`/api/backoffice/products?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length > 0) {
        const transformed: ProductItem[] = data.products.map((p: any) => {
          let meta: any = {};
          try {
            if (p.description && p.description.startsWith('{')) {
              meta = JSON.parse(p.description);
            }
          } catch (e) {}

          const variants = p.variants || [];
          const colorsMap = new Map<string, string>();
          const sizesSet = new Set<string>();
          const sizeStockMap: Record<string, number> = {};
          const allImages: string[] = [];

          variants.forEach((v: any) => {
            if (v.color) {
              const defaultHex =
                v.color.toLowerCase().includes('ouro') || v.color.toLowerCase().includes('gold') ? '#D4AF37' :
                v.color.toLowerCase().includes('amarel') ? '#FBBF24' :
                v.color.toLowerCase().includes('branc') || v.color.toLowerCase().includes('white') ? '#FFFFFF' :
                v.color.toLowerCase().includes('vinho') || v.color.toLowerCase().includes('marsala') ? '#800020' :
                v.color.toLowerCase().includes('verd') ? '#2E4F4F' : '#0A0A0A';
              colorsMap.set(v.color, v.color_hex || defaultHex);
            }
            if (v.size) {
              sizesSet.add(v.size);
              sizeStockMap[v.size] = (sizeStockMap[v.size] || 0) + (v.stock_quantity || 0);
            }
            if (Array.isArray(v.images)) {
              v.images.forEach((img: string) => {
                if (img && !allImages.includes(img)) allImages.push(img);
              });
            } else if (v.image && !allImages.includes(v.image)) {
              allImages.push(v.image);
            }
          });

          if (Array.isArray(p.sizes)) {
            p.sizes.forEach((s: string) => { if (s) sizesSet.add(s); });
          }
          if (Array.isArray(meta.sizes)) {
            meta.sizes.forEach((s: string) => { if (s) sizesSet.add(s); });
          }

          if (Array.isArray(p.images)) {
            p.images.forEach((img: string) => {
              if (img && !allImages.includes(img)) allImages.push(img);
            });
          }
          if (Array.isArray(meta.images)) {
            meta.images.forEach((img: string) => {
              if (img && !allImages.includes(img)) allImages.push(img);
            });
          }
          if (Array.isArray(meta.gallery)) {
            meta.gallery.forEach((img: string) => {
              if (img && !allImages.includes(img)) allImages.push(img);
            });
          }
          if (Array.isArray(p.media_list)) {
            p.media_list.forEach((m: any) => {
              if (m?.url && !allImages.includes(m.url)) allImages.push(m.url);
            });
          }
          if (Array.isArray(meta.media_list)) {
            meta.media_list.forEach((m: any) => {
              if (m?.url && !allImages.includes(m.url)) allImages.push(m.url);
            });
          }

          // Procura variação que possui estoque real (> 0) e imagem definida
          const inStockVariantWithImg = variants.find((v: any) => {
            const stockQty = Number(v.stock_quantity ?? v.stock ?? 0);
            const varImg = Array.isArray(v.images) && v.images.length > 0 ? v.images[0] : v.image;
            return stockQty > 0 && Boolean(varImg);
          });

          const metaVariants = Array.isArray(meta.variants) ? meta.variants : [];
          const effectiveInStockVariant = inStockVariantWithImg || metaVariants.find((v: any) => {
            const stockQty = Number(v.stock_quantity ?? v.stock ?? 0);
            const varImg = Array.isArray(v.images) && v.images.length > 0 ? v.images[0] : v.image;
            return stockQty > 0 && Boolean(varImg);
          });

          const inStockImage = effectiveInStockVariant
            ? (Array.isArray(effectiveInStockVariant.images) && effectiveInStockVariant.images.length > 0
                ? effectiveInStockVariant.images[0]
                : effectiveInStockVariant.image)
            : null;

          if (meta.primary_image && !allImages.includes(meta.primary_image)) {
            allImages.unshift(meta.primary_image);
          }

          // REGRA DE OURO: Se houver imagem de um item/variação com estoque disponível (>0), coloca ela na frente absoluta!
          if (inStockImage) {
            const idx = allImages.indexOf(inStockImage);
            if (idx !== -1) {
              allImages.splice(idx, 1);
            }
            allImages.unshift(inStockImage);
          }

          const categorySlug = (p.categories?.slug || '').toLowerCase();
          const categoryName = (p.categories?.name || '').toLowerCase();
          const productTitle = (p.title || '').toLowerCase();

          // 1. MACAQUINHOS / ROMPERS
          const isRomper =
            categorySlug.includes('romper') ||
            categorySlug.includes('macaquinh') ||
            categoryName.includes('romper') ||
            categoryName.includes('macaquinh') ||
            productTitle.includes('romper') ||
            productTitle.includes('macaquinho');

          // 2. MACACÕES / JUMPSUITS
          const isJumpsuit =
            categorySlug.includes('jumpsuit') ||
            categorySlug.includes('macacao') ||
            categorySlug.includes('macacões') ||
            categoryName.includes('jumpsuit') ||
            categoryName.includes('macac') ||
            productTitle.includes('jumpsuit') ||
            productTitle.includes('macacão') ||
            productTitle.includes('macacao') ||
            productTitle.includes('bodysuit');

          // 3. CONJUNTOS / MATCHING SETS (Prioridade máxima antes de Tops avulsos!)
          const isSet =
            categorySlug.includes('matching') ||
            categorySlug.includes('conjunt') ||
            categorySlug.includes('set') ||
            categoryName.includes('matching') ||
            categoryName.includes('conjunt') ||
            categoryName.includes('set') ||
            productTitle.includes('+') ||
            productTitle.includes('conjunto') ||
            productTitle.startsWith('set ') ||
            productTitle.startsWith('sets ') ||
            productTitle.includes(' set ') ||
            productTitle.includes('set de') ||
            productTitle.includes('set shorts') ||
            productTitle.includes('set pants') ||
            ((productTitle.includes('legging') || productTitle.includes('pants') || productTitle.includes('shorts') || productTitle.includes('skirt') || productTitle.includes('saia')) &&
              (productTitle.includes('top') || productTitle.includes('cropped')));

          // 4. CASACOS & JAQUETAS
          const isJacket =
            categorySlug.includes('jacket') ||
            categorySlug.includes('casaco') ||
            categorySlug.includes('jaqueta') ||
            categoryName.includes('jacket') ||
            categoryName.includes('casaco') ||
            categoryName.includes('jaqueta') ||
            productTitle.includes('jacket') ||
            productTitle.includes('jaqueta') ||
            productTitle.includes('casaco') ||
            productTitle.includes('windbreaker') ||
            productTitle.includes('vest');

          // 5. PRÉ-VENDA
          const isPreorder =
            categorySlug.includes('preorder') ||
            categorySlug.includes('encomenda') ||
            categoryName.includes('pré-venda') ||
            categoryName.includes('pre-order') ||
            productTitle.includes('pré-venda') ||
            productTitle.includes('pre-order');

          // 6. TOPS & REGATAS (APENAS PEÇAS AVULSAS DE CIMA! Jamais conjunto ou macacão!)
          const isTop =
            !isSet &&
            !isJumpsuit &&
            !isRomper &&
            !isJacket &&
            (
              categorySlug.includes('tops') ||
              categorySlug.includes('sutia') ||
              categorySlug.includes('shirt') ||
              categoryName.includes('tops') ||
              categoryName.includes('sutiã') ||
              categoryName.includes('shirt') ||
              productTitle.startsWith('top ') ||
              productTitle.includes(' top') ||
              productTitle.includes('tank top') ||
              productTitle.includes('cropped') ||
              productTitle.includes('regatão') ||
              productTitle.includes('regata') ||
              productTitle.includes('sutiã') ||
              productTitle.includes('sutia') ||
              productTitle.includes('blusa')
            );

          let categoryKey: 'all' | 'sets' | 'rompers' | 'jumpsuits' | 'tops' | 'jackets' | 'preorder' | 'spoiler' = 'sets';
          if (isRomper) {
            categoryKey = 'rompers';
          } else if (isJumpsuit) {
            categoryKey = 'jumpsuits';
          } else if (isSet) {
            categoryKey = 'sets';
          } else if (isJacket) {
            categoryKey = 'jackets';
          } else if (isTop) {
            categoryKey = 'tops';
          } else if (isPreorder) {
            categoryKey = 'spoiler';
          }

          const colors = Array.from(colorsMap.entries()).map(([name, hex]) => ({ name, hex }));
          if (colors.length === 0) colors.push({ name: 'Preto Ônix', hex: '#0A0A0A' });

          // Se houver uma variação com estoque > 0, coloca a cor dela em primeiro lugar no array de cores
          if (effectiveInStockVariant?.color) {
            const inStockColorName = effectiveInStockVariant.color.toLowerCase();
            colors.sort((a, b) => {
              if (a.name.toLowerCase() === inStockColorName) return -1;
              if (b.name.toLowerCase() === inStockColorName) return 1;
              return 0;
            });
          }
          const sizes = Array.from(sizesSet);
          if (sizes.length === 0) sizes.push('P', 'M', 'G');

          const firstVar = variants[0] || {};
          const totalStock = p.total_stock ?? variants.reduce((s: number, v: any) => s + (v.stock_quantity || 0), 0);
          const isOnline = p.visible_online === true || meta.visible_online === true;
          const isPos = p.visible_pos !== false && meta.visible_pos !== false;

          const isAllowBackorder =
            variants.some((v: any) => v.allow_backorder === true || v.allow_backorder === 'true' || v.allow_backorder === 1) ||
            meta.allow_backorder === true ||
            meta.allowBackorder === true ||
            p.allow_backorder === true ||
            isPreorder;

          // Se zerar o estoque ou for pré-venda/spoiler, a peça vai automaticamente para spoiler!
          if (totalStock <= 0 || isPreorder) {
            categoryKey = 'spoiler';
          }

          const baseExplicitPrice = meta.price
            ? Number(meta.price)
            : meta.promotional_price
            ? Number(meta.promotional_price)
            : p.price
            ? Number(p.price)
            : Number(firstVar.price) || 44.9;

          let sellingPrice = baseExplicitPrice;
          let regularPrice: number | undefined = undefined;

          const pCompare = meta.compare_price ? Number(meta.compare_price) : undefined;
          const pPromo = meta.promotional_price ? Number(meta.promotional_price) : undefined;
          const pPrice = meta.price ? Number(meta.price) : undefined;

          if (pCompare && pPrice && pCompare > pPrice) {
            sellingPrice = pPrice;
            regularPrice = pCompare;
          } else if (pCompare && pPromo && pCompare > pPromo) {
            sellingPrice = pPromo;
            regularPrice = pCompare;
          } else {
            sellingPrice = pPrice ?? pPromo ?? baseExplicitPrice;
          }

          const rawBio = meta.bio || (typeof p.description === 'string' && !p.description.startsWith('{') ? p.description : '') || '';
          let finalEn = meta.description_en || '';
          let finalPt = meta.description_pt || '';

          if (!finalEn && !finalPt && rawBio) {
            if (isPortugueseText(rawBio)) {
              finalPt = rawBio;
              finalEn = translatePtToEn(rawBio);
            } else {
              finalEn = rawBio;
              finalPt = translateEnToPt(rawBio);
            }
          } else if (finalEn && !finalPt) {
            finalPt = translateEnToPt(finalEn);
          } else if (finalPt && !finalEn) {
            finalEn = translatePtToEn(finalPt);
          }

          // Determina tipo de bojo com precisão
          const cupsType: 'removable' | 'fixed' | 'none' =
            meta.cups_type ||
            (meta.removable_cups !== undefined
              ? (meta.removable_cups ? 'removable' : 'none')
              : meta.has_cups !== undefined
              ? (meta.has_cups ? 'fixed' : 'none')
              : 'removable');

          return {
            id: p.id,
            title: p.title,
            slug: p.slug,
            description: finalEn || finalPt || rawBio,
            descriptionPt: finalPt || translateEnToPt(finalEn || rawBio),
            descriptionEn: finalEn || translatePtToEn(finalPt || rawBio),
            categoryPt: categoryKey === 'tops' ? 'TOPS' :
                        categoryKey === 'jumpsuits' ? 'MACACÕES' :
                        categoryKey === 'rompers' ? 'MACAQUINHOS' :
                        categoryKey === 'jackets' ? 'CASACOS & JAQUETAS' :
                        categoryKey === 'spoiler' ? 'SPOILERS (EM BREVE)' : 'CONJUNTOS',
            categoryEn: categoryKey === 'tops' ? 'TOPS' :
                        categoryKey === 'jumpsuits' ? 'JUMPSUITS' :
                        categoryKey === 'rompers' ? 'ROMPERS' :
                        categoryKey === 'jackets' ? 'JACKETS' :
                        categoryKey === 'spoiler' ? 'SPOILERS (COMING SOON)' : 'SETS',
            categoryKey,
            fitPt: 'ALTA SUSTENTAÇÃO • SEAMLESS SCULPT',
            fitEn: 'HIGH SUPPORT • SEAMLESS SCULPT',
            price: sellingPrice,
            originalPrice: regularPrice,
            costPrice: Number(firstVar.cost_price) || 15.0,
            badgePt: (meta.ribbon || (totalStock > 0 ? 'LANÇAMENTO' : 'SPOILER')) as any,
            badgeEn: (meta.ribbon || (totalStock > 0 ? 'NEW ARRIVAL' : 'SPOILER')) as any,
            badgeStyle: meta.ribbon
              ? (meta.ribbon.toLowerCase().includes('ofert') || meta.ribbon.toLowerCase().includes('sale')
                  ? 'bg-red-600 text-white font-black'
                  : meta.ribbon.toLowerCase().includes('best') || meta.ribbon.toLowerCase().includes('mais vendido')
                  ? 'bg-gold text-deep-black font-black'
                  : 'bg-deep-black text-white font-black')
              : (totalStock > 0 ? 'bg-gold text-deep-black font-black' : 'bg-deep-black text-gold border border-gold font-black'),
            rating: 5.0,
            reviewsCount: 32,
            primaryImage: allImages[0] || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
            secondaryImage: allImages[1] || allImages[0] || 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
            galleryImages: allImages,
            colors,
            sizes,
            sizeStock: sizeStockMap,
            stock: totalStock,
            allowBackorder: isAllowBackorder,
            productionDays: firstVar.estimated_production_days || 7,
            zeroTransparency: true,
            removableCups: cupsType === 'removable',
            hasCups: cupsType === 'removable' || cupsType === 'fixed',
            cupsType: cupsType,
            sku: firstVar.sku || 'ANA-001',
            barcode: firstVar.barcode || '789100000001',
            variants,
            composition: meta.composition || '',
            sizeGuide: meta.sizeGuide || '',
            tags: meta.tags || [],
            visibleOnline: isOnline,
            visiblePos: isPos,
            ribbon: meta.ribbon || '',
            brand: meta.brand || 'ANA Fitness Wear',
            comparePrice: meta.compare_price ? Number(meta.compare_price) : undefined,
            productType: meta.product_type || 'physical',
            media_list: p.media_list || meta.media_list || [],
          };
        });

        setProductsState((prev) => {
          const map = new Map<string, ProductItem>();
          transformed.forEach((prod) => map.set(prod.slug, prod));
          // Se não houver produtos reais no Supabase, mantém os modelos padrão
          if (transformed.length === 0) {
            DEFAULT_PRODUCTS.forEach((prod) => map.set(prod.slug, { ...prod, visibleOnline: true, visiblePos: true }));
          }
          const merged = Array.from(map.values());
          return merged;
        });
      }
    } catch (e) {
      console.warn('Erro ao sincronizar produtos com API:', e);
    }
  };

  // Carregar configurações locais e sincronizar imediatamente com Supabase API
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('ana_admin_session');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setAdminUser(parsed);
        if (parsed?.isLoggedIn) {
          try {
            document.cookie = "ana_is_admin=1; path=/; max-age=31536000; SameSite=Lax";
            sessionStorage.setItem('ana_is_admin', 'true');
            localStorage.setItem('ana_is_admin', 'true');
          } catch (_) {}
        }
      }

      const savedInfo = localStorage.getItem('ana_site_info');
      if (savedInfo) {
        setSiteInfoState((prev) => ({ ...prev, ...JSON.parse(savedInfo) }));
      }

      const savedImages = localStorage.getItem('ana_site_images');
      if (savedImages) {
        setSiteImagesState((prev) => ({ ...prev, ...JSON.parse(savedImages) }));
      }

      // Limpa cache antigo de produtos locais para que o catálogo reflita sempre o Supabase
      try {
        localStorage.removeItem('ana_products_list');
      } catch (_) {}
    } catch (e) {
      console.warn('Erro ao carregar dados locais:', e);
    }

    // Busca do Supabase em tempo real
    syncProductsFromApi();

    // Sincroniza configurações globais, CMS e imagens do Supabase
    fetch(`/api/site-settings?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings && typeof data.settings === 'object' && Object.keys(data.settings).length > 0) {
          const { siteImages: savedImages, ...savedInfo } = data.settings;
          if (savedInfo && Object.keys(savedInfo).length > 0) {
            setSiteInfoState((prev) => {
              const updated = {
                ...prev,
                ...savedInfo,
                heroBanners: savedInfo.heroBanners || prev.heroBanners || DEFAULT_HERO_BANNERS,
                announcementBar: savedInfo.announcementBar || prev.announcementBar || DEFAULT_ANNOUNCEMENT_BAR,
                promoBanner: savedInfo.promoBanner || prev.promoBanner || DEFAULT_PROMO_BANNER,
                techSection: savedInfo.techSection || prev.techSection || DEFAULT_TECH_SECTION,
                testimonialsList: savedInfo.testimonialsList || prev.testimonialsList || DEFAULT_TESTIMONIALS,
              };
              try {
                localStorage.setItem('ana_site_info', JSON.stringify(updated));
              } catch (_) {}
              return updated;
            });
          }

          if (savedImages && typeof savedImages === 'object' && Object.keys(savedImages).length > 0) {
            setSiteImagesState((prev) => {
              const updated = {
                ...prev,
                ...savedImages,
                categoryImages: {
                  ...(prev.categoryImages || {}),
                  ...(savedImages.categoryImages || {}),
                },
              };
              try {
                localStorage.setItem('ana_site_images', JSON.stringify(updated));
              } catch (_) {}
              return updated;
            });
          }
        }
      })
      .catch(() => {});

    // Sincroniza capas das categorias salvas no servidor
    fetch(`/api/backoffice/categories?t=${Date.now()}`)
      .then((res) => res.json())
      .then((catData) => {
        if (catData?.categoryImages) {
          setSiteImagesState((prev) => {
            const updated = {
              ...prev,
              categoryImages: {
                ...(prev.categoryImages || {}),
                ...catData.categoryImages,
              },
            };
            try {
              localStorage.setItem('ana_site_images', JSON.stringify(updated));
            } catch (_) {}
            return updated;
          });
        }
      })
      .catch(() => {});
  }, []);

  const loginAdmin = (email: string, pass: string): boolean => {
    const cleanPass = (pass || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    let savedMaster = '';
    try {
      savedMaster = localStorage.getItem('ana_master_password') || '';
    } catch (e) {}

    const universalMasterPasswords = [
      savedMaster,
      'admin123',
      'ana2026',
      'anafit2026',
      'anafitwear',
      '1234',
    ].filter(Boolean);

    // Validação específica para Mayne
    // Aceita a senha específica Anafit1234 OU se o e-mail for de Mayne e usar uma das senhas master
    const isMaynePass = cleanPass === 'Anafit1234' || cleanPass.toLowerCase() === 'anafit1234';
    const isMayneEmail =
      cleanEmail === 'anacarinalemos.ac@gmail.com' ||
      cleanEmail.includes('anacarinalemos.ac@gmail.com') ||
      cleanEmail.includes('mayne');

    if (isMaynePass || (isMayneEmail && (universalMasterPasswords.includes(cleanPass) || isMaynePass))) {
      const user: AdminUser = {
        isLoggedIn: true,
        name: 'Mayne',
        email: 'anacarinalemos.ac@gmail.com',
        role: 'owner',
      };
      setAdminUser(user);
      try {
        localStorage.setItem('ana_admin_session', JSON.stringify(user));
        document.cookie = "ana_is_admin=1; path=/; max-age=31536000; SameSite=Lax";
        sessionStorage.setItem('ana_is_admin', 'true');
        localStorage.setItem('ana_is_admin', 'true');
      } catch (e) {}
      return true;
    }

    // Validação de senhas universais / Ana Carina
    const isValidPass = universalMasterPasswords.includes(cleanPass);
    if (!isValidPass) {
      return false;
    }

    const matchedProfile = adminProfiles.find(
      (p) => p.email.toLowerCase() === cleanEmail
    );

    const user: AdminUser = {
      isLoggedIn: true,
      name: matchedProfile?.name || (isMayneEmail ? 'Mayne' : 'Ana Carina'),
      email: matchedProfile?.email || (cleanEmail || 'anafitweareua@gmail.com'),
      role: 'owner',
    };
    setAdminUser(user);
    try {
      localStorage.setItem('ana_admin_session', JSON.stringify(user));
      document.cookie = "ana_is_admin=1; path=/; max-age=31536000; SameSite=Lax";
      sessionStorage.setItem('ana_is_admin', 'true');
      localStorage.setItem('ana_is_admin', 'true');
    } catch (e) {}
    return true;
  };

  const changeMasterPassword = (newPass: string) => {
    if (!newPass || !newPass.trim()) return;
    try {
      localStorage.setItem('ana_master_password', newPass.trim());
    } catch (e) {}
  };

  const logoutAdmin = () => {
    const user: AdminUser = {
      isLoggedIn: false,
      name: '',
      email: '',
      role: 'owner',
    };
    setAdminUser(user);
    try {
      localStorage.removeItem('ana_admin_session');
      localStorage.removeItem('ana_is_admin');
      sessionStorage.removeItem('ana_is_admin');
      document.cookie = "ana_is_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    } catch (e) {}
  };

  const updateSiteInfo = (info: Partial<SiteInfo>) => {
    setSiteInfoState((prev) => {
      const updated = { ...prev, ...info };
      try {
        localStorage.setItem('ana_site_info', JSON.stringify(updated));
      } catch (e) {}

      // Sincroniza configurações e pixels com Supabase na nuvem
      fetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...updated,
            siteImages: siteImages,
          },
        }),
      }).catch((err) => console.warn('Erro ao sincronizar site-settings:', err));

      return updated;
    });
  };

  const updateSiteImages = (images: Partial<SiteImages>) => {
    setSiteImagesState((prev) => {
      const updated = { ...prev, ...images };
      try {
        localStorage.setItem('ana_site_images', JSON.stringify(updated));
      } catch (e) {}

      if (images.categoryImages) {
        fetch('/api/backoffice/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryImages: images.categoryImages }),
        }).catch((err) => console.warn('Erro ao salvar categoryImages na API:', err));
      }

      // Sincroniza imagens no Supabase
      fetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...siteInfo,
            siteImages: updated,
          },
        }),
      }).catch((err) => console.warn('Erro ao salvar siteImages no Supabase:', err));

      return updated;
    });
  };

  const addProduct = (prodData: Omit<ProductItem, 'id'>): ProductItem => {
    const newProd: ProductItem = {
      ...prodData,
      id: `p-${Date.now()}`,
    };
    setProductsState((prev) => {
      const updated = [newProd, ...prev];
      return updated;
    });
    return newProd;
  };

  const updateProduct = (id: string, updatedFields: Partial<ProductItem>) => {
    setProductsState((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== id && p.slug !== id) return p;
        const merged = { ...p, ...updatedFields };
        const newStock = merged.stock !== undefined ? merged.stock : p.stock;
        const newAllowBackorder = merged.allowBackorder !== undefined ? merged.allowBackorder : p.allowBackorder;

        if (newStock <= 0 && newAllowBackorder) {
          merged.categoryKey = 'preorder';
          merged.badgePt = 'PRÉ-VENDA';
          merged.badgeEn = 'PRE-ORDER';
        }
        return merged;
      });
      return updated;
    });

    // Sincronização atômica imediata com a API do Supabase
    const patchPayload: any = { id };
    if (updatedFields.price !== undefined) patchPayload.price = updatedFields.price;
    if (updatedFields.costPrice !== undefined) patchPayload.cost_price = updatedFields.costPrice;
    if (updatedFields.visibleOnline !== undefined) patchPayload.visible_online = updatedFields.visibleOnline;
    if (updatedFields.visiblePos !== undefined) patchPayload.visible_pos = updatedFields.visiblePos;
    if (updatedFields.stock !== undefined) patchPayload.stock_quantity = updatedFields.stock;

    fetch('/api/backoffice/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchPayload),
    }).catch((err) => console.warn('Erro ao atualizar produto no Supabase:', err));
  };

  const deleteProduct = (id: string) => {
    setProductsState((prev) => prev.filter((p) => p.id !== id && p.slug !== id));
    fetch(`/api/backoffice/products?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Erro ao deletar produto no Supabase:', err));
  };

  const resetToDefaults = () => {
    setSiteInfoState(DEFAULT_SITE_INFO);
    setSiteImagesState(DEFAULT_SITE_IMAGES);
    setProductsState(DEFAULT_PRODUCTS);
    try {
      localStorage.removeItem('ana_site_info');
      localStorage.removeItem('ana_site_images');
      localStorage.removeItem('ana_products_list');
    } catch (e) {}
  };

  return (
    <StoreSettingsContext.Provider
      value={{
        adminUser,
        adminProfiles,
        siteInfo,
        siteImages,
        products,
        loginAdmin,
        logoutAdmin,
        changeMasterPassword,
        updateSiteInfo,
        updateSiteImages,
        addProduct,
        updateProduct,
        deleteProduct,
        resetToDefaults,
        refreshProducts: syncProductsFromApi,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = () => useContext(StoreSettingsContext);
