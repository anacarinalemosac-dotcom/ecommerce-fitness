'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AdminUser {
  isLoggedIn: boolean;
  name: string;
  email: string;
  role: 'owner' | 'manager';
}

export interface SiteInfo {
  storeName: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  instagramUrl: string;
  address: string;
  flatShippingRate: number;
  returnDays: number;
  tickerSlogan: string;
  tickerShipping: string;
  heroTitle1: string;
  heroTitle2: string;
  heroSubtitle: string;
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
  categoryKey: 'all' | 'sets' | 'rompers' | 'jumpsuits' | 'tops' | 'preorder';
  fitPt: string;
  fitEn: string;
  price: number;
  originalPrice?: number;
  costPrice: number;
  badgePt: 'BEST SELLER' | 'PRÉ-VENDA' | 'LANÇAMENTO';
  badgeEn: 'BEST SELLER' | 'PRE-ORDER' | 'NEW ARRIVAL';
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
  sku: string;
  barcode: string;
  variants?: any[];
  composition?: string;
  sizeGuide?: string;
  tags?: string[];
}

interface StoreSettingsContextType {
  adminUser: AdminUser;
  siteInfo: SiteInfo;
  siteImages: SiteImages;
  products: ProductItem[];
  loginAdmin: (email: string, pass: string) => boolean;
  logoutAdmin: () => void;
  updateSiteInfo: (info: Partial<SiteInfo>) => void;
  updateSiteImages: (images: Partial<SiteImages>) => void;
  addProduct: (product: Omit<ProductItem, 'id'>) => ProductItem;
  updateProduct: (id: string, updated: Partial<ProductItem>) => void;
  deleteProduct: (id: string) => void;
  resetToDefaults: () => void;
  refreshProducts: () => Promise<void>;
}

const DEFAULT_SITE_INFO: SiteInfo = {
  storeName: 'ANA FITNESS WEAR',
  phone: '+1 (978) 313-9452',
  whatsapp: '19783139452',
  instagram: '@anafitnessweareua',
  instagramUrl: 'https://www.instagram.com/anafitnessweareua',
  address: 'Leominster, MA 01453 • United States',
  flatShippingRate: 9.99,
  returnDays: 30,
  tickerSlogan: '✨ WEAR YOUR STRENGTH ✨',
  tickerShipping: 'FLAT RATE SHIPPING $9.99 ACROSS ALL 50 US STATES',
  heroTitle1: 'WEAR YOUR',
  heroTitle2: 'STRENGTH.',
  heroSubtitle: 'High-performance athletic luxury based in Massachusetts. Lab-verified zero see-through, 4-way anatomical sculpt compression, and flat $9.99 shipping across all 50 US States.',
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
    categoryPt: 'TOPS & BLUSAS',
    categoryEn: 'TOPS & BRAS',
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
    categoryKey: 'preorder',
    fitPt: 'CONFECCIONADO SOB MEDIDA (5-7 DIAS)',
    fitEn: 'MADE-TO-ORDER ATELIER (5-7 DAYS)',
    price: 39.9,
    originalPrice: 49.9,
    costPrice: 16.0,
    badgePt: 'PRÉ-VENDA',
    badgeEn: 'PRE-ORDER',
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
    allowBackorder: true,
    productionDays: 7,
    zeroTransparency: true,
    removableCups: true,
    sku: 'KEL-BLK-M',
    barcode: '789100000004',
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
    costPrice: 18.0,
    badgePt: 'PRÉ-VENDA',
    badgeEn: 'PRE-ORDER',
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
    allowBackorder: true,
    productionDays: 6,
    zeroTransparency: true,
    removableCups: true,
    sku: 'DEL-BLK-M',
    barcode: '789100000005',
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
  siteInfo: DEFAULT_SITE_INFO,
  siteImages: DEFAULT_SITE_IMAGES,
  products: DEFAULT_PRODUCTS,
  loginAdmin: () => false,
  logoutAdmin: () => {},
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
    email: 'ana@anafitwear.com',
    role: 'owner',
  });

  const [siteInfo, setSiteInfoState] = useState<SiteInfo>(DEFAULT_SITE_INFO);
  const [siteImages, setSiteImagesState] = useState<SiteImages>(DEFAULT_SITE_IMAGES);
  const [products, setProductsState] = useState<ProductItem[]>(DEFAULT_PRODUCTS);

  const syncProductsFromApi = async () => {
    try {
      const res = await fetch('/api/backoffice/products');
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
            }
          });

          const categorySlug = (p.categories?.slug || '').toLowerCase();
          let categoryKey: 'all' | 'sets' | 'rompers' | 'jumpsuits' | 'tops' | 'preorder' = 'sets';
          if (categorySlug.includes('romper') || categorySlug.includes('macaquinh')) categoryKey = 'rompers';
          else if (categorySlug.includes('top') || categorySlug.includes('sutia')) categoryKey = 'tops';
          else if (categorySlug.includes('macacao') || categorySlug.includes('jumpsuit')) categoryKey = 'jumpsuits';
          else if (categorySlug.includes('preorder') || categorySlug.includes('encomenda')) categoryKey = 'preorder';

          const colors = Array.from(colorsMap.entries()).map(([name, hex]) => ({ name, hex }));
          if (colors.length === 0) colors.push({ name: 'Preto Ônix', hex: '#0A0A0A' });
          const sizes = Array.from(sizesSet);
          if (sizes.length === 0) sizes.push('P', 'M', 'G');

          const firstVar = variants[0] || {};
          const totalStock = p.total_stock ?? variants.reduce((s: number, v: any) => s + (v.stock_quantity || 0), 0);

          return {
            id: p.id,
            title: p.title,
            slug: p.slug,
            categoryPt: p.categories?.name || 'CONJUNTOS',
            categoryEn: p.categories?.name || 'SETS',
            categoryKey,
            fitPt: meta.bio || 'ALTA SUSTENTAÇÃO • SEAMLESS SCULPT',
            fitEn: meta.bio || 'HIGH SUPPORT • SEAMLESS SCULPT',
            price: Number(firstVar.price) || 44.9,
            originalPrice: firstVar.price ? Number(firstVar.price) * 1.15 : 49.9,
            costPrice: Number(firstVar.cost_price) || 15.0,
            badgePt: (totalStock > 0 ? 'LANÇAMENTO' : 'PRÉ-VENDA') as any,
            badgeEn: (totalStock > 0 ? 'NEW ARRIVAL' : 'PRE-ORDER') as any,
            badgeStyle: totalStock > 0 ? 'bg-gold text-deep-black font-black' : 'bg-deep-black text-gold border border-gold font-black',
            rating: 5.0,
            reviewsCount: 32,
            primaryImage: allImages[0] || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
            secondaryImage: allImages[1] || allImages[0] || 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
            galleryImages: allImages,
            colors,
            sizes,
            sizeStock: sizeStockMap,
            stock: totalStock,
            allowBackorder: variants.some((v: any) => v.allow_backorder),
            productionDays: firstVar.estimated_production_days || 7,
            zeroTransparency: true,
            removableCups: true,
            sku: firstVar.sku || 'ANA-001',
            barcode: firstVar.barcode || '789100000001',
            variants,
            composition: meta.composition || '',
            sizeGuide: meta.sizeGuide || '',
            tags: meta.tags || [],
          };
        });

        setProductsState((prev) => {
          const map = new Map<string, ProductItem>();
          DEFAULT_PRODUCTS.forEach((prod) => map.set(prod.slug, prod));
          transformed.forEach((prod) => map.set(prod.slug, prod));
          const merged = Array.from(map.values());
          try {
            localStorage.setItem('ana_products_list', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    } catch (e) {
      console.warn('Erro ao sincronizar produtos com API:', e);
    }
  };

  // Carregar do localStorage e sincronizar imediatamente com Supabase API
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('ana_admin_session');
      if (savedUser) {
        setAdminUser(JSON.parse(savedUser));
      }

      const savedInfo = localStorage.getItem('ana_site_info');
      if (savedInfo) {
        setSiteInfoState((prev) => ({ ...prev, ...JSON.parse(savedInfo) }));
      }

      const savedImages = localStorage.getItem('ana_site_images');
      if (savedImages) {
        setSiteImagesState((prev) => ({ ...prev, ...JSON.parse(savedImages) }));
      }

      const savedProducts = localStorage.getItem('ana_products_list');
      if (savedProducts) {
        setProductsState(JSON.parse(savedProducts));
      }
    } catch (e) {
      console.warn('Erro ao carregar dados locais:', e);
    }

    // Busca do Supabase em tempo real
    syncProductsFromApi();
  }, []);

  const loginAdmin = (email: string, pass: string): boolean => {
    // Permite login como proprietária Ana Carina
    const isOwner = email.toLowerCase().includes('ana') || email.toLowerCase().includes('admin');
    const user: AdminUser = {
      isLoggedIn: true,
      name: 'Ana Carina',
      email: email || 'ana@anafitwear.com',
      role: 'owner',
    };
    setAdminUser(user);
    try {
      localStorage.setItem('ana_admin_session', JSON.stringify(user));
    } catch (e) {}
    return true;
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
    } catch (e) {}
  };

  const updateSiteInfo = (info: Partial<SiteInfo>) => {
    setSiteInfoState((prev) => {
      const updated = { ...prev, ...info };
      try {
        localStorage.setItem('ana_site_info', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const updateSiteImages = (images: Partial<SiteImages>) => {
    setSiteImagesState((prev) => {
      const updated = { ...prev, ...images };
      try {
        localStorage.setItem('ana_site_images', JSON.stringify(updated));
      } catch (e) {}
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
      try {
        localStorage.setItem('ana_products_list', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    return newProd;
  };

  const updateProduct = (id: string, updatedFields: Partial<ProductItem>) => {
    setProductsState((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
      try {
        localStorage.setItem('ana_products_list', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const deleteProduct = (id: string) => {
    setProductsState((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('ana_products_list', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
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
        siteInfo,
        siteImages,
        products,
        loginAdmin,
        logoutAdmin,
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
