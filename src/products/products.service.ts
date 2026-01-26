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
    const topSales = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });
    const productIds = topSales.map((item) => item.productId);

    // PASO 3: Traer la info completa de esos productos
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    // PASO 4 (Opcional): Ordenar los productos finales según el orden de ventas
    // (Porque el paso 3 no garantiza el orden)
    return products.sort((a, b) => {
      return productIds.indexOf(a.id) - productIds.indexOf(b.id);
    });
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