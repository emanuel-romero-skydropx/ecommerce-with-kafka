import type { RequestExecutorPort, RequestSpec, HttpResponse } from '../../domain/ports/RequestExecutorPort';
import { HttpClient } from './httpClient';

export class RequestExecutorAdapter implements RequestExecutorPort {
  constructor(private readonly httpClient: HttpClient = new HttpClient()) {}

  async execute<T>(spec: RequestSpec): Promise<HttpResponse<T>> {
    const client = this.httpClient.base(spec.baseUrl, spec.headers ?? {});

    switch (spec.method) {
      case 'GET': {
        const resp = await client.get<T>(spec.path, spec.query);
        return { status: resp.status ?? 0, headers: resp.headers as Record<string, string | undefined> | undefined, data: (resp.data as T) };
      }
      case 'POST': {
        const resp = await client.post<T>(spec.path, spec.body, { params: spec.query });
        return { status: resp.status ?? 0, headers: resp.headers as Record<string, string | undefined> | undefined, data: (resp.data as T) };
      }
      case 'PUT': {
        const resp = await client.put<T>(spec.path, spec.body, { params: spec.query });
        return { status: resp.status ?? 0, headers: resp.headers as Record<string, string | undefined> | undefined, data: (resp.data as T) };
      }
      case 'PATCH': {
        const resp = await client.patch<T>(spec.path, spec.body, { params: spec.query });
        return { status: resp.status ?? 0, headers: resp.headers as Record<string, string | undefined> | undefined, data: (resp.data as T) };
      }
      case 'DELETE': {
        const resp = await client.delete<T>(spec.path, spec.query);
        return { status: resp.status ?? 0, headers: resp.headers as Record<string, string | undefined> | undefined, data: (resp.data as T) };
      }
    }
  }
}


