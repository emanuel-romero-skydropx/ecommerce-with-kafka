import { inject, injectable } from 'inversify';
import type { Logger } from 'pino';
import type { OrdersExternalServiceEventPort } from '../../domain/ports/OrdersExternalServiceEventPort';
import { EventChannels as Topics } from '../adapters/OrdersEventChannels';
import type { EventBus } from '../../../shared/application/ports/EventBus';
import { TYPES as SHARED_TYPES } from '../../../shared/domain/d-injection/types';

@injectable()
export class OrdersExternalEvent implements OrdersExternalServiceEventPort {
  constructor(
    @inject(SHARED_TYPES.EventBus) private readonly eventBus: EventBus,
    @inject(SHARED_TYPES.Logger) private readonly logger: Logger
  ) {}

  async getOrders(payload: { shop: string }): Promise<void> {
    this.logger.info({ topic: Topics.ORDERS_SYNC_REQUEST, key: payload.shop }, 'orders.producer.publish.orders.sync.requested');
    await this.eventBus.publish({ topic: Topics.ORDERS_SYNC_REQUEST, key: payload.shop, payload: { shopId: payload.shop } });
  }


}


