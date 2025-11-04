import type { Command } from '../../../shared/application/ports/Command';

export class RequestOrdersSyncCommand implements Command {
  constructor(public readonly shopId: string, public readonly pages: number) {}
}


