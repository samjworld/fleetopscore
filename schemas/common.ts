/** THIS SCHEMA IS TRANSPORT-LEVEL ONLY. NO BUSINESS MEANING. */
import { z } from 'zod';

export const TransportBaseSchema = z.object({
  tenantId: z.string(),
  version: z.number(),
  createdBy: z.string(),
  updatedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Fix: Renamed to match the import expectations in query hooks
export const createPaginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) => 
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    }),
  });