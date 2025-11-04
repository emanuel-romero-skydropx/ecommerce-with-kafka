import type { Logger } from 'pino';
import type { IEventBus, EventHandler } from '../../../application/ports/IEventBus';

type RetryOptions<T> = {
  logger: Logger;
  eventBus: IEventBus;
  retryTopic: string;
  dlqTopic: string;
  maxRetries: number;
  getKey: (payload: T) => string;
  getRetryCount?: (payload: T) => number | undefined;
  serialize?: (payload: T) => string;
};

export function retryMiddleware<T>(options: RetryOptions<T>) {
  const getRetryCount = options.getRetryCount ?? (() => 0);
  const serialize = options.serialize ?? ((p: T) => JSON.stringify(p));

  return (next: EventHandler<T>): EventHandler<T> => {
    return async ({ topic, key, payload }) => {
      try {
        await next({ topic, key, payload });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);

        const previous = getRetryCount(payload) ?? 0;
        const nextRetry = previous + 1;
        const key = options.getKey(payload);

        if (nextRetry > options.maxRetries) {
          options.logger.warn({ payload, reason }, 'middleware.retry.dlq');
          await options.eventBus.publish({ topic: options.dlqTopic, key, payload: { key, reason, originalTopic: topic, value: serialize(payload) } });
        } else {
          options.logger.warn({ payload, reason, nextRetry }, 'middleware.retry.schedule');
          await options.eventBus.publish({ topic: options.retryTopic, key, payload: { key, reason, originalTopic: topic, value: serialize(payload), retryCount: nextRetry } });
        }
      }
    };
  };
}




