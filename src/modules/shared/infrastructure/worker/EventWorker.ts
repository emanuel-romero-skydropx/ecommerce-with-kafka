import type { Logger } from 'pino';
import type { Lifecycle } from '../../application/ports/Lifecycle';
import type { EventBus, EventHandler, EventMessage } from '../../application/ports/EventBus';

type EventWorkerOptions = {
  name: string;
  groupId: string;
  logger: Logger;
  eventBus: EventBus;
};

export abstract class EventWorker implements Lifecycle {
  private readonly workerName: string;
  protected readonly groupId: string;
  protected readonly logger: Logger;
  protected readonly eventBus: EventBus;
  private started = false;
  private configured = false;

  constructor(options: EventWorkerOptions) {
    this.workerName = options.name;
    this.groupId = options.groupId;
    this.logger = options.logger;
    this.eventBus = options.eventBus;
  }

  get name(): string {
    return this.workerName;
  }

  protected configure(): void {}

  protected on<T = unknown>(topic: string, handler: EventHandler<T>): void {
    this.eventBus.subscribe(topic, handler);
  }

  protected onWith<T = unknown>(
    topic: string,
    handler: EventHandler<T>,
    ...middlewares: Array<(next: EventHandler<T>) => EventHandler<T>>
  ): void {
    const composed = middlewares.reduceRight((next, mw) => mw(next), handler);
    this.eventBus.subscribe<T>(topic, async (msg: EventMessage<T>) => composed(msg));
  }

  async start(): Promise<void> {
    if (this.started) {
      this.logger.debug?.({ name: this.workerName }, 'event.worker.start.skip');
      return;
    }
    this.logger.info?.({ name: this.workerName }, 'event.worker.start');
    if (!this.configured) {
      this.configure();
      this.configured = true;
    }
    await this.eventBus.start({ groupId: this.groupId });
    this.started = true;
  }

  async stop(): Promise<void> {
    try {
      this.logger.info?.({ name: this.workerName }, 'event.worker.stop');
      await this.eventBus.stop();
    } finally {
      this.started = false;
    }
  }
}




