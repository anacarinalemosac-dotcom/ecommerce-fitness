import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const SAFE_VARIANT_COLUMNS = 'id, product_id, sku, barcode, size, color, price, stock_quantity, allow_backorder, estimated_production_days, images, video_url';

@Injectable()
export class CatalogService {
  constructor(private readonly supabase: SupabaseService) {}

  async listProducts(categoryId?: string) {
    let query = this.supabase
      .getClient()
      .from('products')
      .select(`*, category:categories(*), variants:product_variants(${SAFE_VARIANT_COLUMNS})`);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getProductBySlug(slug: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('products')
      .select(`*, category:categories(*), variants:product_variants(${SAFE_VARIANT_COLUMNS})`)
      .eq('slug', slug)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Produto com slug '${slug}' não encontrado.`);
    }

    return data;
  }

  async findVariantByBarcode(code: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('product_variants')
      .select(`${SAFE_VARIANT_COLUMNS}, product:products(*)`)
      .or(`barcode.eq.${code},sku.eq.${code}`)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Nenhuma variação encontrada com o código/SKU '${code}'.`);
    }

    return data;
  }
}
