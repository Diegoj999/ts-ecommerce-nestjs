export class Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  rating: number;
  images: string[]; 
  isActive: boolean;

  constructor(partial: Partial<Product>) {
    Object.assign(this, partial);
  }

  static create(id: number, data: {
    name: string;
    price: number;
    stock: number;
    description?: string;
    rating: number;
    images?: string[] 
  }): Product {

    if (data.price <= 0) throw new Error('El precio debe ser mayor a cero.');
    if (data.stock < 0) throw new Error('El stock inicial no puede ser negativo.');
    if (!data.name) throw new Error('El producto debe tener un nombre.');

    return new Product({
      id,
      name: data.name,
      description: data.description || '',
      price: data.price,
      stock: data.stock,
      rating: 0.0,
      images: data.images || [],
      isActive: true,
    });
  }
}