import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { recordOrderEvent } from '@/lib/liveStore';
import { sendOrderConfirmationEmail, sendShippingNotificationEmail } from '@/lib/emailService';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Arquivo de persistência local para garantir histórico contínuo
function getBackupSalesFilePath(): string {
  const primary = path.join(process.cwd(), 'sales_history_db.json');
  return primary;
}

export interface CrediarioInstallment {
  number: number;
  amount: number;
  due_date: string;
  status: 'PENDING' | 'PAID';
  paid_at?: string;
  payment_method?: string;
}

export interface CrediarioInfo {
  customer_doc?: string;
  customer_address?: string;
  notes?: string;
  down_payment?: number;
  down_payment_method?: string;
  remaining_balance?: number;
  installments_count: number;
  installments: CrediarioInstallment[];
}

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
  payment_method: 'CARD' | 'ZELLE' | 'VENMO' | 'CASH' | 'APPLE_PAY' | 'CREDIARIO';
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
  status: 'COMPLETED' | 'PENDING' | 'IN_PRODUCTION' | 'WAITING_PAYMENT' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'AWAITING_SEPARATION';
  // Separação oficial: Status de Entrega (Logística) vs Status de Pagamento (Financeiro)
  fulfillment_status?: 'AWAITING_SEPARATION' | 'IN_PRODUCTION' | 'SHIPPED' | 'DELIVERED';
  payment_status?: 'WAITING_PAYMENT' | 'PARTIAL' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  crediario?: CrediarioInfo;
  tracking_code?: string;
  shipped_at?: string;
  confirmation_email_sent?: boolean;
  shipping_email_sent?: boolean;
}

function readSavedSales(): SaleRecord[] {
  try {
    const filePath = getBackupSalesFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Erro ao ler sales_history_db.json:', e);
  }
  return [];
}

function writeSavedSales(sales: SaleRecord[]) {
  try {
    const filePath = getBackupSalesFilePath();
    fs.writeFileSync(filePath, JSON.stringify(sales, null, 2), 'utf8');
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
  // ZELLE, CASH e CREDIARIO têm taxa 0%
  return 0.00;
}

export async function GET(req: NextRequest) {
  try {
    let sales: SaleRecord[] = readSavedSales();

    // 1. Busca todos os pedidos persistidos no Supabase 'orders'
    try {
      const { data: dbOrders, error: dbError } = await supabaseServer
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        console.warn('Aviso Supabase orders query:', dbError);
      }

      if (dbOrders && dbOrders.length > 0) {
        const transformedDbSales: SaleRecord[] = dbOrders.map((ord: any) => {
          const meta = (typeof ord.shipping_address === 'object' && ord.shipping_address !== null)
            ? ord.shipping_address
            : {};

          const isOnline = ord.channel === 'ONLINE' && meta.channel_detail !== 'POS_COUNTER';
          const gross = Number(ord.subtotal_amount) || Number(ord.total_amount) || 0;
          const disc = Number(ord.discount_amount) || Number(meta.discount_amount) || 0;
          const shipFee = meta.shipping_fee !== undefined
            ? Number(meta.shipping_fee)
            : (isOnline ? 9.99 : 0.00);
          const shipCost = meta.shipping_cost !== undefined
            ? Number(meta.shipping_cost)
            : (isOnline ? 7.50 : 0.00);

          const pMethod = (ord.payment_method || meta.payment_method || 'CARD').toUpperCase() as any;
          const grossTotal = Math.max(0, gross - disc + shipFee);
          const pFee = meta.payment_fee !== undefined
            ? Number(meta.payment_fee)
            : calculatePaymentFee(pMethod, grossTotal);

          const rawComm = ord.commission_amount !== undefined && ord.commission_amount !== null
            ? Number(ord.commission_amount)
            : (meta.commission_amount !== undefined && meta.commission_amount !== null ? Number(meta.commission_amount) : null);
          const comm = rawComm !== null ? rawComm : 0;

          // Itens desempacotados do JSONB ou fallback
          const rawItems = Array.isArray(meta.items) && meta.items.length > 0
            ? meta.items
            : (Array.isArray(ord.order_items) ? ord.order_items : []);

          const items: SaleItemPayload[] = rawItems.map((it: any) => ({
            title: it.title || 'Peça Fitness',
            size: it.size || 'M',
            color: it.color || 'Preto Ônix',
            sku: it.sku || 'ANA-ITEM',
            quantity: Number(it.quantity) || 1,
            unit_price: Number(it.unit_price) || 39.9,
            cost_price: Number(it.cost_price) || 15.00,
          }));

          const cogs = meta.cost_of_goods !== undefined
            ? Number(meta.cost_of_goods)
            : items.reduce((acc: number, it: any) => acc + (Number(it.cost_price || 15) * Number(it.quantity || 1)), 0);

          const net = meta.net_profit !== undefined
            ? Number(meta.net_profit)
            : Number((grossTotal - cogs - pFee - shipCost - comm).toFixed(2));

          const margin = meta.profit_margin_pct !== undefined
            ? Number(meta.profit_margin_pct)
            : (grossTotal > 0 ? Number(((net / grossTotal) * 100).toFixed(1)) : 0);

          const orderNumber = meta.order_number || ord.order_number || `ANA-${ord.id.slice(0, 8).toUpperCase()}`;
          const rawSeller = meta.seller_name || ord.seller_name || '';
          const sellerName = rawSeller.includes('Juliana Silva')
            ? 'Ana Karina'
            : (rawSeller || (isOnline ? 'Loja Oficial Online' : 'Ana Karina'));

          return {
            id: ord.id,
            order_id: orderNumber,
            created_at: ord.created_at || new Date().toISOString(),
            customer_name: ord.customer_name || 'Cliente Showroom',
            customer_email: ord.customer_email || meta.customer_email || undefined,
            customer_phone: ord.customer_phone || meta.customer_phone || undefined,
            channel: isOnline ? 'ONLINE' : 'POS_COUNTER',
            seller_name: sellerName,
            coupon_code: ord.coupon_code || meta.coupon_code || undefined,
            payment_method: pMethod,
            subtotal_products: gross,
            shipping_fee: shipFee,
            shipping_cost: shipCost,
            discount_amount: disc,
            payment_fee: pFee,
            commission_amount: Number(comm.toFixed(2)),
            cost_of_goods: cogs,
            net_profit: net,
            profit_margin_pct: margin,
            items,
            status: ord.status || 'COMPLETED',
            fulfillment_status: meta.fulfillment_status || (
              ord.status === 'DELIVERED' || ord.status === 'SHIPPED' || ord.status === 'IN_PRODUCTION' || ord.status === 'AWAITING_SEPARATION'
                ? ord.status
                : (isOnline ? 'AWAITING_SEPARATION' : 'DELIVERED')
            ),
            payment_status: meta.payment_status || (
              ord.status === 'CANCELLED'
                ? 'CANCELLED'
                : (pMethod === 'CREDIARIO' || meta.crediario)
                  ? (
                      Array.isArray(meta.crediario?.installments) && meta.crediario.installments.every((i: any) => i.status === 'PAID')
                        ? 'PAID'
                        : (Array.isArray(meta.crediario?.installments) && meta.crediario.installments.some((i: any) => i.status === 'PAID')) || Number(meta.crediario?.down_payment || 0) > 0
                          ? 'PARTIAL'
                          : 'WAITING_PAYMENT'
                    )
                  : (ord.status === 'WAITING_PAYMENT' ? 'WAITING_PAYMENT' : 'PAID')
            ),
            shipping_address: meta.address && typeof meta.address === 'object' ? meta.address : undefined,
            crediario: meta.crediario || undefined,
            tracking_code: meta.tracking_code || ord.tracking_code || undefined,
            shipped_at: meta.shipped_at || undefined,
            confirmation_email_sent: meta.confirmation_email_sent || undefined,
            shipping_email_sent: meta.shipping_email_sent || undefined,
          };
        });

        // Mescla garantindo que pedidos do Supabase substituam ou complementem sem duplicidade
        const dbOrderIds = new Set(transformedDbSales.map((s) => s.order_id));
        sales = [...transformedDbSales, ...sales.filter((s) => !dbOrderIds.has(s.order_id))];
      }
    } catch (e) {
      console.warn('Erro ao consultar Supabase orders:', e);
    }

    // Normalização completa de status de entrega e financeiro para todas as vendas
    sales = sales.map((s) => {
      const isOnline = s.channel === 'ONLINE';
      const fStatus = s.fulfillment_status || (
        s.status === 'DELIVERED' || s.status === 'SHIPPED' || s.status === 'IN_PRODUCTION' || s.status === 'AWAITING_SEPARATION'
          ? (s.status as any)
          : (isOnline ? 'AWAITING_SEPARATION' : 'DELIVERED')
      );
      const pStatus = s.payment_status || (
        s.status === 'CANCELLED'
          ? 'CANCELLED'
          : (s.payment_method === 'CREDIARIO' || s.crediario)
            ? (
                Array.isArray(s.crediario?.installments) && s.crediario.installments.every((i: any) => i.status === 'PAID')
                  ? 'PAID'
                  : (Array.isArray(s.crediario?.installments) && s.crediario.installments.some((i: any) => i.status === 'PAID')) || Number(s.crediario?.down_payment || 0) > 0
                    ? 'PARTIAL'
                    : 'WAITING_PAYMENT'
              )
            : (s.status === 'WAITING_PAYMENT' ? 'WAITING_PAYMENT' : 'PAID')
      );
      return {
        ...s,
        fulfillment_status: fStatus,
        payment_status: pStatus,
      };
    });

    // Vendas ativas (exclui pedidos cancelados dos totais financeiros)
    const activeSales = sales.filter((s) => s.status !== 'CANCELLED');

    // Calcula consolidação e totais matemáticos
    const totalGrossRevenue = activeSales.reduce((acc, s) => acc + s.subtotal_products + s.shipping_fee, 0);
    const totalProductsRevenue = activeSales.reduce((acc, s) => acc + s.subtotal_products, 0);
    const totalShippingCollected = activeSales.reduce((acc, s) => acc + s.shipping_fee, 0);
    const totalPaymentFees = activeSales.reduce((acc, s) => acc + s.payment_fee, 0);
    const totalCommissions = activeSales.reduce((acc, s) => acc + s.commission_amount, 0);
    const totalCostOfGoods = activeSales.reduce((acc, s) => acc + s.cost_of_goods, 0);
    const totalDiscounts = activeSales.reduce((acc, s) => acc + (Number(s.discount_amount) || 0), 0);
    const totalShippingCost = activeSales.reduce((acc, s) => acc + s.shipping_cost, 0);
    const totalNetProfit = activeSales.reduce((acc, s) => acc + s.net_profit, 0);
    const averageMarginPct = totalGrossRevenue > 0 ? (totalNetProfit / totalGrossRevenue) * 100 : 0;

    // Breakdown por Meio de Pagamento (somente vendas ativas)
    const paymentBreakdown: Record<string, { total: number; fees: number; net: number; count: number }> = {};
    activeSales.forEach((s) => {
      const m = s.payment_method || 'OUTRO';
      if (!paymentBreakdown[m]) {
        paymentBreakdown[m] = { total: 0, fees: 0, net: 0, count: 0 };
      }
      paymentBreakdown[m].total += (s.subtotal_products + s.shipping_fee);
      paymentBreakdown[m].fees += s.payment_fee;
      paymentBreakdown[m].net += (s.subtotal_products + s.shipping_fee - s.payment_fee);
      paymentBreakdown[m].count += 1;
    });

    // Breakdown por Canal (somente vendas ativas)
    const channelBreakdown = {
      ONLINE: { count: 0, revenue: 0, profit: 0 },
      POS_COUNTER: { count: 0, revenue: 0, profit: 0 },
    };
    activeSales.forEach((s) => {
      const ch = s.channel === 'ONLINE' ? 'ONLINE' : 'POS_COUNTER';
      channelBreakdown[ch].count += 1;
      channelBreakdown[ch].revenue += (s.subtotal_products + s.shipping_fee);
      channelBreakdown[ch].profit += s.net_profit;
    });

    return NextResponse.json(
      {
        sales,
        summary: {
          totalGrossRevenue: Number(totalGrossRevenue.toFixed(2)),
          totalProductsRevenue: Number(totalProductsRevenue.toFixed(2)),
          totalDiscounts: Number(totalDiscounts.toFixed(2)),
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
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
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
      crediario,
    } = body;

    const isPOS = channel === 'POS_COUNTER' || channel === 'POS';
    const dbChannel = isPOS ? 'POS' : 'ONLINE';

    const gross = Number(subtotal_products) || 0;
    const shipFee = Number(shipping_fee) || 0;
    const shipCost = Number(shipping_cost) || 0;
    const disc = Number(discount_amount) || 0;
    const grossTotal = Math.max(0, gross - disc + shipFee);

    const pFee = calculatePaymentFee(payment_method, grossTotal);

    // Consulta vendedora para aplicar taxa personalizada e atualizar estatísticas
    const SELLERS_FILE = path.join(process.cwd(), 'sellers_db.json');
    let matchedSeller: any = null;
    let sellersList: any[] = [];
    try {
      if (fs.existsSync(SELLERS_FILE)) {
        sellersList = JSON.parse(fs.readFileSync(SELLERS_FILE, 'utf8'));
      }
      if (!Array.isArray(sellersList) || sellersList.length === 0) {
        const { data: sRow } = await supabaseServer
          .from('products')
          .select('description')
          .eq('id', '00000000-0000-0000-0000-000000000092')
          .maybeSingle();
        if (sRow?.description) {
          const parsed = JSON.parse(sRow.description);
          if (Array.isArray(parsed)) sellersList = parsed;
        }
      }
      if (Array.isArray(sellersList)) {
        if (coupon_code) {
          matchedSeller = sellersList.find((s: any) => s.coupon_code && s.coupon_code.toUpperCase() === coupon_code.toUpperCase());
        }
        if (!matchedSeller && seller_name && seller_name !== 'Loja Oficial Online') {
          matchedSeller = sellersList.find((s: any) => s.name && s.name.toLowerCase().includes(seller_name.toLowerCase().split(' ')[0]));
        }
      }
    } catch (e) {
      console.warn('Erro ao ler sellers_db:', e);
    }

    // Comissão: se houver vendedora externa cadastrada com cupom, usa commission_pct dela.
    // Vendas feitas pela Ana Karina no Showroom/PDV ou loja própria têm comissão 0
    const hasCoupon = Boolean(coupon_code);
    let commRate = 0.00;
    if (body.commission_amount !== undefined && body.commission_amount !== null) {
      // Comissão explícita enviada no corpo
    } else if (matchedSeller && !matchedSeller.name.toLowerCase().includes('ana karina')) {
      commRate = (Number(matchedSeller.commission_pct) || 10) / 100;
    } else if (hasCoupon && coupon_code?.toUpperCase() !== 'VIP' && coupon_code?.toUpperCase() !== 'OFF') {
      commRate = 0.10;
    }
    const commissionAmount = (body.commission_amount !== undefined && body.commission_amount !== null)
      ? Math.max(0, Number(body.commission_amount) || 0)
      : Number(((gross - disc) * commRate).toFixed(2));

    // Soma do custo de confecção / aquisição
    const totalCostOfGoods = (items || []).reduce((acc: number, it: any) => {
      const c = Number(it.cost_price) || 15.00;
      const q = Number(it.quantity) || 1;
      return acc + (c * q);
    }, 0);

    // Cálculo exato do Lucro Líquido Real
    const netProfit = Number((grossTotal - totalCostOfGoods - pFee - shipCost - commissionAmount).toFixed(2));
    const marginPct = grossTotal > 0 ? Number(((netProfit / grossTotal) * 100).toFixed(1)) : 0;

    const finalSellerName = matchedSeller
      ? matchedSeller.name
      : (seller_name || (isPOS ? 'Ana Karina' : 'Loja Oficial Online'));

    const finalOrderId = order_id || (isPOS ? `POS-LEO-${Math.floor(1000 + Math.random() * 9000)}` : `ANA-${Math.floor(100000 + Math.random() * 900000)}`);

    const formattedItems: SaleItemPayload[] = (items || []).map((it: any) => ({
      title: it.title || 'Peça Fitness',
      size: it.size || 'M',
      color: it.color || 'Preto Ônix',
      sku: it.sku || 'ANA-ITEM',
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unit_price) || 39.9,
      cost_price: Number(it.cost_price) || 15.0,
    }));

    const fulfillmentStatus = body.fulfillment_status || (isPOS ? 'DELIVERED' : 'AWAITING_SEPARATION');
    const paymentStatus = body.payment_status || (
      (payment_method || '').toUpperCase() === 'CREDIARIO'
        ? ((crediario?.down_payment || 0) > 0 ? 'PARTIAL' : 'WAITING_PAYMENT')
        : 'PAID'
    );

    const newSale: SaleRecord = {
      id: `sale-${Date.now()}`,
      order_id: finalOrderId,
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
      payment_method: (payment_method || 'CARD').toUpperCase() as any,
      subtotal_products: gross,
      shipping_fee: shipFee,
      shipping_cost: shipCost,
      discount_amount: disc,
      payment_fee: pFee,
      commission_amount: commissionAmount,
      cost_of_goods: totalCostOfGoods,
      net_profit: netProfit,
      profit_margin_pct: marginPct,
      items: formattedItems,
      status: paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING',
      fulfillment_status: fulfillmentStatus,
      payment_status: paymentStatus,
      crediario: crediario || undefined,
    };

    // 1. Grava no Supabase 'orders' com dados completos e metadados no shipping_address JSONB
    try {
      const metadataPayload = {
        order_number: newSale.order_id,
        seller_name: finalSellerName,
        channel_detail: isPOS ? 'POS_COUNTER' : 'ONLINE',
        payment_fee: pFee,
        shipping_fee: shipFee,
        shipping_cost: shipCost,
        cost_of_goods: totalCostOfGoods,
        net_profit: netProfit,
        profit_margin_pct: marginPct,
        items: formattedItems,
        address: newSale.shipping_address || undefined,
        discount_reason: coupon_code || undefined,
        crediario: crediario || undefined,
        fulfillment_status: fulfillmentStatus,
        payment_status: paymentStatus,
      };

      const { data: insertedOrder, error: orderInsertError } = await supabaseServer
        .from('orders')
        .insert([
          {
            channel: dbChannel, // 'POS' ou 'ONLINE' válido pelo constraint CHECK do banco
            customer_name: newSale.customer_name,
            customer_phone: newSale.customer_phone || null,
            customer_email: newSale.customer_email || null,
            coupon_code: newSale.coupon_code || null,
            subtotal_amount: newSale.subtotal_products,
            discount_amount: newSale.discount_amount,
            total_amount: Math.max(0, newSale.subtotal_products + newSale.shipping_fee - newSale.discount_amount),
            commission_amount: newSale.commission_amount,
            payment_method: newSale.payment_method,
            status: newSale.status,
            shipping_address: metadataPayload,
          },
        ])
        .select();

      if (orderInsertError) {
        console.error('Erro ao gravar pedido no Supabase orders:', orderInsertError);
      } else {
        console.log('Pedido salvo no Supabase orders com sucesso:', insertedOrder?.[0]?.id);
      }
    } catch (e) {
      console.warn('Exceção ao gravar no Supabase orders:', e);
    }

    // 2. Baixa de estoque automática para peças vendidas com SKU correspondente
    for (const it of formattedItems) {
      if (it.sku) {
        try {
          const { data: v } = await supabaseServer
            .from('product_variants')
            .select('id, stock_quantity')
            .eq('sku', it.sku)
            .maybeSingle();

          if (v) {
            await supabaseServer
              .from('product_variants')
              .update({ stock_quantity: Math.max(0, (v.stock_quantity || 0) - (Number(it.quantity) || 1)) })
              .eq('id', v.id);
          }
        } catch (stockErr) {
          console.warn('Erro ao atualizar estoque da variante no banco:', stockErr);
        }
      }
    }

    // 3. Atualiza acumulado da vendedora no sellers_db.json
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
        try {
          fs.writeFileSync(SELLERS_FILE, JSON.stringify(updatedSellers, null, 2), 'utf8');
        } catch (_) {}
        try {
          await supabaseServer.from('products').upsert({
            id: '00000000-0000-0000-0000-000000000092',
            title: '__SELLERS_DB_STATE__',
            slug: '__sellers_db_state__',
            description: JSON.stringify(updatedSellers, null, 2),
          });
        } catch (_) {}
      } catch (e) {
        console.warn('Erro ao atualizar stats da vendedora:', e);
      }
    }

    // 4. Salva no arquivo local persistente como backup
    try {
      const saved = readSavedSales();
      const updated = [newSale, ...saved.filter((s) => s.order_id !== newSale.order_id)];
      writeSavedSales(updated);
    } catch (e) {
      console.warn('Erro ao salvar cópia local:', e);
    }

    // 5. Dispara evento em tempo real para o radar Wix do Backoffice (alerta de áudio e tela)
    try {
      await recordOrderEvent({
        orderId: newSale.order_id,
        customerName: newSale.customer_name,
        city: isPOS ? 'Leominster, MA (Loja Física Balcão)' : 'Online (EUA)',
        amount: newSale.subtotal_products + newSale.shipping_fee - newSale.discount_amount,
        itemsSummary: (newSale.items || []).map((i: any) => `${i.title} (${i.size})`).join(', '),
      });
    } catch (e) {
      console.warn('Erro ao disparar evento de live order:', e);
    }

    // 6. Dispara e-mail automático de Confirmação do Pedido para o cliente
    if (newSale.customer_email) {
      try {
        await sendOrderConfirmationEmail(newSale);
        newSale.confirmation_email_sent = true;
      } catch (emailErr) {
        console.warn('Erro ao disparar e-mail de confirmação de pedido:', emailErr);
      }
    }

    return NextResponse.json({ success: true, sale: newSale });
  } catch (err: any) {
    console.error('Erro no POST de vendas:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      status,
      fulfillment_status,
      payment_status,
      tracking_code,
      action,
      installment_number,
      installment_payment_method,
      payment_method,
    } = body;

    const chosenPaymentMethod = (payment_method || installment_payment_method || 'CASH').toUpperCase();

    if (!order_id) {
      return NextResponse.json({ error: 'order_id é obrigatório' }, { status: 400 });
    }

    // =========================================================================
    // AÇÃO 1: EDITAR VENDA COMPLETA DO PDV (DATA, CLIENTE, ITENS, PGTO, TOTAL)
    // =========================================================================
    if (action === 'edit_sale') {
      const {
        customer_name,
        customer_phone,
        customer_email,
        created_at,
        payment_method,
        seller_name,
        discount_amount,
        subtotal_products,
        total_amount,
        items,
        notes,
      } = body;

      const pMethod = (payment_method || 'CASH').toUpperCase();
      const disc = Math.max(0, Number(discount_amount) || 0);
      const subtotal = Math.max(0, Number(subtotal_products) || 0);
      const grossTotal = Math.max(0, Number(total_amount) || (subtotal - disc));
      const pFee = calculatePaymentFee(pMethod, grossTotal);

      // Custo de confecção / aquisição das peças
      const formattedItems: SaleItemPayload[] = Array.isArray(items)
        ? items.map((it: any) => ({
            title: it.title || 'Peça Fitness',
            size: it.size || 'One Size',
            color: it.color || 'Preto Ônix',
            sku: it.sku || 'ANA-ITEM',
            quantity: Number(it.quantity) || 1,
            unit_price: it.unit_price !== undefined && it.unit_price !== null ? Number(it.unit_price) : 44.9,
            cost_price: (it.cost_price !== undefined && it.cost_price !== null && !isNaN(Number(it.cost_price)))
              ? Number(it.cost_price)
              : 0,
          }))
        : [];

      const totalCostOfGoods = formattedItems.reduce((acc, it) => acc + (it.cost_price * it.quantity), 0);
      const isAnaKarina = !seller_name || seller_name.toLowerCase().includes('ana karina') || seller_name.toLowerCase().includes('loja oficial');
      const commissionAmount = body.commission_amount !== undefined && body.commission_amount !== null
        ? Math.max(0, Number(body.commission_amount) || 0)
        : (isAnaKarina ? 0.00 : Number(((subtotal - disc) * 0.10).toFixed(2)));
      const netProfit = Number((grossTotal - totalCostOfGoods - pFee - commissionAmount).toFixed(2));
      const marginPct = grossTotal > 0 ? Number(((netProfit / grossTotal) * 100).toFixed(1)) : 0;

      // 1. Atualiza no Supabase orders
      try {
        const { data: dbOrders } = await supabaseServer.from('orders').select('*');
        if (dbOrders) {
          const target = dbOrders.find((o: any) => {
            const meta = typeof o.shipping_address === 'object' && o.shipping_address ? o.shipping_address : {};
            return meta.order_number === order_id || o.id === order_id || (body.id && o.id === body.id);
          });

          if (target) {
            const currentMeta = typeof target.shipping_address === 'object' ? target.shipping_address : {};
            const cleanSeller = seller_name && !seller_name.includes('Juliana Silva')
              ? seller_name
              : (currentMeta.seller_name && !currentMeta.seller_name.includes('Juliana Silva') ? currentMeta.seller_name : 'Ana Karina');

            const updatedMeta = {
              ...currentMeta,
              seller_name: cleanSeller,
              payment_fee: pFee,
              cost_of_goods: totalCostOfGoods,
              net_profit: netProfit,
              profit_margin_pct: marginPct,
              items: formattedItems,
              notes: notes !== undefined ? notes : currentMeta.notes,
              ...(fulfillment_status ? { fulfillment_status } : {}),
              ...(payment_status ? { payment_status } : {}),
            };

            const updateFields: any = {
              customer_name: (customer_name || target.customer_name || '').toUpperCase(),
              customer_phone: customer_phone ? String(customer_phone).trim() : null,
              customer_email: customer_email || null,
              payment_method: pMethod,
              subtotal_amount: subtotal,
              discount_amount: disc,
              total_amount: grossTotal,
              commission_amount: commissionAmount,
              status: payment_status === 'PAID' ? 'COMPLETED' : (payment_status || status || target.status || 'COMPLETED'),
              shipping_address: updatedMeta,
            };

            if (created_at) {
              updateFields.created_at = created_at;
            }

            await supabaseServer
              .from('orders')
              .update(updateFields)
              .eq('id', target.id);
          }
        }
      } catch (e) {
        console.warn('Erro ao atualizar Supabase orders na edição:', e);
      }

      // 2. Atualiza no backup local
      const sales = readSavedSales();
      const updated = sales.map((s: any) => {
        if (s.order_id === order_id || s.id === order_id || (body.id && s.id === body.id)) {
          return {
            ...s,
            created_at: created_at || s.created_at,
            customer_name: (customer_name || s.customer_name || '').toUpperCase(),
            customer_phone: customer_phone || s.customer_phone,
            customer_email: customer_email || s.customer_email,
            payment_method: pMethod,
            seller_name: seller_name || s.seller_name,
            subtotal_products: subtotal,
            discount_amount: disc,
            shipping_fee: s.shipping_fee || 0,
            payment_fee: pFee,
            cost_of_goods: totalCostOfGoods,
            commission_amount: commissionAmount,
            net_profit: netProfit,
            profit_margin_pct: marginPct,
            items: formattedItems,
            status: payment_status === 'PAID' ? 'COMPLETED' : (payment_status || status || s.status || 'COMPLETED'),
            fulfillment_status: fulfillment_status || s.fulfillment_status,
            payment_status: payment_status || s.payment_status,
            notes: notes !== undefined ? notes : s.notes,
          };
        }
        return s;
      });

      writeSavedSales(updated);

      return NextResponse.json({ success: true, message: 'Venda atualizada com sucesso!', sales: updated });
    }

    // =========================================================================
    // AÇÃO 2: CANCELAR VENDA (ESTORNAR ESTOQUE, ANULAR COMISSÃO E STATUS)
    // =========================================================================
    if (action === 'cancel_sale' || status === 'CANCELLED') {
      const {
        restore_stock = true,
        cancel_commission = true,
        cancellation_reason = 'Cancelado pelo lojista no Backoffice',
      } = body;

      const sales = readSavedSales();
      const targetSale = sales.find((s: any) => s.order_id === order_id || s.id === order_id || (body.id && s.id === body.id));

      // 1. Estorna estoque de cada item vendido se restore_stock for true e a venda não estava cancelada antes
      if (restore_stock && targetSale && targetSale.status !== 'CANCELLED' && Array.isArray(targetSale.items)) {
        for (const it of targetSale.items) {
          if (it.sku) {
            try {
              const { data: v } = await supabaseServer
                .from('product_variants')
                .select('id, stock_quantity')
                .eq('sku', it.sku)
                .maybeSingle();

              if (v) {
                await supabaseServer
                  .from('product_variants')
                  .update({ stock_quantity: (v.stock_quantity || 0) + (Number(it.quantity) || 1) })
                  .eq('id', v.id);
              }
            } catch (stockErr) {
              console.warn('Erro ao estornar estoque no cancelamento:', stockErr);
            }
          }
        }
      }

      // 2. Estorna comissão da vendedora se aplicável
      if (cancel_commission && targetSale && (targetSale.commission_amount || 0) > 0 && targetSale.seller_name) {
        try {
          const SELLERS_FILE = path.join(process.cwd(), 'sellers_db.json');
          let sellersList: any[] = [];
          if (fs.existsSync(SELLERS_FILE)) {
            sellersList = JSON.parse(fs.readFileSync(SELLERS_FILE, 'utf8'));
          }
          if (sellersList.length > 0) {
            const updatedSellers = sellersList.map((s: any) => {
              if (s.name && (s.name === targetSale.seller_name || targetSale.seller_name.includes(s.name))) {
                const sub = (targetSale.subtotal_products || 0) - (targetSale.discount_amount || 0);
                return {
                  ...s,
                  total_sales_count: Math.max(0, (s.total_sales_count || 1) - 1),
                  total_revenue_generated: Number(Math.max(0, (s.total_revenue_generated || 0) - sub).toFixed(2)),
                  total_commission_earned: Number(Math.max(0, (s.total_commission_earned || 0) - (targetSale.commission_amount || 0)).toFixed(2)),
                };
              }
              return s;
            });
            fs.writeFileSync(SELLERS_FILE, JSON.stringify(updatedSellers, null, 2), 'utf8');
            await supabaseServer.from('products').upsert({
              id: '00000000-0000-0000-0000-000000000092',
              title: '__SELLERS_DB_STATE__',
              slug: '__sellers_db_state__',
              description: JSON.stringify(updatedSellers, null, 2),
            });
          }
        } catch (e) {
          console.warn('Erro ao estornar comissão da vendedora no cancelamento:', e);
        }
      }

      // 3. Atualiza no Supabase orders
      try {
        const { data: dbOrders } = await supabaseServer.from('orders').select('*');
        if (dbOrders) {
          const target = dbOrders.find((o: any) => {
            const meta = typeof o.shipping_address === 'object' && o.shipping_address ? o.shipping_address : {};
            return meta.order_number === order_id || o.id === order_id || (body.id && o.id === body.id);
          });

          if (target) {
            const currentMeta = typeof target.shipping_address === 'object' ? target.shipping_address : {};
            const updatedMeta = {
              ...currentMeta,
              cancellation_reason,
              cancelled_at: new Date().toISOString(),
              stock_restored: restore_stock,
            };

            await supabaseServer
              .from('orders')
              .update({
                status: 'CANCELLED',
                shipping_address: updatedMeta,
              })
              .eq('id', target.id);
          }
        }
      } catch (e) {
        console.warn('Erro ao atualizar cancelamento no Supabase:', e);
      }

      // 4. Atualiza no backup local
      const updated = sales.map((s: any) => {
        if (s.order_id === order_id || s.id === order_id || (body.id && s.id === body.id)) {
          return {
            ...s,
            status: 'CANCELLED',
            cancellation_reason,
            cancelled_at: new Date().toISOString(),
            stock_restored: restore_stock,
          };
        }
        return s;
      });

      writeSavedSales(updated);

      return NextResponse.json({
        success: true,
        message: 'Venda cancelada com sucesso!' + (restore_stock ? ' Itens devolvidos ao estoque.' : ''),
        sales: updated,
      });
    }

    let updatedCrediario: any = null;

    // 1. Atualiza no Supabase 'orders'
    try {
      const { data: dbOrders } = await supabaseServer.from('orders').select('id, shipping_address, status');
      if (dbOrders) {
        const target = dbOrders.find((o: any) => {
          const meta = typeof o.shipping_address === 'object' && o.shipping_address ? o.shipping_address : {};
          return meta.order_number === order_id || o.id === order_id;
        });

        if (target) {
          const currentMeta = typeof target.shipping_address === 'object' ? target.shipping_address : {};
          
          let nextFulfillment = fulfillment_status || currentMeta.fulfillment_status;
          let nextPayment = payment_status || currentMeta.payment_status;

          // Compatibilidade com status legado único
          if (status) {
            if (['AWAITING_SEPARATION', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'].includes(status)) {
              nextFulfillment = status;
            } else if (['WAITING_PAYMENT', 'PARTIAL', 'PAID', 'COMPLETED', 'CANCELLED'].includes(status)) {
              nextPayment = status === 'COMPLETED' ? 'PAID' : status;
            }
          }

          // Ações de Baixa Financeira no Crediário (Parcela individual ou Quitação total)
          const isCrediarioPayAction = action === 'pay_installment' || action === 'pay_crediario_full' || action === 'pay_all_installments' || nextPayment === 'PAID';
          if (isCrediarioPayAction && currentMeta.crediario && Array.isArray(currentMeta.crediario.installments)) {
            const insts = currentMeta.crediario.installments.map((inst: any) => {
              const shouldPay = action === 'pay_crediario_full' || action === 'pay_all_installments' || nextPayment === 'PAID' || inst.number === Number(installment_number);
              if (shouldPay && inst.status !== 'PAID') {
                return {
                  ...inst,
                  status: 'PAID',
                  paid_at: new Date().toISOString(),
                  payment_method: chosenPaymentMethod,
                  paid_method: chosenPaymentMethod,
                };
              }
              return inst;
            });

            const allPaid = insts.every((i: any) => i.status === 'PAID');
            nextPayment = allPaid ? 'PAID' : 'PARTIAL';
            updatedCrediario = {
              ...currentMeta.crediario,
              installments: insts,
            };
          }

          const isShipped = nextFulfillment === 'SHIPPED';
          const updatedMeta = {
            ...currentMeta,
            ...(nextFulfillment ? { fulfillment_status: nextFulfillment } : {}),
            ...(nextPayment ? { payment_status: nextPayment } : {}),
            ...(tracking_code !== undefined ? { tracking_code } : {}),
            ...(isShipped ? { shipped_at: currentMeta.shipped_at || new Date().toISOString(), shipping_email_sent: true } : {}),
            ...(updatedCrediario ? { crediario: updatedCrediario } : {}),
          };

          await supabaseServer
            .from('orders')
            .update({
              status: nextPayment === 'PAID' ? (nextFulfillment === 'DELIVERED' ? 'DELIVERED' : 'COMPLETED') : (nextFulfillment || nextPayment || 'PENDING'),
              shipping_address: updatedMeta,
            })
            .eq('id', target.id);
        }
      }
    } catch (e) {
      console.warn('Atualização opcional Supabase:', e);
    }

    // 2. Atualiza no backup local
    const sales = readSavedSales();
    let shippedSaleToEmail: any = null;
    const updated = sales.map((s: any) => {
      if (s.order_id === order_id || s.id === order_id) {
        let cred = s.crediario;
        let nextFulfillment = fulfillment_status || s.fulfillment_status;
        let nextPayment = payment_status || s.payment_status;

        // Compatibilidade com status legado único
        if (status) {
          if (['AWAITING_SEPARATION', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'].includes(status)) {
            nextFulfillment = status;
          } else if (['WAITING_PAYMENT', 'PARTIAL', 'PAID', 'COMPLETED', 'CANCELLED'].includes(status)) {
            nextPayment = status === 'COMPLETED' ? 'PAID' : status;
          }
        }

        // Ações de Baixa Financeira no Crediário no backup local
        const isCrediarioPayAction = action === 'pay_installment' || action === 'pay_crediario_full' || action === 'pay_all_installments' || nextPayment === 'PAID';
        if (isCrediarioPayAction && cred && Array.isArray(cred.installments)) {
          const insts = cred.installments.map((inst: any) => {
            const shouldPay = action === 'pay_crediario_full' || action === 'pay_all_installments' || nextPayment === 'PAID' || inst.number === Number(installment_number);
            if (shouldPay && inst.status !== 'PAID') {
              return {
                ...inst,
                status: 'PAID',
                paid_at: new Date().toISOString(),
                payment_method: chosenPaymentMethod,
                paid_method: chosenPaymentMethod,
              };
            }
            return inst;
          });
          const allPaid = insts.every((i: any) => i.status === 'PAID');
          nextPayment = allPaid ? 'PAID' : 'PARTIAL';
          cred = { ...cred, installments: insts };
        }

        const isShipped = nextFulfillment === 'SHIPPED';
        const finalTracking = tracking_code !== undefined ? tracking_code : s.tracking_code;

        const updatedOrder = {
          ...s,
          status: nextPayment === 'PAID' ? (nextFulfillment === 'DELIVERED' ? 'DELIVERED' : 'COMPLETED') : (nextFulfillment || nextPayment || s.status),
          fulfillment_status: nextFulfillment || s.fulfillment_status,
          payment_status: nextPayment || s.payment_status,
          tracking_code: finalTracking,
          shipped_at: isShipped ? (s.shipped_at || new Date().toISOString()) : s.shipped_at,
          shipping_email_sent: isShipped ? true : s.shipping_email_sent,
          crediario: cred,
        };

        if (isShipped || tracking_code) {
          shippedSaleToEmail = updatedOrder;
        }

        return updatedOrder;
      }
      return s;
    });

    // 3. Dispara e-mail de envio com código de rastreio para a cliente
    if (shippedSaleToEmail && (shippedSaleToEmail.customer_email || shippedSaleToEmail.shipping_address?.customer_email)) {
      try {
        const codeToSend = shippedSaleToEmail.tracking_code || '9400' + Math.floor(100000000000000000 + Math.random() * 900000000000000000);
        await sendShippingNotificationEmail(shippedSaleToEmail, codeToSend);
      } catch (emailErr) {
        console.warn('Erro ao disparar e-mail com código de rastreamento:', emailErr);
      }
    }

    writeSavedSales(updated);

    return NextResponse.json({ success: true, sales: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const order_id = searchParams.get('order_id');
    const restore_stock = searchParams.get('restore_stock') !== 'false';

    if (!order_id) {
      return NextResponse.json({ error: 'order_id é obrigatório' }, { status: 400 });
    }

    const sales = readSavedSales();
    const targetSale = sales.find((s) => s.order_id === order_id || s.id === order_id);

    // Se solicitado estorno e a venda não estava cancelada antes
    if (restore_stock && targetSale && targetSale.status !== 'CANCELLED' && Array.isArray(targetSale.items)) {
      for (const it of targetSale.items) {
        if (it.sku) {
          try {
            const { data: v } = await supabaseServer
              .from('product_variants')
              .select('id, stock_quantity')
              .eq('sku', it.sku)
              .maybeSingle();

            if (v) {
              await supabaseServer
                .from('product_variants')
                .update({ stock_quantity: (v.stock_quantity || 0) + (Number(it.quantity) || 1) })
                .eq('id', v.id);
            }
          } catch (e) {
            console.warn('Erro ao estornar estoque no DELETE:', e);
          }
        }
      }
    }

    // Remove do Supabase
    try {
      const { data: dbOrders } = await supabaseServer.from('orders').select('id, shipping_address');
      if (dbOrders) {
        const target = dbOrders.find((o: any) => {
          const meta = typeof o.shipping_address === 'object' && o.shipping_address ? o.shipping_address : {};
          return meta.order_number === order_id || o.id === order_id;
        });
        if (target) {
          await supabaseServer.from('orders').delete().eq('id', target.id);
        }
      }
    } catch (e) {
      console.warn('Erro ao remover pedido do Supabase:', e);
    }

    // Remove do arquivo local
    const updated = sales.filter((s) => s.order_id !== order_id && s.id !== order_id);
    writeSavedSales(updated);

    return NextResponse.json({
      success: true,
      message: 'Registro de venda excluído permanentemente!',
      sales: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
