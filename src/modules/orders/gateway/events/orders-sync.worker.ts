import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import type { Logger } from 'pino';
import type { Container } from 'inversify';

import { TYPES as ORDERS_TYPES } from '../../domain/d-injection/types';
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
import type { OrdersSyncWorkerConfig } from '../../domain/config/worker.config';
import type { Order } from '../../domain/order/Order';

type OrdersSyncRequest = { shopId: string; pages?: number };
type OrdersPageRequest = { shopId: string; pageInfo?: string; limit: number; retryCount?: number };
type OrdersPageFetched = { shopId: string; orders: Order[]; nextPageInfo?: string };

@injectable()
export class OrdersSyncWorker extends EventWorker {
  private readonly idempotency: IdempotencyStorePort;
  private readonly requestDelayMs: number;
  private readonly maxRetries: number;
  private readonly onSyncRequested: HandleOrdersSyncRequestedUseCase;
  private readonly onPageRequest: HandleOrdersPageRequestUseCase;
  private readonly onRetry: HandleOrdersRetryUseCase;
  private readonly onPageFetched: ProcessOrdersPageUseCase;

  constructor(
    @inject(SHARED_TYPES.Logger) logger: Logger,
    @inject(SHARED_TYPES.EventBus) eventBus: IEventBus,
    @inject(SHARED_TYPES.IdempotencyStorePort) idempotency: IdempotencyStorePort,
    @inject(ORDERS_TYPES.OrdersSyncWorkerConfig) config: OrdersSyncWorkerConfig,
    @inject(HandleOrdersSyncRequestedUseCase) onSyncRequested: HandleOrdersSyncRequestedUseCase,
    @inject(HandleOrdersPageRequestUseCase) onPageRequest: HandleOrdersPageRequestUseCase,
    @inject(HandleOrdersRetryUseCase) onRetry: HandleOrdersRetryUseCase,
    @inject(ProcessOrdersPageUseCase) onPageFetched: ProcessOrdersPageUseCase
  ) {
    super({ name: 'orders-sync-worker', logger, eventBus, groupId: config.groupId });
    this.idempotency = idempotency;
    this.requestDelayMs = config.requestDelayMs;
    this.maxRetries = config.maxRetries;
    this.onSyncRequested = onSyncRequested;
    this.onPageRequest = onPageRequest;
    this.onRetry = onRetry;
    this.onPageFetched = onPageFetched;
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

  private readonly handlePageFetched = async ({ payload }: EventMessage<OrdersPageFetched>) => {
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

export function createOrdersSyncWorker(container: Container): OrdersSyncWorker {
  return container.get(OrdersSyncWorker);
}
