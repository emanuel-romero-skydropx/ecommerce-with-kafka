export interface OrdersProviderPort {
  fetchPage(params: {
    shopId: string;
    pageInfo?: string;
    limit: number;
    query?: Record<string, string>;
  }): Promise<{
    orders: unknown[];
    nextPageInfo?: string;
  }>;
}


