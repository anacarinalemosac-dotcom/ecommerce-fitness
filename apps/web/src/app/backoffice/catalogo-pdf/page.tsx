'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  Filter,
  RefreshCw,
  Smartphone,
  Layers,
} from 'lucide-react';
import { useStoreSettings } from '@/context/StoreSettingsContext';

export default function WhatsAppCatalogPdfPage() {
  const { siteInfo } = useStoreSettings();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [columnsCount, setColumnsCount] = useState<3 | 2 | 4>(3);
  const [onlyInStock, setOnlyInStock] = useState(true);

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

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    (products || []).forEach((p) => {
      const cat = (p.categories?.name || p.category || p.subcategory || 'OUTROS')
        .toString()
        .trim()
        .toUpperCase();
      if (cat) cats.add(cat);
    });
    return Array.from(cats).sort();
  }, [products]);

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

    return { stockMap, sortedSizes, totalStock };
  };

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

  const groupedProducts = useMemo(() => {
    const groups: Record<string, any[]> = {};
    (products || []).forEach((product) => {
      const cat = (product.categories?.name || product.category || product.subcategory || 'OUTROS')
        .toString()
        .trim()
        .toUpperCase();

      if (selectedCategory !== 'ALL' && cat !== selectedCategory) return;
      const { totalStock } = getProductStockBySize(product);
      if (onlyInStock && totalStock <= 0) return;

      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(product);
    });
    return groups;
  }, [products, selectedCategory, onlyInStock]);

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
                RELATÓRIO & DIVULGAÇÃO
              </span>
              <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                CATÁLOGO PDF WHATSAPP
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Seletor de Categoria */}
            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-gold" />
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

        {loading ? (
          <div className="p-16 text-center text-xs font-black uppercase tracking-wider text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold" />
            Carregando catálogo de produtos...
          </div>
        ) : Object.keys(groupedProducts).length === 0 ? (
          <div className="p-16 text-center text-xs font-bold uppercase text-gray-500">
            Nenhum produto encontrado para os filtros selecionados.
          </div>
        ) : (
          Object.entries(groupedProducts).map(([categoryName, productsList]) => (
            <section key={categoryName} className="mb-8 print:break-inside-auto">
              {/* Separador de Categoria */}
              <div className="flex items-center justify-between bg-gray-100 border-l-4 border-gold p-2.5 mb-4 print:bg-gray-100">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-deep-black">
                  ★ {categoryName}
                </h2>
                <span className="px-2 py-0.5 bg-deep-black text-white text-[9px] font-black uppercase">
                  {productsList.length} {productsList.length === 1 ? 'modelo' : 'modelos'}
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
                {productsList.map((product) => {
                  const pricing = getProductPricing(product);
                  const { stockMap, sortedSizes } = getProductStockBySize(product);
                  const imgUrl = getProductImage(product);

                  return (
                    <article
                      key={product.id || product.slug}
                      className="border border-gray-200 bg-white flex flex-col justify-between overflow-hidden print:break-inside-avoid"
                    >
                      {/* Foto da Peça */}
                      <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                        <img
                          src={imgUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                        {pricing.hasDiscount && (
                          <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 uppercase">
                            -{pricing.discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      {/* Título, Preço e Estoque por Tamanho */}
                      <div className="p-3 flex flex-col flex-1 justify-between gap-2.5">
                        <div>
                          <h3 className="text-xs font-black uppercase text-deep-black tracking-wide line-clamp-2">
                            {product.title}
                          </h3>

                          <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
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

                        {/* Estoque em cada tamanho */}
                        <div className="pt-2 border-t border-dashed border-gray-200">
                          <div className="text-[8.5px] font-black uppercase text-gray-500 mb-1">
                            ESTOQUE POR TAMANHO:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {sortedSizes.map((sz) => {
                              const qty = stockMap[sz] || 0;
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
                  );
                })}
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
