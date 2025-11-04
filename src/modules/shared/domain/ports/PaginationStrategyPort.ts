import type { RequestSpec } from './RequestExecutorPort';

export interface PaginationStrategyPort {
  getNextCursor(response: { status: number; headers?: Record<string, string | undefined>; data: unknown }): string | undefined;
  applyCursor(spec: RequestSpec, cursor?: string): RequestSpec;
}


