import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import type { Logger } from 'pino';
import type { IEventBus } from '../../shared/application/ports/IEventBus';
import { EventChannels as Topics } from '../infrastructure/adapters/OrdersEventChannels';
import { TYPES as SHARED_TYPES } from '../../shared/domain/d-injection/types';
import { TYPES as ORDERS_TYPES } from '../domain/d-injection/types';
import type { SyncJobsRepositoryPort } from '../domain/ports/SyncJobsRepositoryPort';
import type { OrdersRepositoryPort } from '../domain/ports/OrdersRepositoryPort';
import type { Order } from '../domain/order/Order';

@injectable()
export class ProcessOrdersPageUseCase {
  constructor(
    @inject(SHARED_TYPES.Logger) private readonly logger: Logger,
    @inject(SHARED_TYPES.EventBus) private readonly eventBus: IEventBus,
    @inject(ORDERS_TYPES.OrdersRepositoryPort) private readonly ordersRepository: OrdersRepositoryPort,
    @inject(ORDERS_TYPES.SyncJobsRepositoryPort) private readonly jobs: SyncJobsRepositoryPort
  ) {}

  async execute(params: { shopId: string; orders: Order[]; nextPageInfo?: string }): Promise<void> {
    this.logger.info({ shopId: params.shopId, count: params.orders?.length ?? 0 }, 'orders.process-page');

    if (params.orders && params.orders.length > 0) {
      await this.ordersRepository.saveMany(params.orders);
      this.logger.info({ shopId: params.shopId, count: params.orders.length }, 'Successfully saved orders to database');
    }

    if (params.nextPageInfo) {
      this.logger.info({ shopId: params.shopId, nextPageInfo: params.nextPageInfo }, 'Requesting next page of orders');
      await this.jobs.markPageProcessed(params.shopId, params.nextPageInfo);
      const pageLimit = Number(process.env.SHOPIFY_ORDERS_LIMIT ?? '100');
      await this.eventBus.publish({
        topic: Topics.ORDERS_PAGE_REQUEST,
        key: params.shopId,
        payload: {
          shopId: params.shopId,
          pageInfo: params.nextPageInfo,
          limit: pageLimit
        }
      });
    } else {
      this.logger.info({ shopId: params.shopId }, 'Order sync finished for shop');
      await this.jobs.markCompleted(params.shopId);
      await this.eventBus.publish({
        topic: Topics.ORDERS_SYNC_COMPLETED,
        key: params.shopId,
        payload: { shopId: params.shopId }
      });
    }
  }
}
