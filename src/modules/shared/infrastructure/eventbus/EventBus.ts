import { inject, injectable } from 'inversify';
import type { Logger } from 'pino';

import type { IEventBus, EventHandler, EventMessage } from '../../application/ports/IEventBus';
import type { EventTransport } from '../../application/ports/EventTransport';
import { TYPES as SHARED_TYPES } from '../../domain/d-injection/types';

@injectable()
export class EventBus implements IEventBus {
  private readonly topics = new Map<string, Set<EventHandler<unknown>>>();

  constructor(
    @inject(SHARED_TYPES.EventTransport) private readonly transport: EventTransport,
    @inject(SHARED_TYPES.Logger) private readonly logger: Logger
  ) {}

  subscribe<T = unknown>(topic: string, handler: EventHandler<T>): void {
    const isFirstSubscription = !this.topics.has(topic);
    if (isFirstSubscription) this.topics.set(topic, new Set());

    this.topics.get(topic)!.add(handler as unknown as EventHandler<unknown>);
    this.logger.debug({ topic }, 'eventbus.subscribe.register');

    if (isFirstSubscription) {
      this.transport.subscribe(topic, async ({ topic, key, value }) => {
        this.logger.info({ topic, key }, 'eventbus.transport.received');
        const payload = JSON.parse(value) as unknown as EventMessage<unknown>;
        const message: EventMessage<unknown> = { topic, key, payload };

        const listeners = this.topics.get(topic);
        if (!listeners || listeners.size === 0) return;

        for (const listener of listeners) {
          try {
            this.logger.debug({ topic, key }, 'eventbus.listener.invoke');
            await listener(message);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error({ error: message, topic }, 'event handler error');
          }
        }
      });
    }
  }

  async publish<T = unknown>(message: EventMessage<T>): Promise<void> {
    const { topic, key, payload } = message;
    const value = typeof payload === 'string' ? payload : JSON.stringify(payload);

    this.logger.info({ topic, key }, 'eventbus.publish');
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




