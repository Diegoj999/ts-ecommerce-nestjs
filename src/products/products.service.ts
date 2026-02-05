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
    return await this.prisma.product.findMany({
      orderBy: {
      rating: 'desc', 
    }, 
    });
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

async addReview(userId: number, productId: number, rating: number, comment?: string) {
  
  // 1. Guardar o Actualizar el voto del usuario (Upsert)
  // Si ya votó, actualizamos la nota. Si es nuevo, lo creamos.
  await this.prisma.review.upsert({
    where: {
      userId_productId: { userId, productId } // Gracias al @@unique
    },
    update: { rating, comment },
    create: { userId, productId, rating, comment }
  });

  // 2. Calcular el nuevo promedio de ESE producto
  const aggregations = await this.prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },   // Calcula el promedio
    _count: { rating: true }  // Cuenta cuántos votos hay
  });

  // 3. Actualizar la "ficha" del producto (para que sea rápido de leer en la App)
  await this.prisma.product.update({
    where: { id: productId },
    data: {
      rating: aggregations._avg.rating || 0,
      totalReviews: aggregations._count.rating || 0
    }
  });

  return { message: "Review agregada y promedio actualizado" };
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

// Endpoint: POST /products/:id/like
 async toggleLike(userId:number, productId:number){
  
  // 1. Buscamos si ya existe el like
  const existingLike = await this.prisma.favorite.findUnique({
    where: {
      userId_productId: { // Prisma crea este nombre por la clave compuesta
        userId: userId,
        productId: productId
      }
    }
  });

  if (existingLike) {
    // 2. Si existe, lo borramos (Quitó el like)
    await this.prisma.favorite.delete({
      where: {
        userId_productId: {
          userId: userId,
          productId: productId
        }
      }
    });
    return { isFavorite: false };
  } else {
    // 3. Si no existe, lo creamos (Dio like)
    await this.prisma.favorite.create({
      data: {
        userId: userId,
        productId: productId
      }
    });
    return { isFavorite: true };
  }
}

async findFavoriteIds(userId: number): Promise<number[]> {
  const favorites = await this.prisma.favorite.findMany({
    where: { userId },
    select: { productId: true } // ⚡ Optimización: Solo trae la columna ID
  });

  // Transformamos [{productId: 1}, {productId: 5}] a [1, 5]
  return favorites.map(f => f.productId);
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
