/** THIS SCHEMA IS TRANSPORT-LEVEL ONLY. NO BUSINESS MEANING. */
import { z } from 'zod';

export const JobHistoryTransportSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  description: z.string(),
  actorName: z.string(),
});

export const JobTransportSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  vehicleId: z.string(),
  vehicleName: z.string(),
  driverName: z.string(),
  status: z.string(),
  location: z.string(),
  priority: z.string(),
  dueDate: z.string(),
  estimatedHours: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  statusHistory: z.array(JobHistoryTransportSchema).optional(),
});

// Fix: Aliased to match project usage
export const JobSchema = JobTransportSchema;