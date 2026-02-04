import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('favorites/ids') 
  async getFavoriteIds(@Req() req: any) {
    const userId = req.user.userId; // Recuerda: viene de tu JwtStrategy
    return this.productsService.findFavoriteIds(userId);
  }

  @Get('top-5')
  getTopSelling() {
    return this.productsService.findTopSelling();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  @UseGuards(AuthGuard('jwt')) // 🔒 Usamos el guardián directo (sin archivo extra)
  @Post(':id/like')
  async toggleLike(
    @Param('id', ParseIntPipe) productId: number,
    @Req() req: any
  ) {

    const userId = req.user.userId;

    return this.productsService.toggleLike(userId, productId);
  }
}
