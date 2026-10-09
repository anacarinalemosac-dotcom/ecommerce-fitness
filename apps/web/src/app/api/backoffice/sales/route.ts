import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { recordOrderEvent } from '@/lib/liveStore';
import fs from 'fs';
import path from 'path';

// Arquivo de persistência local para garantir histórico contínuo
const BACKUP_SALES_FILE = path.join(process.cwd(), 'sales_history_db.json');

export interface SaleItemPayload {
  title: string;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
}

export interface SaleRecord {
  id: string;
  order_id: string;
  created_at: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: {
    address: string;
    apt?: string;
    city: string;
    state: string;
    zip: string;
  };
  channel: 'ONLINE' | 'POS_COUNTER';
  seller_name: string;
  coupon_code?: string;
  payment_method: 'CARD' | 'ZELLE' | 'VENMO' | 'CASH' | 'APPLE_PAY';
  subtotal_products: number;
  shipping_fee: number; // Valor cobrado do cliente ($9.99 fixo online ou $0 balcão)
  shipping_cost: number; // Custo real da etiqueta USPS
  discount_amount: number;
  payment_fee: number; // Taxa descontada pelo gateway / meio de pagamento
  commission_amount: number; // Comissão da vendedora (ex: 10% no balcão)
  cost_of_goods: number; // Custo de confecção / aquisição das peças
  net_profit: number; // LUCRO LÍQUIDO REAL
  profit_margin_pct: number; // Margem líquida percentual
  items: SaleItemPayload[];
  status: 'COMPLETED' | 'PENDING' | 'IN_PRODUCTION';
}

// Vendas históricas iniciais realistas para demonstração e controle imediato da Ana Carina
const INITIAL_DEMO_SALES: SaleRecord[] = [
  {
    id: 'sale-001',
    order_id: 'ANA-928104',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    customer_name: 'Mariana Salles',
    customer_email: 'mariana.salles@gmail.com',
    customer_phone: '+1 (508) 492-8819',
    channel: 'ONLINE',
    seller_name: 'Camila (Embaixadora)',
    coupon_code: 'CAMILA10',
    payment_method: 'CARD',
    subtotal_products: 44.90,
    shipping_fee: 9.99,
    shipping_cost: 7.50,
    discount_amount: 4.49,
    payment_fee: 1.76, // 2.9% de $50.40 + $0.30
    commission_amount: 4.04, // 10% s/ produtos c/ desconto
    cost_of_goods: 15.00,
    net_profit: 22.10, // (40.41 + 9.99) - 15.00 - 1.76 - 7.50 - 4.04
    profit_margin_pct: 43.8,
    items: [
      {
        title: 'SAMANTA ROMPER',
        size: 'S',
        color: 'Preto Ônix',
        sku: 'SAM-BLK-S',
        quantity: 1,
        unit_price: 44.90,
        cost_price: 15.00,
      },
    ],
    status: 'COMPLETED',
  },
  {
    id: 'sale-002',
    order_id: 'POS-LEO-103',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    customer_name: 'Juliana Barbosa (Balcão)',
    customer_phone: '+1 (978) 400-3321',
    channel: 'POS_COUNTER',
    seller_name: 'Juliana Silva (PDV Balcão)',
    payment_method: 'ZELLE',
    subtotal_products: 69.80,
    shipping_fee: 0.00,
    shipping_cost: 0.00,
    discount_amount: 0.00,
    payment_fee: 0.00, // Zelle tem 0% de taxa
    commission_amount: 6.98, // 10% comissão da vendedora balcão
    cost_of_goods: 26.00,
    net_profit: 36.82, // 69.80 - 26.00 - 6.98
    profit_margin_pct: 52.7,
    items: [
      {
        title: 'BEST SELLER BAILARINA TOP',
        size: 'M',
        color: 'Champagne Gold',
        sku: 'BAI-GLD-M',
        quantity: 2,
        unit_price: 34.90,
        cost_price: 13.00,
      },
    ],
    status: 'COMPLETED',
  },
  {
    id: 'sale-003',
    order_id: 'POS-LEO-102',
    created_at: new Date(Date.now() - 3600000 * 22).toISOString(),
    customer_name: 'Fernanda Lima (Balcão)',
    customer_phone: '+1 (978) 514-9902',
    channel: 'POS_COUNTER',
    seller_name: 'Juliana Silva (PDV Balcão)',
    payment_method: 'VENMO',
    subtotal_products: 44.90,
    shipping_fee: 0.00,
    shipping_cost: 0.00,
    discount_amount: 0.00,
    payment_fee: 0.85, // 1.9% Venmo
    commission_amount: 4.49,
    cost_of_goods: 15.00,
    net_profit: 24.56,
    profit_margin_pct: 54.7,
    items: [
      {
        title: 'SAMANTA ROMPER',
        size: 'M',
        color: 'Pure White',
        sku: 'SAM-WHT-M',
        quantity: 1,
        unit_price: 44.90,
        cost_price: 15.00,
      },
    ],
    status: 'COMPLETED',
  },
  {
    id: 'sale-004',
    order_id: 'ANA-927552',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    customer_name: 'Beatriz Figueiredo',
    customer_email: 'beatriz.fig@miamifit.com',
    customer_phone: '+1 (305) 881-2299',
    channel: 'ONLINE',
    seller_name: 'Loja Oficial Online',
    payment_method: 'CARD',
    subtotal_products: 79.80,
    shipping_fee: 9.99,
    shipping_cost: 7.50,
    discount_amount: 0.00,
    payment_fee: 2.90, // 2.9% de $89.79 + $0.30
    commission_amount: 0.00,
    cost_of_goods: 31.00,
    net_profit: 48.39,
    profit_margin_pct: 53.9,
    items: [
      {
        title: 'KELY PANTS SET (PRE-ORDER)',
        size: 'S',
        color: 'Vinho Marsala',
        sku: 'KEL-VIN-S',
        quantity: 2,
        unit_price: 39.90,
        cost_price: 15.50,
      },
    ],
    status: 'IN_PRODUCTION',
  },
  {
    id: 'sale-005',
    order_id: 'POS-LEO-101',
    created_at: new Date(Date.now() - 3600000 * 50).toISOString(),
    customer_name: 'Camila Santos (Showroom)',
    customer_phone: '+1 (508) 772-1100',
    channel: 'POS_COUNTER',
    seller_name: 'Juliana Silva (PDV Balcão)',
    payment_method: 'CASH',
    subtotal_products: 34.90,
    shipping_fee: 0.00,
    shipping_cost: 0.00,
    discount_amount: 0.00,
    payment_fee: 0.00, // 0% dinheiro vivo
    commission_amount: 3.49,
    cost_of_goods: 13.00,
    net_profit: 18.41,
    profit_margin_pct: 52.8,
    items: [
      {
        title: 'BEST SELLER BAILARINA TOP',
        size: 'L',
        color: 'Preto Ônix',
        sku: 'BAI-BLK-L',
        quantity: 1,
        unit_price: 34.90,
        cost_price: 13.00,
      },
    ],
    status: 'COMPLETED',
  },
];

function readSavedSales(): SaleRecord[] {
  try {
    if (fs.existsSync(BACKUP_SALES_FILE)) {
      const raw = fs.readFileSync(BACKUP_SALES_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Erro ao ler sales_history_db.json:', e);
  }
  return INITIAL_DEMO_SALES;
}

function writeSavedSales(sales: SaleRecord[]) {
  try {
    fs.writeFileSync(BACKUP_SALES_FILE, JSON.stringify(sales, null, 2), 'utf8');
  } catch (e) {
    console.warn('Erro ao salvar sales_history_db.json:', e);
  }
}

// Calcula taxa estimada do gateway de pagamento nos EUA
function calculatePaymentFee(method: string, totalGross: number): number {
  const m = (method || '').toUpperCase();
  if (m === 'CARD' || m === 'CREDIT_CARD' || m === 'DEBIT_CARD' || m === 'APPLE_PAY') {
    return Number(((totalGross * 0.029) + 0.30).toFixed(2));
  }
  if (m === 'VENMO') {
    return Number((totalGross * 0.019).toFixed(2));
  }
  // ZELLE e CASH (dinheiro) têm taxa 0%
  return 0.00;
}

export async function GET(req: NextRequest) {
  try {
    let sales = readSavedSales();

    // Tenta enriquecer com pedidos vindos do Supabase 'orders' se houver
    try {
      const { data: dbOrders } = await supabaseServer
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (dbOrders && dbOrders.length > 0) {
        const transformedDbSales: SaleRecord[] = dbOrders.map((ord: any) => {
          const isOnline = ord.channel === 'ONLINE';
          const gross = Number(ord.total_amount) || Number(ord.subtotal_amount) || 0;
          const shippingFee = isOnline ? 9.99 : 0.00;
          const shippingCost = isOnline ? 7.50 : 0.00;
          const pMethod = ord.payment_method || 'CARD';
          const pFee = calculatePaymentFee(pMethod, gross + shippingFee);
          const comm = Number(ord.commission_amount) || (isOnline ? 0 : gross * 0.1);
          const cogs = (ord.order_items || []).reduce((acc: number, item: any) => {
            return acc + (Number(item.quantity || 1) * 15.00); // estimativa de custo base $15
          }, 0);

          const net = Number(((gross + shippingFee) - cogs - pFee - shippingCost - comm).toFixed(2));
          const margin = gross + shippingFee > 0 ? Number(((net / (gross + shippingFee)) * 100).toFixed(1)) : 0;

          return {
            id: ord.id,
            order_id: ord.order_number || `ANA-${ord.id.slice(0, 6).toUpperCase()}`,
            created_at: ord.created_at || new Date().toISOString(),
            customer_name: ord.customer_name || 'Cliente Showroom',
            customer_email: ord.customer_email || undefined,
            customer_phone: ord.customer_phone || undefined,
            channel: isOnline ? 'ONLINE' : 'POS_COUNTER',
            seller_name: ord.seller_name || (isOnline ? 'Loja Oficial Online' : 'Juliana Silva (PDV Balcão)'),
            coupon_code: ord.coupon_code || undefined,
            payment_method: pMethod,
            subtotal_products: gross,
            shipping_fee: shippingFee,
            shipping_cost: shippingCost,
            discount_amount: Number(ord.discount_amount) || 0,
            payment_fee: pFee,
            commission_amount: Number(comm.toFixed(2)),
            cost_of_goods: cogs,
            net_profit: net,
            profit_margin_pct: margin,
            items: (ord.order_items || []).map((it: any) => ({
              title: it.title || 'PEÇA FITNESS',
              size: it.size || 'M',
              color: it.color || 'Preto Ônix',
              sku: it.sku || 'ANA-ITEM',
              quantity: it.quantity || 1,
              unit_price: Number(it.unit_price) || 39.9,
              cost_price: 15.00,
            })),
            status: ord.status || 'COMPLETED',
          };
        });

        // Mescla sem duplicatas
        const orderIds = new Set(transformedDbSales.map((s) => s.order_id));
        sales = [...transformedDbSales, ...sales.filter((s) => !orderIds.has(s.order_id))];
      }
    } catch (e) {
      console.warn('Erro ao consultar Supabase orders:', e);
    }

    // Calcula consolidação e totais
    const totalGrossRevenue = sales.reduce((acc, s) => acc + s.subtotal_products + s.shipping_fee, 0);
    const totalProductsRevenue = sales.reduce((acc, s) => acc + s.subtotal_products, 0);
    const totalShippingCollected = sales.reduce((acc, s) => acc + s.shipping_fee, 0);
    const totalPaymentFees = sales.reduce((acc, s) => acc + s.payment_fee, 0);
    const totalCommissions = sales.reduce((acc, s) => acc + s.commission_amount, 0);
    const totalCostOfGoods = sales.reduce((acc, s) => acc + s.cost_of_goods, 0);
    const totalShippingCost = sales.reduce((acc, s) => acc + s.shipping_cost, 0);
    const totalNetProfit = sales.reduce((acc, s) => acc + s.net_profit, 0);
    const averageMarginPct = totalGrossRevenue > 0 ? (totalNetProfit / totalGrossRevenue) * 100 : 0;

    // Breakdown por Meio de Pagamento
    const paymentBreakdown: Record<string, { total: number; fees: number; net: number; count: number }> = {};
    sales.forEach((s) => {
      const m = s.payment_method || 'OUTRO';
      if (!paymentBreakdown[m]) {
        paymentBreakdown[m] = { total: 0, fees: 0, net: 0, count: 0 };
      }
      paymentBreakdown[m].total += (s.subtotal_products + s.shipping_fee);
      paymentBreakdown[m].fees += s.payment_fee;
      paymentBreakdown[m].net += (s.subtotal_products + s.shipping_fee - s.payment_fee);
      paymentBreakdown[m].count += 1;
    });

    // Breakdown por Canal
    const channelBreakdown = {
      ONLINE: { count: 0, revenue: 0, profit: 0 },
      POS_COUNTER: { count: 0, revenue: 0, profit: 0 },
    };
    sales.forEach((s) => {
      const ch = s.channel === 'ONLINE' ? 'ONLINE' : 'POS_COUNTER';
      channelBreakdown[ch].count += 1;
      channelBreakdown[ch].revenue += (s.subtotal_products + s.shipping_fee);
      channelBreakdown[ch].profit += s.net_profit;
    });

    return NextResponse.json({
      sales,
      summary: {
        totalGrossRevenue: Number(totalGrossRevenue.toFixed(2)),
        totalProductsRevenue: Number(totalProductsRevenue.toFixed(2)),
        totalShippingCollected: Number(totalShippingCollected.toFixed(2)),
        totalShippingCost: Number(totalShippingCost.toFixed(2)),
        totalPaymentFees: Number(totalPaymentFees.toFixed(2)),
        totalCommissions: Number(totalCommissions.toFixed(2)),
        totalCostOfGoods: Number(totalCostOfGoods.toFixed(2)),
        totalNetProfit: Number(totalNetProfit.toFixed(2)),
        averageMarginPct: Number(averageMarginPct.toFixed(1)),
        ordersCount: sales.length,
      },
      paymentBreakdown,
      channelBreakdown,
    });
  } catch (err: any) {
    console.error('Erro no GET de vendas:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      channel = 'ONLINE',
      customer_name = 'Cliente',
      customer_email,
      customer_phone,
      shipping_address,
      seller_name = 'Loja Oficial',
      coupon_code,
      payment_method = 'CARD',
      subtotal_products = 0,
      discount_amount = 0,
      shipping_fee = channel === 'ONLINE' ? 9.99 : 0.00,
      shipping_cost = channel === 'ONLINE' ? 7.50 : 0.00,
      items = [],
    } = body;

    const gross = Number(subtotal_products) || 0;
    const shipFee = Number(shipping_fee) || 0;
    const shipCost = Number(shipping_cost) || 0;
    const disc = Number(discount_amount) || 0;
    const grossTotal = gross - disc + shipFee;

    const pFee = calculatePaymentFee(payment_method, grossTotal);

    // Consulta vendedora para aplicar taxa personalizada e atualizar estatísticas
    const SELLERS_FILE = path.join(process.cwd(), 'sellers_db.json');
    let matchedSeller: any = null;
    let sellersList: any[] = [];
    try {
      if (fs.existsSync(SELLERS_FILE)) {
        sellersList = JSON.parse(fs.readFileSync(SELLERS_FILE, 'utf8'));
        if (Array.isArray(sellersList)) {
          if (coupon_code) {
            matchedSeller = sellersList.find((s: any) => s.coupon_code && s.coupon_code.toUpperCase() === coupon_code.toUpperCase());
          }
          if (!matchedSeller && seller_name && seller_name !== 'Loja Oficial Online') {
            matchedSeller = sellersList.find((s: any) => s.name && s.name.toLowerCase().includes(seller_name.toLowerCase().split(' ')[0]));
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao ler sellers_db:', e);
    }

    // Comissão: se houver vendedora cadastrada, usa commission_pct dela. Caso contrário balcão 10%
    const isPOS = channel === 'POS_COUNTER' || channel === 'POS';
    const hasCoupon = Boolean(coupon_code);
    let commRate = 0.00;
    if (matchedSeller) {
      commRate = (Number(matchedSeller.commission_pct) || 10) / 100;
    } else if (isPOS || hasCoupon) {
      commRate = 0.10;
    }
    const commissionAmount = Number(((gross - disc) * commRate).toFixed(2));

    // Soma do custo de confecção / aquisição
    const totalCostOfGoods = (items || []).reduce((acc: number, it: any) => {
      const c = Number(it.cost_price) || 15.00;
      const q = Number(it.quantity) || 1;
      return acc + (c * q);
    }, 0);

    // Cálculo exato do Lucro Líquido Real
    const netProfit = Number((grossTotal - totalCostOfGoods - pFee - shipCost - commissionAmount).toFixed(2));
    const marginPct = grossTotal > 0 ? Number(((netProfit / grossTotal) * 100).toFixed(1)) : 0;

    const finalSellerName = matchedSeller ? matchedSeller.name : (seller_name || (isPOS ? 'Juliana Silva (PDV Balcão)' : 'Loja Oficial Online'));

    const newSale: SaleRecord = {
      id: `sale-${Date.now()}`,
      order_id: order_id || `ANA-${Math.floor(100000 + Math.random() * 900000)}`,
      created_at: new Date().toISOString(),
      customer_name,
      customer_email,
      customer_phone,
      shipping_address: shipping_address || (channel === 'ONLINE' ? {
        address: '742 Commonwealth Ave',
        apt: '',
        city: 'Boston',
        state: 'MA',
        zip: '02215',
      } : undefined),
      channel: isPOS ? 'POS_COUNTER' : 'ONLINE',
      seller_name: finalSellerName,
      coupon_code,
      payment_method: payment_method.toUpperCase() as any,
      subtotal_products: gross,
      shipping_fee: shipFee,
      shipping_cost: shipCost,
      discount_amount: disc,
      payment_fee: pFee,
      commission_amount: commissionAmount,
      cost_of_goods: totalCostOfGoods,
      net_profit: netProfit,
      profit_margin_pct: marginPct,
      items: items.map((it: any) => ({
        title: it.title || 'Peça Fitness',
        size: it.size || 'M',
        color: it.color || 'Preto Ônix',
        sku: it.sku || 'ANA-ITEM',
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || 39.9,
        cost_price: Number(it.cost_price) || 15.0,
      })),
      status: 'COMPLETED',
    };

    // Atualiza acumulado da vendedora no sellers_db.json
    if (matchedSeller && sellersList.length > 0) {
      try {
        const updatedSellers = sellersList.map((s: any) => {
          if (s.id === matchedSeller.id) {
            return {
              ...s,
              total_sales_count: (s.total_sales_count || 0) + 1,
              total_revenue_generated: Number(((s.total_revenue_generated || 0) + (gross - disc)).toFixed(2)),
              total_commission_earned: Number(((s.total_commission_earned || 0) + commissionAmount).toFixed(2)),
            };
          }
          return s;
        });
        fs.writeFileSync(SELLERS_FILE, JSON.stringify(updatedSellers, null, 2), 'utf8');
      } catch (e) {
        console.warn('Erro ao atualizar stats da vendedora:', e);
      }
    }

    // 1. Salva no arquivo local persistente
    const saved = readSavedSales();
    const updated = [newSale, ...saved];
    writeSavedSales(updated);

    // 1.1 Dispara evento em tempo real para o radar Wix do Backoffice
    try {
      recordOrderEvent({
        orderId: newSale.order_id,
        customerName: newSale.customer_name,
        city: isPOS ? 'Leominster, MA (Loja Física)' : 'Online (EUA)',
        amount: newSale.subtotal_products + newSale.shipping_fee - newSale.discount_amount,
        itemsSummary: (newSale.items || []).map((i: any) => `${i.title} (${i.size})`).join(', '),
      });
    } catch (e) {
      console.warn('Erro ao disparar evento de live order:', e);
    }

    // 2. Tenta gravar no Supabase orders se disponível
    try {
      await supabaseServer.from('orders').insert([
        {
          channel: newSale.channel,
          customer_name: newSale.customer_name,
          customer_phone: newSale.customer_phone,
          customer_email: newSale.customer_email,
          coupon_code: newSale.coupon_code,
          seller_name: newSale.seller_name,
          subtotal_amount: newSale.subtotal_products,
          discount_amount: newSale.discount_amount,
          total_amount: newSale.subtotal_products + newSale.shipping_fee,
          commission_amount: newSale.commission_amount,
          payment_method: newSale.payment_method,
          status: 'COMPLETED',
        },
      ]);
    } catch (e) {
      console.warn('Gravação em Supabase orders opcional:', e);
    }

    return NextResponse.json({ success: true, sale: newSale });
  } catch (err: any) {
    console.error('Erro no POST de vendas:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
