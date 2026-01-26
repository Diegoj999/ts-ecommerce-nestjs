import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from '../prisma.service'; // 1. Importar

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService, 
    PrismaService // 2. Registrar
  ],
  exports: [ProductsService] // Esto es importante para que Orders pueda usar Products
})
export class ProductsModule {}