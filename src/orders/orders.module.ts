import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ProductsModule } from '../products/products.module';
import { PrismaService } from '../prisma.service'; // 1. IMPORTARLO

@Module({
  imports: [ProductsModule], 
  controllers: [OrdersController],
  providers: [
    OrdersService, 
    PrismaService // 2. AGREGARLO AQUÍ (Esto es lo que te falta)
  ],
})
export class OrdersModule {}