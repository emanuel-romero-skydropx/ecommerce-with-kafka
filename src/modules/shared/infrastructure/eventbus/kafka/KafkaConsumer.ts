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
    const opts = options as { groupId: string; topics: string[]; handlers: Record<string, TopicHandler> };
    if (this.started) {
      this.logger?.debug?.({ groupId: opts?.groupId }, 'kafka.consumer.start.skip');
      return;
    }
    this.logger?.info?.({ groupId: opts.groupId, topics: opts.topics }, 'kafka.consumer.start');
    const consumer = this.kafka.consumer({ groupId: opts.groupId });
    this.consumer = consumer;
    await consumer.connect();
    for (const topic of opts.topics) {
      this.logger?.info?.({ topic }, 'kafka.consumer.subscribe');
      await consumer.subscribe({ topic });
    }
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const handler = opts.handlers[topic];
          if (!handler) return;
          if (!message.value) return;
          const keyText = message.key?.toString();
          this.logger?.info?.({ topic, partition, key: keyText }, 'kafka.consumer.message.received');
          await handler({ topic, partition, key: keyText, value: message.value });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger?.error?.({ err: msg, topic }, 'consumer handler error');
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




