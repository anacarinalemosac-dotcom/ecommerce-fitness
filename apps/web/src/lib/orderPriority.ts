export function isOrderPendingShipping(order: any): boolean {
  if (!order) return false;
  if (order.order_id?.startsWith('OUT-') || order.channel === 'WRITE_OFF') return false;
  const fSt = String(order.fulfillment_status || '').toUpperCase();
  const st = String(order.status || '').toUpperCase();
  if (st === 'CANCELLED' || order.payment_status === 'CANCELLED') return false;
  const isFulfilled = fSt === 'DELIVERED' || fSt === 'SHIPPED' || st === 'DELIVERED' || st === 'SHIPPED';
  return !isFulfilled;
}

export function isOnlineWebsiteSale(order: any): boolean {
  if (!order) return false;
  const ch = String(order.channel || '').toUpperCase();
  const detail = String(order.shipping_address?.channel_detail || '').toUpperCase();
  if (detail === 'POS_COUNTER' || ch === 'POS' || ch === 'POS_COUNTER') return false;
  return ch === 'ONLINE' || detail === 'ONLINE' || String(order.order_id || '').startsWith('ANA-');
}

/**
 * Keeps all orders pending shipment/delivery pinned FIRST (newest first),
 * followed by already shipped/delivered/completed orders (newest first).
 */
export function sortOrdersPendingFirst<T = any>(orders: T[]): T[] {
  if (!Array.isArray(orders)) return [];
  return [...orders].sort((a: any, b: any) => {
    const aPending = isOrderPendingShipping(a) ? 1 : 0;
    const bPending = isOrderPendingShipping(b) ? 1 : 0;
    if (aPending !== bPending) {
      return bPending - aPending; // Pending orders always come first
    }
    const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });
}

export function getOrderItemsList(order: any): any[] {
  if (!order) return [];
  if (Array.isArray(order.items) && order.items.length > 0) return order.items;
  if (Array.isArray(order.shipping_address?.items)) return order.shipping_address.items;
  return [];
}

export function formatOrderAddressText(order: any): string | null {
  const addr = order?.shipping_address;
  if (!addr) return null;
  if (typeof addr === 'string') return addr;
  const target = addr.address && typeof addr.address === 'object' ? addr.address : addr;
  if (target.delivery_method === 'PICKUP') {
    return 'RETIRADA SHOWROOM — 126 First St, Apt 01, Leominster, MA 01453';
  }
  if (target.address || target.street || target.city) {
    return [
      target.address || target.street,
      target.apt ? `Apt ${target.apt}` : '',
      target.city,
      target.state,
      target.zip,
    ]
      .filter(Boolean)
      .join(', ');
  }
  return null;
}
