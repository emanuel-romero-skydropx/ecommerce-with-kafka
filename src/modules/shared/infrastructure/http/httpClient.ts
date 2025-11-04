import { create, type ApisauceInstance } from 'apisauce';

export class HttpClient {
  base(url: string, headers: Record<string, string> = {}): ApisauceInstance {
    return create({ baseURL: url, headers });
  }
}

export function createHttpClient(baseURL: string): ApisauceInstance {
  return new HttpClient().base(baseURL);
}
