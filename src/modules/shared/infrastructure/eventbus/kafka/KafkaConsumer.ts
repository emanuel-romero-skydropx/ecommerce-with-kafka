import type { Kafka } from 'kafkajs';
import type { Logger } from 'pino';

import type { Lifecycle } from '../../../application/ports/Lifecycle';

export type MessageContext = {
  topic: string;
  partition: number;
  key?: string;
  value: Buffer;
};

export type TopicHandler = (ctx: MessageContext) => Promise<void>;

export class KafkaConsumer implements Lifecycle {
  private readonly kafka: Kafka;
  private readonly logger?: Logger;
  private consumer: ReturnType<Kafka['consumer']> | null = null;
  private started = false;

  constructor(kafka: Kafka, logger?: Logger) {
    this.kafka = kafka;
    this.logger = logger;
  }

  async start(options?: unknown): Promise<void> {
    const { groupId, topics, handlers } = options as { groupId: string; topics: string[]; handlers: Record<string, TopicHandler> };
    if (this.started) return;

    const consumer = this.kafka.consumer({ groupId });
    this.consumer = consumer;
    await consumer.connect();
    this.logger?.info?.({ groupId, topics }, 'kafka.consumer.start');

    for (const topic of topics) {
      this.logger?.info?.({ topic }, 'kafka.consumer.subscribe');
      await consumer.subscribe({ topic });
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const handler = handlers[topic];
          if (!handler || !message.value) return;

          const key = message.key?.toString();
          this.logger?.info?.({ topic, partition, key }, 'kafka.consumer.message.received');

          await handler({ topic, partition, key, value: message.value });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger?.error?.({ error: message, topic }, 'consumer handler error');
        }
      }
    });

    this.started = true;
  }

  async stop(): Promise<void> {
    try {
      if (!this.consumer) {
        this.logger?.debug?.('kafka.consumer.stop.skip');
        return;
      }
      this.logger?.info?.('kafka.consumer.stop');
      await this.consumer.disconnect();
    } finally {
      this.consumer = null;
      this.started = false;
    }
  }
}




