import { OrderItem } from './order-item.entity';

export class Order {
  id: number;
  total: number;
  createdAt: Date;
  
  // Relación: Una orden contiene una lista de items
  items?: OrderItem[]; 

  // --- LÓGICA OPCIONAL ---
  // Si alguna vez necesitas recalcular el total desde la entidad,
  // se hace recorriendo el array de items, no multiplicando uno solo.
  calculateTotal() {
    if (this.items && this.items.length > 0) {
      this.total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    } else {
      this.total = 0;
    }
  }
}