import type Router from '@koa/router';
import type { OrdersPostController } from '../controllers/orders.post.controller';

export class OrdersPostRouteRegistrar {
  register(router: Router, controller: OrdersPostController): void {
    router.post('/orders/sync', async (ctx) => {
      await controller.handle(ctx);
    });
  }
}
