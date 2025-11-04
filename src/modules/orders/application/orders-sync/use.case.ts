import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import type { Logger } from 'pino';
import type { OrdersExternalServiceEventPort } from '../../domain/ports/OrdersExternalServiceEventPort';
import { TYPES as ORDERS_TYPES } from '../../domain/d-injection/types';
import { TYPES as SHARED_TYPES } from '../../../shared/domain/d-injection/types';

@injectable()
export class RequestOrdersSync {
  constructor(
    @inject(ORDERS_TYPES.OrdersExternalServiceEventPort) private readonly ordersExternalEventService: OrdersExternalServiceEventPort,
    @inject(SHARED_TYPES.Logger) private readonly logger: Logger
  ) {}

  async execute(params: { shopId: string; pages: number }): Promise<void> {
    this.logger.info({ shopId: params.shopId, pages: params.pages }, 'orders.request-sync');
    await this.ordersExternalEventService.getOrders({ shop: params.shopId });
  }
}


