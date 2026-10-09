import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { PosService, PosCheckoutDto } from './pos.service';

@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('scan/:code')
  async scan(@Param('code') code: string) {
    return this.posService.scanBarcode(code);
  }

  @Post('checkout')
  async checkout(@Body() body: PosCheckoutDto) {
    return this.posService.completePosSale(body);
  }

  @Get('summary')
  async summary(@Query('sellerId') sellerId?: string) {
    return this.posService.getDailySummary(sellerId);
  }
}
