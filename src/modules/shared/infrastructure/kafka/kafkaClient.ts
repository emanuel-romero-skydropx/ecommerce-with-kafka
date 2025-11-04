import { Kafka, type KafkaConfig } from 'kafkajs';

export function createKafkaClient(config: KafkaConfig): Kafka {
  return new Kafka(config);
}
