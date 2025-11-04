import type { OrdersRepositoryPort } from '../../domain/ports/OrdersRepositoryPort';
import type { Order } from '../../domain/order/Order';

export class InMemoryOrdersRepository implements OrdersRepositoryPort {
  private readonly store: Map<string, Order> = new Map();

  async saveMany(orders: Order[]): Promise<void> {
    for (const order of orders) {
      this.store.set(order.id, order);
    }
  }
}


