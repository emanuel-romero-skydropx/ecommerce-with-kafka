import { inject, injectable } from 'inversify';
import type { ApisauceInstance, ApiResponse } from 'apisauce';
import { TYPES as SHARED_TYPES } from '../../../shared/domain/d-injection/types';
import type { HttpClient } from '../../../shared/infrastructure/http/httpClient';
import { loadEnv } from '../../../shared/infrastructure/config/env';

@injectable()
export class ShopifyOrdersClient {
  private readonly api: ApisauceInstance;

  constructor(@inject(SHARED_TYPES.HttpClient) http: HttpClient) {
    const env = loadEnv();
    this.api = http.base(env.SHOPIFY_BASE_URL, {
      'X-Shopify-Access-Token': env.SHOPIFY_TOKEN
    });
  }

  async fetchPage(params: { pageInfo?: string; limit: number; query?: Record<string, string> }): Promise<{ orders: unknown[]; nextPageInfo?: string; raw: ApiResponse<ShopifyOrdersResponse> }> {
    const query: Record<string, string> = { limit: String(params.limit), ...(params.query ?? {}) };
    if (params.pageInfo) query.page_info = params.pageInfo;
    const response = await this.api.get<ShopifyOrdersResponse>('/orders.json', query);
    if (!response.ok) {
      const statusText = `${response.status} ${response.problem ?? ''}`.trim();
      throw new Error(`Shopify orders fetch failed: ${statusText}`);
    }
    const orders: unknown[] = (response.data ?? undefined)?.orders ?? [];
    const headers = response.headers as Record<string, string | undefined> | undefined;
    const linkHeader: string | undefined = headers?.link ?? headers?.Link;
    const nextPageInfo = extractNextPageInfo(linkHeader);
    return { orders, nextPageInfo, raw: response };
  }
}

type ShopifyOrdersResponse = { orders: unknown[] };

function extractNextPageInfo(linkHeader?: string): string | undefined {
  if (!linkHeader) return undefined;
  // Link: <https://api.shopify.com/.../orders.json?page_info=xyz&limit=50>; rel="next"
  const parts = linkHeader.split(',');
  for (const part of parts) {
    const [urlPart, relPart] = part.split(';').map((s) => s.trim());
    if (!urlPart || !relPart) continue;
    if (/rel="next"/i.test(relPart)) {
      const match = urlPart.match(/<([^>]+)>/);
      const url = match?.[1];
      if (!url) continue;
      try {
        const u = new URL(url);
        const pageInfo = u.searchParams.get('page_info') ?? undefined;
        if (pageInfo) return pageInfo;
      } catch {
        // ignore parse errors
      }
    }
  }
  return undefined;
}


