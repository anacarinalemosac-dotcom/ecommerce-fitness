export interface CartItem {
  id?: string;
  title: string;
  slug?: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  quantity: number;
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

export function addToCart(newItem: CartItem): { items: CartItem[]; totalCount: number } {
  const current = getCartItems();
  const existingIdx = current.findIndex(
    (it) =>
      it.slug === newItem.slug &&
      it.size?.toUpperCase() === newItem.size?.toUpperCase() &&
      it.color?.toLowerCase() === newItem.color?.toLowerCase()
  );

  let updated: CartItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = {
      ...updated[existingIdx],
      quantity: (updated[existingIdx].quantity || 1) + (newItem.quantity || 1),
    };
  } else {
    updated = [...current, { ...newItem, quantity: newItem.quantity || 1 }];
  }

  saveCartItems(updated);
  const totalCount = updated.reduce((sum, it) => sum + (it.quantity || 1), 0);
  return { items: updated, totalCount };
}

export function updateCartItemQuantity(index: number, quantity: number): CartItem[] {
  const current = getCartItems();
  if (index < 0 || index >= current.length) return current;

  let updated: CartItem[];
  if (quantity <= 0) {
    updated = current.filter((_, idx) => idx !== index);
  } else {
    updated = [...current];
    updated[index] = { ...updated[index], quantity };
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
