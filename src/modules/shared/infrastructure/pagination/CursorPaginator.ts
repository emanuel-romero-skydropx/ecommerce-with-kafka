import type { RequestExecutorPort, RequestSpec } from '../../domain/ports/RequestExecutorPort';
import type { PaginationStrategyPort } from '../../domain/ports/PaginationStrategyPort';

export class CursorPaginator {
  constructor(private readonly executor: RequestExecutorPort, private readonly strategy: PaginationStrategyPort) {}

  async fetchBatch<T>(baseSpec: RequestSpec, cursor?: string): Promise<{ items: T[]; nextCursor?: string }> {
    const spec = this.strategy.applyCursor(baseSpec, cursor);
    const response = await this.executor.execute<T>(spec);
    const nextCursor = this.strategy.getNextCursor(response);
    return { items: (response.data as unknown as T[]) ?? [], nextCursor };
  }
}


