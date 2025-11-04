import 'reflect-metadata';
import type { Container } from 'inversify';
import type Router from '@koa/router';

import { TYPES as SHARED_TYPES } from '../../../shared/domain/d-injection/types';

import { TYPES } from '../../domain/d-injection/types';
import { ShopifyOrdersClient } from '../adapters/ShopifyOrdersClient';
import { ShopifyOrdersProvider } from '../providers/ShopifyOrdersProvider';
import { OrdersExternalServiceEvent } from '../services/orders.external.service.event';
import { RequestOrdersSync } from '../../application/orders-sync/use.case';
import { RequestOrdersSyncHandler } from '../../application/orders-sync/handler';
import type { OrdersSyncWorkerConfig } from '../../domain/config/worker.config';
import { HandleOrdersSyncRequestedUseCase } from '../../application/handle-orders-sync-requested.usecase';
import { HandleOrdersPageRequestUseCase } from '../../application/handle-orders-page-request.usecase';
import { HandleOrdersRetryUseCase } from '../../application/handle-orders-retry.usecase';
import { ProcessOrdersPageUseCase } from '../../application/process-orders-page.usecase';
import { OrdersSyncWorker } from '../../gateway/events/orders-sync.worker';
import { MongoOrdersRepository } from '../persistence/MongoOrdersRepository/MongoOrdersRepository';
import { ordersSwagger } from '../../gateway/http/swagger';
import { createOrdersRouter } from '../../gateway/http/routes';

export function registerOrdersModule(container: Container): void {
  // Config
  container.bind<OrdersSyncWorkerConfig>(TYPES.OrdersSyncWorkerConfig).toConstantValue({
    groupId: process.env.KAFKA_ORDERS_GROUP ?? 'orders.sync.v1',
    pageLimit: Number(process.env.SHOPIFY_ORDERS_LIMIT ?? '100'),
    requestDelayMs: Number(process.env.SHOPIFY_REQUEST_DELAY_MS ?? '0'),
    maxRetries: Number(process.env.WORKER_RETRY_MAX ?? '5')
  });

  // Use Cases
  container.bind(RequestOrdersSync).toSelf();
  container.bind(TYPES.RequestOrdersSyncUseCase).to(RequestOrdersSync);
  container.bind(HandleOrdersSyncRequestedUseCase).toSelf();
  container.bind(HandleOrdersPageRequestUseCase).toSelf();
  container.bind(HandleOrdersRetryUseCase).toSelf();
  container.bind(ProcessOrdersPageUseCase).toSelf();

  // Worker
  container.bind(OrdersSyncWorker).toSelf();

  // Ports & Adapters
  container.bind(TYPES.OrdersRepositoryPort).to(MongoOrdersRepository);
  container.bind(TYPES.OrdersExternalServiceEventPort).to(OrdersExternalServiceEvent);
  container.bind(TYPES.OrdersProviderPort).to(ShopifyOrdersProvider);
  container.bind(SHARED_TYPES.HttpClient).to(ShopifyOrdersClient);

  // Command Handlers
  container.bind(SHARED_TYPES.CommandHandler).to(RequestOrdersSyncHandler);
}

export function getOrdersHttpRouters(container: Container): Router[] {
  return [ordersSwagger, createOrdersRouter(container)];
}

export function getOrdersWorkers(container: Container) {
  return [container.get(OrdersSyncWorker)];
}


