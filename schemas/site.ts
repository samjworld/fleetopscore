/** THIS SCHEMA IS TRANSPORT-LEVEL ONLY. NO BUSINESS MEANING. */
import { z } from 'zod';
import { TransportBaseSchema } from './common.ts';

export const SiteTransportSchema = TransportBaseSchema.extend({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  managerName: z.string(),
  activeAssets: z.number(),
  riskLevel: z.string(),
  status: z.string(),
});
