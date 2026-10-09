import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { OrdersService, CreateOrderDto } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(@Body() body: CreateOrderDto) {
    return this.ordersService.createOrder(body);
  }

  @Get('commissions/:sellerId')
  async getCommissions(@Param('sellerId') sellerId: string) {
    return this.ordersService.getSellerCommissions(sellerId);
  }
}
