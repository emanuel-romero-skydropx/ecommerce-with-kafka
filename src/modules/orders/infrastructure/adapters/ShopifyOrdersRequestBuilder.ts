import { loadEnv } from '../../../shared/infrastructure/config/env';
import type { RequestSpec } from '../../../shared/domain/ports/RequestExecutorPort';

export class ShopifyOrdersRequestBuilder {
  build(input: { limit: number; pageInfo?: string }): RequestSpec {
    const env = loadEnv();
    const baseUrl = env.SHOPIFY_BASE_URL;
    const headers = { 'X-Shopify-Access-Token': env.SHOPIFY_TOKEN };
    const path = '/orders.json';
    const query: Record<string, string> = { limit: String(input.limit) };
    if (input.pageInfo) query.page_info = input.pageInfo;
    return { baseUrl, path, method: 'GET', headers, query };
  }
}


