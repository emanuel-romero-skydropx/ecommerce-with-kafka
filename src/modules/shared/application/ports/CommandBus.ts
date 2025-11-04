import type { Command } from './Command';

export interface CommandBus {
  dispatch<C extends Command>(command: C): Promise<void>;
}


