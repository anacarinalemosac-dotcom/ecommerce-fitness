export interface CartItem {
  id?: string;
  title: string;
  slug?: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  quantity: number;
  maxStock?: number;
  image: string;
  isBackorder?: boolean;
  productionDays?: number;
  is_combo_item?: boolean;
}

export interface ComboDiscountResult {
  hasCombo: boolean;
  discount: number;
  completedCombos: number;
  participatingCount: number;
  neededForNextCombo: number;
  bundleTargetPrice: number;
  promoTitle: string;
  ineligibleByPaymentMethod?: boolean;
  rawPotentialDiscount?: number;
}

export const COMBO_ELIGIBLE_PAYMENT_METHODS = [
  'ZELLE',
  'VENMO',
  'CASHAPP',
  'CASH_APP',
  'CARD',
  'STRIPE',
  'AFTERPAY',
  'AFFIRM',
  'KLARNA',
  'CREDIARIO',
] as const;

export function isDirectCashPaymentMethod(paymentMethod?: string | null): boolean {
  if (!paymentMethod) return true;
  const m = paymentMethod.trim().toUpperCase().replace(/[-_]/g, '');
  return (
    m === 'ZELLE' ||
    m === 'VENMO' ||
    m === 'CASHAPP' ||
    m === 'CASH' ||
    m === 'PICKUP' ||
    m === 'RETIRADA' ||
    m === 'STORE'
  );
}

export function isGatewayPaymentMethod(paymentMethod?: string | null): boolean {
  if (!paymentMethod) return false;
  return !isDirectCashPaymentMethod(paymentMethod);
}

export function isComboEligiblePaymentMethod(_paymentMethod?: string | null): boolean {
  // Regra oficial: Promoção de combo aceita Zelle, Venmo, Cash App e também formas de pagamento parceladas (Cartão, Afterpay, Affirm, Klarna, Crediário)
  return true;
}

export const CART_EXPIRATION_MS = 3 * 60 * 60 * 1000; // 3 horas
const CART_EXPIRES_AT_KEY = 'ana_cart_expires_at';
const CART_SESSION_ID_KEY = 'ana_cart_session_id';

export function getOrCreateCartSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let existing = localStorage.getItem(CART_SESSION_ID_KEY);
    if (!existing) {
      existing = `cart-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(CART_SESSION_ID_KEY, existing);
    }
    return existing;
  } catch {
    return '';
  }
}

export function getCartExpiresAt(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CART_EXPIRES_AT_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return isNaN(n) || n <= 0 ? null : n;
  } catch {
    return null;
  }
}

export function getCartRemainingMs(): number {
  const exp = getCartExpiresAt();
  if (!exp) return 0;
  return Math.max(0, exp - Date.now());
}

function syncReservationsWithServer(items: CartItem[], expiresAt?: number | null): void {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return;
  try {
    const sessionId = getOrCreateCartSessionId();
    if (!sessionId) return;

    if (!items || items.length === 0) {
      fetch(`/api/cart/reservations?session_id=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
        keepalive: true,
      }).catch(() => {});
      return;
    }

    let visitorId = '';
    try {
      visitorId = sessionStorage.getItem('ana_vis_id') || '';
    } catch (_) {}

    let customerName = '';
    let customerPhone = '';
    try {
      const savedCheckout = localStorage.getItem('ana_checkout_draft');
      if (savedCheckout) {
        const parsed = JSON.parse(savedCheckout);
        customerName = parsed.name || parsed.customerName || '';
        customerPhone = parsed.phone || parsed.customerPhone || '';
      }
    } catch (_) {}

    fetch('/api/cart/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        session_id: sessionId,
        visitor_id: visitorId,
        customer_name: customerName,
        customer_phone: customerPhone,
        items: items.map((it) => ({
          id: it.id,
          title: it.title || 'Peça Fitness',
          slug: it.slug,
          size: it.size,
          color: it.color,
          sku: it.sku,
          price: Number(it.price) || 0,
          quantity: it.quantity || 1,
          image: it.image || '',
        })),
        expires_at: expiresAt || Date.now() + CART_EXPIRATION_MS,
      }),
    }).catch(() => {});
  } catch (_) {}
}

export function getReservedQtyForCandidate(
  holdsByKey: Record<string, number> | undefined | null,
  candidate: { sku?: string; slug?: string; size?: string; color?: string }
): number {
  if (!holdsByKey) return 0;
  const skuKey = candidate.sku ? `SKU:${String(candidate.sku).trim().toUpperCase()}` : '';
  if (skuKey && typeof holdsByKey[skuKey] === 'number') {
    return Math.max(0, holdsByKey[skuKey]);
  }
  const slug = String(candidate.slug || '').trim().toLowerCase();
  const size = String(candidate.size || '').trim().toUpperCase();
  const color = String(candidate.color || '').trim().toLowerCase();
  const sscKey = slug && size && color ? `SSC:${slug}::${size}::${color}` : '';
  if (sscKey && typeof holdsByKey[sscKey] === 'number') {
    return Math.max(0, holdsByKey[sscKey]);
  }
  const ssKey = slug && size ? `SS:${slug}::${size}` : '';
  if (ssKey && typeof holdsByKey[ssKey] === 'number') {
    return Math.max(0, holdsByKey[ssKey]);
  }
  return 0;
}

export function enforceCartExpiration(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const rawMulti = localStorage.getItem('ana_cart_items');
    const rawSingle = localStorage.getItem('ana_cart_item');
    const hasMulti = Boolean(rawMulti && rawMulti !== '[]');
    const hasSingle = Boolean(rawSingle);

    if (!hasMulti && !hasSingle) {
      localStorage.removeItem(CART_EXPIRES_AT_KEY);
      return false;
    }

    const expiresAt = getCartExpiresAt();
    const now = Date.now();
    if (expiresAt && now >= expiresAt) {
      localStorage.removeItem('ana_cart_items');
      localStorage.removeItem('ana_cart_item');
      localStorage.removeItem('ana_cart_item_backup');
      localStorage.removeItem(CART_EXPIRES_AT_KEY);
      syncReservationsWithServer([], null);
      window.dispatchEvent(new Event('ana_cart_updated'));
      window.dispatchEvent(new Event('ana_cart_expired'));
      return true;
    }

    // Se o carrinho já existia antes da regra de 3h, inicia a contagem de 3h a partir de agora
    if (!expiresAt) {
      localStorage.setItem(CART_EXPIRES_AT_KEY, String(now + CART_EXPIRATION_MS));
    }
  } catch (_) {}
  return false;
}

export function getCartItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    if (enforceCartExpiration()) {
      return [];
    }

    const rawMulti = localStorage.getItem('ana_cart_items');
    if (rawMulti) {
      const parsed = JSON.parse(rawMulti);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Migração transparente do item único legado
    const rawSingle = localStorage.getItem('ana_cart_item');
    if (rawSingle) {
      const single = JSON.parse(rawSingle);
      if (single && typeof single === 'object') {
        const migrated = [single];
        localStorage.setItem('ana_cart_items', JSON.stringify(migrated));
        if (!getCartExpiresAt()) {
          localStorage.setItem(CART_EXPIRES_AT_KEY, String(Date.now() + CART_EXPIRATION_MS));
        }
        return migrated;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar itens da sacola:', err);
  }
  return [];
}

export function saveCartItems(
  items: CartItem[],
  options?: { preserveExpiry?: boolean; skipServerSync?: boolean }
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('ana_cart_items', JSON.stringify(items));
    let nextExpiresAt: number | null = null;
    if (items.length > 0) {
      localStorage.setItem('ana_cart_item', JSON.stringify(items[0]));
      localStorage.setItem('ana_cart_item_backup', JSON.stringify(items[0]));
      const existingExp = getCartExpiresAt();
      if (options?.preserveExpiry && existingExp && existingExp > Date.now()) {
        nextExpiresAt = existingExp;
      } else {
        nextExpiresAt = Date.now() + CART_EXPIRATION_MS;
        localStorage.setItem(CART_EXPIRES_AT_KEY, String(nextExpiresAt));
      }
    } else {
      localStorage.removeItem('ana_cart_item');
      localStorage.removeItem('ana_cart_item_backup');
      localStorage.removeItem(CART_EXPIRES_AT_KEY);
    }

    if (!options?.skipServerSync) {
      syncReservationsWithServer(items, nextExpiresAt);
    }
    window.dispatchEvent(new Event('ana_cart_updated'));
  } catch (err) {
    console.warn('Erro ao salvar sacola:', err);
  }
}

export function isSameCartLine(a: Partial<CartItem>, b: Partial<CartItem>): boolean {
  const slugMatch =
    Boolean(a.slug && b.slug && String(a.slug).toLowerCase() === String(b.slug).toLowerCase()) ||
    Boolean(a.id && b.id && String(a.id).toLowerCase() === String(b.id).toLowerCase());
  const sizeA = String(a.size || '').trim().toUpperCase();
  const sizeB = String(b.size || '').trim().toUpperCase();
  const colorA = String(a.color || '').trim().toLowerCase();
  const colorB = String(b.color || '').trim().toLowerCase();

  if (a.sku && b.sku && String(a.sku).trim().toUpperCase() === String(b.sku).trim().toUpperCase()) {
    if (!a.slug || !b.slug || slugMatch) return true;
  }

  return slugMatch && sizeA === sizeB && colorA === colorB;
}

export function getCartItemQty(items: CartItem[], candidate: Partial<CartItem>): number {
  return items
    .filter((it) => isSameCartLine(it, candidate))
    .reduce((sum, it) => sum + Math.max(0, Number(it.quantity) || 1), 0);
}

export function resolveVariantStockFromCatalog(products: any[], item: Partial<CartItem>): number | null {
  if (!Array.isArray(products) || products.length === 0) return null;

  const targetId = String(item.id || '').toLowerCase().trim();
  const targetSlug = String(item.slug || '').toLowerCase().trim();
  const prod = products.find(
    (p: any) =>
      (targetId && String(p.id || '').toLowerCase() === targetId) ||
      (targetSlug && String(p.slug || '').toLowerCase() === targetSlug)
  );
  if (!prod) return null;

  const vars: any[] = Array.isArray(prod.variants) ? prod.variants : [];
  if (vars.length > 0) {
    const skuNorm = String(item.sku || '').toUpperCase().trim();
    const sizeNorm = String(item.size || '').toUpperCase().trim();
    const colorNorm = String(item.color || '').toLowerCase().trim();

    const exactSku = skuNorm
      ? vars.find((v: any) => String(v.sku || '').toUpperCase().trim() === skuNorm)
      : null;
    if (exactSku) {
      return Math.max(0, Number(exactSku.stock_quantity ?? exactSku.stock ?? 0));
    }

    const byColorAndSize = vars.find(
      (v: any) =>
        String(v.size || '').toUpperCase().trim() === sizeNorm &&
        (!colorNorm || colorNorm === 'padrão' || colorNorm === 'padrao' || String(v.color || '').toLowerCase().trim() === colorNorm)
    );
    if (byColorAndSize) {
      return Math.max(0, Number(byColorAndSize.stock_quantity ?? byColorAndSize.stock ?? 0));
    }

    const bySizeOnly = vars.find((v: any) => String(v.size || '').toUpperCase().trim() === sizeNorm);
    if (bySizeOnly) {
      return Math.max(0, Number(bySizeOnly.stock_quantity ?? bySizeOnly.stock ?? 0));
    }
  }

  return Math.max(0, Number(prod.stock ?? prod.stock_quantity ?? 0));
}

export function reconcileCartStockWithCatalog(products: any[]): { items: CartItem[]; adjusted: boolean } {
  const current = getCartItems();
  // Sem limite de peças no carrinho: o cliente pode comprar quantas peças desejar sem restrição de estoque.
  return { items: current, adjusted: false };
}

export function addToCart(
  newItem: CartItem
): { items: CartItem[]; totalCount: number; addedQuantity: number; limitReached: boolean; maxStock?: number } {
  const current = getCartItems();
  const existingIdx = current.findIndex((it) => isSameCartLine(it, newItem));

  let updated: CartItem[];
  let addedQuantity = 0;
  const limitReached = false;

  const reqQty = Math.max(1, Number(newItem.quantity) || 1);

  if (existingIdx >= 0) {
    updated = [...current];
    const existingQty = Math.max(1, Number(updated[existingIdx].quantity) || 1);
    const finalQty = existingQty + reqQty;
    addedQuantity = reqQty;

    updated[existingIdx] = {
      ...updated[existingIdx],
      quantity: finalQty,
    };
  } else {
    addedQuantity = reqQty;
    updated = [
      ...current,
      {
        ...newItem,
        quantity: reqQty,
      },
    ];
  }

  saveCartItems(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ana_cart_item_added', {
        detail: { item: newItem, addedQuantity, limitReached: false },
      })
    );
  }
  const totalCount = updated.reduce((sum, it) => sum + (it.quantity || 1), 0);
  return { items: updated, totalCount, addedQuantity, limitReached: false };
}

export function updateCartItemQuantity(
  index: number,
  quantity: number,
  _explicitMaxStock?: number
): CartItem[] {
  const current = getCartItems();
  if (index < 0 || index >= current.length) return current;

  let updated: CartItem[];
  if (quantity <= 0) {
    updated = current.filter((_, idx) => idx !== index);
  } else {
    updated = [...current];
    updated[index] = {
      ...updated[index],
      quantity,
    };
  }

  saveCartItems(updated);
  return updated;
}

export function removeCartItem(index: number): CartItem[] {
  return updateCartItemQuantity(index, 0);
}

export function clearCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ana_cart_items');
  localStorage.removeItem('ana_cart_item');
  localStorage.removeItem('ana_cart_item_backup');
  localStorage.removeItem(CART_EXPIRES_AT_KEY);
  syncReservationsWithServer([], null);
  window.dispatchEvent(new Event('ana_cart_updated'));
}

export function calculateComboDiscount(
  items: CartItem[],
  promo: any,
  paymentMethod?: string | null
): ComboDiscountResult {
  const defaultBundlePrice = Number(promo?.bundle_price || 110.0);

  const defaultRes: ComboDiscountResult = {
    hasCombo: false,
    discount: 0,
    completedCombos: 0,
    participatingCount: 0,
    neededForNextCombo: promo?.required_quantity || 3,
    bundleTargetPrice: defaultBundlePrice,
    promoTitle: promo?.title || 'Combo Especial: 3 Conjuntos por $110',
    ineligibleByPaymentMethod: false,
    rawPotentialDiscount: 0,
  };

  if (!promo || !promo.active || !items || items.length === 0) {
    return defaultRes;
  }

  const reqQty = Number(promo.required_quantity) || 3;
  const bundlePrice = Number(promo.bundle_price || 110.0);
  const promoProductIds = new Set((promo.product_ids || []).map((id: string) => String(id).toLowerCase()));
  const promoProductSlugs = new Set((promo.product_slugs || []).map((s: string) => String(s).toLowerCase()));

  // Identifica quais itens e unidades participam da promoção
  const participatingUnitsList: { price: number; title: string; slug: string }[] = [];

  items.forEach((it) => {
    // Verificação estrita: nunca inclui produto se o lojista desativou explicitamente
    const isExplicitOptOut = it.is_combo_item === false || (it as any).meta?.is_combo_item === false;
    if (isExplicitOptOut) return;

    const isIdMatch = it.id && promoProductIds.has(String(it.id).toLowerCase());
    const isSlugMatch = it.slug && promoProductSlugs.has(String(it.slug).toLowerCase());
    const isExplicitCombo = it.is_combo_item === true || (it as any).meta?.is_combo_item === true;

    // Apenas produtos explicitamente configurados na promoção pelo lojista participam
    if (isIdMatch || isSlugMatch || isExplicitCombo) {
      const q = Math.max(1, Number(it.quantity) || 1);
      for (let i = 0; i < q; i++) {
        participatingUnitsList.push({
          price: Number(it.price) || 0,
          title: it.title,
          slug: it.slug,
        });
      }
    }
  });

  const participatingCount = participatingUnitsList.length;
  const completedCombos = Math.floor(participatingCount / reqQty);
  const remainder = participatingCount % reqQty;
  const neededForNextCombo = remainder === 0 ? reqQty : reqQty - remainder;

  // Se não atingiu a quantidade necessária (ex: tem apenas 1 ou 2), NÃO dá desconto (preço normal)
  if (completedCombos === 0) {
    return {
      hasCombo: false,
      discount: 0,
      completedCombos: 0,
      participatingCount,
      neededForNextCombo,
      bundleTargetPrice: bundlePrice,
      promoTitle: promo.title,
      ineligibleByPaymentMethod: Boolean(paymentMethod) && !isComboEligiblePaymentMethod(paymentMethod),
      rawPotentialDiscount: 0,
    };
  }

  // Ordena os itens participantes por preço decrescente para agrupar os combos
  participatingUnitsList.sort((a, b) => b.price - a.price);

  const unitsInCombos = completedCombos * reqQty;
  const comboUnits = participatingUnitsList.slice(0, unitsInCombos);
  const originalComboTotal = comboUnits.reduce((acc, u) => acc + u.price, 0);
  const targetComboTotal = completedCombos * bundlePrice;
  const rawDiscount = Math.max(0, Number((originalComboTotal - targetComboTotal).toFixed(2)));

  // Regra oficial da loja: Promoção de Combo é aceita em Zelle, Venmo, Cash App e formas parceladas (Cartão, Afterpay, Affirm, Klarna).
  if (paymentMethod && !isComboEligiblePaymentMethod(paymentMethod)) {
    return {
      hasCombo: false,
      discount: 0,
      completedCombos,
      participatingCount,
      neededForNextCombo,
      bundleTargetPrice: originalComboTotal,
      promoTitle: promo.title,
      ineligibleByPaymentMethod: true,
      rawPotentialDiscount: rawDiscount,
    };
  }

  return {
    hasCombo: rawDiscount > 0,
    discount: rawDiscount,
    completedCombos,
    participatingCount,
    neededForNextCombo,
    bundleTargetPrice: targetComboTotal,
    promoTitle: promo.title,
    ineligibleByPaymentMethod: false,
    rawPotentialDiscount: rawDiscount,
  };
}
