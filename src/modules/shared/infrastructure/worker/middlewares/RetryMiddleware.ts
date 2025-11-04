import type { Logger } from 'pino';
import type { EventBus, EventHandler } from '../../../application/ports/EventBus';

type RetryOptions<T> = {
  logger: Logger;
  eventBus: EventBus;
  retryTopic: string;
  dlqTopic: string;
  maxRetries: number;
  getKey: (payload: T) => string;
  getRetryCount?: (payload: T) => number | undefined;
  serialize?: (payload: T) => string;
};

export function createRetryMiddleware<T>(options: RetryOptions<T>) {
  const getRetryCount = options.getRetryCount ?? (() => 0);
  const serialize = options.serialize ?? ((p: T) => JSON.stringify(p));
  return (next: EventHandler<T>): EventHandler<T> => {
    return async ({ topic, key, payload }) => {
      try {
        await next({ topic, key, payload });
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        const prev = getRetryCount(payload) ?? 0;
        const nextRetry = prev + 1;
        const keyText = options.getKey(payload);
        if (nextRetry > options.maxRetries) {
          options.logger.warn({ payload, reason }, 'middleware.retry.dlq');
          await options.eventBus.publish({ topic: options.dlqTopic, key: keyText, payload: { key: keyText, reason, originalTopic: topic, value: serialize(payload) } });
        } else {
          options.logger.warn({ payload, reason, nextRetry }, 'middleware.retry.schedule');
          await options.eventBus.publish({ topic: options.retryTopic, key: keyText, payload: { key: keyText, reason, originalTopic: topic, value: serialize(payload), retryCount: nextRetry } });
        }
      }
    };
  };
}




