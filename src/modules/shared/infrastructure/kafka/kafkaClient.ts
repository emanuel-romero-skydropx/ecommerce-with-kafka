import { Kafka, type KafkaConfig, CompressionTypes, CompressionCodecs } from 'kafkajs';
import ZstdCodec from '@kafkajs/zstd';

CompressionCodecs[CompressionTypes.ZSTD] = ZstdCodec();

export function createKafkaClient(config: KafkaConfig): Kafka {
  return new Kafka(config);
}
