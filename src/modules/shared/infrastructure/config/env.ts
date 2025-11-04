import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  APP_ROLE: z.string().default('api'),
  MODULES_ENABLED: z.string().default('orders'),
  EVENT_TRANSPORT: z.enum(['kafka', 'inmemory']).default('kafka'),
  KAFKA_BROKERS: z.string().min(1),
  KAFKA_CLIENT_ID: z.string().min(1),
  KAFKA_ORDERS_GROUP: z.string().min(1),
  SHOPIFY_BASE_URL: z.string().url(),
  SHOPIFY_TOKEN: z.string().min(1)
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(from: Record<string, string | undefined> = process.env): Env {
  return envSchema.parse(from);
}
