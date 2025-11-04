import type { Order } from '../order/Order';

export interface OrdersRepositoryPort {
  saveMany(orders: Order[]): Promise<void>;
}


