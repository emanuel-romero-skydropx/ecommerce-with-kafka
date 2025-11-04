import type { Context } from 'koa';
import { ordersSyncRequestSchema } from '../dtos/orders-sync.dto';
import type { CommandBus } from '../../../shared/application/ports/CommandBus';
import { RequestOrdersSyncCommand } from '../../application/orders-sync/command';

export class OrdersPostController {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(ctx: Context): Promise<void> {
    const parsed = ordersSyncRequestSchema.parse(ctx.request.body ?? {});
    await this.commandBus.dispatch(new RequestOrdersSyncCommand(parsed.shopId, parsed.pages));

    ctx.status = 202;
    ctx.body = { accepted: true, shopId: parsed.shopId, pages: parsed.pages };
  }
}
