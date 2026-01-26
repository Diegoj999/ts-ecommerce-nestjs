import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from '../prisma.service'; // Ajusta la ruta si es necesario
import { ProductsService } from '../products/products.service'; // Ajusta la ruta si es necesario

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService
  ) { }

  // 👇 CAMBIO 1: Agregamos 'userId' como segundo parámetro
  async create(createOrderDto: CreateOrderDto, userId: number) {
    
    const { items } = createOrderDto;

    // INICIO TRANSACCIÓN
    return await this.prisma.$transaction(async (tx) => {

      let totalOrder = 0;
      const itemsToSave = [];

      for (const item of items) {
        // Validamos stock 
        const product = await this.productsService.validateAndReduceStock(
          item.productId,
          item.quantity,
          tx
        );

        const subtotal = product.price * item.quantity;
        totalOrder += subtotal;

        // Preparamos el item
        itemsToSave.push({
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: item.quantity,
          subtotal: subtotal
        });
      }

      // Guardamos la Orden
      const newOrder = await tx.order.create({
        data: {
          // 👇 CAMBIO 2: Aquí asignamos el usuario a la orden
          userId: userId, 
          
          total: totalOrder,
          items: {
            create: itemsToSave 
          }
        },
        include: { items: true }
      });

      return newOrder;
    });
  }

  findAll() {
    return this.prisma.order.findMany({
      include: { items: true }
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: any) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}