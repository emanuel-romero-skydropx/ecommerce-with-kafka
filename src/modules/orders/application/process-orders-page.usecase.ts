import type { Logger } from 'pino';

export class ProcessOrdersPageUseCase {
  constructor(private readonly logger: Logger) {}

  async execute(params: { shopId: string; orders: unknown[]; nextPageInfo?: string }): Promise<void> {
    this.logger.info({ shopId: params.shopId, count: params.orders?.length ?? 0, nextPageInfo: params.nextPageInfo }, 'orders.process-page');
  }
}




