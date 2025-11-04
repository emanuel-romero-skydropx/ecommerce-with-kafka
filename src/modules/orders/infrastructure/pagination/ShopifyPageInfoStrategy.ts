import type { PaginationStrategyPort } from '../../../shared/domain/ports/PaginationStrategyPort';
import type { RequestSpec } from '../../../shared/domain/ports/RequestExecutorPort';

export class ShopifyPageInfoStrategy implements PaginationStrategyPort {
  getNextCursor(response: { status: number; headers?: Record<string, string | undefined>; data: unknown }): string | undefined {
    const headers = response.headers ?? {};
    const linkHeader: string | undefined = headers.link ?? headers.Link;
    return extractNextPageInfo(linkHeader);
  }

  applyCursor(spec: RequestSpec, cursor?: string): RequestSpec {
    if (!cursor) return spec;
    const newQuery = { ...(spec.query ?? {}), page_info: cursor };
    return { ...spec, query: newQuery };
  }
}

function extractNextPageInfo(linkHeader?: string): string | undefined {
  if (!linkHeader) return undefined;
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


