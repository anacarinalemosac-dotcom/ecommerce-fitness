import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as crypto from 'crypto';
import axios from 'axios';

export interface TikTokEventPayload {
  eventName: 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'CompletePayment';
  eventId: string;
  userEmail?: string;
  userPhone?: string;
  value?: number;
  currency?: string;
  contentId?: string;
  contentType?: string;
}

@Injectable()
export class TikTokService {
  private readonly logger = new Logger(TikTokService.name);
  private readonly pixelId = process.env.TIKTOK_PIXEL_ID || '';
  private readonly accessToken = process.env.TIKTOK_ACCESS_TOKEN || '';

  constructor(private readonly supabase: SupabaseService) {}

  private hashData(value?: string): string | undefined {
    if (!value) return undefined;
    return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
  }

  async sendConversionEvent(payload: TikTokEventPayload) {
    if (!this.accessToken || !this.pixelId) {
      this.logger.warn('TikTok Pixel ID ou Access Token ausentes. Evento simulado com sucesso.');
      return { status: 'mocked', event: payload.eventName };
    }

    const eventData = {
      pixel_code: this.pixelId,
      event: payload.eventName,
      event_id: payload.eventId,
      timestamp: new Date().toISOString(),
      context: {
        user: {
          email: this.hashData(payload.userEmail),
          phone_number: this.hashData(payload.userPhone),
        },
      },
      properties: {
        currency: payload.currency || 'BRL',
        value: payload.value || 0,
        contents: payload.contentId
          ? [
              {
                content_id: payload.contentId,
                content_type: payload.contentType || 'product',
              },
            ]
          : [],
      },
    };

    try {
      const response = await axios.post(
        'https://business-api.tiktok.com/open_api/v1.3/pixel/track/',
        eventData,
        {
          headers: {
            'Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao disparar evento TikTok: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }

  async getCatalogFeed() {
    const { data: products, error } = await this.supabase
      .getClient()
      .from('products')
      .select('*, variants:product_variants(*)');

    if (error) throw error;

    // Converte produtos para formato aceito no catálogo do TikTok Shop / Meta
    const items = (products || []).flatMap((prod) =>
      (prod.variants || []).map((v: any) => ({
        id: v.sku,
        title: `${prod.title} - ${v.color} - Tam ${v.size}`,
        description: prod.description || prod.title,
        availability: v.stock_quantity > 0 || v.allow_backorder ? 'in stock' : 'out of stock',
        condition: 'new',
        price: `${v.price} BRL`,
        link: `https://sualojafitness.com.br/produtos/${prod.slug}`,
        image_link: v.images && v.images.length > 0 ? v.images[0] : '',
        brand: 'Sua Loja Fitness',
      }))
    );

    return { items };
  }
}
