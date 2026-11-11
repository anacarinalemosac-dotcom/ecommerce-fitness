'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../context/LanguageContext';
import { useStoreSettings } from '../../../context/StoreSettingsContext';
import { trackEvent } from '../../../lib/tracking';
import { addToCart } from '@/lib/cart';
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
  Video,
  Shirt,
  Store,
  MapPin,
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

          const isVideoUrlRaw = (u: any) =>
            typeof u === 'string' &&
            (u.toLowerCase().endsWith('.mp4') ||
              u.toLowerCase().endsWith('.webm') ||
              u.toLowerCase().endsWith('.mov') ||
              u.toLowerCase().includes('.mp4?') ||
              u.toLowerCase().includes('whatsappvideo') ||
              u.toLowerCase().includes('/videos/'));

          const realImages = (p.galleryImages || p.images || []).filter((u: string) => !isVideoUrlRaw(u));
          const primaryCandidate = (!isVideoUrlRaw(p.primaryImage || p.primary_image) ? (p.primaryImage || p.primary_image) : '') || realImages[0] || '';
          const secondaryCandidate = realImages.find((u: string) => u !== primaryCandidate) || realImages[1] || '';

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
            primaryImage: primaryCandidate,
            secondaryImage: secondaryCandidate,
            galleryImages: realImages,
            media_list: p.media_list || meta.media_list || [],
            video_url: p.video_url || meta.video_url || null,
            colors: p.colors || [],
            sizes: p.sizes || [],
            stock: (p.variants || []).reduce((acc: number, v: any) => acc + (v.stock_quantity || 0), 0),
            allowBackorder: Boolean(meta.allow_backorder || p.allow_backorder || true),
            productionDays: p.variants?.[0]?.estimated_production_days || 7,
            cupsType: meta.cups_type || 'removable',
            fitPt: p.fitPt || meta.fit_pt || meta.fit || p.fit || '',
            fitEn: p.fitEn || meta.fit_en || '',
            material: p.material || meta.material || '',
            materials: p.materials || meta.materials || [],
            composition: p.composition || meta.composition || '',
            sizeGuide: p.sizeGuide || p.size_guide || meta.sizeGuide || meta.size_guide || '',
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
    const isVideoUrl = (url: string) => {
      if (!url || typeof url !== 'string') return false;
      const lower = url.toLowerCase();
      return (
        lower.endsWith('.mp4') ||
        lower.endsWith('.webm') ||
        lower.endsWith('.mov') ||
        lower.includes('.mp4?') ||
        lower.includes('.webm?') ||
        lower.includes('.mov?') ||
        lower.includes('whatsappvideo') ||
        lower.includes('/videos/')
      );
    };

    const mediaList: Array<{ type: 'image' | 'video'; url: string; label: string; color?: string }> = [];

    // 1. Foto principal (apenas fotos reais)
    if (dynamicProduct.primaryImage && !isVideoUrl(dynamicProduct.primaryImage)) {
      mediaList.push({
        type: 'image',
        url: dynamicProduct.primaryImage,
        label: 'Front',
        color: dynamicProduct.colors[0]?.name || 'all',
      });
    }

    // 2. Foto secundária (apenas fotos reais)
    if (
      dynamicProduct.secondaryImage &&
      !isVideoUrl(dynamicProduct.secondaryImage) &&
      !mediaList.some((m) => m.url === dynamicProduct.secondaryImage)
    ) {
      mediaList.push({
        type: 'image',
        url: dynamicProduct.secondaryImage,
        label: 'Back / Hover',
        color: dynamicProduct.colors[0]?.name || 'all',
      });
    }

    // 3. Imagens da galeria
    if (dynamicProduct.galleryImages && dynamicProduct.galleryImages.length > 0) {
      dynamicProduct.galleryImages.forEach((img: string, idx: number) => {
        if (img && !mediaList.some((m) => m.url === img)) {
          const type: 'image' | 'video' = isVideoUrl(img) ? 'video' : 'image';
          mediaList.push({
            type,
            url: img,
            label: type === 'video' ? 'Vídeo da Peça' : `Detail ${idx + 1}`,
            color: 'all',
          });
        }
      });
    }

    // 4. Mídias estruturadas (imagens e vídeos explícitos)
    if (Array.isArray((dynamicProduct as any).media_list)) {
      (dynamicProduct as any).media_list.forEach((m: any, idx: number) => {
        if (m?.url) {
          const type: 'image' | 'video' = (m.type === 'video' || isVideoUrl(m.url)) ? 'video' : 'image';
          const existing = mediaList.find((med) => med.url === m.url);
          if (existing) {
            existing.type = type;
            if (type === 'video') existing.label = 'Vídeo da Peça';
          } else {
            mediaList.push({
              type,
              url: m.url,
              label: m.label || (type === 'video' ? 'Vídeo da Peça' : `${m.associatedColor || 'Detail'} ${idx + 1}`),
              color: m.associatedColor || 'all',
            });
          }
        }
      });
    }

    // 5. Vídeo dedicado da peça
    const resolvedVideoUrl =
      (dynamicProduct as any).video_url ||
      (dynamicProduct as any).meta?.video_url ||
      (dynamicProduct as any).videoUrl ||
      (Array.isArray(dynamicProduct.variants) ? dynamicProduct.variants.find((v: any) => v.video_url)?.video_url : null) ||
      null;

    if (resolvedVideoUrl) {
      const existing = mediaList.find((m) => m.url === resolvedVideoUrl);
      if (existing) {
        existing.type = 'video';
        existing.label = 'Vídeo da Peça';
      } else {
        mediaList.push({
          type: 'video',
          url: resolvedVideoUrl,
          label: 'Vídeo da Peça',
          color: 'all',
        });
      }
    }

    // Fallback de segurança: se nenhuma foto foi inserida, adiciona a capa
    if (mediaList.length === 0 || !mediaList.some((m) => m.type === 'image')) {
      mediaList.unshift({
        type: 'image',
        url: dynamicProduct.primaryImage || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=85',
        label: 'Front',
        color: 'all',
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

    const resolvedMaterial =
      dynamicProduct.material ||
      dynamicProduct.meta?.material ||
      (Array.isArray(dynamicProduct.materials) ? dynamicProduct.materials.join(', ') : '') ||
      (Array.isArray(dynamicProduct.meta?.materials) ? dynamicProduct.meta.materials.join(', ') : '');

    const resolvedSizeGuide =
      dynamicProduct.sizeGuide ||
      dynamicProduct.size_guide ||
      dynamicProduct.meta?.sizeGuide ||
      dynamicProduct.meta?.size_guide ||
      '';

    productData = {
      id: dynamicProduct.id,
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
      fitPt: dynamicProduct.fitPt || (dynamicProduct as any).fit || (dynamicProduct as any).meta?.fit_pt || '',
      fitEn: dynamicProduct.fitEn || (dynamicProduct as any).meta?.fit_en || '',
      material: resolvedMaterial,
      materials: dynamicProduct.materials || dynamicProduct.meta?.materials || (resolvedMaterial ? [resolvedMaterial] : []),
      composition: dynamicProduct.composition || dynamicProduct.meta?.composition || '',
      sizeGuide: resolvedSizeGuide,
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
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [directPaymentLinkCopied, setDirectPaymentLinkCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSizeGuideModalOpen, setIsSizeGuideModalOpen] = useState(false);
  const [comboPromo, setComboPromo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/backoffice/combo-promo', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.comboPromo) setComboPromo(data.comboPromo);
      })
      .catch(() => {});
  }, []);

  const isItemInCombo = (pId?: string, pSlug?: string, pTitle?: string) => {
    if (!comboPromo?.active) return false;
    const promoIds = (comboPromo.product_ids || []).map((id: string) => String(id).toLowerCase());
    const promoSlugs = (comboPromo.product_slugs || []).map((s: string) => String(s).toLowerCase());
    const idNorm = String(pId || '').toLowerCase();
    const slugNorm = String(pSlug || '').toLowerCase();

    if (promoIds.length > 0 || promoSlugs.length > 0) {
      return Boolean((idNorm && promoIds.includes(idNorm)) || (slugNorm && promoSlugs.includes(slugNorm)));
    }
    const tUpper = (pTitle || '').toUpperCase();
    return tUpper.includes('SET') || tUpper.includes('CONJUNTO') || tUpper.includes('KIT');
  };

  const isParticipatingInCombo = isItemInCombo(
    (dynamicProduct as any)?.id || (productData as any)?.id,
    slug,
    productData?.title
  );

  // Opção de Entrega (Alo Yoga style): Envio vs Retirada no Showroom
  const [fulfillmentMode, setFulfillmentMode] = useState<'shipping' | 'pickup'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ana_delivery_method');
      if (saved === 'PICKUP' || saved === 'pickup') return 'pickup';
    }
    return 'shipping';
  });

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const favs = JSON.parse(localStorage.getItem('ana_wishlist') || '[]');
        setIsFavorite(favs.includes(slug));
      } catch {}
    }
  }, [slug]);

  const toggleFavorite = () => {
    setIsFavorite((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          const favs = JSON.parse(localStorage.getItem('ana_wishlist') || '[]');
          const updated = next
            ? (favs.includes(slug) ? favs : [...favs, slug])
            : favs.filter((s: string) => s !== slug);
          localStorage.setItem('ana_wishlist', JSON.stringify(updated));
        } catch {}
      }
      return next;
    });
  };

  const handleSelectFulfillment = (mode: 'shipping' | 'pickup') => {
    setFulfillmentMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ana_delivery_method', mode === 'pickup' ? 'PICKUP' : 'DELIVERY');
    }
  };

  // Padronização limpa de etiquetas de tamanho (ex: P (S), M (M), G (L), GG (XL), Tamanho Único (One Size))
  const formatSizeLabel = (sz: string) => {
    const upper = sz.trim().toUpperCase();
    if (upper === 'P' || upper === 'S' || upper === 'P (S)' || upper === 'S (P)') return 'P (S)';
    if (upper === 'M' || upper === 'M (M)') return 'M (M)';
    if (upper === 'G' || upper === 'L' || upper === 'G (L)' || upper === 'L (G)') return 'G (L)';
    if (upper === 'GG' || upper === 'XL' || upper === 'GG (XL)' || upper === 'XL (GG)') return 'GG (XL)';
    if (upper.includes('UN') || upper.includes('ONE') || upper.includes('ÚNICO') || upper.includes('UNICO'))
      return 'Tamanho Único (One Size)';
    return sz;
  };

  // Produtos Similares recomendados (Alo Yoga style)
  const similarItems = useMemo(() => {
    const currentCategory = productData.categoryKey || productData.category || '';
    const currentId = productData.id || slug;
    const pool =
      storeProducts && storeProducts.length > 0
        ? storeProducts
        : Object.entries(CATALOG_ITEMS).map(([k, v]) => ({ ...v, slug: k, id: k }));

    const sameCat = pool.filter(
      (p: any) =>
        p.slug !== slug &&
        p.id !== currentId &&
        ((p.category && p.category === currentCategory) ||
          (p.categoryKey && p.categoryKey === currentCategory))
    );

    const fallback = pool.filter((p: any) => p.slug !== slug && p.id !== currentId);
    return (sameCat.length >= 4 ? sameCat : fallback).slice(0, 4);
  }, [storeProducts, productData, slug]);

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
      setShowReviewBox(true);
      setTimeout(() => {
        const el = document.getElementById('reviews-section');
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

  // Link de Pagamento Direto no Afterpay (1-Clique sem precisar navegar no site)
  const currentSiteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://anafitwear.com';
  const directCheckoutUrl = `${currentSiteOrigin}/checkout?direct=1&slug=${slug}&size=${encodeURIComponent(selectedSize)}&color=${encodeURIComponent(selectedColor)}&pay=afterpay`;

  const handleCopyDirectPaymentLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(directCheckoutUrl).then(() => {
        setDirectPaymentLinkCopied(true);
        setTimeout(() => setDirectPaymentLinkCopied(false), 3000);
      });
    }
  };

  const directPaymentMsg = lang === 'pt'
    ? `Olá! Segue seu link de pagamento direto para garantir seu *${productData.title}* (Tamanho: ${selectedSize}, Cor: ${selectedColor}) na Ana Fitness Wear.\n\n✨ Você pode parcelar em 4x sem juros de $${((currentVariant?.price || productData.price) / 4).toFixed(2)} no Afterpay ou pagar no cartão com envio rápido dos EUA:\n\n${directCheckoutUrl}`
    : `Hello! Here is your direct checkout link for *${productData.title}* (Size: ${selectedSize}, Color: ${selectedColor}) at Ana Fitness Wear.\n\n✨ Pay in 4 interest-free installments of $${((currentVariant?.price || productData.price) / 4).toFixed(2)} with Afterpay:\n\n${directCheckoutUrl}`;

  const whatsappDirectPaymentUrl = `https://wa.me/?text=${encodeURIComponent(directPaymentMsg)}`;

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
      id: productData.id,
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
      is_combo_item: isParticipatingInCombo,
      pickup_in_store: fulfillmentMode === 'pickup',
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('ana_delivery_method', fulfillmentMode === 'pickup' ? 'PICKUP' : 'DELIVERY');
    }

    try {
      addToCart(cartItemToSave);
    } catch (e) {
      localStorage.setItem('ana_cart_item', JSON.stringify(cartItemToSave));
      window.dispatchEvent(new Event('ana_cart_updated'));
    }

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
                    <div className="w-full h-full bg-deep-black flex flex-col items-center justify-center text-gold gap-1 p-1 text-center relative overflow-hidden group">
                      <video
                        src={item.url}
                        className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
                        muted
                        playsInline
                      />
                      <div className="relative z-10 flex flex-col items-center justify-center bg-black/80 px-1 py-1 border border-gold/40 rounded-xs">
                        <Video className="w-4 h-4 text-gold animate-pulse drop-shadow" />
                        <span className="text-[7px] font-black uppercase tracking-wider text-white">VÍDEO</span>
                      </div>
                    </div>
                  ) : (
                    <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 relative aspect-[3/4] bg-deep-black/5 overflow-hidden border border-deep-black/10 group">
              {productData.media[selectedMediaIdx]?.type === 'video' ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video
                    key={productData.media[selectedMediaIdx].url}
                    src={productData.media[selectedMediaIdx].url}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                  <div className="absolute top-4 left-4 pointer-events-none z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-sm bg-deep-black/90 text-gold border border-gold/40 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-gold" />
                      <span>{lang === 'pt' ? 'VÍDEO DA PEÇA' : 'VIDEO PREVIEW'}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={productData.media[selectedMediaIdx]?.url}
                    alt={productData.title}
                    className={`w-full h-full object-cover transition-transform duration-500 cursor-zoom-in ${
                      isZoomed ? 'scale-150' : 'group-hover:scale-105'
                    }`}
                    onClick={() => setIsZoomed(!isZoomed)}
                  />
                  {productData.media.some((m: any) => m.type === 'video') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const vidIdx = productData.media.findIndex((m: any) => m.type === 'video');
                        if (vidIdx >= 0) {
                          setSelectedMediaIdx(vidIdx);
                          setIsZoomed(false);
                        }
                      }}
                      className="absolute bottom-4 left-4 bg-deep-black/95 hover:bg-gold hover:text-deep-black text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-2 border-2 border-gold flex items-center gap-2 shadow-2xl transition z-20 cursor-pointer group"
                    >
                      <Video className="w-4 h-4 text-gold group-hover:text-deep-black transition" />
                      <span>{lang === 'pt' ? '▶ Ver Vídeo da Peça' : '▶ Watch Video'}</span>
                    </button>
                  )}
                </div>
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

        </div>

        {/* DETALHES DA PEÇA & COMPRA (ALO YOGA STYLE CLEAN LUXURY BUY BOX) */}
        <div className="lg:col-span-5 space-y-5 bg-white">
          {/* Categoria & Título */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block">
              {lang === 'pt' ? productData.categoryPt : productData.categoryEn}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {isOutOfStock && (
                <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider">
                  {lang === 'pt' ? 'ESGOTADO' : 'SOLD OUT'}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-black leading-tight">
                {productData.title}
              </h1>
            </div>

            {/* Preço e Avaliações em Linha Única */}
            <div className="flex items-center justify-between gap-4 pt-1 pb-3 border-b border-neutral-100">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-black text-black font-mono tracking-tight">
                  ${productData.price.toFixed(2)}
                </span>
                {productData.originalPrice && productData.originalPrice > productData.price && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-neutral-400 line-through font-mono">
                      ${productData.originalPrice.toFixed(2)}
                    </span>
                    <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5">
                      -{Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('reviews-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-black transition cursor-pointer"
              >
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="text-[11px] font-medium underline">
                  {productReviews.length > 0 ? `(${productReviews.length})` : '(12)'}
                </span>
              </button>
            </div>
          </div>

          {/* Seletor de Cores (Círculos Limpos Alo Yoga) */}
          <div className="space-y-2">
            <div className="text-xs">
              <span className="text-neutral-500 uppercase tracking-wider text-[11px] font-bold">
                {lang === 'pt' ? 'Cor: ' : 'Color: '}
              </span>
              <span className="text-black font-bold uppercase text-[11px]">{selectedColor}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {availableColors.map((col) => {
                const isSelected = selectedColor.toLowerCase() === col.name.toLowerCase();
                const isWhite = col.hex.toLowerCase() === '#ffffff' || col.hex.toLowerCase() === '#fff';
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => handleSelectColor(col.name)}
                    title={col.name}
                    className={`w-7 h-7 rounded-full transition-all relative flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-black scale-105'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: col.hex, border: '1px solid rgba(0,0,0,0.15)' }}
                  >
                    {isSelected && (
                      <Check className={`w-3.5 h-3.5 ${isWhite ? 'text-black' : 'text-white'}`} strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fit Hint (Alo Yoga style) */}
          <p className="text-[11px] text-neutral-600 leading-relaxed">
            <strong className="text-black font-bold">Fit: </strong>
            {lang === 'pt'
              ? `Modelagem anatômica de alta compressão inteligente. ${
                  productData.cupsType === 'removable'
                    ? 'Possui bojo removível incluso.'
                    : productData.cupsType === 'fixed'
                    ? 'Possui bojo fixo anatômico embutido.'
                    : 'Sem bojo (tecido com forro duplo que não marca).'
                }`
              : `Anatomical high-compression fit. ${
                  productData.cupsType === 'removable'
                    ? 'Includes removable cups.'
                    : productData.cupsType === 'fixed'
                    ? 'Built-in anatomical fixed cups.'
                    : 'Unpadded (double-lined coverage).'
                }`}
          </p>

          {/* Seletor de Tamanhos (Botões Retangulares Alo Yoga) */}
          {isSpoilerProduct ? (
            <div className="p-4 bg-neutral-900 border border-neutral-700 text-white space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                👀 {lang === 'pt' ? 'PRÓXIMO LANÇAMENTO • PRÉVIA EXCLUSIVA' : 'UPCOMING DROP'}
              </span>
              <p className="text-xs text-white/80">
                {lang === 'pt'
                  ? 'Esta peça é um spoiler do nosso próximo lançamento. Sem reservas antecipadas.'
                  : 'Exclusive preview of our upcoming drop. No early reservations.'}
              </p>
            </div>
          ) : availableSizes.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 uppercase tracking-wider text-[11px] font-bold">
                  {lang === 'pt' ? 'Tamanho: ' : 'Size: '}
                  <strong className="text-black">{formatSizeLabel(selectedSize)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideModalOpen(true)}
                  className="text-[11px] text-neutral-600 hover:text-black underline font-bold cursor-pointer transition"
                >
                  {lang === 'pt' ? 'Tabela de Medidas' : 'Size Guide'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableSizes.map((sz: string) => {
                  const isSelected = sz.toUpperCase() === selectedSize.toUpperCase();
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleSelectSize(sz)}
                      className={`py-3 px-3 text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-black text-white border-black ring-1 ring-black shadow-xs'
                          : 'bg-white text-black border-neutral-300 hover:border-black'
                      }`}
                    >
                      <span>{formatSizeLabel(sz)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-neutral-100 text-neutral-600 text-xs font-bold uppercase text-center">
              {lang === 'pt' ? 'Tamanho esgotado nesta cor' : 'Out of stock for this color'}
            </div>
          )}

          {/* Opção de Entrega / Retirada (Alo Yoga Segmented Control) */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectFulfillment('shipping')}
                className={`py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider transition border flex items-center justify-center gap-1.5 cursor-pointer ${
                  fulfillmentMode === 'shipping'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-neutral-600 border-neutral-300 hover:border-black'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{lang === 'pt' ? 'Entregar ($9.90)' : 'Ship to Me ($9.90)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFulfillment('pickup')}
                className={`py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider transition border flex items-center justify-center gap-1.5 cursor-pointer ${
                  fulfillmentMode === 'pickup'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-neutral-600 border-neutral-300 hover:border-black'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>{lang === 'pt' ? 'Retirar Showroom ($0)' : 'Pickup in Store (Free)'}</span>
              </button>
            </div>

            {fulfillmentMode === 'pickup' ? (
              <div className="p-3 bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-black text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                  <span>Showroom Oficial (Retirada Grátis):</span>
                </div>
                <p className="text-[11px] text-neutral-600 pl-5">
                  126 First St, Apt 01, Leominster, MA 01453 • Sem custo de frete
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-neutral-500 flex items-center gap-1.5 pt-0.5">
                <Truck className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                <span>{lang === 'pt' ? 'Frete fixo $9.90 para todos os EUA com código de rastreamento' : 'Flat rate shipping $9.90 all US with tracking'}</span>
              </p>
            )}
          </div>

          {/* Destaque Verde da Promoção de Combo (quando participante) */}
          {isParticipatingInCombo && (
            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-500 text-emerald-950 space-y-1.5 shadow-xs">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-3 h-3" />
                </span>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[9.5px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5">
                      {comboPromo?.badge_text || 'COMBO 3 PEÇAS'}
                    </span>
                    <Link
                      href="/combo"
                      className="text-[11px] font-black text-emerald-800 underline hover:text-emerald-950 uppercase tracking-wide"
                    >
                      {lang === 'pt' ? 'Ver peças do combo →' : 'Build Combo →'}
                    </Link>
                  </div>
                  <p className="text-xs font-bold text-emerald-950 leading-relaxed">
                    {lang === 'pt'
                      ? `Esta peça participa da promoção: ${Number(comboPromo?.required_quantity) || 3} peças pelo valor $${Number(comboPromo?.bundle_price || 120).toFixed(2)}. Adicione essa peça na sua sacola e faltará pouco para você participar da promoção.`
                      : `This item is part of our combo deal: ${Number(comboPromo?.required_quantity) || 3} pieces for $${Number(comboPromo?.bundle_price || 120).toFixed(2)}. Add this piece to your bag and you're close to unlocking the promotion!`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação Principal (ADD TO BAG + FAVORITOS) */}
          <div className="space-y-3 pt-2">
            {isSpoilerProduct ? (
              <a
                href={`https://wa.me/19788608822?text=${encodeURIComponent(
                  `Olá Ana! Vi o SPOILER da peça *${productData.title}* no site e gostaria de ser avisada assim que estiver à pronta entrega!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{lang === 'pt' ? 'AVISE-ME NO WHATSAPP QUANDO CHEGAR' : 'NOTIFY ME ON WHATSAPP'}</span>
              </a>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleActionClick}
                    disabled={availableSizes.length === 0}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm ${
                      availableSizes.length === 0
                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                        : 'bg-black hover:bg-neutral-800 text-white'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {lang === 'pt'
                        ? `ADICIONAR À SACOLA • $${(currentVariant?.price || productData.price).toFixed(2)}`
                        : `ADD TO BAG • $${(currentVariant?.price || productData.price).toFixed(2)}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleFavorite}
                    className={`p-4 border transition flex items-center justify-center cursor-pointer shrink-0 ${
                      isFavorite
                        ? 'border-black bg-black text-red-500'
                        : 'border-neutral-300 hover:border-black bg-white text-black'
                    }`}
                    title={isFavorite ? 'Salvo nos favoritos' : 'Salvar nos favoritos'}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-black'}`} />
                  </button>
                </div>

                {/* BNPL Afterpay */}
                <p className="text-[11px] text-neutral-600 text-center">
                  {lang === 'pt' ? 'ou 4 parcelas de ' : 'or 4 interest-free payments of '}
                  <strong className="font-bold text-black font-mono">
                    ${((currentVariant?.price || productData.price) / 4).toFixed(2)}
                  </strong>
                  {' '}com <span className="font-black">Afterpay</span>
                </p>

                {/* Finalizar Compra Link */}
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleActionClick();
                      window.location.href = '/checkout';
                    }}
                    className="text-[11px] font-bold text-neutral-700 hover:text-black underline uppercase tracking-wider cursor-pointer"
                  >
                    {lang === 'pt' ? 'Ou finalizar compra diretamente no Checkout →' : 'Or proceed directly to Checkout →'}
                  </button>
                </div>

                {/* Cart Feedback Toast */}
                {cartFeedback && (
                  <div className="p-3 bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-between gap-2 animate-fadeIn">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{lang === 'pt' ? '✓ Peça adicionada à sacola!' : '✓ Item added to bag!'}</span>
                    </span>
                    <Link href="/checkout" className="text-gold underline hover:text-white text-[11px] font-bold flex items-center gap-1">
                      <span>CHECKOUT</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Garantias discretas em linha */}
          <div className="pt-4 border-t border-neutral-100 grid grid-cols-3 gap-2 text-center text-[10px] text-neutral-600 font-medium">
            <div className="space-y-1">
              <Truck className="w-4 h-4 mx-auto text-neutral-800" />
              <span>{lang === 'pt' ? 'Envio Todos EUA' : 'All US Shipping'}</span>
            </div>
            <div className="space-y-1">
              <RotateCcw className="w-4 h-4 mx-auto text-neutral-800" />
              <span>{lang === 'pt' ? '30 Dias Troca' : '30-Day Returns'}</span>
            </div>
            <div className="space-y-1">
              <ShieldCheck className="w-4 h-4 mx-auto text-neutral-800" />
              <span>{lang === 'pt' ? 'Zero Transparência' : '100% Squat-Proof'}</span>
            </div>
          </div>

          {/* Atendimento no WhatsApp */}
          <div className="pt-2 text-center">
            <a
              href={`https://wa.me/19788608822?text=${encodeURIComponent(
                `Olá Ana! Gostaria de tirar uma dúvida sobre a peça ${productData.title}:`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-neutral-500 hover:text-black inline-flex items-center gap-1.5 transition"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'pt' ? 'Dúvidas sobre tamanho ou tecido? Fale com a Ana no WhatsApp' : 'Questions on size or fit? Chat on WhatsApp'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ALO YOGA: 3-COLUNAS (DESCRIPTION • FIT & DETAILS • FABRICATION & CARE)
         ========================================================================= */}
      <section className="border-t border-neutral-200 mt-16 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 text-xs">
          {/* COLUNA 1: DESCRIPTION */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">
              {lang === 'pt' ? 'DESCRIÇÃO' : 'DESCRIPTION'}
            </h3>
            <div className="text-neutral-600 leading-relaxed font-normal space-y-2">
              <FormattedDescription
                text={lang === 'pt' ? productData.descriptionPt : productData.descriptionEn}
              />
            </div>
          </div>

          {/* COLUNA 2: FIT & DETAILS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">
              {lang === 'pt' ? 'MODELAGEM & AJUSTE' : 'FIT & DETAILS'}
            </h3>
            <ul className="space-y-2 text-neutral-600 leading-relaxed list-disc list-inside">
              <li>
                <span className="font-medium text-black">
                  {lang === 'pt' ? 'Modelagem:' : 'Fit:'}
                </span>{' '}
                {lang === 'pt'
                  ? (productData.fitPt || 'Modelagem anatômica que abraça as curvas com compressão na medida certa.')
                  : (productData.fitEn || 'Anatomical compression fit that flatters and holds with sculpting power.')}
              </li>
              <li>
                <span className="font-medium text-black">
                  {lang === 'pt' ? 'Sustentação do Busto:' : 'Cup Support:'}
                </span>{' '}
                {productData.cupsType === 'fixed'
                  ? (lang === 'pt' ? 'Bojo anatômico embutido e costurado (não sai do lugar durante treinos intensos)' : 'Built-in contour cups engineered to stay in place.')
                  : productData.cupsType === 'none'
                  ? (lang === 'pt' ? 'Sem bojo, confeccionado com forro duplo de alta compressão para suporte natural' : 'Unpadded silhouette with double-layer compression support.')
                  : (lang === 'pt' ? 'Acompanha bojo removível anatômico (use com ou sem, conforme preferir)' : 'Removable cups included for customizable shape and coverage.')}
              </li>
              <li>
                <span className="font-medium text-black">
                  {lang === 'pt' ? 'Cós Anatômico:' : 'Waistband:'}
                </span>{' '}
                {lang === 'pt' ? 'Cós duplo de compressão média/alta que não enrola nem desce nos movimentos' : 'Double-layered stay-put waistband that holds without rolling.'}
              </li>
              <li>
                <span className="font-medium text-black">
                  {lang === 'pt' ? 'Zero Transparência:' : 'Squat-Proof:'}
                </span>{' '}
                {lang === 'pt' ? '100% à prova de agachamentos e iluminação forte de estúdio' : '100% squat-proof under direct gym light.'}
              </li>
              <li>
                <span className="font-medium text-black">
                  {lang === 'pt' ? 'Costuras Flatlock:' : 'Seams:'}
                </span>{' '}
                {lang === 'pt' ? 'Costura ultra-plana suave que previne atrito ou marcas na pele' : 'Ultra-flat reinforced seams that prevent chafing.'}
              </li>
              {productData.sizeGuide && (
                <li className="pt-1 list-none">
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideModalOpen(true)}
                    className="text-[11px] font-bold text-black underline hover:text-gold cursor-pointer inline-flex items-center gap-1"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>{lang === 'pt' ? 'Ver Tabela de Medidas da Peça' : 'View Detailed Size Chart'}</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* COLUNA 3: FABRICATION & CARE */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">
              {lang === 'pt' ? 'TECIDO & CUIDADOS' : 'FABRICATION & CARE'}
            </h3>
            <ul className="space-y-2 text-neutral-600 leading-relaxed list-disc list-inside">
              <li>
                <span className="font-medium text-black">
                  {lang === 'pt' ? 'Composição:' : 'Fabrication:'}
                </span>{' '}
                {productData.composition || productData.material || (lang === 'pt' ? 'Poliamida Premium com Elastano LYCRA® de alta densidade' : 'Premium Polyamide with high-density LYCRA® Spandex')}
              </li>
              <li>
                <span className="font-medium text-black">
                  {lang === 'pt' ? 'Toque:' : 'Handfeel:'}
                </span>{' '}
                {lang === 'pt' ? 'Toque macio amanteigado (buttery-soft) de alta respirabilidade' : 'Buttery-soft luxury handfeel with breathable micro-fibers.'}
              </li>
              <li>
                <span className="font-medium text-black">
                  {lang === 'pt' ? 'Elasticidade:' : 'Stretch:'}
                </span>{' '}
                {lang === 'pt' ? '4-Way Stretch multidirecional que não laceia nem perde a memória elástica' : '4-Way Stretch recovery that holds its shape wash after wash.'}
              </li>
              <li>
                <span className="font-medium text-black">
                  {lang === 'pt' ? 'Tecnologia:' : 'Tech:'}
                </span>{' '}
                {lang === 'pt' ? 'Secagem rápida Dry-Fit com proteção UV 50+ para treinos ao ar livre' : 'Moisture-wicking Dry-Fit with built-in UV 50+ sun protection.'}
              </li>
              <li>
                <span className="font-medium text-black">
                  {lang === 'pt' ? 'Lavagem:' : 'Care:'}
                </span>{' '}
                {lang === 'pt' ? 'Lavar em água fria no ciclo delicado, do avesso. Secar à sombra' : 'Machine wash cold on gentle cycle inside-out. Air dry in shade.'}
              </li>
              <li>
                <span className="font-medium text-black">
                  {lang === 'pt' ? 'Dica de ouro:' : 'Pro tip:'}
                </span>{' '}
                {lang === 'pt' ? 'Não usar amaciante nem secadora de ar quente para preservar as fibras elásticas' : 'Skip softeners and high-heat drying to maximize lifespan.'}
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ALO YOGA: PRODUTOS SIMILARES (SIMILAR ITEMS)
         ========================================================================= */}
      {similarItems && similarItems.length > 0 && (
        <section className="border-t border-neutral-200 mt-16 pt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">
              {lang === 'pt' ? 'PRODUTOS SIMILARES' : 'SIMILAR ITEMS'}
            </h3>
            <Link
              href="/catalogo"
              className="text-[11px] font-medium text-neutral-500 hover:text-black underline uppercase tracking-wider"
            >
              {lang === 'pt' ? 'Ver Coleção Completa →' : 'View All Collection →'}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {similarItems.map((item: any) => {
              const itemImg = item.primaryImage || item.image || item.media?.[0]?.url || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80';
              const itemPrice = Number(item.price) || 44.9;
              const itemInCombo = isItemInCombo(item.id, item.slug, item.title);
              return (
                <Link
                  key={item.id || item.slug}
                  href={`/produto/${item.slug}`}
                  className="group block"
                >
                  <div className="aspect-[3/4] bg-neutral-100 overflow-hidden relative mb-2.5">
                    <img
                      src={itemImg}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {item.badgePt && (
                      <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5">
                        {lang === 'pt' ? item.badgePt : (item.badgeEn || item.badgePt)}
                      </span>
                    )}
                    {itemInCombo && (
                      <span className="absolute bottom-2 left-2 right-2 text-[9px] font-bold uppercase tracking-wider bg-emerald-600/95 text-white px-2 py-1 text-center shadow-xs">
                        {lang === 'pt'
                          ? `COMBO: ${Number(comboPromo?.required_quantity) || 3} POR $${Number(comboPromo?.bundle_price || 120).toFixed(2)}`
                          : `COMBO: ${Number(comboPromo?.required_quantity) || 3} FOR $${Number(comboPromo?.bundle_price || 120).toFixed(2)}`}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-medium text-neutral-900 group-hover:underline truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-neutral-600 font-mono font-medium">
                      ${itemPrice.toFixed(2)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================================================
          ALO YOGA: AVALIAÇÕES DE CLIENTES (CUSTOMER REVIEWS)
         ========================================================================= */}
      <section id="reviews-section" className="border-t border-neutral-200 mt-16 pt-12 scroll-mt-20">
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
          customSizeGuide={productData.sizeGuide}
          productTitle={productData.title}
        />
      )}
    </div>
  );
}
