import { injectable, inject } from 'inversify';
import type { OrdersProviderPort } from '../../domain/ports/OrdersProviderPort';
import type { RequestExecutorPort } from '../../../shared/domain/ports/RequestExecutorPort';
import type { PaginationStrategyPort } from '../../../shared/domain/ports/PaginationStrategyPort';
import { TYPES as SHARED_TYPES } from '../../../shared/domain/d-injection/types';
import { ShopifyOrdersRequestBuilder } from '../adapters/ShopifyOrdersRequestBuilder';
import { ShopifyPageInfoStrategy } from '../pagination/ShopifyPageInfoStrategy';
import { ShopifyOrderMapper } from '../mappers/ShopifyOrderMapper';

@injectable()
export class ShopifyOrdersProvider implements OrdersProviderPort {
  constructor(
    @inject(SHARED_TYPES.RequestExecutorPort) private readonly executor: RequestExecutorPort,
    private readonly strategy: PaginationStrategyPort = new ShopifyPageInfoStrategy(),
    private readonly requestBuilder: ShopifyOrdersRequestBuilder = new ShopifyOrdersRequestBuilder(),
    private readonly orderMapper: ShopifyOrderMapper = new ShopifyOrderMapper()
  ) {}

  async fetchPage(params: { shopId: string; pageInfo?: string; limit: number; query?: Record<string, string> }): Promise<{ orders: unknown[]; nextPageInfo?: string }> {
    const spec = this.requestBuilder.build({ limit: params.limit, pageInfo: params.pageInfo });
    const response = await this.executor.execute<{ orders: Array<{ id: number | string; created_at?: string }> }>(spec);
    const orders = this.orderMapper.toDomain(response.data as { orders: Array<{ id: number | string; created_at?: string }> });
    const nextPageInfo = this.strategy.getNextCursor(response);
    return { orders, nextPageInfo };
  }
}


