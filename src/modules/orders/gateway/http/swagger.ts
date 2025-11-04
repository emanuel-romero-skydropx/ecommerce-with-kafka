import Router from '@koa/router';
import { koaSwagger } from 'koa2-swagger-ui';
import YAML from 'yamljs';
import path from 'node:path';

const openapiDoc = YAML.load(
  path.resolve('src/modules/orders/gateway/http/openapi/openapi.yaml')
);

const router = new Router();
router.get(
  '/docs/orders',
  koaSwagger({ routePrefix: false, swaggerOptions: { spec: openapiDoc } })
);

export const ordersSwagger = router;


