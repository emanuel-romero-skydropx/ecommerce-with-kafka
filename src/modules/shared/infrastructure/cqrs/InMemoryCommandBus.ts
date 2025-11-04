import { inject, injectable, multiInject } from 'inversify';
import type { Logger } from 'pino';
import type { Command } from '../../application/ports/Command';
import type { CommandBus } from '../../application/ports/CommandBus';
import type { CommandHandler } from '../../application/ports/CommandHandler';
import { TYPES as SHARED_TYPES } from '../../domain/d-injection/types';

@injectable()
export class InMemoryCommandBus implements CommandBus {
  private readonly handlersByName = new Map<string, CommandHandler>();

  constructor(
    @multiInject(SHARED_TYPES.CommandHandler) handlers: CommandHandler[],
    @inject(SHARED_TYPES.Logger) private readonly logger: Logger
  ) {
    for (const handler of handlers) {
      const name = handler.commandType.name;
      this.handlersByName.set(name, handler);
    }
  }

  async dispatch<C extends Command>(command: C): Promise<void> {
    const name = (command as any)?.constructor?.name ?? 'UnknownCommand';
    this.logger.info({ command: name }, 'dispatch command');
    const handler = this.handlersByName.get(name);
    if (!handler) throw new Error(`No handler registered for command: ${name}`);
    await handler.handle(command);
  }
}


