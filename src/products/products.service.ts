import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {

  constructor(private prisma: PrismaService) { }
  async create(createProductDto: CreateProductDto) {
    try {
      const newProduct = await this.prisma.product.create({
        data: {
          name: createProductDto.name,
          description: createProductDto.description || '',
          price: createProductDto.price,
          originalPrice: createProductDto.price,
          stock: createProductDto.stock,
          images: createProductDto.images || [],
          isActive: true,
        }
      });

      return newProduct;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll() {
    return await this.prisma.product.findMany({
      orderBy: {
        rating: 'desc',
      },
    });
  }

  async findTopSelling() {
    const topSales = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: {
        _sum: { quantity: 'desc' }
      },
      take: 5,
    });

    const topProductIds = topSales.map((item) => item.productId);

    let topProducts = [];
    if (topProductIds.length > 0) {
      const unorderedProducts = await this.prisma.product.findMany({
        where: { id: { in: topProductIds } },
      });

      topProducts = topProductIds.map(id =>
        unorderedProducts.find(product => product.id === id)
      ).filter(Boolean);
    }

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

    await this.findOne(productId);

    await this.prisma.review.upsert({
      where: {
        userId_productId: { userId, productId }
      },
      update: { rating, comment },
      create: { userId, productId, rating, comment }
    });

    const aggregations = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true }
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: aggregations._avg.rating || 0,
        totalReviews: aggregations._count.rating || 0
      }
    });

    return { message: "Review agregada y promedio actualizado" };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Producto #${id} no encontrado`);
    }
    return product;
  }

  async toggleLike(userId: number, productId: number) {

    const existingLike = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: userId,
          productId: productId
        }
      }
    });

    if (existingLike) {
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
      select: { productId: true }
    });

    return favorites.map(f => f.productId);
  }

  async validateAndReduceStock(productId: number, quantity: number, tx: Prisma.TransactionClient) {

    const product = await tx.product.findUnique({ where: { id: productId } });

    if (!product) {
      throw new NotFoundException(`Producto #${productId} no encontrado`);
    }

    if (!product.isActive) {
      throw new BadRequestException(`El producto ${product.name} está desactivado`);
    }

    if (product.stock < quantity) {
      throw new BadRequestException(`Stock insuficiente. Solicitado: ${quantity}, Disponible: ${product.stock}`);
    }

    await tx.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } }
    });
    return product;
  }


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
