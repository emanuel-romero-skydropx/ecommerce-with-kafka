import { create, type ApisauceInstance } from 'apisauce';

export class HttpClient {
  base(url: string, headers: Record<string, string> = {}): ApisauceInstance {
    return create({ baseURL: url, headers });
  }
}

// Backwards-compatible helper
export function createHttpClient(baseURL: string): ApisauceInstance {
  return new HttpClient().base(baseURL);
}
