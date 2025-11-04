import type { Logger } from 'pino';
import type { EventHandler, EventMessage } from '../../../application/ports/IEventBus';
import type { IdempotencyStorePort } from '../../../domain/ports/IdempotencyStorePort';

export function idempotencyMiddleware<T>(
  idempotency: IdempotencyStorePort,
  logger: Logger,
  keySelector: (payload: T) => string,
  ttlSeconds?: number
): (next: EventHandler<T>) => EventHandler<T> {
  return (next) => async ({ payload, ...rest }) => {
    const key = keySelector(payload);
    const acquired = await idempotency.setIfAbsent(key, ttlSeconds);

    if (!acquired) {
      logger.info({ idKey: key }, 'middleware.idempotency.skip');
      return;
    }

    await next({ payload, ...rest } as unknown as EventMessage<T>);
  };
}




