import type { Logger } from 'pino';
import type { EventHandler } from '../../../application/ports/EventBus';
import type { IdempotencyStorePort } from '../../../domain/ports/IdempotencyStorePort';

export function createIdempotencyMiddleware<T>(
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
    await next({ payload, ...rest } as any);
  };
}




