export interface SaleFinancials {
  totalGross: number; // 1. Valor Total (Bruto)
  discount: number; // 2. Valor do Desconto
  afterDiscount: number; // 3. Valor Após Desconto (Faturado)
  costOfGoods: number; // 4. Valor do Preço de Custo (COGS)
  commission: number; // 5. Valor de Comissões
  fees: number; // 6. Valor de Taxas (Gateways / Stripe)
  netProfit: number; // 7. Valor Final (Lucro Líquido Real)
  shippingFee: number;
  shippingCost: number;
  profitMarginPct: number;
}

/**
 * Calcula de forma unificada e precisa os 7 valores financeiros oficiais de cada venda/pedido
 * solicitados pelo lojista:
 * 1. Valor Total (Bruto)
 * 2. Valor do Desconto
 * 3. Valor Após Desconto (Faturado)
 * 4. Valor do Preço de Custo (COGS)
 * 5. Valor de Comissões (Vendedoras)
 * 6. Valor de Taxas (Stripe / Gateways)
 * 7. Valor Final (Lucro Líquido Real)
 */
export function computeSaleFinancials(sale: any): SaleFinancials {
  if (!sale) {
    return {
      totalGross: 0,
      discount: 0,
      afterDiscount: 0,
      costOfGoods: 0,
      commission: 0,
      fees: 0,
      netProfit: 0,
      shippingFee: 0,
      shippingCost: 0,
      profitMarginPct: 0,
    };
  }

  const discount = Math.max(0, Number(sale.discount_amount) || 0);
  const shippingFee = Math.max(0, Number(sale.shipping_fee) || 0);
  const shippingCost = Math.max(0, Number(sale.shipping_cost) || 0);
  const rawCost = Number(sale.cost_of_goods);
  const commission = Math.max(0, Number(sale.commission_amount) || 0);
  const fees = Math.max(0, Number(sale.payment_fee) || 0);

  // Itens do pedido para cálculo de conferência
  const items = Array.isArray(sale.items) && sale.items.length > 0
    ? sale.items
    : (Array.isArray(sale.shipping_address?.items) ? sale.shipping_address.items : []);

  const itemsGrossSum = items.reduce((acc: number, it: any) => {
    const qty = Number(it.quantity) || 1;
    const price = Number(it.unit_price) || 0;
    return acc + (price * qty);
  }, 0);

  const itemsCostSum = items.reduce((acc: number, it: any) => {
    const qty = Number(it.quantity) || 1;
    const cost = Number(it.cost_price) || 0;
    return acc + (cost * qty);
  }, 0);

  const costOfGoods = !isNaN(rawCost) && rawCost > 0 ? rawCost : itemsCostSum;

  const rawSubtotal = Number(sale.subtotal_products) || Number(sale.total_amount) || 0;

  let totalGross = 0;
  let afterDiscount = 0;

  if (itemsGrossSum > 0 && discount > 0) {
    // Se temos a soma dos itens no preço de vitrine
    totalGross = Number((itemsGrossSum + shippingFee).toFixed(2));
    afterDiscount = Math.max(0, Number((totalGross - discount).toFixed(2)));
  } else if (rawSubtotal > 0) {
    if (discount > 0) {
      // Se subtotal já estiver com desconto deduzido
      if (Math.abs(rawSubtotal + shippingFee - (rawSubtotal)) > 0) {
        totalGross = Number((rawSubtotal + discount + shippingFee).toFixed(2));
        afterDiscount = Number((rawSubtotal + shippingFee).toFixed(2));
      } else {
        totalGross = Number((rawSubtotal + shippingFee).toFixed(2));
        afterDiscount = Math.max(0, Number((totalGross - discount).toFixed(2)));
      }
    } else {
      totalGross = Number((rawSubtotal + shippingFee).toFixed(2));
      afterDiscount = totalGross;
    }
  } else {
    totalGross = 0;
    afterDiscount = 0;
  }

  // Lucro líquido real (Valor Após Desconto - Custo - Comissões - Taxas - Frete Real)
  const calculatedNet = Number((afterDiscount - costOfGoods - commission - fees - shippingCost).toFixed(2));
  const netProfit = sale.net_profit !== undefined && sale.net_profit !== null && !isNaN(Number(sale.net_profit))
    ? Number(sale.net_profit)
    : calculatedNet;

  const profitMarginPct = afterDiscount > 0
    ? Number(((netProfit / afterDiscount) * 100).toFixed(1))
    : 0;

  return {
    totalGross: Number(totalGross.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    afterDiscount: Number(afterDiscount.toFixed(2)),
    costOfGoods: Number(costOfGoods.toFixed(2)),
    commission: Number(commission.toFixed(2)),
    fees: Number(fees.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    shippingFee: Number(shippingFee.toFixed(2)),
    shippingCost: Number(shippingCost.toFixed(2)),
    profitMarginPct,
  };
}
