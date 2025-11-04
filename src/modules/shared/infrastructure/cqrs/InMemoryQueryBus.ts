import { inject, injectable, multiInject } from 'inversify';
import type { Logger } from 'pino';
import type { Query } from '../../application/ports/Query';
import type { QueryBus } from '../../application/ports/QueryBus';
import type { QueryHandler } from '../../application/ports/QueryHandler';
import { TYPES as SHARED_TYPES } from '../../domain/d-injection/types';

@injectable()
export class InMemoryQueryBus implements QueryBus {
  private readonly handlersByName = new Map<string, QueryHandler>();

  constructor(
    @multiInject(SHARED_TYPES.QueryHandler) handlers: QueryHandler[],
    @inject(SHARED_TYPES.Logger) private readonly logger: Logger
  ) {
    for (const handler of handlers) {
      const name = handler.queryType.name;
      this.handlersByName.set(name, handler);
    }
  }

  async ask<Q extends Query<R>, R>(query: Q): Promise<R> {
    const name = query?.constructor?.name ?? 'UnknownQuery';
    this.logger.info({ query: name }, 'ask query');
    const handler = this.handlersByName.get(name) as any;
    if (!handler) throw new Error(`No handler registered for query: ${name}`);
    return await handler.execute(query);
  }
}


