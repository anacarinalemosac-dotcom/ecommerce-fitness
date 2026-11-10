'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Tag,
  Lock,
  Plus,
  Truck,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { saveCartItems, CartItem } from '../../lib/cart';

interface ComboPromoConfig {
  active: boolean;
  title: string;
  required_quantity: number;
  bundle_price: number;
  badge_text: string;
  description: string;
  product_ids: string[];
  product_slugs: string[];
}

export default function ComboBuilderPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [promo, setPromo] = useState<ComboPromoConfig | null>(null);
  const [loadingPromo, setLoadingPromo] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Slots selecionados pelo cliente (padrão 3 slots)
  const [selectedSlots, setSelectedSlots] = useState<
    Array<{
      product: any;
      size: string;
      color: string;
      image: string;
      sku: string;
    } | null>
  >([null, null, null]);

  // Modal para escolher tamanho/cor do produto clicado
  const [activeProductForSlot, setActiveProductForSlot] = useState<any | null>(null);
  const [tempSlotIndex, setTempSlotIndex] = useState<number | null>(null);
  const [tempSize, setTempSize] = useState<string>('M');
  const [tempColor, setTempColor] = useState<string>('');

  // Filtro de busca na grade de produtos participantes
  const [search, setSearch] = useState('');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('ALL');

  useEffect(() => {
    // 1. Carrega configuração da promoção de combo
    fetch('/api/backoffice/combo-promo')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.comboPromo) {
          setPromo(data.comboPromo);
          const reqQty = Number(data.comboPromo.required_quantity) || 3;
          setSelectedSlots(new Array(reqQty).fill(null));
        }
      })
      .catch((err) => console.warn('Erro ao carregar promo:', err))
      .finally(() => setLoadingPromo(false));

    // 2. Carrega catálogo de produtos para listar os participantes
    fetch('/api/backoffice/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.products && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.warn('Erro ao carregar produtos:', err))
      .finally(() => setLoadingProducts(false));
  }, []);

  const requiredQty = promo?.required_quantity || 3;
  const bundlePrice = promo?.bundle_price || 99.0;
  const promoProductIds = new Set((promo?.product_ids || []).map((id) => String(id).toLowerCase()));
  const promoProductSlugs = new Set((promo?.product_slugs || []).map((s) => String(s).toLowerCase()));

  // Filtra produtos participantes da promoção
  const participatingProducts = products.filter((p: any) => {
    if (p.status === 'DRAFT' || p.status === 'ARCHIVED') return false;
    const isId = p.id && promoProductIds.has(String(p.id).toLowerCase());
    const isSlug = p.slug && promoProductSlugs.has(String(p.slug).toLowerCase());
    const isFallback =
      promoProductIds.size === 0 &&
      promoProductSlugs.size === 0 &&
      (p.title?.toUpperCase().includes('SET') || p.title?.toUpperCase().includes('CONJUNTO'));
    return isId || isSlug || isFallback;
  });

  // Aplica filtro de busca e tamanho
  const displayedProducts = participatingProducts.filter((p: any) => {
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchTitle = (p.title || '').toLowerCase().includes(term);
      const matchSlug = (p.slug || '').toLowerCase().includes(term);
      if (!matchTitle && !matchSlug) return false;
    }
    if (selectedSizeFilter !== 'ALL') {
      const hasSize = (p.variants || []).some(
        (v: any) => v.size?.toUpperCase() === selectedSizeFilter.toUpperCase() && (v.stock_quantity ?? v.stock ?? 1) > 0
      );
      if (!hasSize) return false;
    }
    return true;
  });

  const filledCount = selectedSlots.filter(Boolean).length;
  const isComboComplete = filledCount === requiredQty;

  const handleOpenProductModal = (product: any, targetSlotIdx?: number) => {
    const firstEmpty = selectedSlots.findIndex((s) => s === null);
    const destIdx = targetSlotIdx !== undefined ? targetSlotIdx : (firstEmpty >= 0 ? firstEmpty : 0);
    setTempSlotIndex(destIdx);
    setActiveProductForSlot(product);

    // Pré-seleciona primeiro tamanho disponível
    const variants = product.variants || [];
    const firstInStock = variants.find((v: any) => (v.stock_quantity ?? v.stock ?? 1) > 0) || variants[0];
    setTempSize(firstInStock?.size?.toUpperCase() || 'M');
    setTempColor(firstInStock?.color || product.colorName || 'Preto Ônix');
  };

  const handleConfirmSlotSelection = () => {
    if (!activeProductForSlot || tempSlotIndex === null) return;

    const matchedVariant = (activeProductForSlot.variants || []).find(
      (v: any) =>
        v.size?.toUpperCase() === tempSize.toUpperCase() &&
        (!tempColor || v.color?.toLowerCase() === tempColor.toLowerCase())
    ) || (activeProductForSlot.variants || [])[0];

    const img =
      matchedVariant?.image ||
      (Array.isArray(matchedVariant?.images) ? matchedVariant.images[0] : null) ||
      activeProductForSlot.primary_image ||
      activeProductForSlot.primaryImage ||
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80';

    const slotData = {
      product: activeProductForSlot,
      size: tempSize,
      color: tempColor || 'Preto Ônix',
      image: img,
      sku: matchedVariant?.sku || `${activeProductForSlot.slug || 'ANA'}-${tempSize}`,
    };

    setSelectedSlots((prev) => {
      const next = [...prev];
      next[tempSlotIndex] = slotData;
      return next;
    });

    setActiveProductForSlot(null);
    setTempSlotIndex(null);
  };

  const handleRemoveSlot = (idx: number) => {
    setSelectedSlots((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  };

  const handleResetSlots = () => {
    setSelectedSlots(new Array(requiredQty).fill(null));
  };

  const handleCheckoutCombo = () => {
    if (!isComboComplete) return;

    // Converte os slots em itens da sacola
    const itemsToAdd: CartItem[] = selectedSlots.map((s, idx) => ({
      id: s!.product.id,
      title: s!.product.title,
      slug: s!.product.slug,
      size: s!.size,
      color: s!.color,
      sku: s!.sku,
      price: Number(s!.product.price) || 39.9,
      quantity: 1,
      image: s!.image,
      isBackorder: false,
      productionDays: 0,
      is_combo_item: true,
    }));

    saveCartItems(itemsToAdd);
    router.push('/checkout');
  };

  // Preço original somado dos itens selecionados
  const originalSubtotal = selectedSlots.reduce((acc, s) => {
    if (!s) return acc;
    return acc + (Number(s.product.price) || 39.9);
  }, 0);

  const discountAmount = isComboComplete ? Math.max(0, originalSubtotal - bundlePrice) : 0;

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Banner Principal Topo */}
      <div className="bg-deep-black text-white py-12 px-4 sm:px-8 border-b-4 border-gold shadow-md text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-gold text-deep-black text-xs font-black uppercase tracking-widest shadow-luxury">
            <Sparkles className="w-4 h-4 text-deep-black" />
            <span>{promo?.badge_text || 'PROMOÇÃO ESPECIAL • 3 POR $99'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            {promo?.title || 'MONTE SEU COMBO: 3 CONJUNTOS POR $99'}
          </h1>

          <p className="text-xs sm:text-sm text-white/80 uppercase max-w-2xl mx-auto font-medium leading-relaxed">
            {promo?.description ||
              'Escolha quaisquer 3 conjuntos fitness participantes e garanta o valor promocional fechado no checkout! Zero transparência, tecido premium e caimento impecável.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold uppercase text-gold pt-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>FRETE FIXO $9.90 OU RETIRADA GRÁTIS</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>4X SEM JUROS NO AFTERPAY / AFFIRM</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ECONOMIA DIRETA NO CHECKOUT</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Painel Sticky dos Slots Selecionados */}
        <div className="bg-white border-2 border-deep-black p-5 sm:p-7 shadow-luxury space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-deep-black/10 pb-4">
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                <Tag className="w-5 h-5 text-gold" />
                <span>SUA SELEÇÃO DO COMBO ({filledCount} DE {requiredQty})</span>
              </h2>
              <p className="text-xs text-deep-black/60 font-medium">
                {isComboComplete
                  ? '🎉 Combo completo! Clique no botão abaixo para finalizar com o desconto fechado.'
                  : `Selecione mais ${requiredQty - filledCount} conjunto(s) abaixo para completar seu combo.`}
              </p>
            </div>

            {filledCount > 0 && (
              <button
                type="button"
                onClick={handleResetSlots}
                className="text-[10px] font-black uppercase text-red-600 hover:text-red-800 flex items-center gap-1 transition self-start sm:self-auto cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>LIMPAR SELEÇÃO</span>
              </button>
            )}
          </div>

          {/* Os 3 Slots Visuais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedSlots.map((slot, idx) => (
              <div
                key={idx}
                className={`p-4 border-2 transition-all relative flex flex-col justify-between min-h-[160px] ${
                  slot
                    ? 'border-deep-black bg-white shadow-sm'
                    : 'border-dashed border-deep-black/30 bg-stone-50/70 hover:border-gold'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-deep-black/10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gold font-mono">
                    SLOT #{idx + 1}
                  </span>
                  {slot ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(idx)}
                      className="text-red-500 hover:text-red-700 transition cursor-pointer"
                      title="Remover peça deste slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-deep-black/40 uppercase">
                      DISPONÍVEL
                    </span>
                  )}
                </div>

                {slot ? (
                  <div className="flex gap-3 items-center py-2">
                    <img
                      src={slot.image}
                      alt={slot.product.title}
                      className="w-16 h-20 object-cover border border-deep-black/20 shrink-0"
                    />
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-xs font-black uppercase text-deep-black truncate">
                        {slot.product.title}
                      </h4>
                      <p className="text-[11px] font-bold text-deep-black/70 uppercase">
                        TAM: <span className="text-gold font-black">{slot.size}</span> • {slot.color}
                      </p>
                      <p className="text-[10px] text-deep-black/50 line-through">
                        Preço normal: ${(Number(slot.product.price) || 39.9).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-deep-black/5 border border-deep-black/15 flex items-center justify-center text-deep-black/50">
                      <Plus className="w-5 h-5 text-gold" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-wider text-deep-black/70">
                      ESCOLHA A {idx + 1}ª PEÇA
                    </p>
                    <span className="text-[10px] text-deep-black/50">
                      Clique em um produto da vitrine abaixo
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-deep-black/10 text-right">
                  {slot ? (
                    <span className="text-[10px] font-black text-emerald-700 uppercase flex items-center justify-end gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>INCLUÍDO NO COMBO</span>
                    </span>
                  ) : (
                    <span className="text-[9px] text-deep-black/40 uppercase font-mono">
                      AGUARDANDO ESCOLHA
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Barra de Totais e Botão de Finalização */}
          <div className="p-4 sm:p-5 bg-stone-900 text-white border-2 border-gold flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/70 uppercase font-bold">VALOR DO COMBO:</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-gold">
                  ${bundlePrice.toFixed(2)}
                </span>
                {originalSubtotal > 0 && isComboComplete && (
                  <span className="text-xs text-white/50 line-through font-mono">
                    ${originalSubtotal.toFixed(2)}
                  </span>
                )}
              </div>
              {isComboComplete && discountAmount > 0 && (
                <p className="text-xs text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>VOCÊ ESTÁ ECONOMIZANDO ${discountAmount.toFixed(2)} NESTE COMBO!</span>
                </p>
              )}
              {!isComboComplete && (
                <p className="text-[11px] text-white/70 uppercase">
                  Complete os {requiredQty} slots para destravar o valor de ${bundlePrice.toFixed(2)}.
                </p>
              )}
            </div>

            <div>
              {isComboComplete ? (
                <button
                  type="button"
                  onClick={handleCheckoutCombo}
                  className="w-full md:w-auto px-8 py-4 bg-gold hover:bg-white text-deep-black font-black text-xs sm:text-sm uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-luxury cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-deep-black" />
                  <span>FINALIZAR MEU COMBO POR ${bundlePrice.toFixed(2)} →</span>
                </button>
              ) : (
                <div className="px-6 py-3.5 bg-white/10 text-white/60 border border-white/20 text-xs font-black uppercase tracking-wider text-center">
                  ESCOLHA MAIS {requiredQty - filledCount} PEÇA(S) PARA FINALIZAR
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grade de Produtos Participantes para Seleção */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-deep-black pb-4">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gold" />
                <span>PEÇAS DISPONÍVEIS NA PROMOÇÃO ({displayedProducts.length})</span>
              </h3>
              <p className="text-xs text-deep-black/60 uppercase">
                Clique na peça para escolher cor e tamanho e adicionar ao seu combo
              </p>
            </div>

            {/* Barra de Filtros Rápida */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="BUSCAR MODELO..."
                className="px-3.5 py-2 text-xs uppercase border border-deep-black/20 focus:outline-none focus:border-deep-black bg-white font-mono"
              />

              <select
                value={selectedSizeFilter}
                onChange={(e) => setSelectedSizeFilter(e.target.value)}
                className="px-3 py-2 text-xs uppercase border border-deep-black/20 focus:outline-none focus:border-deep-black bg-white"
              >
                <option value="ALL">TODOS OS TAMANHOS</option>
                <option value="P">TAMANHO P (S)</option>
                <option value="M">TAMANHO M (M)</option>
                <option value="G">TAMANHO G (L)</option>
                <option value="GG">TAMANHO GG (XL)</option>
                <option value="UN">TAMANHO ÚNICO</option>
              </select>
            </div>
          </div>

          {loadingProducts ? (
            <div className="p-16 text-center text-xs font-black uppercase tracking-widest text-deep-black/60">
              CARREGANDO PRODUTOS PARTICIPANTES...
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="p-16 text-center bg-white border-2 border-dashed border-deep-black/20 space-y-3">
              <AlertCircle className="w-8 h-8 text-gold mx-auto" />
              <p className="text-sm font-black uppercase text-deep-black">
                NENHUMA PEÇA ENCONTRADA COM ESSES FILTROS
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedSizeFilter('ALL');
                }}
                className="px-4 py-2 bg-deep-black text-white hover:bg-gold hover:text-deep-black text-xs font-black uppercase tracking-wider transition"
              >
                LIMPAR FILTROS
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {displayedProducts.map((prod) => {
                const img =
                  prod.primary_image ||
                  prod.primaryImage ||
                  prod.variants?.[0]?.image ||
                  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80';
                const normalPrice = Number(prod.price) || 39.9;

                // Verifica se este produto já está em algum slot
                const isSelectedInAnySlot = selectedSlots.some((s) => s?.product?.id === prod.id);

                return (
                  <div
                    key={prod.id}
                    className="bg-white border-2 border-deep-black flex flex-col justify-between group shadow-sm hover:shadow-luxury transition relative"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                      <img
                        src={img}
                        alt={prod.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-2 left-2 bg-gold text-deep-black text-[9px] font-black uppercase px-2 py-0.5 border border-deep-black shadow-xs">
                        {promo?.badge_text || '3 POR $99'}
                      </span>
                      {isSelectedInAnySlot && (
                        <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 border border-emerald-800 shadow-xs flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>NO COMBO</span>
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-deep-black line-clamp-2">
                          {prod.title}
                        </h4>
                        <p className="text-[11px] text-deep-black/60 font-mono font-medium">
                          Preço avulso: ${normalPrice.toFixed(2)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenProductModal(prod)}
                        className="w-full py-2.5 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-[11px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ESCOLHER TAMANHO +</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal para Escolher Tamanho & Cor do Produto */}
      {activeProductForSlot && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-2 border-deep-black max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-deep-black/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-gold font-mono">
                  ADICIONAR AO SLOT #{(tempSlotIndex ?? 0) + 1}
                </span>
                <h3 className="text-sm font-black uppercase text-deep-black">
                  {activeProductForSlot.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveProductForSlot(null)}
                className="text-deep-black/60 hover:text-deep-black font-black text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Imagem e Detalhes */}
            <div className="flex gap-4 items-center">
              <img
                src={
                  activeProductForSlot.primary_image ||
                  activeProductForSlot.primaryImage ||
                  activeProductForSlot.variants?.[0]?.image ||
                  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80'
                }
                alt={activeProductForSlot.title}
                className="w-20 h-24 object-cover border border-deep-black/20"
              />
              <div className="space-y-1 text-xs uppercase">
                <p className="font-black text-deep-black">
                  {activeProductForSlot.title}
                </p>
                <p className="text-[11px] text-deep-black/60">
                  Preço individual: ${(Number(activeProductForSlot.price) || 39.9).toFixed(2)}
                </p>
                <span className="inline-block px-2 py-0.5 bg-gold/20 text-deep-black font-black text-[9px] border border-gold">
                  PARTICIPA DO COMBO 3 POR ${bundlePrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Seletor de Tamanho */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                ESCOLHA SEU TAMANHO:
              </label>
              <div className="flex flex-wrap gap-2">
                {['P', 'M', 'G', 'GG', 'UN'].map((sz) => {
                  const hasStock = (activeProductForSlot.variants || []).some(
                    (v: any) => v.size?.toUpperCase() === sz && (v.stock_quantity ?? v.stock ?? 1) > 0
                  );
                  const isSelected = tempSize.toUpperCase() === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setTempSize(sz)}
                      className={`px-4 py-2 text-xs font-black uppercase border transition cursor-pointer ${
                        isSelected
                          ? 'bg-deep-black text-gold border-deep-black shadow-sm'
                          : hasStock
                          ? 'bg-white text-deep-black border-deep-black/30 hover:border-deep-black'
                          : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}
                    >
                      {sz === 'P'
                        ? 'P (S)'
                        : sz === 'M'
                        ? 'M (M)'
                        : sz === 'G'
                        ? 'G (L)'
                        : sz === 'GG'
                        ? 'GG (XL)'
                        : 'ÚNICO (ONE SIZE)'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seletor de Cor se houver variantes com múltiplas cores */}
            {activeProductForSlot.variants && activeProductForSlot.variants.length > 1 && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                  ESCOLHA A COR:
                </label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(
                    new Set(activeProductForSlot.variants.map((v: any) => v.color).filter(Boolean))
                  ).map((col: any) => {
                    const isSelected = tempColor.toLowerCase() === col.toLowerCase();
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setTempColor(col)}
                        className={`px-3 py-1.5 text-xs font-bold uppercase border transition cursor-pointer ${
                          isSelected
                            ? 'bg-deep-black text-white border-deep-black'
                            : 'bg-white text-deep-black border-deep-black/30 hover:border-deep-black'
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botão de Confirmação */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveProductForSlot(null)}
                className="flex-1 py-3 border border-deep-black/30 text-deep-black text-xs font-black uppercase tracking-wider hover:bg-gray-100 transition cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleConfirmSlotSelection}
                className="flex-2 py-3 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-luxury cursor-pointer"
              >
                <Check className="w-4 h-4 text-gold" />
                <span>CONFIRMAR NESTE SLOT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
