
import { z } from 'zod';

export const TelemetryPayloadSchema = z.object({
  deviceId: z.string().min(1),
  timestamp: z.string().datetime(), // ISO 8601
  fuelLevel: z.number().min(0).max(100).optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    speed: z.number().min(0).max(300).optional().default(0), 
    heading: z.number().min(0).max(360).optional(),
    altitude: z.number().optional(),
  }),
  metrics: z.object({
    fuelLevel: z.number().min(0).max(100).optional(),
    engineTemp: z.number().optional(),
    rpm: z.number().min(0).max(10000).optional(),
    engineHours: z.number().min(0).optional(),
    odometer: z.number().min(0).optional(),
    ignition: z.boolean().optional(),
  }),
  events: z.array(z.string()).optional()
});

export const BatchTelemetrySchema = z.object({
    events: z.array(z.any()) // Validation happens per-item in controller
});

export type TelemetryPayload = z.infer<typeof TelemetryPayloadSchema>;
