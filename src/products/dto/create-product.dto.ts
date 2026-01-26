export class CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock: number;
  images?: string[]; // 👈 Nuevo campo: Array de URLs (opcional)
}