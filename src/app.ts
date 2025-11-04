import 'reflect-metadata';
import { Container } from 'inversify';
import type { Logger } from 'pino';

import { registerSharedModule } from './modules/shared/infrastructure/bootstrap/register.module';
import { getOrdersHttpRouters, getOrdersWorkers, registerOrdersModule } from './modules/orders/infrastructure/bootstrap/register.module';
import { TYPES } from './modules/shared/domain/d-injection/types';
import { createHttpApp } from './drivers/http/server';
import { connectToMongoDB } from './modules/shared/infrastructure/database/mongoose';

export async function bootstrap() {
  const container = new Container({ defaultScope: 'Singleton' });

  registerSharedModule(container);
  registerOrdersModule(container);

  const logger = container.get<Logger>(TYPES.Logger);
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    logger.error('MONGO_URI is not defined');
    process.exit(1);
  }

  await connectToMongoDB(mongoUri, logger);

  const role = process.env.APP_ROLE ?? 'api';
  logger.info(`Application running in role: ${role}`);

  if (role === 'api') {
    const routers = getOrdersHttpRouters(container);
    const server = createHttpApp(routers);
    const port = Number(process.env.PORT) || 3000;

    server.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    });

  } else if (role === 'worker' || role === 'workers') {
    const [worker] = getOrdersWorkers(container);
    await worker.start();
  }
}
