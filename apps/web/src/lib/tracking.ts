'use client';

// Helper universal de disparo de eventos de rastreamento para Meta, Google, TikTok e Pinterest
export const trackEvent = {
  // Visualização de Página
  pageView: (url?: string) => {
    if (typeof window === 'undefined') return;
    try {
      if ((window as any).fbq) {
        (window as any).fbq('track', 'PageView');
      }
      if ((window as any).gtag) {
        (window as any).gtag('event', 'page_view', { page_path: url || window.location.pathname });
      }
      if ((window as any).ttq) {
        (window as any).ttq.page();
      }
      if ((window as any).pintrk) {
        (window as any).pintrk('page');
      }
    } catch (_) {}
  },

  // Visualização de Produto (ViewContent / view_item)
  viewItem: (product: { id: string; title: string; price: number; category?: string }) => {
    if (typeof window === 'undefined') return;
    try {
      // 1. Meta (Facebook & Instagram)
      if ((window as any).fbq) {
        (window as any).fbq('track', 'ViewContent', {
          content_ids: [product.id],
          content_name: product.title,
          content_type: 'product',
          content_category: product.category || 'Activewear',
          value: product.price,
          currency: 'USD',
        });
      }

      // 2. Google Analytics 4
      if ((window as any).gtag) {
        (window as any).gtag('event', 'view_item', {
          currency: 'USD',
          value: product.price,
          items: [
            {
              item_id: product.id,
              item_name: product.title,
              item_category: product.category || 'Activewear',
              price: product.price,
              quantity: 1,
            },
          ],
        });
      }

      // 3. TikTok
      if ((window as any).ttq) {
        (window as any).ttq.track('ViewContent', {
          content_id: product.id,
          content_name: product.title,
          content_type: 'product',
          price: product.price,
          currency: 'USD',
        });
      }

      // 4. Pinterest
      if ((window as any).pintrk) {
        (window as any).pintrk('track', 'PageVisit', {
          product_name: product.title,
          product_id: product.id,
          product_price: product.price,
          currency: 'USD',
        });
      }
    } catch (_) {}
  },

  // Adição à Sacola / Carrinho (AddToCart / add_to_cart)
  addToCart: (item: {
    id: string;
    title: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
  }) => {
    if (typeof window === 'undefined') return;
    try {
      const val = (item.price || 0) * (item.quantity || 1);

      // 1. Meta (Facebook & Instagram)
      if ((window as any).fbq) {
        (window as any).fbq('track', 'AddToCart', {
          content_ids: [item.id],
          content_name: item.title,
          content_type: 'product',
          value: val,
          currency: 'USD',
        });
      }

      // 2. Google Analytics 4
      if ((window as any).gtag) {
        (window as any).gtag('event', 'add_to_cart', {
          currency: 'USD',
          value: val,
          items: [
            {
              item_id: item.id,
              item_name: item.title,
              item_variant: `${item.color || ''} ${item.size || ''}`.trim(),
              price: item.price,
              quantity: item.quantity || 1,
            },
          ],
        });
      }

      // 3. TikTok
      if ((window as any).ttq) {
        (window as any).ttq.track('AddToCart', {
          content_id: item.id,
          content_name: item.title,
          content_type: 'product',
          quantity: item.quantity || 1,
          price: item.price,
          value: val,
          currency: 'USD',
        });
      }

      // 4. Pinterest
      if ((window as any).pintrk) {
        (window as any).pintrk('track', 'AddToCart', {
          value: val,
          order_quantity: item.quantity || 1,
          currency: 'USD',
          product_name: item.title,
          product_id: item.id,
        });
      }
    } catch (_) {}
  },

  // Início de Finalização de Compra (InitiateCheckout / begin_checkout)
  initiateCheckout: (
    arg1: any[] | { items?: any[]; value?: number; totalValue?: number; currency?: string },
    arg2?: number
  ) => {
    if (typeof window === 'undefined') return;
    try {
      let items: any[] = [];
      let totalValue = 0;

      if (Array.isArray(arg1)) {
        items = arg1;
        totalValue = arg2 || 0;
      } else if (arg1 && typeof arg1 === 'object') {
        items = arg1.items || [];
        totalValue = arg1.value ?? arg1.totalValue ?? arg2 ?? 0;
      }

      // 1. Meta
      if ((window as any).fbq) {
        (window as any).fbq('track', 'InitiateCheckout', {
          content_ids: items.map((i) => i.id || i.product_id || i.sku),
          num_items: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
          value: totalValue,
          currency: 'USD',
        });
      }

      // 2. Google Analytics 4
      if ((window as any).gtag) {
        (window as any).gtag('event', 'begin_checkout', {
          currency: 'USD',
          value: totalValue,
          items: items.map((i) => ({
            item_id: i.id || i.product_id || i.sku,
            item_name: i.title || i.name,
            price: i.price,
            quantity: i.quantity || 1,
          })),
        });
      }

      // 3. TikTok
      if ((window as any).ttq) {
        (window as any).ttq.track('InitiateCheckout', {
          value: totalValue,
          currency: 'USD',
        });
      }

      // 4. Pinterest
      if ((window as any).pintrk) {
        (window as any).pintrk('track', 'InitiateCheckout', {
          value: totalValue,
          currency: 'USD',
        });
      }
    } catch (_) {}
  },

  // Compra Concluída (Purchase / purchase)
  purchase: (order: {
    id?: string;
    orderId?: string;
    amount?: number;
    value?: number;
    currency?: string;
    items?: any[];
  }) => {
    if (typeof window === 'undefined') return;
    try {
      const orderId = order.orderId || order.id || 'ORDER';
      const orderAmount = order.value ?? order.amount ?? 0;
      const orderItems = order.items || [];

      // 1. Meta
      if ((window as any).fbq) {
        (window as any).fbq('track', 'Purchase', {
          content_ids: orderItems.map((i) => i.id || i.sku),
          content_type: 'product',
          value: orderAmount,
          currency: 'USD',
          order_id: orderId,
        });
      }

      // 2. Google Analytics 4
      if ((window as any).gtag) {
        (window as any).gtag('event', 'purchase', {
          transaction_id: orderId,
          value: orderAmount,
          currency: 'USD',
          items: orderItems.map((i) => ({
            item_id: i.id || i.sku,
            item_name: i.title || i.name,
            price: i.price || i.unit_price,
            quantity: i.quantity || 1,
          })),
        });
      }

      // 3. TikTok
      if ((window as any).ttq) {
        (window as any).ttq.track('CompletePayment', {
          content_id: orderId,
          value: orderAmount,
          currency: 'USD',
        });
      }

      // 4. Pinterest
      if ((window as any).pintrk) {
        (window as any).pintrk('track', 'Checkout', {
          value: orderAmount,
          order_quantity: orderItems.reduce((acc, i) => acc + (i.quantity || 1), 0),
          currency: 'USD',
        });
      }
    } catch (_) {}
  },
};
