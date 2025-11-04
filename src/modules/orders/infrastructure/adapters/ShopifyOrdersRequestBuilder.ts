import { loadEnv } from '../../../shared/infrastructure/config/env';
import type { RequestSpec } from '../../../shared/domain/ports/RequestExecutorPort';

export class ShopifyOrdersRequestBuilder {
  build(input: { limit: number; pageInfo?: string }): RequestSpec {
    const env = loadEnv();
    const baseUrl = env.SHOPIFY_BASE_URL;
    const headers = { 'X-Shopify-Access-Token': env.SHOPIFY_TOKEN };
    const path = '/orders.json';
    // Force limit=1 explicitly to validate one-order-per-page behavior in this POC
    const query: Record<string, string> = { limit: '1' };
    if (input.pageInfo) query.page_info = input.pageInfo;
    return { baseUrl, path, method: 'GET', headers, query };
  }
}


