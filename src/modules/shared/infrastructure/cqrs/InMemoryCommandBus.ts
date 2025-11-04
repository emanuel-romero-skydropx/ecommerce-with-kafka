import { inject, injectable, multiInject } from 'inversify';
import type { Logger } from 'pino';

import type { Command } from '../../application/ports/Command';
import type { CommandBus } from '../../application/ports/CommandBus';
import type { CommandHandler } from '../../application/ports/CommandHandler';
import { TYPES as SHARED_TYPES } from '../../domain/d-injection/types';

@injectable()
export class InMemoryCommandBus implements CommandBus {
  private readonly handlers = new Map<string, CommandHandler>();

  constructor(
    @multiInject(SHARED_TYPES.CommandHandler) handlers: CommandHandler[],
    @inject(SHARED_TYPES.Logger) private readonly logger: Logger
  ) {
    for (const handler of handlers) {
      const name = handler.commandType.name;
      this.handlers.set(name, handler);
    }
  }

  async dispatch<C extends Command>(command: C): Promise<void> {
    const name = command?.constructor?.name ?? 'UnknownCommand';
    this.logger.info({ command: name }, 'dispatch command');

    const handler = this.handlers.get(name);
    if (!handler) throw new Error(`No handler registered for command: ${name}`);

    await handler.handle(command);
  }
}


