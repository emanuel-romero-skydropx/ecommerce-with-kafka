import type { Query } from './Query';

export interface QueryHandler<Q extends Query<R> = Query<any>, R = unknown> {
  readonly queryType: new (...args: any[]) => Q;
  execute(query: Q): Promise<R>;
}


