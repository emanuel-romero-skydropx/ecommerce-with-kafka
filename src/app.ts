import 'reflect-metadata';
import { Container } from 'inversify';

import { createLogger } from './modules/shared/infrastructure/logging/logger';
import { createKafkaClient } from './modules/shared/infrastructure/kafka/kafkaClient';
import { HttpClient } from './modules/shared/infrastructure/http/httpClient';
import { loadEnv } from './modules/shared/infrastructure/config/env';
import { InMemoryIdempotencyStore } from './modules/shared/infrastructure/idempotency/InMemoryIdempotencyStore';
import { TYPES as SHARED_TYPES } from './modules/shared/domain/d-injection/types';
import { registerOrdersModule } from './modules/orders/infrastructure/bootstrap/register.module';
import { RequestExecutorAdapter } from './modules/shared/infrastructure/http/RequestExecutorAdapter';
import { InMemoryCommandBus } from './modules/shared/infrastructure/cqrs/InMemoryCommandBus';
import { InMemoryQueryBus } from './modules/shared/infrastructure/cqrs/InMemoryQueryBus';
import { EventBus } from './modules/shared/infrastructure/eventbus/EventBus';
import { KafkaEventTransport } from './modules/shared/infrastructure/eventbus/kafka/KafkaEventTransport';

export function buildContainer(): Container {
  const env = loadEnv();
  const container = new Container({ defaultScope: 'Singleton' });

  const logger = createLogger();
  const kafka = createKafkaClient({
    clientId: env.KAFKA_CLIENT_ID,
    brokers: env.KAFKA_BROKERS.split(',').map((b) => b.trim()).filter(Boolean)
  });
  const httpClient = new HttpClient();

  container.bind(SHARED_TYPES.Kafka).toConstantValue(kafka);
  container.bind(SHARED_TYPES.Logger).toConstantValue(logger);

  container.bind(SHARED_TYPES.HttpClient).toConstantValue(httpClient);
  container.bind(SHARED_TYPES.RequestExecutorPort).toConstantValue(new RequestExecutorAdapter(httpClient));
  container
    .bind(SHARED_TYPES.IdempotencyStorePort)
    .toConstantValue(new InMemoryIdempotencyStore());

  container.bind(SHARED_TYPES.CommandBus).to(InMemoryCommandBus);
  container.bind(SHARED_TYPES.QueryBus).to(InMemoryQueryBus);
  container.bind(SHARED_TYPES.EventTransport).to(KafkaEventTransport);
  container.bind(SHARED_TYPES.EventBus).to(EventBus);

  registerOrdersModule(container);

  return container;
}
