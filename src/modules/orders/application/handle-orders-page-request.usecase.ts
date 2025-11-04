import { inject, injectable } from 'inversify';
import type { Logger } from 'pino';
import type { IEventBus } from '../../shared/application/ports/IEventBus';
import { TYPES as SHARED_TYPES } from '../../shared/domain/d-injection/types';
import type { OrdersProviderPort } from '../domain/ports/OrdersProviderPort';
import { TYPES as ORDERS_TYPES } from '../domain/d-injection/types';
import { EventChannels as Topics } from '../infrastructure/adapters/OrdersEventChannels';

@injectable()
export class HandleOrdersPageRequestUseCase {
  constructor(
    @inject(SHARED_TYPES.Logger) private readonly logger: Logger,
    @inject(ORDERS_TYPES.OrdersProviderPort) private readonly orderProvider: OrdersProviderPort,
    @inject(SHARED_TYPES.EventBus) private readonly eventBus: IEventBus
  ) {}

  async execute(params: { shopId: string; pageInfo?: string; limit: number; retryCount?: number }): Promise<void> {
    const { orders, nextPageInfo } = await this.orderProvider.fetchPage({ shopId: params.shopId, pageInfo: params.pageInfo, limit: params.limit });
    this.logger.info({ shopId: params.shopId, nextPageInfo, count: orders.length }, 'orders.page-request.fetched');
    await this.eventBus.publish({ topic: Topics.ORDERS_PAGE_FETCHED, key: params.shopId, payload: { shopId: params.shopId, orders, nextPageInfo } });
  }
}




