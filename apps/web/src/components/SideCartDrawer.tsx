'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Sparkles,
  Check,
  ChevronLeft,
  Clock,
  Truck,
} from 'lucide-react';
import {
  CartItem,
  getCartItems,
  updateCartItemQuantity,
  removeCartItem,
  calculateComboDiscount,
  resolveVariantStockFromCatalog,
  reconcileCartStockWithCatalog,
  getCartRemainingMs,
  getOrCreateCartSessionId,
  getReservedQtyForCandidate,
} from '@/lib/cart';
import { useLanguage } from '@/context/LanguageContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import {
  translateProductTitle,
  translateColorName,
  translateBadgeText,
} from '@/lib/translateFitness';

function shouldShowSideCart(path: string): boolean {
  if (!path) return false;
  const clean = path.toLowerCase().split('?')[0].split('#')[0];

  if (
    clean.includes('/backoffice') ||
    clean.includes('/pos') ||
    clean.includes('/admin') ||
    clean.includes('/vendedora') ||
    clean.includes('/api') ||
    clean.startsWith('/checkout') ||
    clean === '/links' ||
    clean === '/bio'
  ) {
    return false;
  }

  return (
    clean === '/' ||
    clean.startsWith('/catalogo') ||
    clean.startsWith('/produto') ||
    clean.startsWith('/contato') ||
    clean.startsWith('/trocas-e-devolucoes') ||
    clean.startsWith('/politica-de-envio') ||
    clean.startsWith('/conta') ||
    clean.startsWith('/pedidos') ||
    clean.startsWith('/avaliar') ||
    clean.startsWith('/review')
  );
}

function formatSizeForLang(size: string, lang: 'en' | 'pt'): string {
  const up = String(size || '').toUpperCase().trim();
  if (lang === 'pt') {
    if (up === 'S') return 'P';
    if (up === 'L') return 'G';
    if (up === 'XL') return 'GG';
    if (up === 'ONE SIZE' || up === 'TAMANHO UNICO' || up === 'TAMANHO ÚNICO') return 'UN';
  }
  return size;
}

export function SideCartDrawer() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const { products: liveCatalogProducts } = useStoreSettings();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [comboPromo, setComboPromo] = useState<any>(null);
  const [justHighlighted, setJustHighlighted] = useState(false);
  const [stockNotice, setStockNotice] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [otherHoldsByKey, setOtherHoldsByKey] = useState<Record<string, number>>({});

  const refreshOtherHolds = useCallback(() => {
    const sid = getOrCreateCartSessionId();
    if (!sid) return;
    fetch(`/api/cart/reservations?session_id=${encodeURIComponent(sid)}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.byKey) setOtherHoldsByKey(data.byKey);
      })
      .catch(() => {});
  }, []);

  const syncCart = useCallback(() => {
    setItems(getCartItems());
    setRemainingMs(getCartRemainingMs());
  }, []);

  useEffect(() => {
    if (!mounted || !Array.isArray(liveCatalogProducts) || liveCatalogProducts.length === 0) return;
    const { items: reconciled, adjusted } = reconcileCartStockWithCatalog(liveCatalogProducts);
    setItems(reconciled);
    if (adjusted) {
      setStockNotice(
        lang === 'pt'
          ? 'Quantidade ajustada automaticamente para o máximo disponível em estoque.'
          : 'Quantity automatically adjusted to match available stock.'
      );
      setTimeout(() => setStockNotice(null), 5000);
    }
  }, [mounted, liveCatalogProducts, lang]);

  useEffect(() => {
    setMounted(true);
    syncCart();

    fetch('/api/backoffice/combo-promo', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.comboPromo) setComboPromo(data.comboPromo);
      })
      .catch(() => {});

    const handleUpdated = () => syncCart();
    const handleExpired = () => {
      syncCart();
      setStockNotice(
        lang === 'pt'
          ? '⏰ Seu carrinho ficou mais de 3 horas sem finalizar e foi esvaziado automaticamente para liberar as peças.'
          : '⏰ Your bag expired after 3 hours and was automatically emptied to release items.'
      );
      setTimeout(() => setStockNotice(null), 6500);
    };
    const handleFocus = () => {
      syncCart();
      refreshOtherHolds();
    };
    const handleAdded = (evt: any) => {
      syncCart();
      refreshOtherHolds();
      setIsOpen(true);
      const detail = evt?.detail;
      if (detail?.limitReached) {
        const cap = detail.maxStock ?? 1;
        setStockNotice(
          lang === 'pt'
            ? `Limite do estoque atingido (${cap} ${cap === 1 ? 'unidade disponível' : 'unidades disponíveis'}).`
            : `Stock limit reached (${cap} ${cap === 1 ? 'unit available' : 'units available'}).`
        );
        setTimeout(() => setStockNotice(null), 4000);
      } else {
        setJustHighlighted(true);
        setTimeout(() => setJustHighlighted(false), 1800);
      }
    };
    const handleOpen = () => {
      syncCart();
      refreshOtherHolds();
      setIsOpen(true);
    };
    const handleToggle = () => {
      syncCart();
      refreshOtherHolds();
      setIsOpen((prev) => !prev);
    };

    refreshOtherHolds();
    window.addEventListener('ana_cart_updated', handleUpdated);
    window.addEventListener('ana_cart_expired', handleExpired);
    window.addEventListener('storage', handleUpdated);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('ana_cart_item_added', handleAdded);
    window.addEventListener('ana_open_cart_drawer', handleOpen);
    window.addEventListener('ana_toggle_cart_drawer', handleToggle);

    return () => {
      window.removeEventListener('ana_cart_updated', handleUpdated);
      window.removeEventListener('ana_cart_expired', handleExpired);
      window.removeEventListener('storage', handleUpdated);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('ana_cart_item_added', handleAdded);
      window.removeEventListener('ana_open_cart_drawer', handleOpen);
      window.removeEventListener('ana_toggle_cart_drawer', handleToggle);
    };
  }, [syncCart, refreshOtherHolds, lang]);

  // Cronômetro em tempo real da validade de 3h do carrinho
  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      const current = getCartItems();
      setItems(current);
      setRemainingMs(current.length > 0 ? getCartRemainingMs() : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [mounted]);

  // Fecha no Esc para facilitar navegação no desktop
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');

  if (!mounted || !shouldShowSideCart(currentPath)) {
    return null;
  }

  const totalCount = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const subtotal = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const comboResult = calculateComboDiscount(items, comboPromo);
  const netSubtotal = Math.max(0, Number((subtotal - (comboResult.hasCombo ? comboResult.discount : 0)).toFixed(2)));
  const isFreeShipping = netSubtotal >= 100;
  const freeShippingRemaining = Math.max(0, Number((100 - netSubtotal).toFixed(2)));
  const freeShippingProgress = Math.min(100, Math.max(0, (netSubtotal / 100) * 100));

  return (
    <>
      {/* ABA LATERAL FIXA NA BORDA DIREITA DO SITE (sempre visível para abrir/ver tudo na sacola) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            syncCart();
            setIsOpen(true);
          }}
          aria-label={lang === 'pt' ? 'Abrir sacola lateral' : 'Open side shopping bag'}
          title={lang === 'pt' ? 'Ver tudo no carrinho' : 'View items in your bag'}
          className={`fixed right-0 top-[42%] -translate-y-1/2 z-40 flex items-center gap-2 pl-2.5 pr-2 py-3 bg-deep-black text-white border-y-2 border-l-2 border-gold shadow-2xl hover:bg-gold hover:text-deep-black transition-all cursor-pointer group ${
            totalCount > 0 ? 'opacity-100' : 'opacity-90'
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5 text-gold group-hover:text-deep-black shrink-0" />
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-gold group-hover:text-deep-black" />
              {totalCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-gold group-hover:bg-deep-black text-deep-black group-hover:text-gold text-[9px] font-black flex items-center justify-center shadow">
                  {totalCount}
                </span>
              )}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
              {lang === 'pt' ? 'CARRINHO' : 'MY BAG'}
            </span>
            {totalCount > 0 && (
              <span className="text-[9px] font-mono font-black text-gold group-hover:text-deep-black">
                ${netSubtotal.toFixed(0)}
              </span>
            )}
          </div>
        </button>
      )}

      {/* BACKDROP + PAINEL LATERAL DA SACOLA */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop clicável para fechar */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-deep-black/50 backdrop-blur-[2px] animate-fadeIn"
            aria-hidden="true"
          />

          {/* Gaveta Lateral */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={lang === 'pt' ? 'Sacola Lateral' : 'Side Shopping Bag'}
            className="relative z-10 w-full max-w-md bg-white border-l-4 border-deep-black h-full flex flex-col shadow-2xl animate-fadeIn"
          >
            {/* Cabeçalho */}
            <div className="bg-deep-black text-white px-5 py-4 flex items-center justify-between border-b-2 border-gold shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gold/20 border border-gold flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <span>{lang === 'pt' ? 'SEU CARRINHO' : 'YOUR BAG'}</span>
                    <span className="px-2 py-0.5 bg-gold text-deep-black text-[10px] font-black">
                      {totalCount} {totalCount === 1 ? (lang === 'pt' ? 'ITEM' : 'ITEM') : (lang === 'pt' ? 'ITENS' : 'ITEMS')}
                    </span>
                  </h2>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">
                    {justHighlighted
                      ? (lang === 'pt' ? '✓ Peça adicionada agora!' : '✓ Added just now!')
                      : (lang === 'pt' ? 'Revise tudo sem sair da página' : 'Review your bag while browsing')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/70 hover:text-gold hover:bg-white/10 transition cursor-pointer"
                aria-label={lang === 'pt' ? 'Fechar carrinho lateral' : 'Close side bag'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aviso de Limite de Estoque / Expiração */}
            {stockNotice && (
              <div className="px-5 py-2.5 text-[11px] font-black bg-amber-50 border-b border-amber-300 text-amber-950 shrink-0">
                {stockNotice}
              </div>
            )}

            {/* Cronômetro de 3 Horas (Esvazia Automaticamente) */}
            {items.length > 0 && remainingMs > 0 && (() => {
              const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
              const hrs = Math.floor(totalSec / 3600);
              const mins = Math.floor((totalSec % 3600) / 60);
              const secs = totalSec % 60;
              const formatted = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
              return (
                <div className="px-5 py-2 text-[10.5px] font-bold bg-deep-black/5 border-b border-deep-black/15 text-deep-black flex items-center justify-between gap-2 shrink-0">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span>
                      {lang === 'pt'
                        ? 'Sacola expira automaticamente após 3h sem concluir:'
                        : 'Bag automatically clears after 3h idle:'}
                    </span>
                  </span>
                  <span className="font-mono font-black px-2 py-0.5 bg-deep-black text-gold text-[10px]">
                    {formatted}
                  </span>
                </div>
              );
            })()}

            {/* Barra de Progresso de Frete Grátis ($100+) */}
            {items.length > 0 && (
              <div className="px-5 py-2.5 bg-neutral-100 border-b border-deep-black/10 space-y-1.5 shrink-0">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wide">
                  <span className="flex items-center gap-1.5 text-deep-black">
                    <Truck className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span>
                      {isFreeShipping
                        ? (lang === 'pt'
                            ? 'PARABÉNS! VOCÊ GANHOU FRETE GRÁTIS!'
                            : 'CONGRATULATIONS! YOU UNLOCKED FREE SHIPPING!')
                        : (lang === 'pt'
                            ? `Falta apenas $${freeShippingRemaining.toFixed(2)} para FRETE GRÁTIS!`
                            : `Add $${freeShippingRemaining.toFixed(2)} more for FREE SHIPPING!`)}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] font-black px-1.5 py-0.2 bg-deep-black text-gold">
                    {isFreeShipping ? '100%' : `${Math.min(99, Math.round(freeShippingProgress))}%`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 overflow-hidden rounded-full">
                  <div
                    className={`h-full transition-all duration-300 ${isFreeShipping ? 'bg-emerald-500' : 'bg-gold'}`}
                    style={{ width: `${Math.min(100, isFreeShipping ? 100 : Math.max(5, freeShippingProgress))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Banner de Promoção Combo (se ativa) */}
            {comboPromo?.active && items.length > 0 && (
              <div
                className={`px-5 py-2.5 text-[11px] font-bold border-b shrink-0 flex items-center gap-2 ${
                  comboResult.hasCombo
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                {comboResult.hasCombo ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                    <span>
                      {lang === 'pt'
                        ? `${translateBadgeText(comboPromo.title || 'Combo', lang)} elegível: economia de $${comboResult.discount.toFixed(2)} USD (válido para Zelle, Venmo, Cash App e Parcelamento no Cartão/Afterpay/Affirm)!`
                        : `${translateBadgeText(comboPromo.title || 'Combo', lang)} eligible: save $${comboResult.discount.toFixed(2)} USD (valid for Zelle, Venmo, Cash App & Installments)!`}
                    </span>
                  </>
                ) : comboResult.participatingCount > 0 ? (
                  <>
                    <Sparkles className="w-4 h-4 text-gold shrink-0" />
                    <span>
                      {lang === 'pt'
                        ? `Falta(m) ${comboResult.neededForNextCombo} peça(s) participante(s) para o ${translateBadgeText(comboPromo.badge_text || 'Combo', lang)} ($${Number(comboPromo.bundle_price || 99).toFixed(2)})!`
                        : `Add ${comboResult.neededForNextCombo} more combo item(s) to unlock ${translateBadgeText(comboPromo.badge_text || 'Combo', lang)} ($${Number(comboPromo.bundle_price || 99).toFixed(2)})!`}
                    </span>
                  </>
                ) : null}
              </div>
            )}

            {/* Lista Rolável dos Produtos na Sacola */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/70">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-3">
                  <div className="w-14 h-14 bg-white border-2 border-deep-black/15 flex items-center justify-center">
                    <ShoppingBag className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-deep-black">
                    {lang === 'pt' ? 'Seu carrinho está vazio' : 'Your bag is empty'}
                  </h3>
                  <p className="text-xs text-deep-black/60 max-w-xs leading-relaxed">
                    {lang === 'pt'
                      ? 'Escolha o tamanho direto nos conjuntos da tela inicial e clique em "ADICIONAR NO CARRINHO". Tudo o que você escolher aparecerá aqui.'
                      : 'Select a size directly on the homepage product cards and click "ADD TO CART". Everything you add stays visible right here.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 bg-deep-black text-white hover:bg-gold hover:text-deep-black text-[11px] font-black uppercase tracking-widest transition cursor-pointer"
                  >
                    {lang === 'pt' ? 'VER CONJUNTOS NA VITRINE' : 'BROWSE COLLECTION'}
                  </button>
                </div>
              ) : (
                items.map((item, idx) => {
                  const qty = Math.max(1, Number(item.quantity) || 1);
                  const liveCap = resolveVariantStockFromCatalog(liveCatalogProducts || [], item);
                  const rawCap = liveCap !== null ? liveCap : (typeof item.maxStock === 'number' ? item.maxStock : undefined);
                  const heldByOthers = getReservedQtyForCandidate(otherHoldsByKey, {
                    sku: item.sku,
                    slug: item.slug,
                    size: item.size,
                    color: item.color,
                  });
                  const maxAllowed = rawCap !== undefined ? Math.max(0, rawCap - heldByOthers) : undefined;
                  const isAtMaxStock = typeof maxAllowed === 'number' && qty >= maxAllowed;
                  const lineTotal = (Number(item.price) || 0) * qty;
                  return (
                    <div
                      key={`${item.sku || item.id}-${item.size}-${item.color}-${idx}`}
                      className="bg-white border-2 border-deep-black/15 hover:border-deep-black p-3 flex gap-3 shadow-xs transition"
                    >
                      <Link
                        href={item.slug ? `/produto/${item.slug}` : '/'}
                        onClick={() => setIsOpen(false)}
                        className="w-20 h-24 bg-neutral-100 border border-deep-black/15 shrink-0 overflow-hidden block"
                      >
                        <img
                          src={item.image || '/logo-ana-fitness.png'}
                          alt={translateProductTitle(item.title, lang)}
                          className="w-full h-full object-cover"
                        />
                      </Link>

                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={item.slug ? `/produto/${item.slug}` : '/'}
                              onClick={() => setIsOpen(false)}
                              className="text-xs font-black uppercase tracking-wider text-deep-black hover:text-gold transition line-clamp-2"
                            >
                              {translateProductTitle(item.title, lang)}
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                removeCartItem(idx);
                                syncCart();
                              }}
                              className="p-1 text-deep-black/40 hover:text-red-600 transition cursor-pointer shrink-0"
                              title={lang === 'pt' ? 'Remover do carrinho' : 'Remove item'}
                              aria-label={lang === 'pt' ? 'Remover item' : 'Remove item'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] font-bold uppercase">
                            <span className="px-1.5 py-0.5 bg-deep-black text-gold font-black">
                              {lang === 'pt' ? 'TAM' : 'SIZE'} {formatSizeForLang(item.size, lang)}
                            </span>
                            {item.color && (
                              <span className="px-1.5 py-0.5 bg-neutral-100 border border-deep-black/15 text-deep-black truncate max-w-[130px]">
                                {translateColorName(item.color, lang)}
                              </span>
                            )}
                          </div>

                          {item.sku && (
                            <span className="text-[9px] font-mono text-deep-black/45 block mt-1 truncate">
                              SKU: {item.sku}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-deep-black/10 gap-2">
                          <div className="space-y-1">
                            {/* Stepper Quantidade */}
                            <div className="inline-flex items-center border border-deep-black bg-white">
                              <button
                                type="button"
                                onClick={() => {
                                  updateCartItemQuantity(idx, qty - 1, maxAllowed);
                                  syncCart();
                                }}
                                className="w-7 h-7 flex items-center justify-center text-deep-black hover:bg-neutral-100 transition cursor-pointer"
                                aria-label={lang === 'pt' ? 'Diminuir quantidade' : 'Decrease quantity'}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center text-xs font-black font-mono text-deep-black">
                                {qty}
                              </span>
                              <button
                                type="button"
                                disabled={isAtMaxStock}
                                onClick={() => {
                                  if (isAtMaxStock) return;
                                  updateCartItemQuantity(idx, qty + 1, maxAllowed);
                                  syncCart();
                                }}
                                className={`w-7 h-7 flex items-center justify-center transition ${
                                  isAtMaxStock
                                    ? 'bg-neutral-100 text-deep-black/25 cursor-not-allowed'
                                    : 'text-deep-black hover:bg-neutral-100 cursor-pointer'
                                }`}
                                title={
                                  isAtMaxStock
                                    ? (lang === 'pt' ? `Máximo disponível: ${maxAllowed} un` : `Max available: ${maxAllowed}`)
                                    : (lang === 'pt' ? 'Aumentar quantidade' : 'Increase quantity')
                                }
                                aria-label={lang === 'pt' ? 'Aumentar quantidade' : 'Increase quantity'}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            {typeof maxAllowed === 'number' && (
                              <span
                                className={`block text-[9px] font-bold uppercase ${
                                  isAtMaxStock ? 'text-amber-700' : 'text-deep-black/45'
                                }`}
                              >
                                {isAtMaxStock
                                  ? (lang === 'pt'
                                      ? `Máx. no estoque (${maxAllowed} un)`
                                      : `Max stock (${maxAllowed} left)`)
                                  : (lang === 'pt' ? `${maxAllowed} em estoque` : `${maxAllowed} in stock`)}
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-black font-mono text-deep-black block">
                              ${lineTotal.toFixed(2)}
                            </span>
                            {qty > 1 && (
                              <span className="text-[9px] font-mono text-deep-black/50 block">
                                ${Number(item.price || 0).toFixed(2)} {lang === 'pt' ? 'cada' : 'each'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé do Carrinho Lateral */}
            {items.length > 0 && (
              <div className="p-4 sm:p-5 bg-white border-t-2 border-deep-black space-y-3 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-deep-black/70 font-bold uppercase">
                    <span>{lang === 'pt' ? 'Subtotal dos Produtos' : 'Products Subtotal'}</span>
                    <span className="font-mono font-black text-deep-black">${subtotal.toFixed(2)}</span>
                  </div>

                  {comboResult.hasCombo && comboResult.discount > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-emerald-700 font-black uppercase">
                        <span>{lang === 'pt' ? 'Combo Promocional' : 'Bundle Deal'}</span>
                        <span className="font-mono">-${comboResult.discount.toFixed(2)}</span>
                      </div>
                      <p className="text-[9px] text-emerald-800/80 font-bold uppercase text-right">
                        {lang === 'pt'
                          ? '✓ Válido para Zelle, Venmo, Cash App e Parcelamento'
                          : '✓ Valid for Zelle, Venmo, Cash App & Installments'}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] font-bold uppercase">
                    <span className="text-deep-black/60">
                      {lang === 'pt' ? 'Frete EUA (USPS Priority)' : 'US Shipping (USPS Priority)'}
                    </span>
                    <span className={`font-mono ${isFreeShipping ? 'text-emerald-700 font-black' : 'text-deep-black/60'}`}>
                      {isFreeShipping
                        ? (lang === 'pt' ? 'GRÁTIS ($100+)' : 'FREE ($100+)')
                        : `$9.90 ${lang === 'pt' ? 'no checkout' : 'at checkout'}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-deep-black/15 text-sm font-black uppercase">
                    <span className="text-deep-black">{lang === 'pt' ? 'Total das Peças' : 'Bag Total'}</span>
                    <span className="font-mono text-base text-gold bg-deep-black px-2 py-0.5">
                      ${netSubtotal.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <Link
                    href="/checkout"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3.5 px-4 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-lg border-2 border-deep-black"
                  >
                    <span>{lang === 'pt' ? 'FINALIZAR COMPRA' : 'PROCEED TO CHECKOUT'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 px-4 bg-white hover:bg-neutral-100 text-deep-black border border-deep-black/30 text-[10px] font-black uppercase tracking-widest transition cursor-pointer"
                  >
                    {lang === 'pt' ? '← CONTINUAR ADICIONANDO PEÇAS' : '← CONTINUE BROWSING'}
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
