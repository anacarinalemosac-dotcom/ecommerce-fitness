import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { recordOrderEvent } from '@/lib/liveStore';
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
  status: 'COMPLETED' | 'PENDING' | 'IN_PRODUCTION' | 'WAITING_PAYMENT' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  crediario?: CrediarioInfo;
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

          const comm = Number(ord.commission_amount) || Number(meta.commission_amount) || (isOnline ? 0 : Number(((gross - disc) * 0.1).toFixed(2)));

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
          const sellerName = meta.seller_name || ord.seller_name || (isOnline ? 'Loja Oficial Online' : 'Juliana Silva (PDV Balcão Leominster)');

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
            shipping_address: meta.address && typeof meta.address === 'object' ? meta.address : undefined,
            crediario: meta.crediario || undefined,
          };
        });

        // Mescla garantindo que pedidos do Supabase substituam ou complementem sem duplicidade
        const dbOrderIds = new Set(transformedDbSales.map((s) => s.order_id));
        sales = [...transformedDbSales, ...sales.filter((s) => !dbOrderIds.has(s.order_id))];
      }
    } catch (e) {
      console.warn('Erro ao consultar Supabase orders:', e);
    }

    // Calcula consolidação e totais matemáticos
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

    return NextResponse.json(
      {
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

    // Comissão: se houver vendedora cadastrada, usa commission_pct dela. Caso contrário balcão 10%
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

    const finalSellerName = matchedSeller
      ? matchedSeller.name
      : (seller_name || (isPOS ? 'Juliana Silva (PDV Balcão Leominster)' : 'Loja Oficial Online'));

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
      status: (payment_method || '').toUpperCase() === 'CREDIARIO' ? 'PENDING' : 'COMPLETED',
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
            status: 'COMPLETED',
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
      tracking_code,
      action,
      installment_number,
      installment_payment_method = 'CASH',
    } = body;

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
            unit_price: Number(it.unit_price) || 44.9,
            cost_price: Number(it.cost_price) || 16.0,
          }))
        : [];

      const totalCostOfGoods = formattedItems.reduce((acc, it) => acc + (it.cost_price * it.quantity), 0);
      const commRate = 0.10;
      const commissionAmount = Number(((subtotal - disc) * commRate).toFixed(2));
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
            const updatedMeta = {
              ...currentMeta,
              seller_name: seller_name || currentMeta.seller_name || 'Juliana Silva (PDV Balcão Leominster)',
              payment_fee: pFee,
              cost_of_goods: totalCostOfGoods,
              net_profit: netProfit,
              profit_margin_pct: marginPct,
              items: formattedItems,
              notes: notes !== undefined ? notes : currentMeta.notes,
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
              status: status || target.status || 'COMPLETED',
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
            status: status || s.status || 'COMPLETED',
            notes: notes !== undefined ? notes : s.notes,
          };
        }
        return s;
      });

      writeSavedSales(updated);

      return NextResponse.json({ success: true, message: 'Venda atualizada com sucesso!', sales: updated });
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
          let newStatus = status || target.status;

          if (action === 'pay_installment' && currentMeta.crediario && Array.isArray(currentMeta.crediario.installments)) {
            const insts = currentMeta.crediario.installments.map((inst: any) => {
              if (inst.number === Number(installment_number)) {
                return {
                  ...inst,
                  status: 'PAID',
                  paid_at: new Date().toISOString(),
                  payment_method: installment_payment_method,
                };
              }
              return inst;
            });

            const allPaid = insts.every((i: any) => i.status === 'PAID');
            if (allPaid) {
              newStatus = 'COMPLETED';
            }

            updatedCrediario = {
              ...currentMeta.crediario,
              installments: insts,
            };
          }

          const updatedMeta = {
            ...currentMeta,
            ...(tracking_code !== undefined ? { tracking_code } : {}),
            ...(updatedCrediario ? { crediario: updatedCrediario } : {}),
          };

          await supabaseServer
            .from('orders')
            .update({
              status: newStatus,
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
    const updated = sales.map((s: any) => {
      if (s.order_id === order_id || s.id === order_id) {
        let cred = s.crediario;
        let newStatus = status || s.status;

        if (action === 'pay_installment' && cred && Array.isArray(cred.installments)) {
          const insts = cred.installments.map((inst: any) => {
            if (inst.number === Number(installment_number)) {
              return {
                ...inst,
                status: 'PAID',
                paid_at: new Date().toISOString(),
                payment_method: installment_payment_method,
              };
            }
            return inst;
          });
          const allPaid = insts.every((i: any) => i.status === 'PAID');
          if (allPaid) newStatus = 'COMPLETED';
          cred = { ...cred, installments: insts };
        }

        return {
          ...s,
          status: newStatus,
          tracking_code: tracking_code !== undefined ? tracking_code : s.tracking_code,
          crediario: cred,
        };
      }
      return s;
    });

    writeSavedSales(updated);

    return NextResponse.json({ success: true, sales: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
