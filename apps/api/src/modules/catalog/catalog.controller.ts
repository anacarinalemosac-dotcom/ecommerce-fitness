import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  async getProducts(@Query('categoryId') categoryId?: string) {
    return this.catalogService.listProducts(categoryId);
  }

  @Get('products/:slug')
  async getProduct(@Param('slug') slug: string) {
    return this.catalogService.getProductBySlug(slug);
  }

  @Get('variants/lookup/:code')
  async lookupVariant(@Param('code') code: string) {
    return this.catalogService.findVariantByBarcode(code);
  }
}
