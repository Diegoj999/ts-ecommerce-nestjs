import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport'; // 👈 Importamos el guardián

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(AuthGuard('jwt')) 
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    const userId = req.user.userId; 
    return this.ordersService.create(createOrderDto, userId);
  }

  @UseGuards(AuthGuard('jwt')) 
  @Get('my-orders') 
  async findMyOrders(@Req() req: any) {
    const userId = req.user.userId; 
    
    return this.ordersService.findMyOrders(userId);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }


  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: any) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}