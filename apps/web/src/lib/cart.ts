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
}

export function getCartItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
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
        return migrated;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar itens da sacola:', err);
  }
  return [];
}

export function saveCartItems(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('ana_cart_items', JSON.stringify(items));
    if (items.length > 0) {
      localStorage.setItem('ana_cart_item', JSON.stringify(items[0]));
      localStorage.setItem('ana_cart_item_backup', JSON.stringify(items[0]));
    } else {
      localStorage.removeItem('ana_cart_item');
      localStorage.removeItem('ana_cart_item_backup');
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
  if (!Array.isArray(products) || products.length === 0 || current.length === 0) {
    return { items: current, adjusted: false };
  }

  let changed = false;
  let adjusted = false;
  const reconciled: CartItem[] = [];

  for (const item of current) {
    const liveStock = resolveVariantStockFromCatalog(products, item);
    if (liveStock === null) {
      reconciled.push(item);
      continue;
    }

    if (liveStock <= 0 && !item.isBackorder) {
      changed = true;
      adjusted = true;
      continue;
    }

    const currentQty = Math.max(1, Number(item.quantity) || 1);
    const clampedQty = liveStock > 0 ? Math.min(currentQty, liveStock) : currentQty;
    if (clampedQty !== currentQty) {
      changed = true;
      adjusted = true;
    }
    if (item.maxStock !== liveStock) {
      changed = true;
    }

    reconciled.push({
      ...item,
      quantity: clampedQty,
      maxStock: liveStock,
    });
  }

  if (changed) {
    saveCartItems(reconciled);
  }
  return { items: reconciled, adjusted };
}

export function addToCart(
  newItem: CartItem
): { items: CartItem[]; totalCount: number; addedQuantity: number; limitReached: boolean; maxStock?: number } {
  const current = getCartItems();
  const existingIdx = current.findIndex((it) => isSameCartLine(it, newItem));

  const incomingMax =
    typeof newItem.maxStock === 'number' && !isNaN(newItem.maxStock)
      ? Math.max(0, Number(newItem.maxStock))
      : undefined;
  const existingMax =
    existingIdx >= 0 && typeof current[existingIdx].maxStock === 'number' && !isNaN(current[existingIdx].maxStock!)
      ? Math.max(0, Number(current[existingIdx].maxStock))
      : undefined;
  const effectiveMax = incomingMax !== undefined ? incomingMax : existingMax;

  if (effectiveMax !== undefined && effectiveMax <= 0) {
    const totalCount = current.reduce((sum, it) => sum + (it.quantity || 1), 0);
    return { items: current, totalCount, addedQuantity: 0, limitReached: true, maxStock: 0 };
  }

  let updated: CartItem[];
  let addedQuantity = 0;
  let limitReached = false;

  if (existingIdx >= 0) {
    updated = [...current];
    const existingQty = Math.max(1, Number(updated[existingIdx].quantity) || 1);
    const addReq = Math.max(1, Number(newItem.quantity) || 1);
    const desiredQty = existingQty + addReq;
    const finalQty = effectiveMax !== undefined ? Math.min(effectiveMax, desiredQty) : desiredQty;
    limitReached = effectiveMax !== undefined && desiredQty > effectiveMax;
    addedQuantity = Math.max(0, finalQty - existingQty);

    updated[existingIdx] = {
      ...updated[existingIdx],
      quantity: finalQty,
      maxStock: effectiveMax ?? updated[existingIdx].maxStock,
    };
  } else {
    const reqQty = Math.max(1, Number(newItem.quantity) || 1);
    const finalQty = effectiveMax !== undefined ? Math.min(effectiveMax, reqQty) : reqQty;
    limitReached = effectiveMax !== undefined && reqQty > effectiveMax;
    addedQuantity = finalQty;
    updated = [
      ...current,
      {
        ...newItem,
        quantity: finalQty,
        maxStock: effectiveMax,
      },
    ];
  }

  saveCartItems(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ana_cart_item_added', {
        detail: { item: newItem, addedQuantity, limitReached, maxStock: effectiveMax },
      })
    );
  }
  const totalCount = updated.reduce((sum, it) => sum + (it.quantity || 1), 0);
  return { items: updated, totalCount, addedQuantity, limitReached, maxStock: effectiveMax };
}

export function updateCartItemQuantity(
  index: number,
  quantity: number,
  explicitMaxStock?: number
): CartItem[] {
  const current = getCartItems();
  if (index < 0 || index >= current.length) return current;

  const targetItem = current[index];
  const cap =
    typeof explicitMaxStock === 'number' && !isNaN(explicitMaxStock)
      ? Math.max(0, Number(explicitMaxStock))
      : typeof targetItem.maxStock === 'number' && !isNaN(targetItem.maxStock)
      ? Math.max(0, Number(targetItem.maxStock))
      : undefined;

  let updated: CartItem[];
  if (quantity <= 0 || (cap !== undefined && cap <= 0)) {
    updated = current.filter((_, idx) => idx !== index);
  } else {
    const finalQty = cap !== undefined ? Math.min(cap, quantity) : quantity;
    updated = [...current];
    updated[index] = {
      ...updated[index],
      quantity: finalQty,
      maxStock: cap ?? updated[index].maxStock,
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
  window.dispatchEvent(new Event('ana_cart_updated'));
}

export function calculateComboDiscount(
  items: CartItem[],
  promo: any
): ComboDiscountResult {
  const defaultRes: ComboDiscountResult = {
    hasCombo: false,
    discount: 0,
    completedCombos: 0,
    participatingCount: 0,
    neededForNextCombo: promo?.required_quantity || 3,
    bundleTargetPrice: promo?.bundle_price || 99.0,
    promoTitle: promo?.title || 'Promoção Especial de Combo',
  };

  if (!promo || !promo.active || !items || items.length === 0) {
    return defaultRes;
  }

  const reqQty = Number(promo.required_quantity) || 3;
  const bundlePrice = Number(promo.bundle_price) || 99.0;
  const promoProductIds = new Set((promo.product_ids || []).map((id: string) => String(id).toLowerCase()));
  const promoProductSlugs = new Set((promo.product_slugs || []).map((s: string) => String(s).toLowerCase()));

  // Identifica quais itens e unidades participam da promoção
  const participatingUnitsList: { price: number; title: string; slug: string }[] = [];

  items.forEach((it) => {
    const isIdMatch = it.id && promoProductIds.has(String(it.id).toLowerCase());
    const isSlugMatch = it.slug && promoProductSlugs.has(String(it.slug).toLowerCase());
    const isExplicitCombo = it.is_combo_item === true;
    // Se o lojista cadastrou ids específicos, verifica correspondência; se não cadastrou nenhum id, considera itens que são sets/conjuntos
    const isFallbackMatch =
      promoProductIds.size === 0 &&
      promoProductSlugs.size === 0 &&
      (it.title?.toUpperCase().includes('SET') || it.title?.toUpperCase().includes('CONJUNTO'));

    if (isIdMatch || isSlugMatch || isExplicitCombo || isFallbackMatch) {
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
    };
  }

  // Ordena os itens participantes por preço decrescente para agrupar os combos
  participatingUnitsList.sort((a, b) => b.price - a.price);

  const unitsInCombos = completedCombos * reqQty;
  const comboUnits = participatingUnitsList.slice(0, unitsInCombos);
  const originalComboTotal = comboUnits.reduce((acc, u) => acc + u.price, 0);
  const targetComboTotal = completedCombos * bundlePrice;
  const discount = Math.max(0, originalComboTotal - targetComboTotal);

  return {
    hasCombo: true,
    discount: Number(discount.toFixed(2)),
    completedCombos,
    participatingCount,
    neededForNextCombo,
    bundleTargetPrice: targetComboTotal,
    promoTitle: promo.title,
  };
}
