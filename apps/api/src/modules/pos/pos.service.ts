import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { OrdersService, CreateOrderDto } from '../orders/orders.service';

export interface PosCheckoutDto {
  sellerId: string;
  customerName?: string;
  customerCpf?: string;
  paymentMethod: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH';
  items: {
    variantId: string;
    quantity: number;
  }[];
}

@Injectable()
export class PosService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly ordersService: OrdersService,
  ) {}

  async scanBarcode(code: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('product_variants')
      .select('id, sku, barcode, size, color, price, stock_quantity, allow_backorder, product:products(title, images:product_variants(images))')
      .or(`barcode.eq.${code},sku.eq.${code}`)
      .single();

    if (error || !data) {
      throw new BadRequestException(`Código de barras ou SKU '${code}' não encontrado.`);
    }

    return data;
  }

  async completePosSale(dto: PosCheckoutDto) {
    const orderPayload: CreateOrderDto = {
      channel: 'POS',
      sellerId: dto.sellerId,
      customerName: dto.customerName || 'Cliente Balcão PDV',
      customerCpf: dto.customerCpf,
      paymentMethod: dto.paymentMethod,
      items: dto.items,
    };

    return this.ordersService.createOrder(orderPayload);
  }

  async getDailySummary(sellerId?: string) {
    const today = new Date().toISOString().split('T')[0];
    let query = this.supabase
      .getClient()
      .from('orders')
      .select('id, total_amount, payment_method, commission_amount, created_at')
      .eq('channel', 'POS')
      .gte('created_at', `${today}T00:00:00Z`);

    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totalSales = (data || []).reduce((acc, curr) => acc + Number(curr.total_amount), 0);
    const totalCommissions = (data || []).reduce((acc, curr) => acc + Number(curr.commission_amount), 0);

    return {
      date: today,
      salesCount: (data || []).length,
      totalSales,
      totalCommissions,
      orders: data,
    };
  }
}
