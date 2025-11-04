import { inject, injectable } from 'inversify';
import type { Logger } from 'pino';
import type { EventBus, EventHandler, EventMessage } from '../../../application/ports/EventBus';
import type { EventTransport } from '../../../application/ports/EventTransport';
import { TYPES as SHARED_TYPES } from '../../../domain/d-injection/types';

@injectable()
export class EventBusAdapter implements EventBus {
  private readonly handlersByTopic = new Map<string, Set<EventHandler<unknown>>>();

  constructor(
    @inject(SHARED_TYPES.EventTransport) private readonly transport: EventTransport,
    @inject(SHARED_TYPES.Logger) private readonly logger: Logger
  ) {}

  subscribe<T = unknown>(topic: string, handler: EventHandler<T>): void {
    const firstSubscriptionForTopic = !this.handlersByTopic.has(topic);
    if (firstSubscriptionForTopic) this.handlersByTopic.set(topic, new Set());
    this.handlersByTopic.get(topic)!.add(handler as unknown as EventHandler<unknown>);
    this.logger.debug({ topic }, 'eventbus.subscribe.register');
    if (firstSubscriptionForTopic) {
      this.transport.subscribe(topic, async ({ topic, key, value }) => {
        this.logger.info({ topic, key }, 'eventbus.transport.received');
        let payload: unknown = value;
        try {
          payload = JSON.parse(value);
        } catch {
        //
        }
        const eventMessage: EventMessage<unknown> = { topic, key, payload };
        const listeners = this.handlersByTopic.get(topic);
        if (!listeners || listeners.size === 0) return;
        for (const listener of listeners) {
          try {
            this.logger.debug({ topic, key }, 'eventbus.listener.invoke');
            await listener(eventMessage);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error({ err: msg, topic }, 'event handler error');
          }
        }
      });
    }
  }

  async publish<T = unknown>(message: EventMessage<T>): Promise<void> {
    const { topic, key, payload } = message;
    this.logger.info({ topic, key }, 'eventbus.publish');
    const value = typeof payload === 'string' ? payload : JSON.stringify(payload);
    await this.transport.publish({ topic, key, value });
  }

  async start(options?: unknown): Promise<void> {
    this.logger.info({ options }, 'eventbus.start');
    await this.transport.start(options);
  }

  async stop(): Promise<void> {
    this.logger.info('eventbus.stop');
    await this.transport.stop();
  }
}




