import type { Command } from './Command';

export interface CommandHandler<C extends Command = Command> {
  readonly commandType: new (...args: any[]) => C;
  handle(command: C): Promise<void>;
}


