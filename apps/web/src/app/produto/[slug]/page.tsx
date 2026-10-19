'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../context/LanguageContext';
import { useStoreSettings } from '../../../context/StoreSettingsContext';
import { trackEvent } from '../../../lib/tracking';
import ProductShareModal from '../../../components/ProductShareModal';
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
  Copy,
  Lock,
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
    title: 'KELY PANTS SET (PRE-ORDER)',
    categoryPt: 'CONJUNTOS • EXCLUSIVO SOB ENCOMENDA',
    categoryEn: 'SETS • MADE-TO-ORDER EXCLUSIVE',
    price: 39.9,
    originalPrice: 49.9,
    cupsType: 'removable',
    descriptionPt:
      'Conjunto completo de calça legging cós anatômico + top de sustentação. Atualmente esgotado para pronta entrega e disponível exclusivamente sob encomenda sob medida na nossa confecção (prazo de até 30 dias para receber sua mercadoria. Nossa equipe entrará em contato para esclarecer todas as informações com relação ao prazo).',
    descriptionEn:
      'Complete luxury set featuring sculpting leggings with double anatomical waistband and matching support top. Currently sold out for ready stock, available exclusively via made-to-order pre-order (~30 days delivery. Our team will contact you to confirm and clarify all details regarding your timeframe).',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1200&q=85', label: 'Set Overview', color: 'Preto Ônix' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=85', label: 'Side Fit', color: 'Preto Ônix' },
    ],
    colors: [
      { name: 'Preto Ônix', hex: '#0A0A0A' },
      { name: 'Vinho Marsala', hex: '#800020' },
    ],
    sizes: ['S', 'M', 'L'],
    variants: [
      { id: 'v-kel-blk-s', sku: 'KEL-BLK-S', size: 'S', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 39.9, stock: 0, allowBackorder: true, productionDays: 7 },
      { id: 'v-kel-blk-m', sku: 'KEL-BLK-M', size: 'M', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 39.9, stock: 0, allowBackorder: true, productionDays: 7 },
      { id: 'v-kel-blk-l', sku: 'KEL-BLK-L', size: 'L', color: 'Preto Ônix', colorNamePt: 'Preto Ônix', colorNameEn: 'Onyx Black', colorHex: '#0A0A0A', price: 39.9, stock: 0, allowBackorder: true, productionDays: 7 },
      { id: 'v-kel-vin-s', sku: 'KEL-VIN-S', size: 'S', color: 'Vinho Marsala', colorNamePt: 'Vinho Marsala', colorNameEn: 'Marsala Wine', colorHex: '#800020', price: 39.9, stock: 0, allowBackorder: true, productionDays: 7 },
      { id: 'v-kel-vin-m', sku: 'KEL-VIN-M', size: 'M', color: 'Vinho Marsala', colorNamePt: 'Vinho Marsala', colorNameEn: 'Marsala Wine', colorHex: '#800020', price: 39.9, stock: 0, allowBackorder: true, productionDays: 7 },
      { id: 'v-kel-vin-l', sku: 'KEL-VIN-L', size: 'L', color: 'Vinho Marsala', colorNamePt: 'Vinho Marsala', colorNameEn: 'Marsala Wine', colorHex: '#800020', price: 39.9, stock: 0, allowBackorder: true, productionDays: 7 },
    ],
  },
};

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { lang, t } = useLanguage();
  const { products: storeProducts } = useStoreSettings();
  const slug = params.slug || 'samanta-romper';

  // Localiza produto cadastrado ou editado no Backoffice/Supabase
  const dynamicProduct = storeProducts.find((p) => p.slug === slug || p.id === slug);

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

        const varImg = Array.isArray(v.images) && v.images.length > 0 ? v.images[0] : v.image;
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

  // Grade completa padrão de tamanhos exigidos: S, M, L, XL (P, M, G, GG)
  const STANDARD_SIZES = ['S', 'M', 'L', 'XL'];
  const availableSizesSet = new Set<string>(STANDARD_SIZES);
  (productData.variants || []).forEach((v: Variant) => {
    if (v.size) availableSizesSet.add(v.size.toUpperCase());
  });
  const sizeOrder: Record<string, number> = { S: 1, P: 1, M: 2, L: 3, G: 3, XL: 4, GG: 4 };
  const availableSizes = Array.from(availableSizesSet).sort(
    (a, b) => (sizeOrder[a.toUpperCase()] || 99) - (sizeOrder[b.toUpperCase()] || 99)
  );

  // Identifica a primeira variação com estoque real (> 0) para selecionar automaticamente na abertura
  const inStockVariant = (productData.variants || []).find((v: Variant) => Number(v.stock) > 0);
  const initialColor = inStockVariant?.color || availableColors[0]?.name || 'Preto Ônix';
  const initialSize = inStockVariant?.size || availableSizes[0] || 'S';

  // Estados de seleção
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);

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
  const [activeTab, setActiveTab] = useState<'desc' | 'sizing' | 'care' | 'preorder'>('desc');
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

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

  // Se não houver estoque disponível para essa cor e tamanho, ativa Pré-Venda de 30 dias automaticamente
  const currentStock = currentVariant?.stock ? Number(currentVariant.stock) : 0;
  const isBackorder = currentStock <= 0;

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

  // Ação de Compra / Adicionar à Sacola (Sempre liberado: se sem estoque, entra como Pré-Venda 30 dias)
  const handleActionClick = () => {
    const matchedVariant = (productData.variants || []).find(
      (v: Variant) =>
        v.color.toLowerCase() === selectedColor.toLowerCase() &&
        v.size.toUpperCase() === selectedSize.toUpperCase()
    );
    const hasStock = matchedVariant ? Number(matchedVariant.stock) > 0 : false;
    const isItemPreOrder = !hasStock;

    const cartItemToSave = {
      title: productData.title,
      slug: slug,
      size: selectedSize,
      color: selectedColor,
      sku: matchedVariant?.sku || `${slug}-${selectedColor.slice(0, 3)}-${selectedSize}`,
      price: matchedVariant?.price || productData.price,
      quantity: 1,
      image: matchedVariant?.image || productData.media[selectedMediaIdx]?.url || productData.media[0]?.url,
      isBackorder: isItemPreOrder,
      productionDays: 30,
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

    setCartFeedback(isBackorder ? 'backorder' : 'added');
    setTimeout(() => setCartFeedback(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-16 bg-white">
      {/* Breadcrumb */}
      <nav className="text-[10px] font-black uppercase tracking-widest text-deep-black/50 flex items-center gap-2">
        <Link href="/" className="hover:text-deep-black transition">HOME</Link>
        <span>/</span>
        <Link href={`/?cat=${productData.category || 'all'}`} className="hover:text-deep-black transition">
          {lang === 'pt' ? productData.categoryPt : productData.categoryEn}
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

              {/* Selos de Destaque (Apenas promocionais para itens em estoque; nunca pré-venda em cima da foto) */}
              {!isBackorder && productData.badgeEn !== 'PRE-ORDER' && productData.badgePt !== 'PRÉ-VENDA' && (productData.ribbon || productData.badgePt) && (
                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-sm ${productData.badgeStyle || 'bg-gold text-deep-black'}`}>
                    {productData.ribbon || (lang === 'pt' ? productData.badgePt : productData.badgeEn)}
                  </span>
                </div>
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
              <p className="text-xs sm:text-sm text-deep-black/85 font-medium leading-relaxed uppercase tracking-wide">
                {lang === 'pt' ? productData.descriptionPt : productData.descriptionEn}
              </p>
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

            <div className="flex items-center gap-3 pt-1">
              <div className="flex text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                5.0 ({lang === 'pt' ? 'AVALIAÇÕES VERIFICADAS' : 'VERIFIED REVIEWS'})
              </span>
            </div>

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

          {/* Seletor de Tamanhos (P / M / G com equivalência US) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span>{lang === 'pt' ? 'TAMANHO:' : 'SIZE:'}</span>
                <span className="text-gold font-bold">{selectedSize}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('sizing');
                  document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] text-deep-black/60 underline hover:text-gold transition cursor-pointer font-bold"
              >
                {t('tab.sizing')}
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
                const stockQty = matchedVariant ? Number(matchedVariant.stock) : 0;
                const hasStock = stockQty > 0;

                const sizeLabel = lang === 'pt'
                  ? (sz === 'S' ? 'P (S)' : sz === 'M' ? 'M' : sz === 'L' ? 'G (L)' : sz === 'XL' ? 'GG (XL)' : sz)
                  : sz;

                const subLabel = sz === 'S' ? 'US 2-4' : sz === 'M' ? 'US 6-8' : sz === 'L' ? 'US 10-12' : sz === 'XL' ? 'US 14-16' : '';

                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSelectSize(sz)}
                    className={`py-3 px-2 text-xs font-black uppercase tracking-wider border transition-all relative flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      isSelected
                        ? 'border-deep-black bg-deep-black text-white ring-2 ring-gold shadow-md'
                        : hasStock
                        ? 'border-deep-black/30 hover:border-gold text-deep-black bg-white'
                        : 'border-gold/50 bg-amber-50/40 hover:border-gold text-deep-black'
                    }`}
                  >
                    <span className="text-xs font-black">{sizeLabel}</span>
                    {subLabel && (
                      <span className={`text-[8.5px] font-mono ${isSelected ? 'text-white/60' : 'text-deep-black/50'}`}>
                        {subLabel}
                      </span>
                    )}
                    <span
                      className={`text-[8px] font-black tracking-widest mt-0.5 ${
                        hasStock
                          ? (isSelected ? 'text-emerald-300' : 'text-emerald-700')
                          : (isSelected ? 'text-gold' : 'text-amber-800')
                      }`}
                    >
                      {hasStock ? `${stockQty} IN STOCK` : 'PRE-ORDER'}
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

          {/* Status do Estoque & Pré-Venda 30 Dias */}
          <div className="p-4 border-2 border-deep-black bg-white">
            {isBackorder ? (
              <div className="flex items-start gap-3.5 text-deep-black">
                <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-deep-black text-gold text-[9px] font-black tracking-widest uppercase">
                      MADE-TO-ORDER
                    </span>
                    <p className="font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      {lang === 'pt' ? 'PRODUÇÃO SOB ENCOMENDA • PRÉ-VENDA (PRAZO DE 30 DIAS)' : 'MADE-TO-ORDER PRE-ORDER (~30 DAYS DELIVERY)'}
                    </p>
                  </div>
                  <p className="text-deep-black/85 font-medium leading-relaxed">
                    {lang === 'pt'
                      ? 'Prazo de entrega estimado em até 30 dias para receber sua mercadoria. Nós vamos entrar em contato com você para esclarecer e confirmar todas as informações com relação ao prazo.'
                      : 'Estimated delivery within ~30 days. Our team will contact you directly to clarify and confirm all details regarding your delivery timeframe.'}
                  </p>
                  <p className="text-[10px] text-amber-900 font-bold uppercase tracking-wider">
                    {lang === 'pt' ? 'Atendimento concierge via WhatsApp / SMS após o pedido' : 'Concierge WhatsApp & SMS support included with every order'}
                  </p>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          {/* Formas de Pagamento dos EUA */}
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

          {/* OPÇÃO DE CHECKOUT OU OPÇÃO DE PRÉ-RESERVA */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                handleActionClick();
                window.location.href = '/checkout';
              }}
              className={`w-full py-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-luxury cursor-pointer ${
                isBackorder
                  ? 'bg-gold hover:bg-deep-black hover:text-gold text-deep-black border-2 border-deep-black'
                  : 'bg-deep-black hover:bg-gold hover:text-deep-black text-white'
              }`}
            >
              {isBackorder ? (
                <>
                  <Sparkles className="w-4 h-4 text-deep-black" />
                  <span>{lang === 'pt' ? 'RESERVAR NA PRÉ-VENDA (PRAZO 30 DIAS)' : 'RESERVE PRE-ORDER (30 DAYS)'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-gold" />
                  <span>
                    {lang === 'pt'
                      ? `FINALIZAR NO CHECKOUT AGORA • $${(currentVariant?.price || productData.price).toFixed(2)}`
                      : `PROCEED TO CHECKOUT NOW • $${(currentVariant?.price || productData.price).toFixed(2)}`}
                  </span>
                </>
              )}
            </button>

            {!isBackorder && (
              <button
                type="button"
                onClick={handleActionClick}
                className="w-full py-3.5 bg-white hover:bg-deep-black hover:text-white text-deep-black border-2 border-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-gold" />
                <span>{lang === 'pt' ? 'ADICIONAR À SACOLA E CONTINUAR' : 'ADD TO BAG & CONTINUE'}</span>
              </button>
            )}

            {cartFeedback && (
              <div className="p-3.5 bg-deep-black text-white border-2 border-gold text-xs font-bold uppercase tracking-wider flex items-center justify-between animate-fadeIn">
                <span>
                  {cartFeedback === 'backorder'
                    ? (lang === 'pt' ? '✓ Peça reservada como Pré-Venda (Prazo de 30 dias)!' : '✓ Added as Made-to-Order Pre-Order (~30 Days)!')
                    : (lang === 'pt' ? '✓ Peça adicionada com sucesso!' : '✓ Item added to bag!')}
                </span>
                <Link href="/checkout" className="text-gold underline hover:text-white font-black flex items-center gap-1">
                  <span>IR P/ CHECKOUT</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
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
            { id: 'preorder', label: t('tab.preorder'), icon: Clock },
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

                <p className="text-sm text-deep-black/80 font-medium uppercase tracking-wide leading-relaxed">
                  {lang === 'pt' ? productData.descriptionPt : productData.descriptionEn}
                </p>

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

          {/* ABA 2: TABELA DE MEDIDAS (US SIZES) */}
          {activeTab === 'sizing' && (
            <div className="space-y-8">
              <div className="max-w-3xl space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  {lang === 'pt' ? 'GUIA DE TAMANHOS OFICIAL' : 'OFFICIAL SIZING GUIDE'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-deep-black">
                  {lang === 'pt' ? 'ENCONTRE O SEU CAIMENTO IDEAL' : 'FIND YOUR PERFECT FIT'}
                </h3>
                <p className="text-xs text-deep-black/70 font-medium uppercase tracking-wide leading-relaxed">
                  {lang === 'pt'
                    ? 'Nossas peças possuem bastante elasticidade e se adaptam perfeitamente ao corpo. Se tiver qualquer dúvida, fale conosco pelo WhatsApp (+1 978 313-9452)!'
                    : 'Our fabrics offer generous elasticity and mold seamlessly to your silhouette. Reach out via WhatsApp (+1 978 313-9452) for concierge sizing guidance!'}
                </p>
              </div>

              <div className="overflow-x-auto border border-deep-black/15">
                <table className="w-full text-left border-collapse text-xs uppercase tracking-wider">
                  <thead>
                    <tr className="bg-deep-black text-white text-[11px] font-black">
                      <th className="py-3 px-4 border-b border-deep-black/20">SIZE</th>
                      <th className="py-3 px-4 border-b border-deep-black/20">US SIZING</th>
                      <th className="py-3 px-4 border-b border-deep-black/20">BUST (INCHES)</th>
                      <th className="py-3 px-4 border-b border-deep-black/20">WAIST (INCHES)</th>
                      <th className="py-3 px-4 border-b border-deep-black/20">HIPS (INCHES)</th>
                      <th className="py-3 px-4 border-b border-deep-black/20 text-gold">AVAILABILITY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-deep-black/10 font-bold">
                    {[
                      { size: 'P (S)', us: 'US 2 - 4', bust: '32 - 34"', waist: '25 - 27"', hip: '35 - 37"', stock: 'IN STOCK' },
                      { size: 'M (M)', us: 'US 6 - 8', bust: '35 - 37"', waist: '28 - 30"', hip: '38 - 40"', stock: 'IN STOCK' },
                      { size: 'G (L)', us: 'US 10 - 12', bust: '38 - 40"', waist: '31 - 33"', hip: '41 - 43"', stock: 'PRE-ORDER (30 DAYS)' },
                      { size: 'GG (XL)', us: 'US 14 - 16', bust: '41 - 43"', waist: '34 - 36"', hip: '44 - 46"', stock: 'PRE-ORDER (30 DAYS)' },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-deep-black/5 transition">
                        <td className="py-3.5 px-4 font-black text-deep-black">{row.size}</td>
                        <td className="py-3.5 px-4 text-deep-black/80">{row.us}</td>
                        <td className="py-3.5 px-4 text-deep-black/80">{row.bust}</td>
                        <td className="py-3.5 px-4 text-deep-black/80">{row.waist}</td>
                        <td className="py-3.5 px-4 text-deep-black/80">{row.hip}</td>
                        <td className="py-3.5 px-4 text-[10px] font-black text-gold">{row.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

          {/* ABA 4: PRÉ-VENDA */}
          {activeTab === 'preorder' && (
            <div className="space-y-8">
              <div className="max-w-3xl space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  MADE-TO-ORDER
                </span>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-deep-black">
                  {lang === 'pt' ? 'COMO FUNCIONA O PRE-ORDER' : 'HOW PRE-ORDER WORKS'}
                </h3>
                <p className="text-xs text-deep-black/70 font-medium uppercase tracking-wide leading-relaxed">
                  {lang === 'pt'
                    ? 'Quando um modelo esgota na pronta entrega, ativamos a confecção sob encomenda exclusiva para você com prazo de até 30 dias para receber sua mercadoria. Nossa equipe entrará em contato para esclarecer todas as informações com relação ao prazo.'
                    : 'When inventory sells out, we tailor your silhouette on-demand with delivery estimated in ~30 days. Our team will contact you to confirm and clarify all details regarding your delivery timeframe.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { step: '01', title: 'ORDER CONFIRMED', desc: 'Placed in queue & team contacts you.' },
                  { step: '02', title: 'CUT & SEW (~30 DAYS)', desc: 'Artisanal tailoring & crafting.' },
                  { step: '03', title: 'QUALITY INSPECTION', desc: 'Scrutinized & packaged.' },
                  { step: '04', title: 'DISPATCHED VIA USPS', desc: 'Tracking sent to your phone.' },
                ].map((st, i) => (
                  <div key={i} className="p-5 border border-deep-black/15 bg-white space-y-2">
                    <span className="text-2xl font-black text-gold">{st.step}</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-deep-black">{st.title}</h4>
                    <p className="text-[11px] text-deep-black/70 font-medium uppercase tracking-wide">{st.desc}</p>
                  </div>
                ))}
              </div>
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
    </div>
  );
}
