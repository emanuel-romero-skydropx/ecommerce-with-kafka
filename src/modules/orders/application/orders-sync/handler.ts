import { inject, injectable } from 'inversify';
import type { Logger } from 'pino';
import type { CommandHandler } from '../../../shared/application/ports/CommandHandler';
import { RequestOrdersSyncCommand } from './command';
import type { RequestOrdersSync } from './use.case';
import { TYPES as ORDERS_TYPES } from '../../domain/d-injection/types';
import { TYPES as SHARED_TYPES } from '../../../shared/domain/d-injection/types';

@injectable()
export class RequestOrdersSyncHandler implements CommandHandler<RequestOrdersSyncCommand> {
  readonly commandType = RequestOrdersSyncCommand;

  constructor(
    @inject(ORDERS_TYPES.RequestOrdersSyncUseCase) private readonly useCase: RequestOrdersSync,
    @inject(SHARED_TYPES.Logger) private readonly logger: Logger
  ) {}

  async handle(command: RequestOrdersSyncCommand): Promise<void> {
    this.logger.info({ shopId: command.shopId, pages: command.pages }, 'orders.request-sync');
    await this.useCase.execute({ shopId: command.shopId, pages: command.pages });
  }
}


