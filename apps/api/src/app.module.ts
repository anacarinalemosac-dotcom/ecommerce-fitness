import { Module } from '@nestjs/common';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PosModule } from './modules/pos/pos.module';
import { TikTokModule } from './modules/tiktok/tiktok.module';

@Module({
  imports: [
    SupabaseModule,
    CatalogModule,
    OrdersModule,
    PosModule,
    TikTokModule,
  ],
})
export class AppModule {}
