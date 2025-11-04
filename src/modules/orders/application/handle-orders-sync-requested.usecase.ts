import { inject, injectable } from 'inversify';
import type { Logger } from 'pino';
import type { IEventBus } from '../../shared/application/ports/IEventBus';
import { TYPES as SHARED_TYPES } from '../../shared/domain/d-injection/types';
import { TYPES as ORDERS_TYPES } from '../domain/d-injection/types';
import type { OrdersSyncWorkerConfig } from '../domain/config/worker.config';
import { EventChannels as Topics } from '../infrastructure/adapters/OrdersEventChannels';

@injectable()
export class HandleOrdersSyncRequestedUseCase {
  private readonly pageLimit: number;

  constructor(
    @inject(SHARED_TYPES.EventBus) private readonly eventBus: IEventBus,
    @inject(SHARED_TYPES.Logger) private readonly logger: Logger,
    @inject(ORDERS_TYPES.OrdersSyncWorkerConfig) config: OrdersSyncWorkerConfig
  ) {
    this.pageLimit = config.pageLimit;
  }

  async execute(params: { shopId: string }): Promise<void> {
    this.logger.info({ shopId: params.shopId, limit: this.pageLimit }, 'orders.sync.handle-requested');
    await this.eventBus.publish({ topic: Topics.ORDERS_PAGE_REQUEST, key: params.shopId, payload: { shopId: params.shopId, pageInfo: undefined, limit: this.pageLimit } });
  }
}




