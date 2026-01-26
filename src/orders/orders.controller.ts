import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport'; // 👈 Importamos el guardián

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 🔒 1. PROTEGEMOS LA RUTA
  // Solo entra quien tenga un Token válido
  @UseGuards(AuthGuard('jwt')) 
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    
    // 🕵️ 2. EXTRAEMOS AL USUARIO
    // El 'req.user' lo crea automáticamente la estrategia JWT que hicimos antes.
    const userId = req.user.userId; 

    // 🚀 3. PASAMOS TODO AL SERVICIO
    // Enviamos el carrito (DTO) Y el ID del usuario
    return this.ordersService.create(createOrderDto, userId);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  // Si quieres proteger también la actualización o borrado,
  // puedes poner @UseGuards(AuthGuard('jwt')) encima de estos métodos también.

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: any) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}