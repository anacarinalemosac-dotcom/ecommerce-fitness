'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Printer,
  Share2,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Smartphone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useStoreSettings } from '@/context/StoreSettingsContext';

export interface CatalogVariationTile {
  tileId: string;
  productId: string;
  productSlug: string;
  title: string;
  category: string;
  colorName: string;
  colorHex: string;
  imageUrl: string;
  price: number;
  promoPrice: number;
  originalPrice: number | null;
  hasDiscount: boolean;
  discountPercent: number;
  stockMap: Record<string, number>;
  sortedSizes: string[];
  totalStock: number;
}

export default function PublicClientCatalogPage() {
  const { siteInfo } = useStoreSettings();
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [columnsCount, setColumnsCount] = useState<2 | 3 | 4>(3);
  const [onlyInStock, setOnlyInStock] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/backoffice/products');
        if (res.ok) {
          const data = await res.json();
          setRawProducts(data.products || []);
        }
      } catch (err) {
        console.error('Erro ao carregar produtos para catálogo:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Expande cada produto em variações individuais disponíveis no estoque (foto de um por um)
  const expandedVariations = useMemo<CatalogVariationTile[]>(() => {
    const tiles: CatalogVariationTile[] = [];

    (rawProducts || []).forEach((product) => {
      // Filtra produtos que não estejam visíveis
      const isOnline = product.visible_online === true || product.visibleOnline === true || product.meta?.visible_online === true;
      if (product.status === 'HIDDEN' || product.status === 'ARCHIVED') return;

      const categoryName = (product.categories?.name || product.category || product.subcategory || 'CONJUNTOS')
        .toString()
        .trim()
        .toUpperCase();

      const variants = Array.isArray(product.variants) ? product.variants : [];
      const meta = product.meta || {};

      // Preço e promoção
      const basePrice = Number(product.price ?? variants[0]?.price ?? 44.9);
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

      const sizeOrder = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', '1', '2', '3', 'UN'];

      // Se temos variantes registradas
      if (variants.length > 0) {
        // Agrupa por cor
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

          // Se estiver filtrando apenas estoque > 0 e esta variação estiver zerada, pula
          if (onlyInStock && colorStockTotal <= 0) return;

          // Localiza a foto exata desta cor
          let varImage = '';
          const withImg = cVariants.find((v: any) => (Array.isArray(v.images) && v.images.length > 0) || v.image);
          if (withImg) {
            varImage = Array.isArray(withImg.images) && withImg.images.length > 0 ? withImg.images[0] : withImg.image;
          }

          // Fallback para meta.media_list correspondente a esta cor
          if (!varImage && Array.isArray(meta.media_list)) {
            const match = meta.media_list.find((m: any) => m.associatedColor && m.associatedColor.trim().toLowerCase() === colorName.toLowerCase());
            if (match?.url) varImage = match.url;
          }

          // Fallback para imagem primária
          if (!varImage) {
            varImage = product.primaryImage || product.primary_image || meta.primary_image || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80';
          }

          // Cor hex
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
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
          });

          const varPrice = cVariants[0]?.price && !isNaN(Number(cVariants[0].price)) ? Number(cVariants[0].price) : promoPrice;

          tiles.push({
            tileId: `${product.id}__${colorName.replace(/\s+/g, '_')}`,
            productId: product.id,
            productSlug: product.slug,
            title: product.title,
            category: categoryName,
            colorName,
            colorHex,
            imageUrl: varImage,
            price: varPrice,
            originalPrice: comparePrice,
            promoPrice: varPrice,
            hasDiscount,
            discountPercent,
            stockMap,
            sortedSizes,
            totalStock: colorStockTotal,
          });
        });
      } else {
        // Fallback para produto sem array de variantes
        const stockMap: Record<string, number> = {};
        const total = Number(product.stock || product.total_stock || 0);

        if (onlyInStock && total <= 0) return;

        if (Array.isArray(product.sizes) && product.sizes.length > 0) {
          const each = Math.round(total / product.sizes.length);
          product.sizes.forEach((sz: string) => {
            stockMap[sz.toUpperCase()] = each;
          });
        } else {
          stockMap['UN'] = total;
        }

        const sortedSizes = Object.keys(stockMap).sort((a, b) => {
          const idxA = sizeOrder.indexOf(a);
          const idxB = sizeOrder.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          return a.localeCompare(b);
        });

        tiles.push({
          tileId: product.id,
          productId: product.id,
          productSlug: product.slug,
          title: product.title,
          category: categoryName,
          colorName: product.colors?.[0]?.name || 'Padrão',
          colorHex: product.colors?.[0]?.hex || '#0A0A0A',
          imageUrl: product.primaryImage || product.primary_image || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
          price: promoPrice,
          originalPrice: comparePrice,
          promoPrice,
          hasDiscount,
          discountPercent,
          stockMap,
          sortedSizes,
          totalStock: total,
        });
      }
    });

    return tiles;
  }, [rawProducts, onlyInStock]);

  // Lista de categorias disponíveis
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    expandedVariations.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [expandedVariations]);

  // Filtragem
  const filteredItems = useMemo(() => {
    return expandedVariations.filter((item) => {
      // Filtro de categoria
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Filtro de tamanho (se selecionado, precisa ter estoque > 0 naquele tamanho específico)
      if (selectedSizeFilter !== 'ALL') {
        const qtyInSize = item.stockMap[selectedSizeFilter.toUpperCase()] || 0;
        if (qtyInSize <= 0) return false;
      }

      // Filtro de busca textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesColor = item.colorName.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesColor && !matchesCategory) return false;
      }

      return true;
    });
  }, [expandedVariations, selectedCategory, selectedSizeFilter, searchQuery]);

  // Agrupa itens filtrados por categoria para o lookbook
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, CatalogVariationTile[]> = {};
    filteredItems.forEach((item) => {
      const cat = item.category || 'OUTROS';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleCopyCatalogLink = () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  const handleShareWhatsApp = () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const phone = siteInfo.whatsapp ? siteInfo.whatsapp.replace(/\D/g, '') : '19783139452';
    const text = `Olá! Confira nosso Catálogo Completo de Pronta Entrega com todas as peças, fotos e tamanhos disponíveis:\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const createWhatsAppOrderLink = (item: CatalogVariationTile) => {
    const phone = siteInfo.whatsapp ? siteInfo.whatsapp.replace(/\D/g, '') : '19783139452';
    const availableSizesText = item.sortedSizes
      .filter((s) => (item.stockMap[s] || 0) > 0)
      .join(', ');
    const text = `Olá! Vi no catálogo e gostaria de reservar:\n\n*${item.title}*\nCor: *${item.colorName}*\nPreço: *$${item.price.toFixed(2)}*\nTamanhos disponíveis: *${availableSizesText}*\n\nComo posso finalizar o pedido?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-deep-black print:bg-white print:p-0 selection:bg-gold selection:text-deep-black">
      {/* =========================================================================
          BARRA DE FERRAMENTAS SUPERIOR (Oculta na impressão / PDF)
         ========================================================================= */}
      <header className="no-print sticky top-0 z-50 bg-deep-black text-white p-3 sm:p-4 border-b-2 border-gold shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <span>CATÁLOGO DE PRODUTOS & PRONTA ENTREGA</span>
                  <span className="text-[9px] px-2 py-0.5 bg-gold text-deep-black font-black uppercase">
                    FOTO POR VARIAÇÃO
                  </span>
                </h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {filteredItems.length} {filteredItems.length === 1 ? 'variação disponível' : 'variações disponíveis'} no estoque
                </p>
              </div>
            </div>
          </div>

          {/* Botões de Ação Direta: Copiar Link, Enviar WhatsApp e Imprimir PDF */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyCatalogLink}
              className="px-3.5 py-2 bg-white/10 hover:bg-white hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-sm"
              title="Copiar link para enviar à cliente"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 bg-[#25d366] hover:bg-emerald-600 text-black text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 border border-emerald-600 cursor-pointer shadow-sm"
              title="Compartilhar no WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Compartilhar</span> WhatsApp
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 border-2 border-deep-black cursor-pointer shadow-md"
              title="Imprimir ou Salvar PDF"
            >
              <Printer className="w-4 h-4 stroke-[3]" />
              <span>IMPRIMIR / PDF</span>
            </button>
          </div>
        </div>

        {/* Linha de Filtros Rápidos (Categorias, Busca, Tamanho e Colunas) */}
        <div className="max-w-7xl mx-auto pt-3 border-t border-white/10 mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Campo de Busca */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar modelo ou cor (ex: Vitória, Verde Militar, Preto)..."
              className="w-full bg-white/10 text-white pl-8 pr-3 py-1.5 text-xs font-bold uppercase placeholder:text-gray-400 placeholder:normal-case border border-white/20 focus:outline-none focus:border-gold"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Seletor de Categoria */}
            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 border border-white/20">
              <Filter className="w-3.5 h-3.5 text-gold shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-white font-bold text-xs uppercase focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="text-black">TODAS AS CATEGORIAS</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c} className="text-black">{c}</option>
                ))}
              </select>
            </div>

            {/* Filtro Rápido de Tamanho */}
            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 border border-white/20">
              <span className="text-[10px] text-gold font-black uppercase">TAMANHO:</span>
              <select
                value={selectedSizeFilter}
                onChange={(e) => setSelectedSizeFilter(e.target.value)}
                className="bg-transparent text-white font-bold text-xs uppercase focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="text-black">TODOS</option>
                <option value="PP" className="text-black">PP</option>
                <option value="P" className="text-black">P</option>
                <option value="M" className="text-black">M</option>
                <option value="G" className="text-black">G</option>
                <option value="GG" className="text-black">GG</option>
              </select>
            </div>

            {/* Colunas no Desktop */}
            <div className="hidden sm:inline-flex border border-white/20 bg-white/10">
              <button
                type="button"
                onClick={() => setColumnsCount(2)}
                className={`px-2 py-1 text-[10px] font-black uppercase transition ${
                  columnsCount === 2 ? 'bg-gold text-deep-black' : 'text-white hover:bg-white/20'
                }`}
              >
                2 Col
              </button>
              <button
                type="button"
                onClick={() => setColumnsCount(3)}
                className={`px-2 py-1 text-[10px] font-black uppercase transition ${
                  columnsCount === 3 ? 'bg-gold text-deep-black' : 'text-white hover:bg-white/20'
                }`}
              >
                3 Col
              </button>
              <button
                type="button"
                onClick={() => setColumnsCount(4)}
                className={`px-2 py-1 text-[10px] font-black uppercase transition ${
                  columnsCount === 4 ? 'bg-gold text-deep-black' : 'text-white hover:bg-white/20'
                }`}
              >
                4 Col
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          CONTEÚDO IMPRIMÍVEL DO LOOKBOOK / CATÁLOGO
         ========================================================================= */}
      <main className="max-w-6xl mx-auto p-4 sm:p-8 bg-white my-4 print:my-0 print:p-0 shadow-sm border print:border-0 border-gray-200">
        {/* Banner de Capa Athleisure Luxury */}
        <div className="bg-deep-black text-white p-5 sm:p-7 border-2 border-gold flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-ultra text-gold block">
              OFFICIAL ATELIER CATALOG • LEOMINSTER, MA
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-0.5">
              {siteInfo?.storeName || 'ANA FITNESS WEAR'}
            </h1>
            <p className="text-xs font-black uppercase tracking-widest text-white/80 mt-1">
              CATÁLOGO DE PEÇAS & PRONTA ENTREGA (TODAS AS CORES E FOTOS)
            </p>
          </div>

          <div className="text-left md:text-right space-y-1.5">
            <a
              href={`https://wa.me/${siteInfo?.whatsapp ? siteInfo.whatsapp.replace(/\D/g, '') : '19783139452'}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#25d366] text-black font-black text-xs hover:bg-emerald-500 transition shadow-sm"
            >
              <span>📲 PEDIDOS WHATSAPP: {siteInfo?.whatsapp || siteInfo?.phone || '+1 (978) 313-9452'}</span>
            </a>
            <div className="text-[10px] text-gold font-bold uppercase tracking-wider">
              {siteInfo?.address || 'Showroom Leominster, MA'} • FRETE FIXO $9.99 P/ TODOS OS EUA
            </div>
            <div className="text-[9px] text-gray-400 font-bold uppercase">
              ATUALIZADO EM {new Date().toLocaleDateString('pt-BR')} • TOTAL: {filteredItems.length} VARIAÇÕES
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-xs font-black uppercase tracking-wider text-gray-500 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gold" />
            <p>Carregando todas as variações e fotos do catálogo...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed border-gray-300 space-y-3">
            <ShoppingBag className="w-10 h-10 text-gold mx-auto" />
            <h3 className="text-sm font-black uppercase text-deep-black">
              Nenhuma variação encontrada com os filtros selecionados
            </h3>
            <p className="text-xs text-gray-500 uppercase max-w-md mx-auto">
              Tente selecionar &quot;TODAS AS CATEGORIAS&quot; ou limpar o campo de busca.
            </p>
          </div>
        ) : (
          Object.entries(groupedByCategory).map(([categoryName, itemsList]) => (
            <section key={categoryName} className="mb-10 print:break-inside-auto">
              {/* Separador de Categoria */}
              <div className="flex items-center justify-between bg-gray-100 border-l-4 border-gold p-3 mb-5 print:bg-gray-100">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                  <span className="text-gold">★</span>
                  <span>{categoryName}</span>
                </h2>
                <span className="px-2.5 py-0.5 bg-deep-black text-white text-[10px] font-black uppercase">
                  {itemsList.length} {itemsList.length === 1 ? 'variação' : 'variações'}
                </span>
              </div>

              {/* Grid de Variações Lado a Lado (Foto de um por um) */}
              <div
                className={`grid gap-4 sm:gap-6 ${
                  columnsCount === 2
                    ? 'grid-cols-2'
                    : columnsCount === 4
                    ? 'grid-cols-2 sm:grid-cols-4'
                    : 'grid-cols-2 sm:grid-cols-3'
                }`}
              >
                {itemsList.map((item) => (
                  <article
                    key={item.tileId}
                    className="border border-gray-200 bg-white flex flex-col justify-between overflow-hidden shadow-xs hover:border-gold hover:shadow-md transition print:break-inside-avoid"
                  >
                    {/* Foto da Variação em Proporção 4:5 */}
                    <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden group">
                      <img
                        src={item.imageUrl}
                        alt={`${item.title} - ${item.colorName}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Badge de Desconto */}
                      {item.hasDiscount && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 uppercase shadow-sm">
                          -{item.discountPercent}% OFF
                        </span>
                      )}

                      {/* Swatch de Cor Sobreposto */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-deep-black/85 backdrop-blur-xs text-white px-2 py-1 border border-white/20">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span className="text-[9px] font-black uppercase tracking-wider line-clamp-1">
                          {item.colorName}
                        </span>
                      </div>
                    </div>

                    {/* Detalhes, Preço e Grade de Tamanhos */}
                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
                      <div>
                        {/* Título do Produto */}
                        <h3 className="text-xs sm:text-sm font-black uppercase text-deep-black tracking-wide line-clamp-2">
                          {item.title}
                        </h3>

                        {/* Preço */}
                        <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                          {item.hasDiscount ? (
                            <>
                              <span className="text-[11px] text-gray-400 font-bold line-through">
                                ${item.originalPrice?.toFixed(2)}
                              </span>
                              <span className="text-sm sm:text-base font-black text-green-700">
                                ${item.promoPrice.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm sm:text-base font-black text-deep-black">
                              ${item.price.toFixed(2)}
                            </span>
                          )}
                          <span className="text-[8.5px] font-bold text-gray-500 uppercase">
                            +$9.99 FRETE FIXO EUA
                          </span>
                        </div>
                      </div>

                      {/* Grade de Estoque por Tamanho */}
                      <div className="pt-2 border-t border-dashed border-gray-200">
                        <div className="text-[8.5px] font-black uppercase text-gray-500 mb-1 flex items-center justify-between">
                          <span>TAMANHOS DISPONÍVEIS:</span>
                          <span className="text-emerald-700 font-black">
                            {item.totalStock} un total
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {item.sortedSizes.map((sz) => {
                            const qty = item.stockMap[sz] || 0;
                            const isZero = qty <= 0;
                            return (
                              <span
                                key={sz}
                                className={`px-2 py-0.5 border text-[9.5px] font-mono flex items-center gap-1 ${
                                  isZero
                                    ? 'bg-gray-50 text-gray-300 border-gray-200 line-through'
                                    : 'bg-emerald-50 text-emerald-950 border-emerald-400 font-black shadow-2xs'
                                }`}
                                title={isZero ? `Tamanho ${sz} esgotado nesta cor` : `${qty} unidades disponíveis no tamanho ${sz}`}
                              >
                                <span className="font-bold">{sz}:</span>
                                <span>{isZero ? '0' : qty}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Botões de Ação na Versão Web (Ocultos na Impressão) */}
                      <div className="no-print pt-2 border-t border-gray-100 flex items-center gap-1.5">
                        <a
                          href={createWhatsAppOrderLink(item)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-1.5 px-2 bg-[#25d366] hover:bg-emerald-600 text-black text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1 transition"
                        >
                          <span>📲 Pedir no Whats</span>
                        </a>

                        <Link
                          href={`/produto/${item.productSlug}?cor=${encodeURIComponent(item.colorName)}`}
                          target="_blank"
                          className="p-1.5 bg-gray-100 hover:bg-gold hover:text-deep-black text-gray-700 text-[10px] font-black uppercase transition border border-gray-200"
                          title="Ver peça na loja online"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}

        {/* Rodapé do Catálogo */}
        <footer className="text-center p-5 bg-gray-50 border border-gray-200 text-[10px] text-gray-600 font-bold uppercase mt-8 print:mt-4 space-y-1">
          <p className="font-black text-deep-black">
            {siteInfo?.storeName || 'ANA FITNESS WEAR'} • LEOMINSTER, MASSACHUSETTS, EUA
          </p>
          <p>
            Envie a foto ou o nome da peça desejada para nosso WhatsApp {siteInfo?.whatsapp || '+1 (978) 313-9452'} para reservar seu pedido com envio expresso via USPS para todos os EUA!
          </p>
        </footer>
      </main>
    </div>
  );
}
