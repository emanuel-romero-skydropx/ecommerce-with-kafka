export interface OrdersQueryPort {
  getById(params: { id: string }): Promise<unknown | null>;
  listByShop(params: { shopId: string; cursor?: string; limit: number }): Promise<{ items: unknown[]; nextCursor?: string }>;
  search(params: { shopId: string; query?: Record<string, string>; cursor?: string; limit: number }): Promise<{ items: unknown[]; nextCursor?: string }>;
}


