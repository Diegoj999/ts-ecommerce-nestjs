import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma.service'; // 👈 IMPORTANTE: Importar Prisma

@Injectable()
export class ProductsService {

  // Inyectamos el servicio de base de datos
  constructor(private prisma: PrismaService) { }

  // --- CREAR PRODUCTO (Guardar en MySQL) ---
  async create(createProductDto: CreateProductDto) {
    try {
      // Prisma se encarga de crear el registro en la DB
      const newProduct = await this.prisma.product.create({
        data: {
          name: createProductDto.name,
          description: createProductDto.description || '', // Manejo de opcionales
          price: createProductDto.price,
          originalPrice: createProductDto.price,
          stock: createProductDto.stock,
          images: createProductDto.images || [], // En MySQL se guarda como JSON
          isActive: true,
        }
      });

      return newProduct;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  // --- LISTAR TODOS (Leer de MySQL) ---
  async findAll() {
    return await this.prisma.product.findMany();
  }

  

async findTopSelling() {
    // 1. CAMBIO CLAVE: Usamos _sum en lugar de _count
    const topSales = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true }, // 👈 Sumamos la columna 'quantity'
      orderBy: { 
        _sum: { quantity: 'desc' } // 👈 Ordenamos por esa suma
      },
      take: 5,
    });

    // topSales ahora se ve así: [{ productId: 5, _sum: { quantity: 12 } }, ...]

    const topProductIds = topSales.map((item) => item.productId);

    let topProducts = [];
    if (topProductIds.length > 0) {
      // Buscamos la info completa de los productos
      const unorderedProducts = await this.prisma.product.findMany({
        where: { id: { in: topProductIds } },
      });

      // 2. CAMBIO CLAVE: Reordenar manual
      // La base de datos te devuelve los productos desordenados (ej: ID 1, 2, 3...)
      // Hay que forzar el orden según nuestra lista de ventas (topProductIds)
      topProducts = topProductIds.map(id => 
        unorderedProducts.find(product => product.id === id)
      ).filter(Boolean); // Filtramos por si alguno se borró
    }

    // --- RELLENO (Esto queda igual) ---

    const missingCount = 5 - topProducts.length;

    if (missingCount > 0) {
      const existingIds = topProducts.map((p) => p.id);

      const fillerProducts = await this.prisma.product.findMany({
        where: {
          id: { notIn: existingIds },
        },
        take: missingCount,
        orderBy: { createdAt: 'desc' },
      });

      topProducts = [...topProducts, ...fillerProducts];
    }

    return topProducts;
}

  // --- BUSCAR UNO ---
  async findOne(id: number) {
    // Buscamos en la DB por ID
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Producto #${id} no encontrado`);
    }
    return product;
  }

  // --- VALIDAR Y RESTAR STOCK (Usado por OrdersModule) ---
  async validateAndReduceStock(productId: number, quantity: number, tx: any) {

    // 1. Buscamos el producto USANDO LA TRANSACCIÓN (tx)
    const product = await tx.product.findUnique({ where: { id: productId } });

    // 2. Validaciones
    if (!product) {
      throw new NotFoundException(`Producto #${productId} no encontrado`);
    }

    if (!product.isActive) {
      throw new BadRequestException(`El producto ${product.name} está desactivado`);
    }

    if (product.stock < quantity) {
      throw new BadRequestException(`Stock insuficiente para ${product.name}. Solicitado: ${quantity}, Disponible: ${product.stock}`);
    }

    // 3. Restar el stock (USANDO tx)
    await tx.product.update({
      where: { id: productId },
      data: { stock: product.stock - quantity }
    });

    // 4. Devolvemos el producto (Snapshot)
    return product;
  }

  // --- MÉTODOS DE ACTUALIZAR/BORRAR (Opcionales) ---
  async update(id: number, updateProductDto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto
    });
  }

  async remove(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }
}
