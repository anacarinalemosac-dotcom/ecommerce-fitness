import { Controller, Post, Body, Get } from '@nestjs/common';
import { TikTokService, TikTokEventPayload } from './tiktok.service';

@Controller('tiktok')
export class TikTokController {
  constructor(private readonly tikTokService: TikTokService) {}

  @Post('events')
  async trackEvent(@Body() payload: TikTokEventPayload) {
    return this.tikTokService.sendConversionEvent(payload);
  }

  @Get('catalog-feed')
  async getFeed() {
    return this.tikTokService.getCatalogFeed();
  }
}
