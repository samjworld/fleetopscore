/** THIS SCHEMA IS TRANSPORT-LEVEL ONLY. NO BUSINESS MEANING. */
import { z } from 'zod';
import { TransportBaseSchema } from './common.ts';

export const UserTransportSchema = TransportBaseSchema.extend({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  phone: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

export const AuthResponseTransportSchema = z.object({
  token: z.string(),
  user: UserTransportSchema,
});
