'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../context/LanguageContext';
import { useStoreSettings } from '../../../context/StoreSettingsContext';
import { trackEvent } from '../../../lib/tracking';
import ProductShareModal from '../../../components/ProductShareModal';
import { ProductSizeGuide } from '../../../components/ProductSizeGuide';
import { FormattedDescription } from '../../../components/FormattedDescription';
import { UrgencyCountdownTimer } from '../../../components/UrgencyCountdownTimer';
import { translateEnToPt, translatePtToEn, isPortugueseText } from '../../../lib/translateFitness';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Tag,
  CheckCircle2,
  Clock,
  Heart,
  ZoomIn,
  ArrowRight,
  ShoppingBag,
  Ruler,
  Droplets,
  Layers,
  Shield,
  Activity,
  Scissors,
  Check,
  Sun,
  Wind,
  Phone,
  Share2,
  MessageSquare,
  MessageCircle,
  Copy,
  Lock,
  Camera,
  User,
  Mail,
  Upload,
} from 'lucide-react';

interface Variant {
  id: string;
  sku: string;
  size: string;
  color: string;
  colorNamePt: string;
  colorNameEn: string;
  colorHex: string;
  price: number;
  originalPrice?: number;
  stock: number;
  allowBackorder: boolean;
  productionDays: number;
  image?: string;
}

const CATALOG_ITEMS: Record<string, any> = {
  'samanta-romper': {
    title: 'SAMANTA ROMPER',
    categoryPt: 'MACAQUINHOS • ALTA PERFORMANCE',
    categoryEn: 'ROMPERS • HIGH PERFORMANCE',
    price: 44.9,
    originalPrice: 49.9,
    cupsType: 'removable',
    descriptionPt:
      'O Samanta Romper é a definição de liberdade e elegância nos treinos. Desenvolvido em malha nobre de poliamida com toque amanteigado e elasticidade 4-way stretch. Conta com suporte reforçado, zero transparência e opção para bojo removível para o ajuste perfeito.',
    descriptionEn:
      'The Samanta Romper is the pinnacle of luxury mobility. Engineered in premium buttery-soft polyamide with 4-way stretch elasticity. Features built-in contour support, verified zero see-through, and removable bra cups for the ideal silhouette.',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=85', label: 'Onyx Black Front', color: 'Preto Ônix' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=1200&q=85', label: 'Side Profile', color: 'Preto Ônix' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=85', label: 'Champagne Gold Front', color: 'Champagne Gold' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=85', label: 'Pure White Front', color: 'Pure White' },
      { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-squats-in-a-gym-40502-large.mp4', label: 'Movement Video', color: 'all' },
    ],
    colors: [
      { name: 'Preto Ônix', hex: '#0A0A0A' },
      { name: 'Champagne Gold', hex: '#D4AF37' },
      { name: 'Pure White', hex: '#FFFFFF' },
    ],
    sizes: ['S', 'M', 'L'],
    variants: [
      // Preto Ônix
      { id: 'v-sam-blk-s', sku: 'SAM-BLK-S', size: 'S', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 44.9, stock: 8, allowBackorder: true, productionDays: 5, image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=85' },
      { id: 'v-sam-blk-m', sku: 'SAM-BLK-M', size: 'M', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 44.9, stock: 6, allowBackorder: true, productionDays: 5, image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=85' },
      { id: 'v-sam-blk-l', sku: 'SAM-BLK-L', size: 'L', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 44.9, stock: 4, allowBackorder: true, productionDays: 5, image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=85' },
      // Champagne Gold
      { id: 'v-sam-gld-s', sku: 'SAM-GLD-S', size: 'S', color: 'Champagne Gold', colorNamePt: 'Champagne Gold', colorNameEn: 'Champagne Gold', colorHex: '#D4AF37', price: 44.9, stock: 5, allowBackorder: true, productionDays: 5, image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=85' },
      { id: 'v-sam-gld-m', sku: 'SAM-GLD-M', size: 'M', color: 'Champagne Gold', colorNamePt: 'Champagne Gold', colorNameEn: 'Champagne Gold', colorHex: '#D4AF37', price: 44.9, stock: 7, allowBackorder: true, productionDays: 5, image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=85' },
      { id: 'v-sam-gld-l', sku: 'SAM-GLD-l', size: 'L', color: 'Champagne Gold', colorNamePt: 'Champagne Gold', colorNameEn: 'Champagne Gold', colorHex: '#D4AF37', price: 44.9, stock: 0, allowBackorder: true, productionDays: 5, image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=85' },
      // Pure White
      { id: 'v-sam-wht-s', sku: 'SAM-WHT-S', size: 'S', color: 'Pure White', colorNamePt: 'Pure White', colorNameEn: 'Pure White', colorHex: '#FFFFFF', price: 44.9, stock: 4, allowBackorder: true, productionDays: 5, image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=85' },
      { id: 'v-sam-wht-m', sku: 'SAM-WHT-M', size: 'M', color: 'Pure White', colorNamePt: 'Pure White', colorNameEn: 'Pure White', colorHex: '#FFFFFF', price: 44.9, stock: 3, allowBackorder: true, productionDays: 5, image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=85' },
      { id: 'v-sam-wht-l', sku: 'SAM-WHT-L', size: 'L', color: 'Pure White', colorNamePt: 'Pure White', colorNameEn: 'Pure White', colorHex: '#FFFFFF', price: 44.9, stock: 2, allowBackorder: true, productionDays: 5, image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=85' },
    ],
  },
  'blusa-bailarina': {
    title: 'BEST SELLER BAILARINA TOP',
    categoryPt: 'TOPS • ALTA SUSTENTAÇÃO',
    categoryEn: 'TOPS • MAXIMUM SUPPORT',
    price: 34.9,
    cupsType: 'removable',
    descriptionPt:
      'Top Bailarina Best Seller com decote delicado nas costas e sustentação perfeita para musculação, corrida e pilates. Confeccionado com bojo removível e tecnologia Dry-Fit respirável.',
    descriptionEn:
      'Best Seller Bailarina Top featuring an elegant cross-back design and maximum support for weightlifting, running, and pilates. Fitted with removable bra cups and breathable Dry-Fit technology.',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=85', label: 'Front', color: 'Preto Ônix' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=85', label: 'Back Design', color: 'Preto Ônix' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=1200&q=85', label: 'Fabric Close-up', color: 'Champagne Gold' },
    ],
    colors: [
      { name: 'Preto Ônix', hex: '#0A0A0A' },
      { name: 'Champagne Gold', hex: '#D4AF37' },
    ],
    sizes: ['S', 'M', 'L'],
    variants: [
      { id: 'v-bai-blk-s', sku: 'BAI-BLK-S', size: 'S', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 34.9, stock: 12, allowBackorder: true, productionDays: 5 },
      { id: 'v-bai-blk-m', sku: 'BAI-BLK-M', size: 'M', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 34.9, stock: 10, allowBackorder: true, productionDays: 5 },
      { id: 'v-bai-blk-l', sku: 'BAI-BLK-L', size: 'L', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 34.9, stock: 5, allowBackorder: true, productionDays: 5 },
      { id: 'v-bai-gld-s', sku: 'BAI-GLD-S', size: 'S', color: 'Champagne Gold', colorNamePt: 'Champagne Gold', colorNameEn: 'Champagne Gold', colorHex: '#D4AF37', price: 34.9, stock: 6, allowBackorder: true, productionDays: 5 },
      { id: 'v-bai-gld-m', sku: 'BAI-GLD-M', size: 'M', color: 'Champagne Gold', colorNamePt: 'Champagne Gold', colorNameEn: 'Champagne Gold', colorHex: '#D4AF37', price: 34.9, stock: 4, allowBackorder: true, productionDays: 5 },
      { id: 'v-bai-gld-l', sku: 'BAI-GLD-L', size: 'L', color: 'Champagne Gold', colorNamePt: 'Champagne Gold', colorNameEn: 'Champagne Gold', colorHex: '#D4AF37', price: 34.9, stock: 0, allowBackorder: true, productionDays: 5 },
    ],
  },
  'conjunto-calca-kely': {
    title: 'KELY PANTS SET',
    categoryPt: 'SPOILER • EM BREVE',
    categoryEn: 'SPOILER • COMING SOON',
    categoryKey: 'spoiler',
    price: 39.9,
    originalPrice: 49.9,
    badgePt: 'SPOILER',
    badgeEn: 'SPOILER',
    badgeStyle: 'bg-deep-black text-gold border border-gold font-black',
    cupsType: 'removable',
    descriptionPt:
      'Conjunto completo de calça legging cós anatômico + top de sustentação. Próximo lançamento exclusivo Ana Fitness Wear. Peça em exibição de spoiler — sem pré-venda ou reservas. Em breve à pronta entrega!',
    descriptionEn:
      'Complete luxury set featuring sculpting leggings with double anatomical waistband and matching support top. Upcoming exclusive drop from Ana Fitness Wear. Exclusive preview/spoiler — no reservation or pre-orders. Ready to ship soon!',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1200&q=85', label: 'Set Overview', color: 'Preto Ônix' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=85', label: 'Side Fit', color: 'Preto Ônix' },
    ],
    colors: [
      { name: 'Preto Ônix', hex: '#0A0A0A' },
      { name: 'Vinho Marsala', hex: '#800020' },
    ],
    sizes: ['S', 'M', 'L'],
    stock: 0,
    allowBackorder: false,
    variants: [
      { id: 'v-kel-blk-s', sku: 'KEL-BLK-S', size: 'S', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 39.9, stock: 0, allowBackorder: false, productionDays: 0 },
      { id: 'v-kel-blk-m', sku: 'KEL-BLK-M', size: 'M', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 39.9, stock: 0, allowBackorder: false, productionDays: 0 },
      { id: 'v-kel-blk-l', sku: 'KEL-BLK-L', size: 'L', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 39.9, stock: 0, allowBackorder: false, productionDays: 0 },
      { id: 'v-kel-vin-s', sku: 'KEL-VIN-S', size: 'S', color: 'Vinho Marsala', colorNamePt: 'Vinho Marsala', colorNameEn: 'Marsala Wine', colorHex: '#800020', price: 39.9, stock: 0, allowBackorder: false, productionDays: 0 },
      { id: 'v-kel-vin-m', sku: 'KEL-VIN-M', size: 'M', color: 'Vinho Marsala', colorNamePt: 'Vinho Marsala', colorNameEn: 'Marsala Wine', colorHex: '#800020', price: 39.9, stock: 0, allowBackorder: false, productionDays: 0 },
      { id: 'v-kel-vin-l', sku: 'KEL-VIN-L', size: 'L', color: 'Vinho Marsala', colorNamePt: 'Vinho Marsala', colorNameEn: 'Marsala Wine', colorHex: '#800020', price: 39.9, stock: 0, allowBackorder: false, productionDays: 0 },
    ],
  },
  'macaquinho-deluxe': {
    title: 'DELUXE ROMPER',
    categoryPt: 'SPOILER • EM BREVE',
    categoryEn: 'SPOILER • COMING SOON',
    categoryKey: 'spoiler',
    price: 49.9,
    originalPrice: 59.9,
    badgePt: 'SPOILER',
    badgeEn: 'SPOILER',
    badgeStyle: 'bg-deep-black text-gold border border-gold font-black',
    cupsType: 'fixed',
    descriptionPt:
      'Macaquinho Deluxe com recortes anatômicos e bojo fixo anatômico. Próximo lançamento exclusivo Ana Fitness Wear. Peça em exibição de spoiler — sem pré-venda ou reservas. Em breve à pronta entrega!',
    descriptionEn:
      'Deluxe Romper featuring anatomical cuts and built-in fixed cups. Upcoming exclusive drop from Ana Fitness Wear. Exclusive preview/spoiler — no reservation or pre-orders. Ready to ship soon!',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=85', label: 'Front', color: 'Preto Ônix' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=1200&q=85', label: 'Side Fit', color: 'Preto Ônix' },
    ],
    colors: [
      { name: 'Preto Ônix', hex: '#0A0A0A' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 0,
    allowBackorder: false,
    variants: [
      { id: 'v-del-blk-s', sku: 'DEL-BLK-S', size: 'S', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 49.9, stock: 0, allowBackorder: false, productionDays: 0 },
      { id: 'v-del-blk-m', sku: 'DEL-BLK-M', size: 'M', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 49.9, stock: 0, allowBackorder: false, productionDays: 0 },
      { id: 'v-del-blk-l', sku: 'DEL-BLK-L', size: 'L', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 49.9, stock: 0, allowBackorder: false, productionDays: 0 },
      { id: 'v-del-blk-xl', sku: 'DEL-BLK-XL', size: 'XL', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 49.9, stock: 0, allowBackorder: false, productionDays: 0 },
    ],
  },
};

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { lang, t } = useLanguage();
  const { products: storeProducts } = useStoreSettings();
  const slug = params.slug || 'samanta-romper';

  const [liveProduct, setLiveProduct] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    let isCancelled = false;
    fetch(`/api/backoffice/products?id=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled && data?.product) {
          const p = data.product;
          const meta = p.meta || {};
          const pPrice = Number(p.price) || 44.9;
          const pCompare = meta.compare_price ? Number(meta.compare_price) : undefined;

          setLiveProduct({
            id: p.id,
            title: p.title,
            slug: p.slug,
            description: meta.bio || p.description || '',
            descriptionPt: meta.description_pt || '',
            descriptionEn: meta.description_en || '',
            categoryPt: p.categories?.name || 'CONJUNTOS',
            categoryEn: p.categories?.name || 'SETS',
            price: pPrice,
            originalPrice: pCompare && pCompare > pPrice ? pCompare : undefined,
            costPrice: Number(p.cost_price) || 16.0,
            primaryImage: p.primaryImage || p.primary_image || '',
            secondaryImage: p.galleryImages?.[1] || p.images?.[1] || '',
            galleryImages: p.galleryImages || p.images || [],
            colors: p.colors || [],
            sizes: p.sizes || [],
            stock: (p.variants || []).reduce((acc: number, v: any) => acc + (v.stock_quantity || 0), 0),
            allowBackorder: Boolean(meta.allow_backorder || p.allow_backorder || true),
            productionDays: p.variants?.[0]?.estimated_production_days || 7,
            cupsType: meta.cups_type || 'removable',
            ribbon: meta.ribbon || '',
            badgePt: meta.ribbon || 'BEST SELLER',
            badgeEn: meta.ribbon || 'BEST SELLER',
            badgeStyle: 'bg-gold text-deep-black',
            variants: p.variants || [],
          });
        }
      })
      .catch((err) => console.warn('Erro ao carregar produto em tempo real:', err));

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  // Localiza produto cadastrado ou editado no Backoffice/Supabase (prioriza dados frescos em tempo real)
  const dynamicProduct = liveProduct || storeProducts.find((p) => p.slug === slug || p.id === slug);

  let productData = CATALOG_ITEMS[slug] || CATALOG_ITEMS['samanta-romper'];

  if (dynamicProduct) {
    const mediaList: Array<{ type: 'image' | 'video'; url: string; label: string; color?: string }> = [
      { type: 'image', url: dynamicProduct.primaryImage, label: 'Front', color: dynamicProduct.colors[0]?.name || 'all' },
    ];
    if (dynamicProduct.secondaryImage) {
      mediaList.push({ type: 'image', url: dynamicProduct.secondaryImage, label: 'Back / Hover', color: dynamicProduct.colors[0]?.name || 'all' });
    }
    if (dynamicProduct.galleryImages && dynamicProduct.galleryImages.length > 0) {
      dynamicProduct.galleryImages.forEach((img, idx) => {
        if (img && !mediaList.some((m) => m.url === img)) {
          mediaList.push({ type: 'image', url: img, label: `Detail ${idx + 1}`, color: 'all' });
        }
      });
    }

    if (Array.isArray((dynamicProduct as any).media_list)) {
      (dynamicProduct as any).media_list.forEach((m: any, idx: number) => {
        if (m?.url && !mediaList.some((med) => med.url === m.url)) {
          mediaList.push({
            type: m.type === 'video' ? 'video' : 'image',
            url: m.url,
            label: m.label || `${m.associatedColor || 'Detail'} ${idx + 1}`,
            color: m.associatedColor || 'all',
          });
        }
      });
    }

    // Se temos variantes completas salvas no Supabase, mapeamos diretamente
    let variantsList: Variant[] = [];

    if (Array.isArray(dynamicProduct.variants) && dynamicProduct.variants.length > 0) {
      variantsList = dynamicProduct.variants.map((v: any, idx: number) => {
        const cName = v.color || 'Preto Ônix';
        const defaultHex =
          cName.toLowerCase().includes('ouro') || cName.toLowerCase().includes('gold') ? '#D4AF37' :
          cName.toLowerCase().includes('amarel') ? '#FBBF24' :
          cName.toLowerCase().includes('branc') || cName.toLowerCase().includes('white') ? '#FFFFFF' :
          cName.toLowerCase().includes('vinho') || cName.toLowerCase().includes('marsala') ? '#800020' :
          cName.toLowerCase().includes('verd') ? '#2E4F4F' : '#0A0A0A';

        let varImg = Array.isArray(v.images) && v.images.length > 0 ? v.images[0] : v.image;
        if (!varImg && Array.isArray((dynamicProduct as any).media_list)) {
          const mMatch = (dynamicProduct as any).media_list.find(
            (m: any) => m.associatedColor && m.associatedColor.trim().toLowerCase() === cName.trim().toLowerCase()
          );
          if (mMatch?.url) varImg = mMatch.url;
        }

        if (varImg) {
          const existingMedia = mediaList.find((m) => m.url === varImg);
          if (existingMedia) {
            existingMedia.color = cName;
          } else {
            mediaList.push({ type: 'image', url: varImg, label: `${cName} Foto`, color: cName });
          }
        }

        return {
          id: v.id || `v-${dynamicProduct.id}-${idx}`,
          sku: v.sku || `${dynamicProduct.title.slice(0, 3).toUpperCase()}-${cName.slice(0, 3).toUpperCase()}-${v.size}`,
          size: v.size || 'M',
          color: cName,
          colorNamePt: cName,
          colorNameEn: cName,
          colorHex: v.color_hex || defaultHex,
          price: Number(v.price) || dynamicProduct.price,
          originalPrice: dynamicProduct.originalPrice,
          stock: Number(v.stock_quantity ?? v.stock ?? 0),
          allowBackorder: Boolean(v.allow_backorder),
          productionDays: Number(v.estimated_production_days) || dynamicProduct.productionDays || 7,
          image: varImg || dynamicProduct.primaryImage,
        };
      });
    } else {
      // Gera grade combinatória com todas as cores e tamanhos
      const colorsToUse = dynamicProduct.colors && dynamicProduct.colors.length > 0
        ? dynamicProduct.colors
        : [{ name: 'Preto Ônix', hex: '#0A0A0A' }];
      const sizesToUse = dynamicProduct.sizes && dynamicProduct.sizes.length > 0
        ? dynamicProduct.sizes
        : ['S', 'M', 'L'];

      colorsToUse.forEach((c) => {
        sizesToUse.forEach((sz) => {
          const stockQty = dynamicProduct.sizeStock
            ? dynamicProduct.sizeStock[sz] ?? 0
            : Math.round(dynamicProduct.stock / (sizesToUse.length || 3));

          variantsList.push({
            id: `v-${dynamicProduct.id}-${c.name}-${sz}`,
            sku: `${dynamicProduct.sku || 'ANA'}-${c.name.slice(0, 3).toUpperCase()}-${sz}`,
            size: sz,
            color: c.name,
            colorNamePt: c.name,
            colorNameEn: c.name,
            colorHex: c.hex,
            price: dynamicProduct.price,
            originalPrice: dynamicProduct.originalPrice,
            stock: stockQty,
            allowBackorder: dynamicProduct.allowBackorder,
            productionDays: dynamicProduct.productionDays,
            image: dynamicProduct.primaryImage,
          });
        });
      });
    }

    const finalEn =
      dynamicProduct.descriptionEn ||
      (dynamicProduct.description && !isPortugueseText(dynamicProduct.description) ? dynamicProduct.description : '') ||
      translatePtToEn(dynamicProduct.descriptionPt || dynamicProduct.description || '');

    const finalPt =
      dynamicProduct.descriptionPt ||
      (dynamicProduct.description && isPortugueseText(dynamicProduct.description) ? dynamicProduct.description : '') ||
      translateEnToPt(dynamicProduct.descriptionEn || dynamicProduct.description || '');

    const resolvedCupsType =
      dynamicProduct.cupsType ||
      (dynamicProduct.removableCups ? 'removable' : dynamicProduct.hasCups ? 'fixed' : 'none');

    productData = {
      title: dynamicProduct.title,
      categoryPt: `${dynamicProduct.categoryPt} • ALTA PERFORMANCE`,
      categoryEn: `${dynamicProduct.categoryEn} • HIGH PERFORMANCE`,
      price: dynamicProduct.price,
      originalPrice: dynamicProduct.originalPrice,
      ribbon: dynamicProduct.ribbon || '',
      badgePt: dynamicProduct.badgePt || 'BEST SELLER',
      badgeEn: dynamicProduct.badgeEn || 'BEST SELLER',
      badgeStyle: dynamicProduct.badgeStyle || 'bg-gold text-deep-black',
      cupsType: resolvedCupsType,
      descriptionPt: finalPt || `${dynamicProduct.title} com modelagem de alta compressão e corte anatômico da Ana Fitness Wear. Tecido testado e aprovado com 100% zero transparência e toque amanteigado.`,
      descriptionEn: finalEn || `${dynamicProduct.title} crafted with anatomical contour support and 4-way stretch fabric. Lab-verified zero see-through athletic luxury fit.`,
      media: mediaList,
      variants: variantsList,
    };
  }

  // Lista de cores únicas extraídas das variantes
  const availableColorsMap = new Map<string, { name: string; hex: string; image?: string }>();
  (productData.variants || []).forEach((v: Variant) => {
    if (v.color && !availableColorsMap.has(v.color.toLowerCase())) {
      availableColorsMap.set(v.color.toLowerCase(), {
        name: v.color,
        hex: v.colorHex || '#0A0A0A',
        image: v.image,
      });
    }
  });
  (productData.colors || []).forEach((c: any) => {
    if (c.name && !availableColorsMap.has(c.name.toLowerCase())) {
      availableColorsMap.set(c.name.toLowerCase(), {
        name: c.name,
        hex: c.hex || '#0A0A0A',
      });
    }
  });
  const availableColors = Array.from(availableColorsMap.values());

  // 1. Identifica se a peça é SPOILER (exclusiva para prévia, sem reserva)
  const totalStock =
    (productData.variants || []).reduce((acc: number, v: Variant) => acc + (Number(v.stock) || 0), 0) +
    (Number(productData.stock) || 0);

  const isSpoilerProduct =
    totalStock <= 0 ||
    productData.categoryKey === 'spoiler' ||
    productData.categoryKey === 'preorder' ||
    productData.badgePt === 'PRÉ-VENDA' ||
    productData.badgePt === 'SPOILER';

  // Identifica a primeira variação com estoque real (> 0) para selecionar automaticamente na abertura
  const inStockVariant = (productData.variants || []).find((v: Variant) => Number(v.stock) > 0);
  const initialColor = inStockVariant?.color || availableColors[0]?.name || 'Preto Ônix';

  // Estados de seleção
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);

  // Grade ESTRITA de tamanhos com estoque real disponível (> 0)
  // Se tiver um conjunto com apenas P e G, vai aparecer APENAS P e G no tamanho. M e GG com estoque zero NÃO aparecem.
  // Se a peça for spoiler ou estoque zero, a lista fica vazia e a compra é bloqueada.
  const availableSizes = useMemo(() => {
    if (isSpoilerProduct) return [];

    // Filtra estritamente as variantes da cor selecionada com estoque real > 0
    const colorInStock = (productData.variants || []).filter(
      (v: Variant) => v.color.toLowerCase() === selectedColor.toLowerCase() && Number(v.stock) > 0
    );

    if (colorInStock.length > 0) {
      const set = new Set<string>();
      colorInStock.forEach((v: Variant) => {
        if (v.size) set.add(v.size.toUpperCase());
      });
      const sizeOrder: Record<string, number> = { S: 1, P: 1, M: 2, L: 3, G: 3, XL: 4, GG: 4 };
      return Array.from(set).sort(
        (a, b) => (sizeOrder[a] || 99) - (sizeOrder[b] || 99)
      );
    }

    // Se temos variantes cadastradas no produto e nenhuma desta cor tem estoque, o tamanho nesta cor é vazio
    if (Array.isArray(productData.variants) && productData.variants.length > 0) {
      return [];
    }

    // Fallback legado para produtos estáticos sem variantes
    if (!isSpoilerProduct && totalStock > 0 && Array.isArray(productData.sizes) && productData.sizes.length > 0) {
      return productData.sizes.map((s: string) => s.toUpperCase());
    }

    return [];
  }, [productData.variants, productData.sizes, selectedColor, isSpoilerProduct, totalStock]);

  const [selectedSize, setSelectedSize] = useState<string>(() => {
    return inStockVariant?.size || 'S';
  });

  // Sincroniza selectedSize caso a cor mude e o tamanho atual não exista nela
  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(selectedSize.toUpperCase())) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  // Sincroniza a foto da galeria inicial com a foto da variação em estoque
  useEffect(() => {
    if (inStockVariant && inStockVariant.image) {
      const idx = (productData.media || []).findIndex((m: any) => m.url === inStockVariant.image);
      if (idx >= 0) {
        setSelectedMediaIdx(idx);
      }
    }
  }, [inStockVariant?.image]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'desc' | 'sizing' | 'care' | 'reviews'>('desc');
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSizeGuideModalOpen, setIsSizeGuideModalOpen] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      setLoadingReviews(true);
      try {
        const res = await fetch(`/api/reviews?slug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.reviews && data.reviews.length > 0) {
            setProductReviews(data.reviews);
          } else {
            const generalRes = await fetch('/api/reviews');
            if (generalRes.ok) {
              const genData = await generalRes.json();
              setProductReviews(genData.reviews || []);
            }
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar avaliações do produto:', e);
      } finally {
        setLoadingReviews(false);
      }
    }
    loadReviews();
  }, [slug]);

  const avgRating = productReviews.length > 0
    ? (productReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / productReviews.length).toFixed(1)
    : '5.0';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  // Estados para Avaliação Inline sob o Look & Login da Cliente
  const [customerSession, setCustomerSession] = useState<any | null>(null);
  const [showReviewBox, setShowReviewBox] = useState(false);
  const [reviewAuthEmail, setReviewAuthEmail] = useState('');
  const [reviewAuthName, setReviewAuthName] = useState('');
  const [reviewAuthLoading, setReviewAuthLoading] = useState(false);
  const [reviewAuthError, setReviewAuthError] = useState('');
  const [inlineRating, setInlineRating] = useState(5);
  const [inlineComment, setInlineComment] = useState('');
  const [inlinePhotoUrl, setInlinePhotoUrl] = useState('');
  const [uploadingInlinePhoto, setUploadingInlinePhoto] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [inlineSuccessCoupon, setInlineSuccessCoupon] = useState<string | null>(null);

  // Carrega sessão da cliente salva no navegador ou via URL (parâmetros de e-mail pós-entrega)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('ana_customer_session');
      if (saved) {
        setCustomerSession(JSON.parse(saved));
      }
    } catch (_) {}

    const params = new URLSearchParams(window.location.search);
    const shouldReview = params.get('avaliar') === 'true';
    const emailParam = params.get('email');
    const nameParam = params.get('nome');

    if (emailParam) setReviewAuthEmail(emailParam);
    if (nameParam) setReviewAuthName(nameParam);

    if (shouldReview) {
      setActiveTab('reviews');
      setShowReviewBox(true);
      setTimeout(() => {
        const el = document.getElementById('product-tabs');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 400);

      // Se veio com e-mail do pedido, autentica automaticamente a cliente
      if (emailParam) {
        fetch('/api/customer/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'quick_auth',
            email: emailParam,
            name: nameParam || emailParam.split('@')[0],
          }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.customer) {
              setCustomerSession(d.customer);
              localStorage.setItem('ana_customer_session', JSON.stringify(d.customer));
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const handleCustomerQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewAuthError('');
    if (!reviewAuthEmail || !reviewAuthEmail.includes('@')) {
      setReviewAuthError('Por favor, informe um e-mail válido.');
      return;
    }
    setReviewAuthLoading(true);
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quick_auth',
          email: reviewAuthEmail.trim(),
          name: reviewAuthName.trim() || reviewAuthEmail.split('@')[0],
        }),
      });
      const data = await res.json();
      if (res.ok && data.customer) {
        setCustomerSession(data.customer);
        localStorage.setItem('ana_customer_session', JSON.stringify(data.customer));
      } else {
        setReviewAuthError(data.error || 'Erro ao autenticar');
      }
    } catch (err: any) {
      setReviewAuthError(err.message || 'Erro de conexão');
    } finally {
      setReviewAuthLoading(false);
    }
  };

  const handleInlinePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingInlinePhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.url) setInlinePhotoUrl(data.url);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) setInlinePhotoUrl(reader.result.toString());
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Erro ao carregar foto:', err);
    } finally {
      setUploadingInlinePhoto(false);
    }
  };

  const handleInlineReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineComment.trim() || inlineComment.trim().length < 10) {
      alert('Por favor, escreva uma frase sobre o caimento ou tecido da peça (mínimo 10 caracteres).');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerSession?.name || reviewAuthName || 'Cliente Verificada',
          customerEmail: customerSession?.email || reviewAuthEmail,
          city: customerSession?.shipping_address?.city ? `${customerSession.shipping_address.city}, ${customerSession.shipping_address.state || 'MA'}` : 'Massachusetts, EUA',
          productSlug: slug,
          productTitle: productData.title,
          rating: inlineRating,
          comment: inlineComment.trim(),
          photoUrl: inlinePhotoUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar avaliação.');
      }

      setInlineSuccessCoupon('OBRIGADA10');
      if (data.review) {
        setProductReviews((prev) => [data.review, ...prev]);
      }
      setInlineComment('');
      setInlinePhotoUrl('');
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar avaliação.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const shareText = `Olha essa peça linda da Ana Fitness Wear: ${productData.title} ($${productData.price.toFixed(2)})`;
  const productShareUrl = currentUrl || (typeof window !== 'undefined' ? window.location.href : `https://anafitnesswear.com/produto/${slug}`);
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} - ${productShareUrl}`)}`;
  const smsShareUrl = `sms:?&body=${encodeURIComponent(`${shareText} - ${productShareUrl}`)}`;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const urlToCopy = productShareUrl;
      navigator.clipboard.writeText(urlToCopy).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      });
    }
  };

  // Localiza a variante exata (Cor Selecionada + Tamanho Selecionado)
  const currentVariant: Variant | undefined =
    (productData.variants || []).find(
      (v: Variant) =>
        v.color.toLowerCase() === selectedColor.toLowerCase() &&
        v.size.toUpperCase() === selectedSize.toUpperCase()
    ) ||
    (productData.variants || []).find(
      (v: Variant) => v.color.toLowerCase() === selectedColor.toLowerCase()
    );

  // Estoque da variante selecionada
  const currentStock = currentVariant?.stock ? Number(currentVariant.stock) : (Number(productData.stock) || 0);
  const isOutOfStock = currentStock <= 0 || isSpoilerProduct;

  // Troca de Cor com atualização visual de foto vinculada
  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);

    // 1. Procura variante desta cor que possua imagem própria vinculada
    const matchingVariant = (productData.variants || []).find(
      (v: Variant) => v.color.toLowerCase() === colorName.toLowerCase() && v.image
    );

    if (matchingVariant && matchingVariant.image) {
      const idx = productData.media.findIndex((m: any) => m.url === matchingVariant.image);
      if (idx >= 0) {
        setSelectedMediaIdx(idx);
        return;
      }
    }

    // 2. Fallback: Procura foto vinculada a essa cor na galeria
    const colorMediaIdx = productData.media.findIndex(
      (m: any) => m.color && m.color.toLowerCase() === colorName.toLowerCase()
    );
    if (colorMediaIdx >= 0) {
      setSelectedMediaIdx(colorMediaIdx);
    }
  };

  // Troca de Tamanho
  const handleSelectSize = (sz: string) => {
    setSelectedSize(sz);
  };

  // Pre-seleciona cor se vier via parâmetro de URL (?cor=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const corParam = params.get('cor');
      if (corParam) {
        handleSelectColor(corParam);
      }
    } catch (_) {}
  }, [productData.variants, productData.media]);

  // Dispara evento de ViewContent / view_item nos Pixels
  useEffect(() => {
    if (productData) {
      trackEvent.viewItem({
        id: slug,
        title: productData.title,
        price: currentVariant?.price || productData.price,
        category: productData.categoryPt || productData.categoryEn,
      });
    }
  }, [slug, productData?.title]);

  // Ação de Compra / Adicionar à Sacola (Apenas peças e tamanhos com estoque real)
  const handleActionClick = () => {
    if (isSpoilerProduct) return;

    const matchedVariant = (productData.variants || []).find(
      (v: Variant) =>
        v.color.toLowerCase() === selectedColor.toLowerCase() &&
        v.size.toUpperCase() === selectedSize.toUpperCase()
    );
    const stockQty = matchedVariant ? Number(matchedVariant.stock) : (Number(productData.stock) || 0);
    if (stockQty <= 0) return; // Bloqueio estrito: sem estoque não adiciona à sacola

    const cartItemToSave = {
      title: productData.title,
      slug: slug,
      size: selectedSize,
      color: selectedColor,
      sku: matchedVariant?.sku || `${slug}-${selectedColor.slice(0, 3)}-${selectedSize}`,
      price: matchedVariant?.price || productData.price,
      quantity: 1,
      image: matchedVariant?.image || productData.media[selectedMediaIdx]?.url || productData.media[0]?.url,
      isBackorder: false,
      productionDays: 0,
    };

    try {
      localStorage.setItem('ana_cart_item', JSON.stringify(cartItemToSave));
      window.dispatchEvent(new Event('ana_cart_updated'));
    } catch (e) {}

    // Dispara evento de AddToCart nos Pixels de Rastreamento (Meta, Google, TikTok, Pinterest)
    trackEvent.addToCart({
      id: slug,
      title: productData.title,
      price: currentVariant?.price || productData.price,
      quantity: 1,
      size: selectedSize,
      color: selectedColor,
    });

    setCartFeedback('added');
    setTimeout(() => setCartFeedback(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-16 bg-white">
      {/* Breadcrumb */}
      <nav className="text-[10px] font-black uppercase tracking-widest text-deep-black/50 flex items-center gap-2">
        <Link href="/" className="hover:text-deep-black transition">HOME</Link>
        <span>/</span>
        <Link
          href={isSpoilerProduct ? '/?cat=spoiler' : `/?cat=${productData.categoryKey || productData.category || 'all'}`}
          className="hover:text-deep-black transition"
        >
          {isSpoilerProduct
            ? (lang === 'pt' ? '👀 SPOILER (EM BREVE)' : '👀 SPOILER (COMING SOON)')
            : (lang === 'pt' ? productData.categoryPt : productData.categoryEn)}
        </Link>
        <span>/</span>
        <span className="text-deep-black font-black">{productData.title}</span>
      </nav>

      {/* Grid Principal: Galeria Lateral + Painel de Compra */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* COLUNA ESQUERDA: A PEÇA (GALERIA + DESCRIÇÃO EMBAIXO DA PEÇA) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col-reverse sm:flex-row gap-4">
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible shrink-0 pb-2 sm:pb-0">
              {productData.media.map((item: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedMediaIdx(idx);
                    setIsZoomed(false);
                  }}
                  className={`w-16 h-20 sm:w-20 sm:h-24 overflow-hidden border-2 transition-all relative shrink-0 ${
                    selectedMediaIdx === idx
                      ? 'border-deep-black ring-2 ring-gold'
                      : 'border-deep-black/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full bg-deep-black flex items-center justify-center text-gold text-[9px] font-bold">
                      VIDEO
                    </div>
                  ) : (
                    <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 relative aspect-[3/4] bg-deep-black/5 overflow-hidden border border-deep-black/10 group">
              {productData.media[selectedMediaIdx]?.type === 'video' ? (
                <video
                  src={productData.media[selectedMediaIdx].url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={productData.media[selectedMediaIdx]?.url}
                  alt={productData.title}
                  className={`w-full h-full object-cover transition-transform duration-500 cursor-zoom-in ${
                    isZoomed ? 'scale-150' : 'group-hover:scale-105'
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                />
              )}

              {/* Selos de Destaque da Foto */}
              {isSpoilerProduct ? (
                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-sm bg-deep-black text-gold border border-gold">
                    👀 {lang === 'pt' ? 'SPOILER • EM BREVE' : 'SPOILER • COMING SOON'}
                  </span>
                </div>
              ) : (
                (productData.ribbon || productData.badgePt) && (
                  <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-sm ${productData.badgeStyle || 'bg-gold text-deep-black'}`}>
                      {productData.ribbon || (lang === 'pt' ? productData.badgePt : productData.badgeEn)}
                    </span>
                  </div>
                )
              )}

              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="absolute bottom-4 right-4 p-2.5 bg-deep-black/80 hover:bg-gold hover:text-deep-black text-white backdrop-blur-md transition"
                title="Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DESCRIÇÃO EMBAIXO DA PEÇA (ABOUT THIS PIECE) */}
          {(productData.descriptionPt || productData.descriptionEn) && (
            <div className="p-5 sm:p-6 bg-warm-light/20 border-2 border-deep-black space-y-2.5 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between border-b border-deep-black/10 pb-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span>{lang === 'pt' ? 'SOBRE A PEÇA' : 'ABOUT THIS PIECE'}</span>
                </span>
                <span className="text-[9px] font-black uppercase text-gold bg-deep-black px-2 py-0.5">
                  {lang === 'pt' ? '100% ZERO TRANSPARÊNCIA' : '100% SQUAT-PROOF'}
                </span>
              </div>
              <div className="pt-1">
                <FormattedDescription
                  text={lang === 'pt' ? productData.descriptionPt : productData.descriptionEn}
                />
              </div>
            </div>
          )}
        </div>

        {/* DETALHES DA PEÇA & COMPRA (DÓLAR $) */}
        <div className="lg:col-span-5 space-y-7 bg-white">
          <div className="space-y-3 border-b border-deep-black/10 pb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              {lang === 'pt' ? productData.categoryPt : productData.categoryEn}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-deep-black leading-tight">
              {productData.title}
            </h1>

            <button
              type="button"
              onClick={() => {
                setActiveTab('reviews');
                const el = document.getElementById('product-tabs');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-3 pt-1 text-left group cursor-pointer"
            >
              <div className="flex text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-deep-black group-hover:text-gold transition">
                {avgRating} ({productReviews.length > 0 ? `${productReviews.length} ${lang === 'pt' ? 'avaliações' : 'reviews'}` : (lang === 'pt' ? 'AVALIAÇÕES VERIFICADAS' : 'VERIFIED REVIEWS')}) • {lang === 'pt' ? 'Ver Opiniões' : 'See Reviews'}
              </span>
            </button>

            {/* PREÇO EM DÓLAR ($) */}
            <div className="flex items-baseline gap-3 pt-3">
              <span className="text-3xl sm:text-4xl font-black text-deep-black uppercase tracking-wider font-mono">
                ${productData.price.toFixed(2)}
              </span>
              {productData.originalPrice && productData.originalPrice > productData.price && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-deep-black/40 line-through uppercase tracking-wider font-mono">
                    ${productData.originalPrice.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5">
                    -{Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100)}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* PARCELAMENTO BNPL (AFFIRM & AFTERPAY) */}
            <div className="flex items-center gap-2 pt-1.5 pb-1 text-[11px] text-deep-black/85 flex-wrap">
              <span>
                {lang === 'pt' ? 'ou 4x de' : 'or 4 interest-free payments of'}{' '}
                <strong className="font-mono font-black text-deep-black text-xs">
                  ${(productData.price / 4).toFixed(2)}
                </strong>{' '}
                {lang === 'pt' ? 'sem juros com' : 'with'}
              </span>
              <div className="inline-flex items-center gap-1.5 font-black uppercase text-[10px]">
                <span className="px-1.5 py-0.5 bg-[#004BFF]/10 text-[#004BFF] border border-[#004BFF]/30 font-bold rounded-xs tracking-tight">
                  affirm
                </span>
                <span className="text-deep-black/40 text-[9px] font-bold">{lang === 'pt' ? 'ou' : 'or'}</span>
                <span className="px-1.5 py-0.5 bg-[#b2fce4] text-deep-black border border-[#7ae3c0] font-bold rounded-xs tracking-tight">
                  afterpay ↗
                </span>
              </div>
            </div>

            {/* Relógio Psicológico de Urgência & Escassez (15 minutos com clientes ao vivo) */}
            <UrgencyCountdownTimer mode="product" />
          </div>

          {/* Banner de Frete Fixo $9.99 */}
          <div className="p-3.5 bg-deep-black text-white border border-gold flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2 text-gold">
              <Truck className="w-4 h-4 text-gold shrink-0" />
              <span>{lang === 'pt' ? 'FRETE FIXO: $9.99 (TODOS OS EUA)' : 'FLAT RATE SHIPPING: $9.99 (ALL US)'}</span>
            </div>
            <Link href="/politica-de-envio" className="text-[10px] text-white/70 hover:text-gold underline">
              {lang === 'pt' ? 'VER REGRAS' : 'DETAILS'}
            </Link>
          </div>

          {/* Indicador Oficial de Bojo */}
          <div className="p-3 bg-neutral-50 border-2 border-deep-black/15 flex items-center justify-between gap-3 text-xs uppercase tracking-wider shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold shrink-0" />
              <span className="font-bold text-deep-black/60">{lang === 'pt' ? 'BOJO:' : 'BRA CUPS:'}</span>
              <span className="font-black text-deep-black">
                {productData.cupsType === 'removable'
                  ? (lang === 'pt' ? 'COM BOJO REMOVÍVEL' : 'INCLUDES REMOVABLE CUPS')
                  : productData.cupsType === 'fixed'
                  ? (lang === 'pt' ? 'BOJO FIXO ANATÔMICO' : 'BUILT-IN FIXED CUPS')
                  : (lang === 'pt' ? 'SEM BOJO (FORRO DUPLO)' : 'UNPADDED (DOUBLE LINED)')}
              </span>
            </div>
            <span className={`text-[9px] font-black px-2 py-0.5 ${
              productData.cupsType === 'none'
                ? 'bg-neutral-200 text-deep-black'
                : 'bg-gold text-deep-black'
            }`}>
              {productData.cupsType === 'none'
                ? (lang === 'pt' ? 'SEM BOJO' : 'NO CUPS')
                : (lang === 'pt' ? 'INCLUSO' : 'INCLUDED')}
            </span>
          </div>

          {/* Seletor de Cores com Swatches Hexadecimais e Nome da Cor */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span>{lang === 'pt' ? 'COR:' : 'COLOR:'}</span>
                <span className="text-gold font-bold">{selectedColor}</span>
              </span>
              <span className="text-[10px] text-deep-black/60 font-bold">
                {availableColors.length} {lang === 'pt' ? 'CORES DISPONÍVEIS' : 'COLORS AVAILABLE'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {availableColors.map((col) => {
                const isSelected = selectedColor.toLowerCase() === col.name.toLowerCase();
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => handleSelectColor(col.name)}
                    className={`group flex items-center gap-2 px-3 py-2 border text-xs font-black uppercase tracking-wider transition-all relative ${
                      isSelected
                        ? 'border-deep-black bg-deep-black text-white ring-2 ring-gold shadow-sm'
                        : 'border-deep-black/20 hover:border-deep-black text-deep-black bg-white'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/30 shrink-0 shadow-inner"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span>{col.name}</span>
                    {isSelected && (
                      <Check className="w-3 h-3 text-gold stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seletor de Tamanhos (Apenas tamanhos com estoque real) */}
          {isSpoilerProduct ? (
            <div className="p-4 bg-neutral-900 border-2 border-gold text-white space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gold text-deep-black text-[9px] font-black tracking-widest uppercase">
                  👀 SPOILER
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-gold">
                  {lang === 'pt' ? 'PRÓXIMO LANÇAMENTO • PRÉVIA EXCLUSIVA' : 'UPCOMING DROP • EXCLUSIVE PREVIEW'}
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium leading-relaxed">
                {lang === 'pt'
                  ? 'Esta peça é um spoiler exclusivo do nosso próximo lançamento. Você pode conferir os detalhes e fotos, mas não realizamos reservas antecipadas. Fique atenta ao nosso WhatsApp para ser notificada assim que estiver à pronta entrega!'
                  : 'This piece is an exclusive preview of our upcoming drop. You can check all photos and details, but reservations are not accepted. Keep in touch via WhatsApp to be alerted when stock arrives!'}
              </p>
            </div>
          ) : availableSizes.length > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span>{lang === 'pt' ? 'TAMANHO:' : 'SIZE:'}</span>
                  <span className="text-gold font-bold">{selectedSize}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideModalOpen(true)}
                  className="flex items-center gap-1.5 text-[10.5px] font-black text-deep-black hover:text-gold uppercase tracking-wider underline cursor-pointer transition py-0.5"
                  title={lang === 'pt' ? 'Abrir Tabela de Medidas Oficial' : 'Open Official Size Guide'}
                >
                  <Ruler className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>{lang === 'pt' ? 'Tabela de Medidas (P • M • G • GG)' : 'Size Guide (S • M • L • XL)'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {availableSizes.map((sz: string) => {
                  const isSelected = sz.toUpperCase() === selectedSize.toUpperCase();
                  const matchedVariant = (productData.variants || []).find(
                    (v: Variant) =>
                      v.color.toLowerCase() === selectedColor.toLowerCase() &&
                      v.size.toUpperCase() === sz.toUpperCase()
                  );
                  const stockQty = matchedVariant ? Number(matchedVariant.stock) : (Number(productData.stock) || 0);

                  const upperSz = sz.toUpperCase();
                  const sizeLabel = lang === 'pt'
                    ? (upperSz === 'S' || upperSz === 'P' ? 'P' : upperSz === 'M' ? 'M' : upperSz === 'L' || upperSz === 'G' ? 'G' : upperSz === 'XL' || upperSz === 'GG' ? 'GG' : sz)
                    : (upperSz === 'P' || upperSz === 'S' ? 'S' : upperSz === 'M' ? 'M' : upperSz === 'G' || upperSz === 'L' ? 'L' : upperSz === 'GG' || upperSz === 'XL' ? 'XL' : sz);

                  const subLabel = (upperSz === 'S' || upperSz === 'P')
                    ? 'BR 36-38 • US 2-4'
                    : upperSz === 'M'
                    ? 'BR 40-42 • US 6-8'
                    : (upperSz === 'L' || upperSz === 'G')
                    ? 'BR 44 • US 10-12'
                    : (upperSz === 'XL' || upperSz === 'GG')
                    ? 'BR 46-48 • US 14-16'
                    : '';

                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleSelectSize(sz)}
                      className={`py-3 px-2 text-xs font-black uppercase tracking-wider border transition-all relative flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        isSelected
                          ? 'border-deep-black bg-deep-black text-white ring-2 ring-gold shadow-md'
                          : 'border-deep-black/30 hover:border-gold text-deep-black bg-white'
                      }`}
                    >
                      <span className="text-xs font-black">{sizeLabel}</span>
                      {subLabel && (
                        <span className={`text-[8.5px] font-mono ${isSelected ? 'text-white/70' : 'text-deep-black/60'}`}>
                          {subLabel}
                        </span>
                      )}
                      <span
                        className={`text-[8px] font-black tracking-widest mt-0.5 ${
                          isSelected ? 'text-emerald-300' : 'text-emerald-700'
                        }`}
                      >
                        {stockQty} IN STOCK
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Código SKU Ativo */}
              <div className="flex items-center justify-between text-[10px] font-mono text-deep-black/60 pt-1">
                <span>SKU: {currentVariant?.sku || `${slug}-${selectedColor.slice(0, 3)}-${selectedSize}`}</span>
                {currentVariant?.price && currentVariant.price !== productData.price && (
                  <span className="text-gold font-bold font-mono">
                    ${currentVariant.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-neutral-100 border border-deep-black/20 text-deep-black text-xs font-bold uppercase tracking-wider text-center">
              {lang === 'pt' ? 'Tamanho esgotado nesta cor' : 'Size out of stock for this color'}
            </div>
          )}

          {/* Status do Estoque */}
          {!isSpoilerProduct && (
            <div className="p-4 border-2 border-deep-black bg-white">
              <div className="flex items-start gap-3 text-deep-black">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-black uppercase tracking-wider text-deep-black">
                    {lang === 'pt' ? 'EM ESTOQUE • PRONTA ENTREGA' : 'IN STOCK • READY TO SHIP'}
                  </p>
                  <p className="text-deep-black/70 font-medium">
                    {lang === 'pt'
                      ? 'Despacho express a partir de Leominster, MA em 1 a 5 dias úteis com código de rastreamento.'
                      : 'Ships from Leominster, MA within 1 to 5 business days with full online tracking.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Formas de Pagamento dos EUA */}
          {!isSpoilerProduct && (
            <div className="space-y-2 border-t border-deep-black/10 pt-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                {lang === 'pt' ? 'PAGAMENTOS ACEITOS:' : 'ACCEPTED PAYMENT METHODS:'}
              </span>
              <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase text-deep-black">
                <span className="px-2.5 py-1 bg-deep-black text-white font-mono">APPLE PAY</span>
                <span className="px-2.5 py-1 bg-gold text-deep-black font-mono">ZELLE</span>
                <span className="px-2.5 py-1 bg-deep-black text-gold font-mono">VENMO</span>
                <span className="px-2.5 py-1 border border-deep-black/30">CREDIT CARD</span>
                <span className="px-2.5 py-1 border border-deep-black/30">DEBIT CARD</span>
              </div>
            </div>
          )}

          {/* AÇÕES DE COMPRA OU ALERTA SPOILER WHATSAPP */}
          <div className="space-y-3">
            {isSpoilerProduct ? (
              <div className="space-y-3">
                <a
                  href={`https://wa.me/19788608822?text=${encodeURIComponent(
                    `Olá Ana! Vi o SPOILER da peça *${productData.title}* no site e gostaria de ser avisada assim que estiver à pronta entrega!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-luxury cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                  <span>{lang === 'pt' ? 'AVISE-ME NO WHATSAPP QUANDO CHEGAR' : 'NOTIFY ME ON WHATSAPP WHEN AVAILABLE'}</span>
                </a>
                <div className="p-3 bg-neutral-100 border border-deep-black/15 text-center text-[10.5px] font-black uppercase tracking-wider text-deep-black/70">
                  {lang === 'pt' ? '👀 Peça em prévia spoiler • Sem reservas antecipadas' : '👀 Preview piece • No early reservations'}
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handleActionClick();
                    window.location.href = '/checkout';
                  }}
                  disabled={availableSizes.length === 0}
                  className={`w-full py-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-luxury cursor-pointer ${
                    availableSizes.length === 0
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-deep-black hover:bg-gold hover:text-deep-black text-white'
                  }`}
                >
                  <Lock className="w-4 h-4 text-gold" />
                  <span>
                    {lang === 'pt'
                      ? `FINALIZAR NO CHECKOUT AGORA • $${(currentVariant?.price || productData.price).toFixed(2)}`
                      : `PROCEED TO CHECKOUT NOW • $${(currentVariant?.price || productData.price).toFixed(2)}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleActionClick}
                  disabled={availableSizes.length === 0}
                  className={`w-full py-3.5 border-2 border-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-xs ${
                    availableSizes.length === 0
                      ? 'bg-neutral-100 text-neutral-400 border-neutral-300 cursor-not-allowed'
                      : 'bg-white hover:bg-deep-black hover:text-white text-deep-black cursor-pointer'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-gold" />
                  <span>{lang === 'pt' ? 'ADICIONAR À SACOLA E CONTINUAR' : 'ADD TO BAG & CONTINUE'}</span>
                </button>

                {cartFeedback && (
                  <div className="p-3.5 bg-deep-black text-white border-2 border-gold text-xs font-bold uppercase tracking-wider flex items-center justify-between animate-fadeIn">
                    <span>
                      {lang === 'pt' ? '✓ Peça adicionada com sucesso!' : '✓ Item added to bag!'}
                    </span>
                    <Link href="/checkout" className="text-gold underline hover:text-white font-black flex items-center gap-1">
                      <span>IR P/ CHECKOUT</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Módulo de Compartilhamento Oficial: WhatsApp & SMS */}
          <div className="space-y-2.5 pt-4 border-t border-deep-black/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/70 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-gold" />
                <span>{lang === 'pt' ? 'COMPARTILHAR ESTA PEÇA:' : 'SHARE THIS PIECE:'}</span>
              </span>
              {copySuccess && (
                <span className="text-[9px] font-black text-green-700 bg-green-50 px-2 py-0.5 border border-green-200 animate-fadeIn">
                  ✓ {lang === 'pt' ? 'LINK COPIADO!' : 'LINK COPIED!'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Copiar Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-3 bg-white hover:bg-deep-black hover:text-white text-deep-black font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition border border-deep-black/30 shadow-xs"
                title="Copiar link da peça"
              >
                <Copy className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'pt' ? 'COPIAR LINK' : 'COPY LINK'}</span>
              </button>

              {/* Compartilhar WhatsApp */}
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-sm"
                title="Compartilhar no WhatsApp"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>WHATSAPP</span>
              </a>

              {/* Compartilhar SMS */}
              <a
                href={smsShareUrl}
                className="py-2.5 px-3 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition border border-deep-black shadow-sm"
                title="Compartilhar por SMS / Mensagem de Texto"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>SMS</span>
              </a>

              {/* Outros Apps / Escolher Aplicativo */}
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="py-2.5 px-3 bg-gold hover:bg-gold/90 text-deep-black font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-xs"
                title="Escolher outro aplicativo para compartilhar"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'pt' ? 'OUTROS APPS' : 'MORE APPS'}</span>
              </button>
            </div>
          </div>

          {/* Garantias */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-deep-black/10 text-center text-[10px] font-bold uppercase tracking-wider text-deep-black/70">
            <div className="space-y-1">
              <Truck className="w-4 h-4 mx-auto text-gold" />
              <span>{lang === 'pt' ? 'Frete $9.99' : 'Flat $9.99'}</span>
            </div>
            <div className="space-y-1">
              <RotateCcw className="w-4 h-4 mx-auto text-gold" />
              <span>{lang === 'pt' ? '30 Dias Troca' : '30-Day Returns'}</span>
            </div>
            <div className="space-y-1">
              <ShieldCheck className="w-4 h-4 mx-auto text-gold" />
              <span>{lang === 'pt' ? 'Zero Transparência' : 'Zero See-Through'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MÓDULO DE ABAS (DESCRIÇÃO, MEDIDAS, CUIDADOS, PRÉ-VENDA)
         ========================================================================= */}
      <section id="product-tabs" className="border-t border-deep-black/10 pt-16 space-y-8 scroll-mt-24">
        <div className="flex border-b border-deep-black/15 overflow-x-auto no-scrollbar gap-2 sm:gap-6">
          {[
            { id: 'desc', label: t('tab.desc'), icon: Sparkles },
            { id: 'sizing', label: t('tab.sizing'), icon: Ruler },
            { id: 'care', label: t('tab.care'), icon: Droplets },
            { id: 'reviews', label: `${lang === 'pt' ? 'AVALIAÇÕES' : 'REVIEWS'} (${productReviews.length})`, icon: Star },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-3 sm:px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap border-b-2 -mb-[2px] ${
                  isActive
                    ? 'border-deep-black text-deep-black bg-white'
                    : 'border-transparent text-deep-black/40 hover:text-deep-black hover:border-gold/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-gold' : 'text-deep-black/30'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-2">
          {/* ABA 1: PERFORMANCE */}
          {activeTab === 'desc' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                    ANA FITNESS WEAR • ATELIER
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-deep-black mt-1">
                    {lang === 'pt' ? 'COMPRESSÃO ANATÔMICA & TOQUE AMANTEIGADO' : 'ANATOMICAL COMPRESSION & BUTTERY-SOFT FEEL'}
                  </h3>
                </div>

                <div className="pt-1">
                  <FormattedDescription
                    text={lang === 'pt' ? productData.descriptionPt : productData.descriptionEn}
                  />
                </div>

                <div className="p-5 border border-deep-black/10 bg-white space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gold" />
                    {lang === 'pt' ? 'ZERO TRANSPARÊNCIA COMPROVADA' : 'VERIFIED ZERO SEE-THROUGH'}
                  </h4>
                  <p className="text-xs text-deep-black/70 font-medium uppercase tracking-wide leading-relaxed">
                    {lang === 'pt'
                      ? 'Nossas peças são rigorosamente testadas sob iluminação direta e flexão máxima. Segurança absoluta para agachar sem preocupações.'
                      : 'Every silhouette is rigorously tested under high-intensity gym lighting and 90-degree deep squats. Absolute peace of mind.'}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {[
                  {
                    title: productData.cupsType === 'fixed'
                      ? (lang === 'pt' ? 'BOJO FIXO ANATÔMICO' : 'BUILT-IN FIXED CUPS')
                      : productData.cupsType === 'none'
                      ? (lang === 'pt' ? 'SEM BOJO (FORRO DUPLO)' : 'UNPADDED (DOUBLE LINED)')
                      : (lang === 'pt' ? 'BOJO REMOVÍVEL INCLUSO' : 'REMOVABLE BRA CUPS'),
                    desc: productData.cupsType === 'fixed'
                      ? (lang === 'pt' ? 'Bojo embutido de sustentação anatômica que não sai do lugar durante treinos intensos.' : 'Built-in contour cups engineered to stay perfectly positioned during movement.')
                      : productData.cupsType === 'none'
                      ? (lang === 'pt' ? 'Confeccionada sem bojo, com forro duplo de alta compressão para suporte natural e conforto.' : 'Crafted without padding, featuring double-layer compression for natural contour and support.')
                      : (lang === 'pt' ? 'Acompanha bojo removível para usar com ou sem, personalizando o caimento e o suporte.' : 'Built-in slots allowing effortless insertion or removal of padding for customizable coverage.'),
                    icon: Sparkles,
                  },
                  {
                    title: lang === 'pt' ? 'ELASTICIDADE 4-WAY STRETCH' : '4-WAY STRETCH RECOVERY',
                    desc: lang === 'pt' ? 'Fibras elásticas de alta recuperação que acompanham cada repetição sem deformar.' : 'High-recovery spandex fibers that stretch multidirectionally without sagging.',
                    icon: Activity,
                  },
                  {
                    title: lang === 'pt' ? 'CÓS DUPLO ANTI-ROLAMENTO' : 'ANTI-ROLL DOUBLE WAISTBAND',
                    desc: lang === 'pt' ? 'Firmeza e sustentação abdominal que dispensam puxões a cada série de exercícios.' : 'Double-layered waist contour that stays securely in place during cardio and lifting.',
                    icon: Layers,
                  },
                  {
                    title: lang === 'pt' ? 'DRY-FIT & PROTEÇÃO SOLAR' : 'DRY-FIT & UV 50+ DEFENSE',
                    desc: lang === 'pt' ? 'Secagem acelerada e bloqueio de raios UV para treinos internos e ao ar livre.' : 'Instant sweat wicking with UV 50+ protection for indoor and outdoor endurance.',
                    icon: Sun,
                  },
                ].map((feat, i) => {
                  const FIcon = feat.icon;
                  return (
                    <div key={i} className="p-4 border border-deep-black/10 bg-white hover:border-gold transition space-y-1.5">
                      <div className="flex items-center gap-2">
                        <FIcon className="w-4 h-4 text-gold" />
                        <h5 className="text-xs font-black uppercase tracking-wider text-deep-black">
                          {feat.title}
                        </h5>
                      </div>
                      <p className="text-[11px] text-deep-black/70 font-medium uppercase tracking-wide leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA 2: TABELA DE MEDIDAS SEPARADA (P, M, G, GG) */}
          {activeTab === 'sizing' && (
            <div className="pt-2">
              <ProductSizeGuide
                selectedSize={selectedSize}
                onSelectSize={handleSelectSize}
                availableSizes={availableSizes}
                variants={productData.variants}
                selectedColor={selectedColor}
              />
            </div>
          )}

          {/* ABA 3: CUIDADOS & LAVAGEM */}
          {activeTab === 'care' && (
            <div className="space-y-8">
              <div className="max-w-3xl space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  GARMENT PRESERVATION
                </span>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-deep-black">
                  {lang === 'pt' ? 'INSTRUÇÕES DE LAVAGEM' : 'WASH & CARE INSTRUCTIONS'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: lang === 'pt' ? 'ÁGUA FRIA' : 'COLD WATER WASH',
                    desc: lang === 'pt' ? 'Lavar em água fria no ciclo delicado e com a peça virada do avesso.' : 'Gentle cycle with cold water, inside-out.',
                    icon: Droplets,
                  },
                  {
                    title: lang === 'pt' ? 'SEM AMACIANTE' : 'NO FABRIC SOFTENERS',
                    desc: lang === 'pt' ? 'Amaciantes impermeabilizam os microporos respiráveis.' : 'Softeners damage the breathable Dry-Fit fibers.',
                    icon: Shield,
                  },
                  {
                    title: lang === 'pt' ? 'SECAGEM NATURAL' : 'NATURAL AIR DRY',
                    desc: lang === 'pt' ? 'Secar à sombra. Não usar secadora de alta temperatura.' : 'Air dry in shade. Avoid high-heat tumble dryers.',
                    icon: Wind,
                  },
                  {
                    title: lang === 'pt' ? 'NÃO PASSAR A FERRO' : 'NO IRONING',
                    desc: lang === 'pt' ? 'O tecido não amassa e o calor excessivo prejudica o elastano.' : 'Fabric is naturally wrinkle-free. Protect the spandex.',
                    icon: Scissors,
                  },
                ].map((c, i) => {
                  const CIcon = c.icon;
                  return (
                    <div key={i} className="p-5 border border-deep-black/15 bg-white space-y-2.5">
                      <div className="w-10 h-10 rounded-full bg-deep-black text-gold flex items-center justify-center">
                        <CIcon className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-deep-black">
                        {c.title}
                      </h4>
                      <p className="text-[11px] text-deep-black/70 font-medium uppercase tracking-wide leading-relaxed">
                        {c.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}



          {/* ABA 5: AVALIAÇÕES & PROVA SOCIAL */}
          {activeTab === 'reviews' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border-2 border-deep-black p-6 sm:p-8">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                    OPINIÃO DE QUEM JÁ VESTE
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                    <span>{lang === 'pt' ? 'AVALIAÇÕES & PROVA SOCIAL' : 'CUSTOMER REVIEWS'}</span>
                  </h3>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-1 text-gold">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                      ))}
                    </div>
                    <span className="text-2xl font-black font-mono text-deep-black">{avgRating}</span>
                    <span className="text-xs text-deep-black/60 font-bold uppercase">
                      ({productReviews.length} {lang === 'pt' ? 'avaliações verificadas' : 'verified reviews'})
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReviewBox(!showReviewBox)}
                    className="px-6 py-3.5 bg-gold hover:bg-deep-black hover:text-gold text-deep-black border-2 border-deep-black font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow cursor-pointer"
                  >
                    <Star className="w-4 h-4 fill-current" />
                    <span>{showReviewBox ? (lang === 'pt' ? 'FECHAR FORMULÁRIO' : 'CLOSE FORM') : (lang === 'pt' ? 'AVALIAR ESTA PEÇA (+10% OFF)' : 'REVIEW THIS LOOK (+10% OFF)')}</span>
                  </button>
                </div>
              </div>

              {/* FORMULÁRIO INLINE DE AVALIAÇÃO DIRETAMENTE SOB O LOOK */}
              {showReviewBox && (
                <div className="bg-white border-2 border-gold p-6 sm:p-8 space-y-6 shadow-luxury animate-fadeIn">
                  {!customerSession ? (
                    /* PASSO 1: IDENTIFICAÇÃO / LOGIN DO CLIENTE */
                    <div className="space-y-4 max-w-lg mx-auto text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold border-2 border-gold shrink-0">
                          <Lock className="w-6 h-6 text-deep-black" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                            AVALIAÇÃO DE CLIENTE VERIFICADA
                          </span>
                          <h4 className="text-base font-black uppercase tracking-wider text-deep-black">
                            {lang === 'pt' ? 'IDENTIFIQUE-SE PARA AVALIAR ESTA PEÇA' : 'LOGIN TO REVIEW THIS SILHOUETTE'}
                          </h4>
                        </div>
                      </div>

                      <p className="text-xs text-deep-black/70 leading-relaxed uppercase">
                        {lang === 'pt'
                          ? 'Para garantir a veracidade dos depoimentos, apenas clientes que adquiriram peças podem avaliar. Digite seu e-mail de compra para liberar o formulário e receber seu cupom de 10% OFF:'
                          : 'To guarantee verified buyer authenticity, enter your order email to unlock the review form and receive your 10% OFF coupon:'}
                      </p>

                      {reviewAuthError && (
                        <div className="p-3 bg-red-50 border-2 border-red-500 text-red-900 text-xs font-black uppercase">
                          {reviewAuthError}
                        </div>
                      )}

                      <form onSubmit={handleCustomerQuickLogin} className="space-y-3 pt-1 text-left">
                        <div>
                          <label className="text-[10px] font-black uppercase text-deep-black block mb-1">
                            {lang === 'pt' ? 'SEU E-MAIL DE COMPRA *' : 'ORDER EMAIL *'}
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="ex: mariana@gmail.com"
                            value={reviewAuthEmail}
                            onChange={(e) => setReviewAuthEmail(e.target.value)}
                            className="w-full p-3 border-2 border-deep-black text-xs font-mono font-bold lowercase focus:outline-none focus:border-gold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase text-deep-black block mb-1">
                            {lang === 'pt' ? 'SEU NOME COMPLETO *' : 'YOUR FULL NAME *'}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Mariana Silva"
                            value={reviewAuthName}
                            onChange={(e) => setReviewAuthName(e.target.value)}
                            className="w-full p-3 border-2 border-deep-black text-xs font-bold uppercase focus:outline-none focus:border-gold"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={reviewAuthLoading}
                          className="w-full py-3.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 border border-gold shadow cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4 text-gold" />
                          <span>{reviewAuthLoading ? 'VERIFICANDO...' : (lang === 'pt' ? 'CONTINUAR & AVALIAR O LOOK' : 'CONTINUE & REVIEW')}</span>
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* PASSO 2: FORMULÁRIO DE AVALIAÇÃO DA PEÇA ESPECÍFICA */
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-deep-black/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center font-black text-gold border border-gold text-sm shrink-0">
                            {(customerSession.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5">
                                ✓ COMPRADORA IDENTIFICADA
                              </span>
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-wider text-deep-black mt-0.5">
                              {customerSession.name || customerSession.email}
                            </h4>
                            <span className="text-[10px] text-deep-black/60 font-mono block">
                              Avaliando: <strong>{productData.title}</strong>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            localStorage.removeItem('ana_customer_session');
                            setCustomerSession(null);
                          }}
                          className="text-[10px] text-deep-black/50 hover:text-red-600 font-bold uppercase underline"
                        >
                          Trocar de conta
                        </button>
                      </div>

                      {inlineSuccessCoupon ? (
                        <div className="p-6 bg-emerald-50 border-2 border-emerald-500 text-center space-y-4 animate-fadeIn">
                          <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow">
                            <CheckCircle2 className="w-7 h-7" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-base font-black uppercase tracking-wider text-emerald-950">
                              SUA AVALIAÇÃO FOI PUBLICADA COM SUCESSO!
                            </h4>
                            <p className="text-xs text-emerald-900 leading-relaxed max-w-md mx-auto">
                              Muito obrigada, <strong>{customerSession.name}</strong>! Seu depoimento já está visível logo abaixo. Enviamos o seu cupom de 10% OFF para o e-mail: <strong>{customerSession.email}</strong>.
                            </p>
                          </div>
                          <div className="inline-block bg-deep-black text-gold border-2 border-gold px-6 py-2.5 font-mono font-black text-lg tracking-widest shadow">
                            CUPOM: {inlineSuccessCoupon}
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleInlineReviewSubmit} className="space-y-4 text-xs">
                          {/* NOTA EM ESTRELAS */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-black uppercase tracking-wider text-deep-black block">
                              QUAL A SUA NOTA PARA ESTE LOOK? *
                            </label>
                            <div className="flex items-center gap-1.5 pt-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setInlineRating(s)}
                                  className="p-1 hover:scale-125 transition-transform cursor-pointer"
                                >
                                  <Star
                                    className={`w-8 h-8 sm:w-9 sm:h-9 ${
                                      inlineRating >= s ? 'fill-gold text-gold drop-shadow-sm' : 'fill-gray-200 text-gray-300'
                                    }`}
                                  />
                                </button>
                              ))}
                              <span className="text-[11px] font-mono font-black text-gold ml-2">
                                {inlineRating === 5 ? '⭐⭐⭐⭐⭐ EXCELENTE' : `${inlineRating} ESTRELAS`}
                              </span>
                            </div>
                          </div>

                          {/* COMENTÁRIO */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-black uppercase tracking-wider text-deep-black block">
                              O QUE VOCÊ ACHOU DO CAIMENTO, TECIDO E CONFORTO? *
                            </label>
                            <textarea
                              required
                              rows={4}
                              value={inlineComment}
                              onChange={(e) => setInlineComment(e.target.value)}
                              placeholder={`Conte sua experiência real com ${productData.title} (ex: compressão do cós, se ficou transparente no agachamento, toque da malha)...`}
                              className="w-full p-3 border-2 border-deep-black text-xs font-medium focus:outline-none focus:border-gold"
                            />
                          </div>

                          {/* FOTO DA CLIENTE VESTINDO O LOOK */}
                          <div className="space-y-1.5 border-t border-deep-black/10 pt-3">
                            <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                              <Camera className="w-4 h-4 text-gold" />
                              <span>FOTO SUA VESTINDO A PEÇA (OPCIONAL)</span>
                            </label>

                            {inlinePhotoUrl ? (
                              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-300">
                                <img src={inlinePhotoUrl} alt="Foto enviada" className="w-12 h-12 object-cover rounded border" />
                                <div className="flex-1">
                                  <span className="text-xs font-black uppercase text-emerald-900 block">✓ Foto adicionada!</span>
                                  <button
                                    type="button"
                                    onClick={() => setInlinePhotoUrl('')}
                                    className="text-[10px] text-red-600 font-bold uppercase underline"
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="border-2 border-dashed border-deep-black/30 hover:border-gold p-3 flex items-center justify-center gap-2 cursor-pointer transition bg-warm-light/20">
                                <Upload className="w-4 h-4 text-gold" />
                                <span className="text-[11px] font-black uppercase text-deep-black">
                                  {uploadingInlinePhoto ? 'Enviando imagem...' : 'Anexar foto no espelho ou treino'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleInlinePhotoUpload}
                                  disabled={uploadingInlinePhoto}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>

                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="w-full py-4 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border border-gold shadow-lg cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="w-4 h-4 text-gold" />
                            <span>{submittingReview ? 'PUBLICANDO SUA AVALIAÇÃO...' : 'PUBLICAR AVALIAÇÃO & GANHAR 10% OFF NO E-MAIL'}</span>
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Lista de Avaliações */}
              {productReviews.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-deep-black/20 p-8 space-y-4 bg-white">
                  <Sparkles className="w-8 h-8 text-gold mx-auto" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-deep-black">
                    {lang === 'pt' ? 'SEJA A PRIMEIRA A AVALIAR ESTA PEÇA!' : 'BE THE FIRST TO REVIEW THIS PIECE!'}
                  </h4>
                  <p className="text-xs text-deep-black/70 max-w-md mx-auto uppercase tracking-wide">
                    {lang === 'pt'
                      ? 'Adquiriu este look? Compartilhe sua experiência com o caimento e tecido e ganhe 10% OFF na sua próxima compra!'
                      : 'Purchased this silhouette? Share your thoughts on compression and fit and get 10% OFF your next order!'}
                  </p>
                  <Link
                    href={`/avaliar?produto=${encodeURIComponent(productData.title)}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-deep-black text-white hover:bg-gold hover:text-deep-black font-black text-xs uppercase tracking-wider transition"
                  >
                    <span>{lang === 'pt' ? 'ESCREVER AVALIAÇÃO AGORA' : 'WRITE A REVIEW NOW'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {productReviews.map((rev, idx) => (
                    <div
                      key={rev.id || idx}
                      className="bg-white border-2 border-deep-black p-6 space-y-4 shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            {rev.photoUrl ? (
                              <img
                                src={rev.photoUrl}
                                alt={rev.customerName}
                                className="w-11 h-11 rounded-full object-cover border border-deep-black"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-gold/20 flex items-center justify-center font-black text-gold border border-gold text-sm">
                                {(rev.customerName || 'A').charAt(0)}
                              </div>
                            )}
                            <div>
                              <strong className="text-xs font-black uppercase text-deep-black block">
                                {rev.customerName}
                              </strong>
                              <span className="text-[10px] text-deep-black/60 font-mono block">
                                📍 {rev.city || 'Massachusetts, EUA'}
                              </span>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 bg-green-50 border border-green-300 text-green-800 text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />
                            <span>{lang === 'pt' ? 'COMPRA VERIFICADA' : 'VERIFIED BUYER'}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-gold">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
                          ))}
                        </div>

                        <p className="text-xs text-deep-black/85 leading-relaxed italic">
                          "{rev.comment}"
                        </p>
                      </div>

                      <div className="pt-3 border-t border-deep-black/10 flex items-center justify-between text-[10px] text-deep-black/50 font-mono">
                        <span className="font-bold uppercase text-gold">{rev.productTitle || productData.title}</span>
                        <span>{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Modal Universal de Compartilhamento */}
      <ProductShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        product={{
          title: productData.title,
          slug: slug,
          price: currentVariant?.price || productData.price,
          image: productData.media?.[0]?.url,
          categoryPt: productData.categoryPt,
          categoryEn: productData.categoryEn,
        }}
        lang={lang}
      />

      {/* Modal Interativo de Tabela de Medidas (P • M • G • GG) */}
      {isSizeGuideModalOpen && (
        <ProductSizeGuide
          isModal
          onClose={() => setIsSizeGuideModalOpen(false)}
          selectedSize={selectedSize}
          onSelectSize={handleSelectSize}
          availableSizes={availableSizes}
          variants={productData.variants}
          selectedColor={selectedColor}
        />
      )}
    </div>
  );
}
