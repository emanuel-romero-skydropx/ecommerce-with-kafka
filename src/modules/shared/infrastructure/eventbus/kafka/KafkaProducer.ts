import { CompressionTypes, Partitioners, type Kafka, type Producer } from 'kafkajs';
import type { Logger } from 'pino';
import type { Lifecycle } from '../../../application/ports/Lifecycle';

export type PublishMessageParams = {
  topic: string;
  key?: string;
  value: string;
  acks?: number;
  compression?: CompressionTypes;
};

export class KafkaProducer implements Lifecycle {
  private readonly producer: Producer;
  private started = false;

  constructor(kafka: Kafka, private readonly logger?: Logger) {
    this.producer = kafka.producer({ allowAutoTopicCreation: false, createPartitioner: Partitioners.LegacyPartitioner });
  }

  async start(): Promise<void> {
    if (this.started) {
      this.logger?.debug?.('kafka.producer.start.skip');
      return;
    }
    this.logger?.info?.('kafka.producer.start');
    await this.producer.connect();
    this.started = true;
  }

  async stop(): Promise<void> {
    if (!this.started) {
      this.logger?.debug?.('kafka.producer.stop.skip');
      return;
    }
    try {
      this.logger?.info?.('kafka.producer.stop');
      await this.producer.disconnect();
    } finally {
      this.started = false;
    }
  }

  async send(params: PublishMessageParams): Promise<void> {
    const { topic, key, value, acks = -1, compression = CompressionTypes.GZIP } = params;
    this.logger?.info?.({ topic, key }, 'kafka.producer.send');
    await this.producer.send({ topic, acks, compression, messages: [{ key, value }] });
  }
}




