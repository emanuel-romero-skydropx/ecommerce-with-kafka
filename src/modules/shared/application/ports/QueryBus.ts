import type { Query } from './Query';

export interface QueryBus {
  ask<Q extends Query<R>, R>(query: Q): Promise<R>;
}


