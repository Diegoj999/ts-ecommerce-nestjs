import { IsString, IsNumber, IsArray, IsOptional, Min, IsInt } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  stock: number;

   @IsNumber()
  @Min(0)
  rating: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true }) // Valida que cada item del array sea string
  images?: string[];
}