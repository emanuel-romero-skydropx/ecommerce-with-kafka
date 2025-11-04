import type { EventHandler } from '../../../application/ports/EventBus';

export function createDelayMiddleware<T>(delayMs: number): (next: EventHandler<T>) => EventHandler<T> {
  return (next) => async (msg) => {
    if (delayMs > 0) await new Promise((res) => setTimeout(res, delayMs));
    await next(msg);
  };
}




