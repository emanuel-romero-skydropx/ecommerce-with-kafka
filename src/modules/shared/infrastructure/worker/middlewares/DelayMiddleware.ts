import type { EventHandler } from '../../../application/ports/IEventBus';

export function delayMiddleware<T>(delayMs: number): (next: EventHandler<T>) => EventHandler<T> {
  return (next) => async (msg) => {
    if (delayMs > 0) await new Promise((res) => setTimeout(res, delayMs));
    await next(msg);
  };
}




