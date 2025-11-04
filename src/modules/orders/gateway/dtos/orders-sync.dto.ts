import { z } from 'zod';

export const ordersSyncRequestSchema = z.object({
  shopId: z.string().min(1),
  pages: z.number().int().min(1)
});

export type OrdersSyncRequest = z.infer<typeof ordersSyncRequestSchema>;


