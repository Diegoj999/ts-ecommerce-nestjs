export class Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[]; // 👈 La propiedad en el modelo
  isActive: boolean;

  constructor(partial: Partial<Product>) {
    Object.assign(this, partial);
  }

  static create(id: number, data: { 
    name: string; 
    price: number; 
    stock: number; 
    description?: string; 
    images?: string[] // 👈 Lo recibimos aquí
  }): Product {
    
    // Validaciones existentes...
    if (data.price <= 0) throw new Error('El precio debe ser mayor a cero.');
    if (data.stock < 0) throw new Error('El stock inicial no puede ser negativo.');
    if (!data.name) throw new Error('El producto debe tener un nombre.');

    return new Product({
      id,
      name: data.name,
      description: data.description || '',
      price: data.price,
      stock: data.stock,
      // 🛡️ BLINDAJE: Si no hay imágenes, guardamos array vacío
      images: data.images || [], 
      isActive: true,
    });
  }
}