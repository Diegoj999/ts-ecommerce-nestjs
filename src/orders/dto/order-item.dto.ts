import { IsInt, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Clase auxiliar para validar cada extra (opcional pero recomendada)
class OrderItemExtraDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  price: number;
}

export class OrderItemDto {
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsInt()
  @IsNotEmpty()
  quantity: number;

  // 👇 AGREGA ESTO AQUÍ
  @IsOptional() // Puede no venir
  @IsArray()    // Si viene, debe ser un array
  @ValidateNested({ each: true }) // Valida cada objeto dentro del array
  @Type(() => OrderItemExtraDto) // Convierte el JSON a la clase
  extras?: OrderItemExtraDto[]; 
}

export class CreateOrderDto {
  // ... resto de tu DTO
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}