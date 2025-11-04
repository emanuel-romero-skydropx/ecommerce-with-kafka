import Router from '@koa/router';
import type { Container } from 'inversify';

import { OrdersRoutesRegistrar } from '../routes/index';
import { OrdersPostController } from '../controllers/orders.post.controller';
import type { CommandBus } from '../../../shared/application/ports/CommandBus';
import { TYPES as SHARED_TYPES } from '../../../shared/domain/d-injection/types';

export function createOrdersRouter(container: Container): Router {
  const router = new Router({ prefix: '/api' });

  const commandBus = container.get<CommandBus>(SHARED_TYPES.CommandBus);
  const controller = new OrdersPostController(commandBus);
  const registrar = new OrdersRoutesRegistrar();
  registrar.register(router, { ordersPostController: controller });

  return router;
}


