import { inject, injectable } from 'inversify';
import type { Logger } from 'pino';
import type { Kafka } from 'kafkajs';

import type { EventTransport, TransportHandler, TransportMessage } from '../../../application/ports/EventTransport';
import { TYPES as SHARED_TYPES } from '../../../domain/d-injection/types';
import { KafkaProducer } from './KafkaProducer';
import { KafkaConsumer } from './KafkaConsumer';

@injectable()
export class KafkaEventTransport implements EventTransport {
  private readonly handlersByTopic = new Map<string, TransportHandler>();
  private readonly publisher: KafkaProducer;
  private consumer: KafkaConsumer | null = null;
  private publisherStarted = false;

  constructor(
    @inject(SHARED_TYPES.Kafka) private readonly kafka: Kafka,
    @inject(SHARED_TYPES.Logger) private readonly logger: Logger
  ) {
    this.publisher = new KafkaProducer(this.kafka, this.logger);
  }

  subscribe(topic: string, handler: TransportHandler): void {
    this.handlersByTopic.set(topic, handler);
    this.logger.info({ topic }, 'kafka.transport.subscribe');
  }

  private async ensurePublisherStarted(): Promise<void> {
    if (this.publisherStarted) {
      this.logger.debug('kafka.transport.publisher.already-started');
      return;
    }
    this.logger.info('kafka.transport.publisher.starting');
    await this.publisher.start();
    this.publisherStarted = true;
  }

  async publish(message: TransportMessage): Promise<void> {
    this.logger.info({ topic: message.topic, key: message.key }, 'kafka.transport.publish');
    await this.ensurePublisherStarted();
    await this.publisher.send({ topic: message.topic, key: message.key, value: message.value });
  }

  async start(options?: unknown): Promise<void> {
    if (this.consumer) {
      this.logger.debug('kafka.transport.consumer.already-started');
      return;
    }
    const topics = Array.from(this.handlersByTopic.keys());
    if (topics.length === 0) {
      this.logger.info('event transport start with no subscriptions');
      return;
    }
    const groupId = (options as { groupId?: string } | undefined)?.groupId ?? 'app.events.v1';
    this.logger.info({ groupId, topics }, 'kafka.transport.consumer.start');
    const handlers: Record<string, (ctx: { topic: string; partition: number; key?: string; value: Buffer }) => Promise<void>> = {};
    for (const topic of topics) {
      const userHandler = this.handlersByTopic.get(topic)!;
      handlers[topic] = async ({ topic, key, value }) => {
        const text = value.toString();
        this.logger.info({ topic, key }, 'kafka.transport.consumer.received');
        await userHandler({ topic, key, value: text });
      };
    }
    this.consumer = new KafkaConsumer(this.kafka, this.logger);
    await this.consumer.start({ groupId, topics, handlers });
  }

  async stop(): Promise<void> {
    try {
      if (this.consumer) {
        this.logger.info('kafka.transport.consumer.stop');
        await this.consumer.stop();
      }
    } finally {
      this.consumer = null;
      if (this.publisherStarted) {
        try {
          this.logger.info('kafka.transport.publisher.stop');
          await this.publisher.stop();
        } finally {
          this.publisherStarted = false;
        }
      }
    }
  }
}


