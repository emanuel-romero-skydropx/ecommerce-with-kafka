import { injectable } from 'inversify';
import type { Order } from '../../../domain/order/Order';
import type { OrdersRepositoryPort } from '../../../domain/ports/OrdersRepositoryPort';
import { OrderModel } from './Order.schema';

@injectable()
export class MongoOrdersRepository implements OrdersRepositoryPort {
  async saveMany(orders: Order[]): Promise<void> {
    const operations = orders.map((order) => ({
      updateOne: {
        filter: { id: order.id },
        update: { $set: order },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await OrderModel.bulkWrite(operations);
    }
  }
}
