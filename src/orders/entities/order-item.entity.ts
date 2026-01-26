export class OrderItem {
  id: number;
  productId: number;
  orderId: number;
  
  // Datos guardados (Snapshot)
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}