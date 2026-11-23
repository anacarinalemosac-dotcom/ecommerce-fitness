'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Star, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { defaultProducts } from '../lib/defaultProductsCatalog';
import { translateProductTitle, translateColorName } from '../lib/translateFitness';

interface ProductRecommendationsProps {
  currentProduct: {
    id?: string;
    slug?: string;
    title?: string;
    categoryKey?: string;
    categoryPt?: string;
    categoryEn?: string;
    colors?: any[];
  };
  productsPool?: any[];
  title?: string;
  subtitle?: string;
  limit?: number;
}

export function ProductRecommendations({
  currentProduct,
  productsPool,
  title,
  subtitle,
  limit = 4,
}: ProductRecommendationsProps) {
  const { lang } = useLanguage();

  const recommendations = useMemo(() => {
    if (!currentProduct) return [];

    const pool = (productsPool && productsPool.length > 0) ? productsPool : defaultProducts;
    if (!pool || pool.length === 0) return [];

    const currentSlug = currentProduct.slug || '';
    const currentId = currentProduct.id || '';
    const rawCategory = (
      currentProduct.categoryKey ||
      currentProduct.categoryPt ||
      currentProduct.categoryEn ||
      ''
    ).toLowerCase();

    // 1. Mapeamento de Categorias Complementares Inteligentes (Cross-Sell de Estilo)
    let complementaryPriorities: string[] = [];
    if (rawCategory.includes('set') || rawCategory.includes('conjunto')) {
      // Para conjuntos: sugere Tops (alternar/camada), Jaquetas/Coletes (frio/sobreposição), Macaquinhos e Macacões
      complementaryPriorities = ['tops', 'jackets', 'rompers', 'jumpsuits'];
    } else if (rawCategory.includes('top')) {
      // Para tops: sugere Conjuntos (legging/short correspondente), Jaquetas e Macaquinhos
      complementaryPriorities = ['sets', 'jackets', 'rompers'];
    } else if (rawCategory.includes('romper') || rawCategory.includes('macaquinho')) {
      // Para macaquinhos: sugere Jaquetas (sobreposição), Tops e Conjuntos
      complementaryPriorities = ['jackets', 'tops', 'sets'];
    } else if (rawCategory.includes('jumpsuit') || rawCategory.includes('macacão') || rawCategory.includes('macacao')) {
      // Para macacões: sugere Jaquetas/Coletes e Tops
      complementaryPriorities = ['jackets', 'tops', 'sets'];
    } else if (rawCategory.includes('jacket') || rawCategory.includes('jaqueta') || rawCategory.includes('casaco') || rawCategory.includes('colete')) {
      // Para jaquetas: sugere Conjuntos, Macaquinhos e Macacões
      complementaryPriorities = ['sets', 'rompers', 'jumpsuits', 'tops'];
    } else {
      complementaryPriorities = ['tops', 'jackets', 'sets', 'rompers'];
    }

    // Cores da peça atual para cálculo de harmonia de paleta
    const currentColors = (currentProduct.colors || []).map((c: any) =>
      (typeof c === 'string' ? c : c.name || '').toLowerCase()
    );

    // 2. Sistema de Pontuação (Score) de Relevância
    const scoredCandidates = pool
      .filter((p: any) => {
        if (!p) return false;
        if (p.slug && p.slug === currentSlug) return false;
        if (p.id && p.id === currentId) return false;
        if (p.stock !== undefined && p.stock <= 0) return false;
        return true;
      })
      .map((p: any) => {
        let score = 0;
        const pCat = (p.categoryKey || p.categoryPt || p.categoryEn || '').toLowerCase();

        // Pontuação de Categoria Complementar
        const priorityIndex = complementaryPriorities.findIndex((cp) => pCat.includes(cp));
        if (priorityIndex !== -1) {
          // Primeira prioridade ganha 50 pontos, segunda 40, etc.
          score += (complementaryPriorities.length - priorityIndex) * 20;
        }

        // Pontuação de Harmonia de Cor
        const pColors = (p.colors || []).map((c: any) =>
          (typeof c === 'string' ? c : c.name || '').toLowerCase()
        );
        const matchesColor = currentColors.some((curColor: string) =>
          pColors.some((pColor: string) => pColor.includes(curColor) || curColor.includes(pColor))
        );
        if (matchesColor) {
          score += 25;
        }

        // Avaliação alta ganha bônus
        if (p.rating) {
          score += Number(p.rating) * 2;
        }

        // Presença de imagem primária é indispensável
        if (p.primaryImage || p.primary_image) {
          score += 10;
        }

        return { product: p, score, matchedCategory: priorityIndex !== -1 };
      });

    // Ordena pelo maior score
    scoredCandidates.sort((a, b) => b.score - a.score);

    // 3. Garantia de Variedade (tentar não repetir a mesma categoria em todos os 4 slots)
    const result: any[] = [];
    const usedCategories = new Set<string>();

    for (const item of scoredCandidates) {
      if (result.length >= limit) break;
      const catKey = item.product.categoryKey || item.product.categoryPt || 'other';
      if (!usedCategories.has(catKey) || result.length >= complementaryPriorities.length) {
        result.push(item.product);
        usedCategories.add(catKey);
      }
    }

    // Se ainda restarem vagas, completa com os melhores classificados
    for (const item of scoredCandidates) {
      if (result.length >= limit) break;
      if (!result.some((r) => r.slug === item.product.slug)) {
        result.push(item.product);
      }
    }

    return result;
  }, [currentProduct, productsPool, limit]);

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const defaultTitle = lang === 'pt' ? 'COMBINE COM ESTA PEÇA' : 'COMPLETE THE LOOK';
  const defaultSubtitle = lang === 'pt'
    ? 'Sugestões inteligentes selecionadas para sobreposição, harmonia de cores e alto desempenho no treino.'
    : 'Curated pairings selected for stylish layering, color harmony, and peak workout performance.';

  return (
    <section className="border-t border-gray-200 bg-white py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Seção de Sugestões Estilo Gymshark */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-800 rounded-xs mb-2">
              <Sparkles className="w-3 h-3 text-gold" />
              <span>{lang === 'pt' ? 'CROSS-SELL EXCLUSIVO' : 'PERFECT MATCH'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-950">
              {title || defaultTitle}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1 max-w-2xl">
              {subtitle || defaultSubtitle}
            </p>
          </div>

          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-black hover:text-gold transition group self-start sm:self-auto"
          >
            <span>{lang === 'pt' ? 'Ver todo o catálogo' : 'View all pieces'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Grade Gymshark 4:5 de Produtos Sugeridos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {recommendations.map((item: any) => {
            const itemPrice = Number(item.price) || 44.9;
            const itemOriginalPrice = item.originalPrice ? Number(item.originalPrice) : undefined;
            const hasDiscount = itemOriginalPrice && itemOriginalPrice > itemPrice;
            const discountPct = hasDiscount
              ? Math.round(((itemOriginalPrice - itemPrice) / itemOriginalPrice) * 100)
              : 0;

            const displayCategory = lang === 'pt'
              ? (item.categoryPt ? item.categoryPt.charAt(0).toUpperCase() + item.categoryPt.slice(1).toLowerCase() : 'Fitness Wear')
              : (item.categoryEn ? item.categoryEn.charAt(0).toUpperCase() + item.categoryEn.slice(1).toLowerCase() : 'Activewear');

            const itemImage = item.primaryImage || item.primary_image || (item.galleryImages && item.galleryImages[0]) || '';

            return (
              <div
                key={item.id || item.slug}
                className="group/card flex flex-col justify-between bg-white transition duration-300"
              >
                {/* 1. Imagem Retrato Vertical 4:5 Gymshark */}
                <Link
                  href={`/produto/${item.slug}`}
                  className="relative aspect-[3/4] sm:aspect-[4/5] w-full overflow-hidden bg-[#fafafa] flex items-center justify-center p-1 rounded-xs"
                >
                  {itemImage ? (
                    <img
                      src={itemImage}
                      alt={item.title}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                      Ana Fitness
                    </div>
                  )}

                  {/* Badge Discreta de Combinação */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
                    <span className="px-2 py-0.5 bg-black text-white text-[9px] font-bold uppercase tracking-wider rounded-xs shadow-xs">
                      {lang === 'pt' ? 'SUGESTÃO' : 'MATCH'}
                    </span>
                    {hasDiscount && (
                      <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded-xs">
                        -{discountPct}%
                      </span>
                    )}
                  </div>
                </Link>

                {/* 2. Metadados Limpos e Tipografia Gymshark */}
                <div className="pt-3 flex flex-col flex-1 justify-between space-y-1.5">
                  {/* Linha de Amostras de Cores + Avaliação */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {(item.colors || []).slice(0, 3).map((c: any, cIdx: number) => {
                        const hex = typeof c === 'string' ? '#000000' : c.hex || '#000000';
                        const name = typeof c === 'string' ? c : c.name || '';
                        return (
                          <span
                            key={cIdx}
                            className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                            style={{ backgroundColor: hex }}
                            title={translateColorName(name, lang)}
                          />
                        );
                      })}
                      {(item.colors || []).length > 3 && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          +{(item.colors || []).length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-700">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{(Number(item.rating) || 5.0).toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Título e Subtítulo da Categoria */}
                  <div>
                    <Link
                      href={`/produto/${item.slug}`}
                      className="text-xs sm:text-[13px] font-bold text-gray-900 hover:text-gold transition line-clamp-1 block tracking-tight"
                    >
                      {translateProductTitle(item.title, lang)}
                    </Link>
                    <p className="text-[11px] text-gray-500 font-medium tracking-normal mt-0.5 line-clamp-1">
                      {displayCategory} • {lang === 'pt' ? 'Alta Compressão' : 'High Compression'}
                    </p>
                  </div>

                  {/* Preço e Botão Ver Peça */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm sm:text-base font-extrabold text-gray-950">
                        ${itemPrice.toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through">
                          ${itemOriginalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/produto/${item.slug}`}
                      className="py-1 px-2.5 bg-gray-100 hover:bg-black hover:text-white text-gray-800 text-[10px] font-bold uppercase rounded-xs transition active:scale-95 flex items-center gap-1"
                    >
                      <span>{lang === 'pt' ? 'Ver look' : 'View'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
export default ProductRecommendations;
