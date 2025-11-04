import type { Container } from 'inversify';
import type Router from '@koa/router';

import { TYPES as SHARED_TYPES } from '../../../shared/domain/d-injection/types';
import { TYPES as ORDERS_TYPES } from '../../domain/d-injection/types';
import { ShopifyOrdersProvider } from '../providers/ShopifyOrdersProvider';
import { InMemoryOrdersRepository } from '../repositories/InMemoryOrdersRepository';
import { createOrdersRouter } from '../../gateway/http/routes';
import { ordersSwagger } from '../../gateway/http/swagger';
import { createOrdersSyncWorker } from '../../gateway/events/orders-sync.worker';
import { ShopifyOrdersRequestBuilder } from '../adapters/ShopifyOrdersRequestBuilder';
import { ShopifyOrderMapper } from '../mappers/ShopifyOrderMapper';
import { RequestOrdersSyncHandler } from '../../application/orders-sync/handler';
import { RequestOrdersSync } from '../../application/orders-sync/use.case';
import { OrdersExternalEvent } from '../services/orders.external.event';

export function registerOrdersModule(container: Container): void {
  container.bind(ORDERS_TYPES.OrdersProviderPort).to(ShopifyOrdersProvider);
  container.bind(ORDERS_TYPES.OrdersRepositoryPort).toConstantValue(new InMemoryOrdersRepository());
  container.bind(ORDERS_TYPES.OrdersExternalServiceEventPort).to(OrdersExternalEvent);
  container.bind(ORDERS_TYPES.RequestOrdersSyncUseCase).to(RequestOrdersSync);
  container.bind(SHARED_TYPES.CommandHandler).to(RequestOrdersSyncHandler);
  container.bind(ShopifyOrdersRequestBuilder).toSelf();
  container.bind(ShopifyOrderMapper).toSelf();
}

export function getOrdersHttpRouters(container: Container): Router[] {
  return [ordersSwagger, createOrdersRouter(container)];
}

export function getOrdersWorkers(container: Container) {
  return [createOrdersSyncWorker(container)];
}


