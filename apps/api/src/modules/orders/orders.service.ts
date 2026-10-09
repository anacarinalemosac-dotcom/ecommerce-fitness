import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface CreateOrderItemDto {
  variantId: string;
  quantity: number;
}

export interface CreateOrderDto {
  channel: 'ONLINE' | 'POS';
  customerName: string;
  customerCpf?: string;
  customerPhone?: string;
  customerEmail?: string;
  couponCode?: string;
  sellerId?: string;
  paymentMethod: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH';
  shippingAddress?: any;
  items: CreateOrderItemDto[];
}

@Injectable()
export class OrdersService {
  constructor(private readonly supabase: SupabaseService) {}

  async createOrder(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('O pedido deve conter pelo menos um item.');
    }

    const adminClient = this.supabase.getAdminClient();

    // 1. Validar e buscar comissão de cupom ou vendedora
    let sellerId = dto.sellerId || null;
    let commissionRate = 0;
    let couponCode = dto.couponCode ? dto.couponCode.trim().toUpperCase() : null;

    if (couponCode) {
      const { data: seller, error } = await adminClient
        .from('sellers')
        .select('id, commission_rate, active')
        .eq('coupon_code', couponCode)
        .eq('active', true)
        .single();

      if (seller && !error) {
        sellerId = seller.id;
        commissionRate = Number(seller.commission_rate) || 0;
      }
    } else if (sellerId) {
      const { data: seller } = await adminClient
        .from('sellers')
        .select('id, commission_rate, active')
        .eq('id', sellerId)
        .single();

      if (seller) {
        commissionRate = Number(seller.commission_rate) || 0;
      }
    }

    // 2. Processar itens de forma atômica e determinar estoque vs encomenda
    let subtotal = 0;
    let hasBackorder = false;
    const processedItems: {
      variantId: string;
      quantity: number;
      unitPrice: number;
      isBackorder: boolean;
    }[] = [];

    for (const item of dto.items) {
      // Chama a função atômica PostgreSQL (process_checkout_item)
      const { data, error } = await adminClient.rpc('process_checkout_item', {
        p_variant_id: item.variantId,
        p_quantity: item.quantity,
      });

      if (error || !data || data.length === 0) {
        throw new BadRequestException(
          `Falha ao processar item ${item.variantId}: ${error?.message || 'Estoque insuficiente'}`
        );
      }

      const row = data[0];
      const unitPrice = Number(row.unit_price);
      const isBackorder = Boolean(row.is_backorder);

      if (isBackorder) {
        hasBackorder = true;
      }

      subtotal += unitPrice * item.quantity;
      processedItems.push({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        isBackorder,
      });
    }

    // 3. Calcular totais e comissão
    const discountAmount = 0; // Pode aplicar regras de cupom de desconto se houver
    const totalAmount = subtotal - discountAmount;
    const commissionAmount = Number(((totalAmount * commissionRate) / 100).toFixed(2));

    // Status inicial: se houver peça sob encomenda, vai para 'IN_PRODUCTION' após pagamento
    const initialStatus = 'PENDING';

    // 4. Inserir Pedido
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert({
        channel: dto.channel,
        seller_id: sellerId,
        coupon_code: couponCode,
        customer_name: dto.customerName,
        customer_cpf: dto.customerCpf,
        customer_phone: dto.customerPhone,
        customer_email: dto.customerEmail,
        subtotal_amount: subtotal,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        commission_amount: commissionAmount,
        payment_method: dto.paymentMethod,
        status: initialStatus,
        shipping_address: dto.shippingAddress,
      })
      .select()
      .single();

    if (orderError) {
      throw new BadRequestException(`Erro ao criar pedido: ${orderError.message}`);
    }

    // 5. Inserir Itens do Pedido
    const orderItemsPayload = processedItems.map((item) => ({
      order_id: order.id,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      is_backorder: item.isBackorder,
    }));

    await adminClient.from('order_items').insert(orderItemsPayload);

    return {
      orderId: order.id,
      status: order.status,
      hasBackorder,
      totalAmount,
      commissionAmount,
      channel: dto.channel,
      items: processedItems,
    };
  }

  async getSellerCommissions(sellerId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('orders')
      .select('id, total_amount, commission_amount, status, created_at')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
