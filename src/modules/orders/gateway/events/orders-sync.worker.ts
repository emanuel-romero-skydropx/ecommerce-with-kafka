import 'reflect-metadata';
import type { Logger } from 'pino';
import type { Container } from 'inversify';

import { TYPES as ORDERS_TYPES } from '../../domain/d-injection/types';
import type { OrdersProviderPort } from '../../domain/ports/OrdersProviderPort';
import { TYPES as SHARED_TYPES } from '../../../shared/domain/d-injection/types';
import type { IdempotencyStorePort } from '../../../shared/domain/ports/IdempotencyStorePort';
import type { RetryEnvelope } from '../../../shared/infrastructure/messaging/retry';
import type { IEventBus, EventMessage } from '../../../shared/application/ports/IEventBus';
import { EventWorker } from '../../../shared/infrastructure/worker/EventWorker';
import { EventChannels as Topics } from '../../infrastructure/adapters/OrdersEventChannels';
import { HandleOrdersSyncRequestedUseCase } from '../../application/handle-orders-sync-requested.usecase';
import { HandleOrdersPageRequestUseCase } from '../../application/handle-orders-page-request.usecase';
import { HandleOrdersRetryUseCase } from '../../application/handle-orders-retry.usecase';
import { ProcessOrdersPageUseCase } from '../../application/process-orders-page.usecase';
import { idempotencyMiddleware } from '../../../shared/infrastructure/worker/middlewares/IdempotencyMiddleware';
import { delayMiddleware } from '../../../shared/infrastructure/worker/middlewares/DelayMiddleware';
import { retryMiddleware } from '../../../shared/infrastructure/worker/middlewares/RetryMiddleware';

type OrdersSyncRequest = { shopId: string; pages?: number };
type OrdersPageRequest = { shopId: string; pageInfo?: string; limit: number; retryCount?: number };

export class OrdersSyncWorker extends EventWorker {
  constructor(
    logger: Logger,
    eventBus: IEventBus,
    groupId: string,
    private readonly onSyncRequested: HandleOrdersSyncRequestedUseCase,
    private readonly onPageRequest: HandleOrdersPageRequestUseCase,
    private readonly onRetry: HandleOrdersRetryUseCase,
    private readonly onPageFetched: ProcessOrdersPageUseCase,
    private readonly idempotency: IdempotencyStorePort,
    private readonly requestDelayMs: number,
    private readonly maxRetries: number
  ) {
    super({ name: 'orders-sync-worker', logger, eventBus, groupId });
  }

  private readonly handleSyncRequest = async ({ payload }: EventMessage<OrdersSyncRequest>) => {
    await this.onSyncRequested.execute({ shopId: payload.shopId });
  };

  private readonly handlePageRequest = async ({ payload }: EventMessage<OrdersPageRequest>) => {
    await this.onPageRequest.execute(payload);
  };

  private readonly handleRetry = async ({ payload: envelope }: EventMessage<RetryEnvelope>) => {
    await this.onRetry.execute(envelope);
  };

  private readonly handlePageFetched = async ({ payload }: EventMessage<{ shopId: string; orders: unknown[]; nextPageInfo?: string }>) => {
    await this.onPageFetched.execute(payload);
  };

  protected configure(): void {
    this.logger.info('orders.sync.worker.subscribe');
    this.onWith(
      Topics.ORDERS_SYNC_REQUEST,
      this.handleSyncRequest,
      retryMiddleware({
        logger: this.logger,
        eventBus: this.eventBus,
        retryTopic: Topics.ORDERS_RETRY,
        dlqTopic: Topics.ORDERS_DLQ,
        maxRetries: this.maxRetries,
        getKey: (p: OrdersSyncRequest) => p.shopId
      })
    );
    this.onWith(
      Topics.ORDERS_PAGE_REQUEST,
      this.handlePageRequest,
      idempotencyMiddleware(this.idempotency, this.logger, (p: OrdersPageRequest) => `${p.shopId}|${p.pageInfo ?? 'FIRST'}`),
      delayMiddleware(this.requestDelayMs),
      retryMiddleware({
        logger: this.logger,
        eventBus: this.eventBus,
        retryTopic: Topics.ORDERS_RETRY,
        dlqTopic: Topics.ORDERS_DLQ,
        maxRetries: this.maxRetries,
        getKey: (p: OrdersPageRequest) => p.shopId,
        getRetryCount: (p: OrdersPageRequest) => p.retryCount
      })
    );
    this.on(Topics.ORDERS_RETRY, this.handleRetry);
    this.on(Topics.ORDERS_PAGE_FETCHED, this.handlePageFetched);
  }
}

export function createOrdersSyncWorker(container: Container) {
  const logger = container.get<Logger>(SHARED_TYPES.Logger);
  const eventBus = container.get<IEventBus>(SHARED_TYPES.EventBus);
  const provider = container.get<OrdersProviderPort>(ORDERS_TYPES.OrdersProviderPort);
  const idempotency = container.get<IdempotencyStorePort>(SHARED_TYPES.IdempotencyStorePort);
  const groupId = process.env.KAFKA_ORDERS_GROUP ?? 'orders.sync.v1';
  const pageLimit = Number(process.env.SHOPIFY_ORDERS_LIMIT ?? '100');
  const requestDelayMs = Number(process.env.SHOPIFY_REQUEST_DELAY_MS ?? '0');
  const maxRetries = Number(process.env.WORKER_RETRY_MAX ?? '5');
  const onSyncRequested = new HandleOrdersSyncRequestedUseCase(eventBus, logger, pageLimit);
  const onPageRequest = new HandleOrdersPageRequestUseCase(logger, provider, eventBus);
  const onRetry = new HandleOrdersRetryUseCase(eventBus, logger);
  const onPageFetched = new ProcessOrdersPageUseCase(logger);
  return new OrdersSyncWorker(logger, eventBus, groupId, onSyncRequested, onPageRequest, onRetry, onPageFetched, idempotency, requestDelayMs, maxRetries);
}
