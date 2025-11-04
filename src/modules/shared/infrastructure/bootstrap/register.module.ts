import 'reflect-metadata';
import type { Container } from 'inversify';
import { createLogger } from '../logging/logger';
import { createKafkaClient } from '../kafka/kafkaClient';
import { HttpClient } from '../http/httpClient';
import { loadEnv } from '../config/env';
import { InMemoryIdempotencyStore } from '../idempotency/InMemoryIdempotencyStore';
import { TYPES } from '../../domain/d-injection/types';
import { RequestExecutorAdapter } from '../http/RequestExecutorAdapter';
import { InMemoryCommandBus } from '../cqrs/InMemoryCommandBus';
import { InMemoryQueryBus } from '../cqrs/InMemoryQueryBus';
import { EventBus } from '../eventbus/EventBus';
import { KafkaEventTransport } from '../eventbus/kafka/KafkaEventTransport';

export function registerSharedModule(container: Container): void {
  const env = loadEnv();
  const logger = createLogger();
  const kafka = createKafkaClient({
    clientId: env.KAFKA_CLIENT_ID,
    brokers: env.KAFKA_BROKERS.split(',').map((b) => b.trim()).filter(Boolean)
  });
  const httpClient = new HttpClient();

  container.bind(TYPES.Kafka).toConstantValue(kafka);
  container.bind(TYPES.Logger).toConstantValue(logger);
  container.bind(TYPES.HttpClient).toConstantValue(httpClient);
  container.bind(TYPES.RequestExecutorPort).to(RequestExecutorAdapter);
  container.bind(TYPES.IdempotencyStorePort).to(InMemoryIdempotencyStore);
  container.bind(TYPES.CommandBus).to(InMemoryCommandBus);
  container.bind(TYPES.QueryBus).to(InMemoryQueryBus);
  container.bind(TYPES.EventTransport).to(KafkaEventTransport);
  container.bind(TYPES.EventBus).to(EventBus);
}
