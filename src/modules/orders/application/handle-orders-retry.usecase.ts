import { inject, injectable } from 'inversify';
import type { Logger } from 'pino';
import type { IEventBus } from '../../shared/application/ports/IEventBus';
import { TYPES as SHARED_TYPES } from '../../shared/domain/d-injection/types';
import { computeExponentialBackoff, type RetryEnvelope } from '../../shared/infrastructure/messaging/retry';

@injectable()
export class HandleOrdersRetryUseCase {
  constructor(
    @inject(SHARED_TYPES.EventBus) private readonly eventBus: IEventBus,
    @inject(SHARED_TYPES.Logger) private readonly logger: Logger
  ) {}

  async execute(envelope: RetryEnvelope): Promise<void> {
    const backoffMs = computeExponentialBackoff(envelope.retryCount);
    this.logger.info({ envelope, backoffMs }, 'orders.retry.scheduling');
    await new Promise((r) => setTimeout(r, backoffMs));
    const forwardValue = envelope.value ? JSON.parse(envelope.value) : undefined;
    await this.eventBus.publish({ topic: envelope.originalTopic, key: envelope.key, payload: forwardValue ?? envelope });
  }
}




