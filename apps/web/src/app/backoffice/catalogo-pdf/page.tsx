'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  Filter,
  RefreshCw,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Search,
  ShoppingBag,
} from 'lucide-react';
import { useStoreSettings } from '@/context/StoreSettingsContext';

export interface CatalogPdfVariationTile {
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

export default function WhatsAppCatalogPdfPage() {
  const { siteInfo } = useStoreSettings();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [columnsCount, setColumnsCount] = useState<2 | 3 | 4>(3);
  const [onlyInStock, setOnlyInStock] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/backoffice/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (e) {
        console.error('Erro ao buscar produtos:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Expande cada produto em variações com foto individual
  const expandedVariations = useMemo<CatalogPdfVariationTile[]>(() => {
    const tiles: CatalogPdfVariationTile[] = [];

    (products || []).forEach((product) => {
      if (product.status === 'HIDDEN' || product.status === 'ARCHIVED') return;

      const categoryName = (product.categories?.name || product.category || product.subcategory || 'CONJUNTOS')
        .toString()
        .trim()
        .toUpperCase();

      const variants = Array.isArray(product.variants) ? product.variants : [];
      const meta = product.meta || {};

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
            varImage = product.primaryImage || product.primary_image || meta.primary_image || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80';
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
  }, [products, onlyInStock]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    expandedVariations.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [expandedVariations]);

  const filteredItems = useMemo(() => {
    return expandedVariations.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedSizeFilter !== 'ALL') {
        const qtyInSize = item.stockMap[selectedSizeFilter.toUpperCase()] || 0;
        if (qtyInSize <= 0) return false;
      }
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

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, CatalogPdfVariationTile[]> = {};
    filteredItems.forEach((item) => {
      const cat = item.category || 'OUTROS';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleCopyClientLink = () => {
    if (typeof window === 'undefined') return;
    const clientUrl = `${window.location.origin}/catalogo`;
    navigator.clipboard.writeText(clientUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-deep-black print:bg-white print:p-0">
      {/* Barra Superior de Ações (Oculta na Impressão) */}
      <header className="no-print sticky top-0 z-50 bg-deep-black text-white p-3 sm:p-4 border-b-2 border-gold shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/backoffice"
              className="p-2 border border-white/20 hover:bg-white hover:text-deep-black transition flex items-center gap-1.5 text-xs font-black uppercase"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Backoffice</span>
            </Link>
            <div className="hidden sm:block">
              <span className="text-[10px] text-gold font-black uppercase tracking-wider block">
                RELATÓRIO & DIVULGAÇÃO • TODAS AS VARIAÇÕES
              </span>
              <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                CATÁLOGO PDF WHATSAPP ({filteredItems.length} VARIAÇÕES)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Copiar Link do Catálogo do Cliente */}
            <button
              type="button"
              onClick={handleCopyClientLink}
              className="px-3 py-2 bg-white/10 hover:bg-white hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-sm"
              title="Copiar link limpo (/catalogo) para enviar à cliente no WhatsApp"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link p/ Cliente'}</span>
            </button>

            {/* Abrir Link do Catálogo */}
            <Link
              href="/catalogo"
              target="_blank"
              className="px-3 py-2 bg-white/10 hover:bg-white hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 border border-white/20 shadow-sm"
              title="Abrir a página do catálogo que o cliente visualiza"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Catálogo do Cliente</span>
            </Link>

            {/* Seletor de Categoria */}
            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 text-xs border border-white/20">
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

            {/* Colunas */}
            <div className="inline-flex border border-white/20 bg-white/10">
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

            {/* Botão de Impressão Direta em PDF */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-gold hover:bg-white text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 border-2 border-deep-black cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4 stroke-[3]" />
              <span>IMPRIMIR / SALVAR PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Imprimível do Catálogo */}
      <main className="max-w-5xl mx-auto p-4 sm:p-8 bg-white my-4 print:my-0 print:p-0 shadow-sm border print:border-0 border-gray-200">
        {/* Banner de Capa */}
        <div className="bg-deep-black text-white p-4 sm:p-6 border-2 border-gold flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-gold">
              {siteInfo?.storeName || 'ANA FITNESS WEAR'}
            </h1>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/80 mt-1">
              CATÁLOGO DE PRODUTOS & PRONTA ENTREGA (FOTO DE CADA VARIAÇÃO)
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

        {loading ? (
          <div className="p-16 text-center text-xs font-black uppercase tracking-wider text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold" />
            Carregando variações e fotos do catálogo...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center text-xs font-bold uppercase text-gray-500">
            Nenhuma variação encontrada para os filtros selecionados.
          </div>
        ) : (
          Object.entries(groupedByCategory).map(([categoryName, itemsList]) => (
            <section key={categoryName} className="mb-8 print:break-inside-auto">
              {/* Separador de Categoria */}
              <div className="flex items-center justify-between bg-gray-100 border-l-4 border-gold p-2.5 mb-4 print:bg-gray-100">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-deep-black">
                  ★ {categoryName}
                </h2>
                <span className="px-2 py-0.5 bg-deep-black text-white text-[9px] font-black uppercase">
                  {itemsList.length} {itemsList.length === 1 ? 'variação' : 'variações'}
                </span>
              </div>

              {/* Grid de Itens Lado a Lado */}
              <div
                className={`grid gap-4 ${
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
                    className="border border-gray-200 bg-white flex flex-col justify-between overflow-hidden print:break-inside-avoid"
                  >
                    {/* Foto da Variação */}
                    <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={`${item.title} - ${item.colorName}`}
                        className="w-full h-full object-cover"
                      />
                      {item.hasDiscount && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 uppercase">
                          -{item.discountPercent}% OFF
                        </span>
                      )}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-deep-black/85 text-white px-2 py-0.5 text-[9px] font-black uppercase border border-white/20">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span>{item.colorName}</span>
                      </div>
                    </div>

                    {/* Título, Preço e Estoque por Tamanho */}
                    <div className="p-3 flex flex-col flex-1 justify-between gap-2.5">
                      <div>
                        <h3 className="text-xs font-black uppercase text-deep-black tracking-wide line-clamp-2">
                          {item.title}
                        </h3>

                        <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                          {item.hasDiscount ? (
                            <>
                              <span className="text-[11px] text-gray-400 font-bold line-through">
                                De: ${item.originalPrice?.toFixed(2)}
                              </span>
                              <span className="text-sm font-black text-green-700">
                                Por: ${item.promoPrice.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-black text-deep-black">
                              ${item.promoPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Estoque em cada tamanho */}
                      <div className="pt-2 border-t border-dashed border-gray-200">
                        <div className="text-[8.5px] font-black uppercase text-gray-500 mb-1 flex items-center justify-between">
                          <span>ESTOQUE POR TAMANHO:</span>
                          <span className="text-green-800 font-bold">{item.totalStock} un</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.sortedSizes.map((sz) => {
                            const qty = item.stockMap[sz] || 0;
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
                  </article>
                ))}
              </div>
            </section>
          ))
        )}

        {/* Rodapé do Catálogo */}
        <footer className="text-center p-4 bg-gray-50 border border-gray-200 text-[10px] text-gray-600 font-bold uppercase mt-8 print:mt-4">
          {siteInfo?.storeName || 'ANA FITNESS WEAR'} • Envie a foto ou nome da peça para nosso WhatsApp para reservar seu pedido!
        </footer>
      </main>
    </div>
  );
}
