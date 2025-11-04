import 'reflect-metadata';
import type Router from '@koa/router';
import { createHttpApp } from './drivers/http/server';
import { buildContainer } from './app';
import { loadEnv } from './modules/shared/infrastructure/config/env';
import { getOrdersHttpRouters, getOrdersWorkers } from './modules/orders/infrastructure/bootstrap/register.module';
import type { Lifecycle } from './modules/shared/application/ports/Lifecycle';

type WorkerAdapter = Lifecycle & { name: string };

function parseList(value: string | undefined): string[] {
  return (value ?? '').split(',').map((x) => x.trim()).filter(Boolean);
}

async function main(): Promise<void> {
  const env = loadEnv();
  const roles = new Set(parseList(env.APP_ROLE));
  const enabledModules = new Set(parseList(env.MODULES_ENABLED));

  const container = buildContainer();


  const httpRouters: Router[] = [];
  const workerAdapters: WorkerAdapter[] = [];

  if (enabledModules.has('orders')) {
    httpRouters.push(...getOrdersHttpRouters(container));
    workerAdapters.push(...getOrdersWorkers(container));
  }

  const pendingStopHandlers: Array<() => Promise<void>> = [];

  let closeServer: (() => Promise<void>) | null = null;

  if (roles.has('api')) {
    const app = createHttpApp(httpRouters);
    const port = env.PORT;
    const server = app.listen(port, () => {
      console.log(`HTTP listening on :${port}`);
    });
    closeServer = async () => new Promise<void>((res) => server.close(() => res()));
  }

  if (roles.has('workers')) {
    for (const worker of workerAdapters) {
      console.log(`Starting worker: ${worker.name}`);
      await worker.start();
      pendingStopHandlers.push(() => worker.stop());
    }
  }

  const shutdown = async () => {
    console.log('Shutting down...');
    try {
      await Promise.allSettled(pendingStopHandlers.map((stopHandler) => stopHandler()));
      if (closeServer) await closeServer();
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


