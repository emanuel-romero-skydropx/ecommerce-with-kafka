import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from '@koa/router';

export function createHttpApp(routers: Router[] = []): Koa {
  const app = new Koa();
  app.use(bodyParser());

  const health = new Router();
  health.get('/health', (ctx) => {
    ctx.status = 200;
    ctx.body = { status: 'ok' };
  });

  app.use(health.routes()).use(health.allowedMethods());

  for (const moduleRouter of routers) {
    app.use(moduleRouter.routes()).use(moduleRouter.allowedMethods());
  }

  return app;
}


