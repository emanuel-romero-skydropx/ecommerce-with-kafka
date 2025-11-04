export const TYPES = {
  IdempotencyStorePort: Symbol('IdempotencyStorePort'),
  HttpClient: Symbol('HttpClient'),
  Kafka: Symbol('Kafka'),
  Logger: Symbol('Logger'),
  RequestExecutorPort: Symbol('RequestExecutorPort'),
  CommandBus: Symbol('CommandBus'),
  QueryBus: Symbol('QueryBus'),
  CommandHandler: Symbol('CommandHandler'),
  QueryHandler: Symbol('QueryHandler'),
  EventBus: Symbol('EventBus'),
  EventTransport: Symbol('EventTransport')
} as const;


