export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestSpec = {
  baseUrl: string;
  path: string;
  method: HttpMethod;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
};

export type HttpResponse<T> = {
  status: number;
  headers?: Record<string, string | undefined>;
  data: T;
};

export interface RequestExecutorPort {
  execute<T>(spec: RequestSpec): Promise<HttpResponse<T>>;
}


