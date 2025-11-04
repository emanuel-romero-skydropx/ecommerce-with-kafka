import type Router from '@koa/router';
import type { OrdersPostController } from '../controllers/orders.post.controller';
import { OrdersPostRouteRegistrar } from './orders.post.router';

export class OrdersRoutesRegistrar {
  constructor(private readonly postRegistrar: OrdersPostRouteRegistrar = new OrdersPostRouteRegistrar()) {}

  register(router: Router, deps: { ordersPostController: OrdersPostController }): void {
    this.postRegistrar.register(router, deps.ordersPostController);
  }
}
