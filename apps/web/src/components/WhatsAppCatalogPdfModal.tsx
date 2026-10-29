'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  ExternalLink,
  Filter,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  Smartphone,
  Eye,
  Tag,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { useStoreSettings } from '@/context/StoreSettingsContext';

// Helper para verificar se a peça está no ar (ativa na vitrine do site)
export const isProductOnline = (p: any): boolean => {
  if (!p) return false;
  // Se explicitamente marcado como não visível online
  if (p.visible_online === false || p.visibleOnline === false) return false;
  if (p.meta && (p.meta.visible_online === false || p.meta.visibleOnline === false)) return false;
  // Se o status indicar oculto, arquivado ou rascunho
  if (p.status === 'HIDDEN' || p.status === 'ARCHIVED' || p.status === 'DRAFT' || p.status === 'INACTIVE') return false;
  // Visibilidade positiva
  const isOnline = p.visible_online === true || p.visibleOnline === true || p.meta?.visible_online === true;
  if (p.visible_online === undefined && p.visibleOnline === undefined && p.meta?.visible_online === undefined) {
    return p.status !== 'HIDDEN' && p.status !== 'ARCHIVED';
  }
  return isOnline;
};

interface WhatsAppCatalogPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogProducts?: any[];
  siteInfo?: any;
}

export function WhatsAppCatalogPdfModal({
  isOpen,
  onClose,
  catalogProducts: propProducts,
  siteInfo: propSiteInfo,
}: WhatsAppCatalogPdfModalProps) {
  const { siteInfo: contextSiteInfo, products: contextProducts } = useStoreSettings();
  const siteInfo = propSiteInfo || contextSiteInfo;
  const [internalProducts, setInternalProducts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && (!propProducts || propProducts.length === 0)) {
      fetch('/api/backoffice/products')
        .then((r) => r.json())
        .then((d) => {
          if (d.products && Array.isArray(d.products)) {
            setInternalProducts(d.products);
          }
        })
        .catch((e) => console.warn('Erro ao carregar produtos para catálogo:', e));
    }
  }, [isOpen, propProducts]);

  const catalogProducts = useMemo(() => {
    if (propProducts && propProducts.length > 0) return propProducts;
    if (internalProducts.length > 0) return internalProducts;
    return contextProducts || [];
  }, [propProducts, internalProducts, contextProducts]);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [columnsCount, setColumnsCount] = useState<3 | 2 | 4>(3);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(true);
  const [onlyOnline, setOnlyOnline] = useState<boolean>(true); // REGRA: Apenas peças que estão no ar
  const [hideOutOfStockSizes, setHideOutOfStockSizes] = useState<boolean>(false);
  const [copiedClientLink, setCopiedClientLink] = useState<boolean>(false);

  // Extrai todas as categorias disponíveis (apenas de produtos no ar)
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    (catalogProducts || []).forEach((p) => {
      if (onlyOnline && !isProductOnline(p)) return;
      const cat = (p.categories?.name || p.category || p.subcategory || 'OUTROS')
        .toString()
        .trim()
        .toUpperCase();
      if (cat) cats.add(cat);
    });
    return Array.from(cats).sort();
  }, [catalogProducts, onlyOnline]);

  // Função auxiliar para dados de preços (original e promocional)
  const getProductPricing = (product: any) => {
    const itemVariants = product.variants || [];
    const basePrice = Number(product.price ?? itemVariants[0]?.price ?? 44.9);
    const meta = product.meta || {};

    let comparePrice: number | null = null;
    let promoPrice: number = basePrice;

    if (meta.promotional_price && Number(meta.promotional_price) > 0) {
      promoPrice = Number(meta.promotional_price);
      if (meta.compare_price && Number(meta.compare_price) > promoPrice) {
        comparePrice = Number(meta.compare_price);
      } else if (basePrice > promoPrice) {
        comparePrice = basePrice;
      }
    } else if (meta.compare_price && Number(meta.compare_price) > basePrice) {
      comparePrice = Number(meta.compare_price);
      promoPrice = basePrice;
    } else if (product.originalPrice && Number(product.originalPrice) > basePrice) {
      comparePrice = Number(product.originalPrice);
      promoPrice = basePrice;
    }

    const hasDiscount = comparePrice !== null && comparePrice > promoPrice;
    const discountPercent =
      hasDiscount && comparePrice
        ? Math.round(((comparePrice - promoPrice) / comparePrice) * 100)
        : 0;

    return {
      originalPrice: hasDiscount ? comparePrice : null,
      promoPrice,
      hasDiscount,
      discountPercent,
    };
  };

  // Função auxiliar para estoque por tamanho
  const getProductStockBySize = (product: any) => {
    const itemVariants = product.variants || [];
    const stockMap: Record<string, number> = {};

    if (itemVariants.length > 0) {
      itemVariants.forEach((v: any) => {
        const sz = (v.size || 'M').trim().toUpperCase();
        stockMap[sz] = (stockMap[sz] || 0) + (Number(v.stock_quantity) || 0);
      });
    } else if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
      const total = Number(product.stock || 0);
      const each = Math.round(total / product.sizes.length);
      product.sizes.forEach((sz: string) => {
        stockMap[sz.toUpperCase()] = each;
      });
    } else {
      stockMap['UN'] = Number(product.stock || product.total_stock || 0);
    }

    const sizeOrder = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', '1', '2', '3', 'UN'];
    const sortedSizes = Object.keys(stockMap).sort((a, b) => {
      const idxA = sizeOrder.indexOf(a);
      const idxB = sizeOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const totalStock = Object.values(stockMap).reduce((sum, q) => sum + q, 0);

    return {
      stockMap,
      sortedSizes,
      totalStock,
    };
  };

  // Função auxiliar para foto principal nítida
  const getProductImage = (product: any) => {
    if (product.primaryImage && typeof product.primaryImage === 'string' && !product.primaryImage.startsWith('data:')) {
      return product.primaryImage;
    }
    if (product.primary_image && typeof product.primary_image === 'string' && !product.primary_image.startsWith('data:')) {
      return product.primary_image;
    }
    if (product.meta?.primary_image && typeof product.meta.primary_image === 'string' && !product.meta.primary_image.startsWith('data:')) {
      return product.meta.primary_image;
    }
    const itemVariants = product.variants || [];
    for (const v of itemVariants) {
      if (Array.isArray(v.images) && v.images[0] && !v.images[0].startsWith('data:')) {
        return v.images[0];
      }
      if (v.image && !v.image.startsWith('data:')) {
        return v.image;
      }
    }
    if (product.image && typeof product.image === 'string') {
      return product.image;
    }
    return 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80';
  };

  // Filtra e agrupa produtos por categoria, expandindo cada variação de cor disponível
  const groupedProducts = useMemo(() => {
    const groups: Record<string, any[]> = {};

    (catalogProducts || []).forEach((product) => {
      // REGRA: Produtos que não estão no ar não devem aparecer no catálogo enviado ao WhatsApp
      if (onlyOnline && !isProductOnline(product)) {
        return;
      }

      const cat = (product.categories?.name || product.category || product.subcategory || 'CONJUNTOS')
        .toString()
        .trim()
        .toUpperCase();

      if (selectedCategory !== 'ALL' && cat !== selectedCategory) {
        return;
      }

      const variants = Array.isArray(product.variants) ? product.variants : [];
      const meta = product.meta || {};
      const pricing = getProductPricing(product);
      const sizeOrder = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', '1', '2', '3', 'UN'];

      if (variants.length > 0) {
        const colorGroups = new Map<string, any[]>();
        variants.forEach((v: any) => {
          const cName = (v.color || 'Padrão').trim();
          const list = colorGroups.get(cName) || [];
          list.push(v);
          colorGroups.set(cName, list);
        });

        colorGroups.forEach((cVariants, colorName) => {
          const stockMap: Record<string, number> = {};
          let colorStockTotal = 0;

          cVariants.forEach((v: any) => {
            const sz = (v.size || 'M').trim().toUpperCase();
            const qty = Number(v.stock_quantity ?? v.stock ?? 0);
            stockMap[sz] = (stockMap[sz] || 0) + qty;
            colorStockTotal += qty;
          });

          if (onlyInStock && colorStockTotal <= 0) return;

          let varImage = '';
          const withImg = cVariants.find((v: any) => (Array.isArray(v.images) && v.images.length > 0) || v.image);
          if (withImg) {
            varImage = Array.isArray(withImg.images) && withImg.images.length > 0 ? withImg.images[0] : withImg.image;
          }

          if (!varImage && Array.isArray(meta.media_list)) {
            const match = meta.media_list.find((m: any) => m.associatedColor && m.associatedColor.trim().toLowerCase() === colorName.toLowerCase());
            if (match?.url) varImage = match.url;
          }

          if (!varImage) {
            varImage = getProductImage(product);
          }

          const defaultHex =
            colorName.toLowerCase().includes('ouro') || colorName.toLowerCase().includes('gold') ? '#D4AF37' :
            colorName.toLowerCase().includes('amarel') ? '#FBBF24' :
            colorName.toLowerCase().includes('branc') || colorName.toLowerCase().includes('white') ? '#FFFFFF' :
            colorName.toLowerCase().includes('vinho') || colorName.toLowerCase().includes('marsala') ? '#800020' :
            colorName.toLowerCase().includes('verd') ? '#2E4F4F' : '#0A0A0A';

          const colorHex = cVariants[0]?.color_hex || cVariants[0]?.colorHex || defaultHex;

          const sortedSizes = Object.keys(stockMap).sort((a, b) => {
            const idxA = sizeOrder.indexOf(a);
            const idxB = sizeOrder.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            return a.localeCompare(b);
          });

          const varPrice = cVariants[0]?.price && !isNaN(Number(cVariants[0].price)) ? Number(cVariants[0].price) : pricing.promoPrice;

          if (!groups[cat]) groups[cat] = [];
          groups[cat].push({
            ...product,
            id: `${product.id}__${colorName.replace(/\s+/g, '_')}`,
            colorName,
            colorHex,
            primaryImage: varImage,
            image: varImage,
            price: varPrice,
            pricingOverride: {
              ...pricing,
              promoPrice: varPrice,
            },
            stockDataOverride: {
              stockMap,
              sortedSizes,
              totalStock: colorStockTotal,
            },
          });
        });
      } else {
        const { totalStock, stockMap, sortedSizes } = getProductStockBySize(product);
        if (onlyInStock && totalStock <= 0) return;

        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({
          ...product,
          colorName: product.colors?.[0]?.name || 'Padrão',
          colorHex: product.colors?.[0]?.hex || '#0A0A0A',
          pricingOverride: pricing,
          stockDataOverride: {
            stockMap,
            sortedSizes,
            totalStock,
          },
        });
      }
    });

    return groups;
  }, [catalogProducts, selectedCategory, onlyInStock, onlyOnline]);

  const totalFilteredCount = useMemo(() => {
    return Object.values(groupedProducts).reduce((acc, list) => acc + list.length, 0);
  }, [groupedProducts]);

  // Função para abrir janela de impressão e gerar o PDF
  const handlePrintPdf = () => {
    let printWindow: Window | null = null;
    try {
      printWindow = window.open('', '_blank', 'width=1100,height=900');
    } catch (e) {
      console.warn('Erro ao abrir popup de impressão:', e);
    }

    if (!printWindow) {
      // Fallback seguro se o navegador bloquear popup:
      window.open('/backoffice/catalogo-pdf', '_blank');
      return;
    }

    const todayDate = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const storeTitle = siteInfo?.storeName || 'ANA FITNESS WEAR';
    const storePhone = siteInfo?.whatsapp || siteInfo?.phone || '+1 (978) 313-9452';
    const storeAddress = siteInfo?.address || 'Showroom Leominster, Massachusetts';

    let categoriesHtml = '';

    Object.entries(groupedProducts).forEach(([categoryName, productsList]) => {
      if (!productsList || productsList.length === 0) return;

      let itemsHtml = '';

      productsList.forEach((product) => {
        const pricing = product.pricingOverride || getProductPricing(product);
        const { stockMap, sortedSizes } = product.stockDataOverride || getProductStockBySize(product);
        const imgUrl = product.primaryImage || getProductImage(product);

        const discountBadgeHtml = pricing.hasDiscount
          ? `<span class="discount-badge">-${pricing.discountPercent}% OFF</span>`
          : '';

        const priceHtml = pricing.hasDiscount
          ? `<div class="price-container">
               <span class="price-original">De: $${pricing.originalPrice?.toFixed(2)}</span>
               <span class="price-promo">Por: $${pricing.promoPrice.toFixed(2)}</span>
             </div>`
          : `<div class="price-container">
               <span class="price-single">$${pricing.promoPrice.toFixed(2)}</span>
             </div>`;

        let stockPillsHtml = '';
        sortedSizes.forEach((sz) => {
          const qty = stockMap[sz] || 0;
          if (hideOutOfStockSizes && qty <= 0) return;

          const isZero = qty <= 0;
          stockPillsHtml += `
            <div class="stock-pill ${isZero ? 'stock-zero' : ''}">
              <span class="sz-name">${sz}:</span>
              <span class="sz-qty">${isZero ? 'Esgotado' : `${qty} un`}</span>
            </div>
          `;
        });

        const colorBadgeHtml = product.colorName
          ? `<span style="font-size:9.5px; background:#0a0a0a; color:#d4af37; padding:1px 6px; border-radius:2px; font-weight:900; margin-left:4px;">${product.colorName}</span>`
          : '';

        itemsHtml += `
          <div class="product-card">
            <div class="img-wrapper">
              <img src="${imgUrl}" alt="${product.title || 'Peça Fitness'}" />
              ${discountBadgeHtml}
            </div>
            <div class="card-body">
              <h3 class="product-title">${product.title || 'PEÇA FITNESS'}${colorBadgeHtml}</h3>
              ${priceHtml}
              <div class="stock-section">
                <div class="stock-title">ESTOQUE POR TAMANHO:</div>
                <div class="stock-pills-grid">
                  ${stockPillsHtml}
                </div>
              </div>
            </div>
          </div>
        `;
      });

      categoriesHtml += `
        <div class="category-section">
          <div class="category-header">
            <h2>★ ${categoryName}</h2>
            <span class="category-badge">${productsList.length} ${productsList.length === 1 ? 'modelo' : 'modelos'}</span>
          </div>
          <div class="products-grid cols-${columnsCount}">
            ${itemsHtml}
          </div>
        </div>
      `;
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Catalogo_${storeTitle.replace(/\s+/g, '_')}_WhatsApp</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #0a0a0a;
            padding: 20px;
            font-size: 12px;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 10mm 8mm;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            .category-section { page-break-inside: auto; }
            .product-card { page-break-inside: avoid; break-inside: avoid; }
          }
          .catalog-banner {
            border: 2px solid #0a0a0a;
            background: #0a0a0a;
            color: #ffffff;
            padding: 16px 20px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .store-name {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #d4af37;
          }
          .catalog-subtitle {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #e5e5e5;
            margin-top: 3px;
          }
          .banner-right {
            text-align: right;
            font-size: 11px;
            font-weight: 700;
          }
          .whatsapp-call {
            background: #25d366;
            color: #000;
            padding: 4px 10px;
            font-weight: 900;
            font-size: 11px;
            display: inline-block;
            margin-bottom: 3px;
            border-radius: 2px;
          }
          .date-tag {
            font-size: 9px;
            color: #aaa;
          }
          .category-section {
            margin-bottom: 28px;
          }
          .category-header {
            background: #f4f4f5;
            border-left: 5px solid #d4af37;
            padding: 8px 14px;
            margin-bottom: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .category-header h2 {
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #0a0a0a;
          }
          .category-badge {
            background: #0a0a0a;
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            padding: 2px 8px;
            text-transform: uppercase;
          }
          .products-grid {
            display: grid;
            gap: 14px;
          }
          .cols-2 { grid-template-columns: repeat(2, 1fr); }
          .cols-3 { grid-template-columns: repeat(3, 1fr); }
          .cols-4 { grid-template-columns: repeat(4, 1fr); }
          .product-card {
            border: 1.5px solid #e5e5e5;
            background: #ffffff;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border-radius: 4px;
          }
          .img-wrapper {
            position: relative;
            width: 100%;
            aspect-ratio: 4 / 5;
            background: #f0f0f0;
            overflow: hidden;
          }
          .img-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .discount-badge {
            position: absolute;
            top: 6px;
            right: 6px;
            background: #dc2626;
            color: #ffffff;
            font-weight: 900;
            font-size: 9px;
            padding: 2px 6px;
            border-radius: 2px;
            letter-spacing: 0.5px;
          }
          .card-body {
            padding: 10px;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            justify-content: space-between;
          }
          .product-title {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            color: #0a0a0a;
            margin-bottom: 6px;
            line-height: 1.3;
            min-height: 28px;
          }
          .price-container {
            margin-bottom: 8px;
            display: flex;
            align-items: baseline;
            gap: 6px;
            flex-wrap: wrap;
          }
          .price-original {
            font-size: 11px;
            color: #888888;
            text-decoration: line-through;
            font-weight: 700;
          }
          .price-promo {
            font-size: 15px;
            color: #15803d;
            font-weight: 900;
          }
          .price-single {
            font-size: 15px;
            color: #0a0a0a;
            font-weight: 900;
          }
          .stock-section {
            border-top: 1px dashed #dddddd;
            padding-top: 6px;
            margin-top: 4px;
          }
          .stock-title {
            font-size: 8.5px;
            font-weight: 900;
            color: #555555;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .stock-pills-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          }
          .stock-pill {
            background: #f4f4f5;
            border: 1px solid #d4d4d8;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 9px;
            display: inline-flex;
            align-items: center;
            gap: 3px;
          }
          .stock-pill.stock-zero {
            background: #fafafa;
            border-color: #eee;
            color: #aaa;
          }
          .stock-pill .sz-name {
            font-weight: 900;
            color: #0a0a0a;
          }
          .stock-pill.stock-zero .sz-name {
            color: #aaa;
          }
          .stock-pill .sz-qty {
            font-weight: 800;
            color: #15803d;
          }
          .stock-pill.stock-zero .sz-qty {
            color: #bbb;
          }
          .footer-note {
            text-align: center;
            margin-top: 24px;
            padding: 12px;
            background: #f9f9f9;
            border: 1px solid #e5e5e5;
            font-size: 10px;
            color: #555;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fffbe5; border: 1px solid #ffe58f; padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
          <div style="font-size: 12px; font-weight: 800; color: #874d00;">
            📄 Dica: Na tela de impressão que abrirá, selecione <strong>"Salvar como PDF"</strong> para salvar o arquivo e enviar no WhatsApp!
          </div>
          <button onclick="window.print()" style="background: #0a0a0a; color: #fff; border: 0; padding: 6px 14px; font-weight: 900; font-size: 11px; cursor: pointer;">
            🖨️ IMPRIMIR / SALVAR PDF
          </button>
        </div>

        <div class="catalog-banner">
          <div>
            <div class="store-name">${storeTitle}</div>
            <div class="catalog-subtitle">CATÁLOGO DE PRODUTOS & PRONTA ENTREGA</div>
          </div>
          <div class="banner-right">
            <div class="whatsapp-call">📲 PEÇA PELO WHATSAPP: ${storePhone}</div>
            <div class="date-tag">${storeAddress} • Atualizado em ${todayDate}</div>
          </div>
        </div>

        ${categoriesHtml}

        <div class="footer-note">
          ${storeTitle} • Enviamos para todos os Estados Unidos • Peças limitadas sujeitas a confirmação de estoque
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white border-2 border-deep-black w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl rounded-none">
        {/* Top Header */}
        <div className="bg-deep-black text-white p-4 sm:p-5 border-b-2 border-gold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500 text-black font-black shrink-0">
              <Smartphone className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-gold tracking-widest">
                  RELATÓRIO & DIVULGAÇÃO WHATSAPP
                </span>
                <span className="px-1.5 py-0.2 bg-green-600 text-white text-[8px] font-black uppercase">
                  PDF EXPORT
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                CATÁLOGO DE PRODUTOS PARA GRUPOS DO WHATSAPP
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => {
                const clientUrl = `${window.location.origin}/catalogo`;
                navigator.clipboard.writeText(clientUrl).then(() => {
                  setCopiedClientLink(true);
                  setTimeout(() => setCopiedClientLink(false), 3000);
                });
              }}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Copiar link do catálogo limpo para a cliente no WhatsApp"
            >
              {copiedClientLink ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedClientLink ? 'Link Copiado!' : 'Copiar Link p/ Cliente'}</span>
            </button>

            <a
              href="/catalogo"
              target="_blank"
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white hover:text-deep-black text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 border border-white/30 cursor-pointer"
              title="Abrir o catálogo que o cliente visualiza"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Catálogo Cliente</span>
            </a>

            <a
              href="/backoffice/catalogo-pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white hover:text-deep-black text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 border border-white/30 cursor-pointer"
              title="Abrir diretamente em página dedicada para salvar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Página PDF</span>
            </a>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-4 py-2.5 bg-gold hover:bg-white text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 border-2 border-deep-black shadow-md cursor-pointer"
              title="Abre a janela para salvar em PDF ou imprimir diretamente"
            >
              <Printer className="w-4 h-4 stroke-[3]" />
              <span>GERAR & SALVAR EM PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-red-600 text-white transition cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Opções */}
        <div className="bg-gray-50 border-b border-gray-200 p-3 sm:p-4 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filtro por Categoria */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-deep-black/60" />
              <span className="text-[10px] uppercase font-black text-deep-black/70">CATEGORIA:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-1.5 border border-deep-black/30 bg-white font-mono font-bold text-xs uppercase focus:outline-none focus:border-deep-black"
              >
                <option value="ALL">TODAS AS CATEGORIAS</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Colunas no PDF / Visualizador */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-black text-deep-black/70">COLUNAS:</span>
              <div className="inline-flex border border-deep-black/30 bg-white">
                <button
                  type="button"
                  onClick={() => setColumnsCount(2)}
                  className={`px-2 py-1 text-[10px] font-black uppercase transition ${
                    columnsCount === 2 ? 'bg-deep-black text-white' : 'text-deep-black hover:bg-gray-100'
                  }`}
                >
                  2 (Grandes)
                </button>
                <button
                  type="button"
                  onClick={() => setColumnsCount(3)}
                  className={`px-2 py-1 text-[10px] font-black uppercase transition ${
                    columnsCount === 3 ? 'bg-deep-black text-white' : 'text-deep-black hover:bg-gray-100'
                  }`}
                >
                  3 (Padrão)
                </button>
                <button
                  type="button"
                  onClick={() => setColumnsCount(4)}
                  className={`px-2 py-1 text-[10px] font-black uppercase transition ${
                    columnsCount === 4 ? 'bg-deep-black text-white' : 'text-deep-black hover:bg-gray-100'
                  }`}
                >
                  4 (Compacto)
                </button>
              </div>
            </div>

            {/* Checkbox Apenas Peças no Ar (Vitrine Ativa) */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 border border-emerald-300">
              <input
                type="checkbox"
                checked={onlyOnline}
                onChange={(e) => setOnlyOnline(e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-600"
              />
              <span>Apenas peças no ar (Ativas no site)</span>
            </label>

            {/* Checkbox Apenas com Estoque */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-black uppercase">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-3.5 h-3.5 accent-deep-black"
              />
              <span>Apenas itens em estoque</span>
            </label>

            {/* Checkbox Ocultar tamanhos zerados */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-black uppercase text-deep-black/70">
              <input
                type="checkbox"
                checked={hideOutOfStockSizes}
                onChange={(e) => setHideOutOfStockSizes(e.target.checked)}
                className="w-3.5 h-3.5 accent-deep-black"
              />
              <span>Ocultar tamanhos esgotados</span>
            </label>
          </div>

          <div className="text-[10px] font-mono font-black text-deep-black/80">
            {totalFilteredCount} PRODUTOS SELECIONADOS PARA O RELATÓRIO
          </div>
        </div>

        {/* Visualização Prévia do Catálogo (Layout Idêntico ao PDF) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100">
          <div className="max-w-5xl mx-auto bg-white border border-gray-300 shadow-sm p-4 sm:p-8 space-y-8">
            {/* Banner de Capa */}
            <div className="bg-deep-black text-white p-4 sm:p-6 border-2 border-gold flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-gold">
                  {siteInfo?.storeName || 'ANA FITNESS WEAR'}
                </h1>
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/80 mt-1">
                  CATÁLOGO DE PRODUTOS & PRONTA ENTREGA
                </p>
              </div>

              <div className="text-left md:text-right space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#25d366] text-black font-black text-xs">
                  <span>📲 PEDIDOS WHATSAPP: {siteInfo?.whatsapp || siteInfo?.phone || '+1 (978) 313-9452'}</span>
                </div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">
                  {siteInfo?.address || 'Showroom Leominster, MA'} • ATUALIZADO EM {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            {/* Conteúdo Separado por Categoria */}
            {Object.keys(groupedProducts).length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-bold uppercase text-xs">
                Nenhum produto atende aos filtros selecionados.
              </div>
            ) : (
              Object.entries(groupedProducts).map(([categoryName, productsList]) => (
                <div key={categoryName} className="space-y-4">
                  {/* Cabeçalho da Categoria */}
                  <div className="flex items-center justify-between bg-gray-100 border-l-4 border-gold p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gold font-black text-base">★</span>
                      <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-deep-black">
                        {categoryName}
                      </h2>
                    </div>
                    <span className="px-2 py-0.5 bg-deep-black text-white text-[9px] font-black uppercase">
                      {productsList.length} {productsList.length === 1 ? 'modelo' : 'modelos'}
                    </span>
                  </div>

                  {/* Grid de Produtos Lado a Lado */}
                  <div
                    className={`grid gap-4 ${
                      columnsCount === 2
                        ? 'grid-cols-1 sm:grid-cols-2'
                        : columnsCount === 4
                        ? 'grid-cols-2 sm:grid-cols-4'
                        : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                    }`}
                  >
                    {productsList.map((product) => {
                      const pricing = product.pricingOverride || getProductPricing(product);
                      const { stockMap, sortedSizes, totalStock } = product.stockDataOverride || getProductStockBySize(product);
                      const imgUrl = product.primaryImage || getProductImage(product);

                      return (
                        <div
                          key={product.id || product.slug}
                          className="border border-gray-200 bg-white flex flex-col justify-between overflow-hidden shadow-xs hover:border-deep-black transition"
                        >
                          {/* Foto da Peça */}
                          <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                            <img
                              src={imgUrl}
                              alt={product.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {pricing.hasDiscount && (
                              <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 uppercase shadow-xs">
                                -{pricing.discountPercent}% OFF
                              </span>
                            )}
                            {product.colorName && (
                              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-deep-black/85 text-white px-2 py-0.5 text-[9px] font-black uppercase border border-white/20">
                                <span
                                  className="w-2 h-2 rounded-full border border-white/40 shrink-0"
                                  style={{ backgroundColor: product.colorHex || '#0A0A0A' }}
                                />
                                <span>{product.colorName}</span>
                              </div>
                            )}
                          </div>

                          {/* Dados da Peça (Nome, Preços e Estoque por Tamanho) */}
                          <div className="p-3 flex flex-col flex-1 justify-between gap-3">
                            <div>
                              <h3 className="text-xs font-black uppercase text-deep-black tracking-wide line-clamp-2">
                                {product.title}
                              </h3>

                              {/* Preço Original e Preço da Promoção */}
                              <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                                {pricing.hasDiscount ? (
                                  <>
                                    <span className="text-[11px] text-gray-400 font-bold line-through">
                                      De: ${pricing.originalPrice?.toFixed(2)}
                                    </span>
                                    <span className="text-sm font-black text-green-700">
                                      Por: ${pricing.promoPrice.toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm font-black text-deep-black">
                                    ${pricing.promoPrice.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quantidade do Estoque em Cada Tamanho */}
                            <div className="pt-2 border-t border-dashed border-gray-200">
                              <div className="text-[8.5px] font-black uppercase text-gray-500 mb-1 flex items-center justify-between">
                                <span>Estoque por Tamanho:</span>
                                <span className="font-mono text-gray-700">{totalStock} unid</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {sortedSizes.map((sz) => {
                                  const qty = stockMap[sz] || 0;
                                  if (hideOutOfStockSizes && qty <= 0) return null;
                                  const isZero = qty <= 0;

                                  return (
                                    <span
                                      key={sz}
                                      className={`px-1.5 py-0.5 border text-[9px] font-mono flex items-center gap-1 ${
                                        isZero
                                          ? 'bg-gray-50 text-gray-400 border-gray-200'
                                          : 'bg-green-50 text-green-900 border-green-300 font-black'
                                      }`}
                                    >
                                      <span className="font-bold">{sz}:</span>
                                      <span>{isZero ? '0' : qty}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {/* Rodapé do Catálogo */}
            <div className="text-center p-4 bg-gray-50 border border-gray-200 text-[10px] text-gray-600 font-bold uppercase">
              {siteInfo?.storeName || 'ANA FITNESS WEAR'} • Envie o nome ou foto da peça para nosso WhatsApp para reservar seu pedido!
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="bg-white border-t-2 border-deep-black p-3 sm:p-4 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-600 font-bold">
            Mostrando <strong>{totalFilteredCount}</strong> peças prontas para divulgação
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="/backoffice/catalogo-pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border-2 border-deep-black bg-white hover:bg-gray-100 text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>PÁGINA CHEIA (PDF)</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-deep-black text-deep-black font-black text-xs uppercase tracking-wider hover:bg-gray-100 transition"
            >
              FECHAR
            </button>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-5 py-2 bg-gold hover:bg-deep-black hover:text-gold text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 border-2 border-deep-black shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[3]" />
              <span>BAIXAR / SALVAR PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
