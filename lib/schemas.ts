
import { z } from 'zod';
import { Role, FuelType } from '../types';

/**
 * Enterprise Entity Base Schema
 */
export const EntitySchema = z.object({
  tenantId: z.string().uuid(),
  version: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * User Profile Schema
 */
export const UserSchema = EntitySchema.extend({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.nativeEnum(Role),
  phone: z.string().optional(),
  skills: z.array(z.string()).default([]),
});

/**
 * Vehicle / Machine Asset Schema
 */
export const VehicleSchema = EntitySchema.extend({
  id: z.string(),
  name: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  vin: z.string(),
  status: z.enum(['active', 'maintenance', 'offline', 'idle']),
  fuelLevel: z.number().min(0).max(100),
  fuelType: z.nativeEnum(FuelType),
  engineHours: z.number().nonnegative(),
  odometer: z.number().nonnegative(),
  lastLat: z.number().min(-90).max(90),
  lastLng: z.number().min(-180).max(180),
  lastSeen: z.string().datetime(),
});

/**
 * Telemetry Packet Schema
 */
export const TelemetryPacketSchema = z.object({
  deviceId: z.string(),
  timestamp: z.string().datetime(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    speed: z.number().default(0),
  }),
  metrics: z.object({
    fuelLevel: z.number().optional(),
    engineHours: z.number().optional(),
    ignition: z.boolean().optional(),
  }),
});

export type ValidUser = z.infer<typeof UserSchema>;
export type ValidVehicle = z.infer<typeof VehicleSchema>;
export type ValidTelemetry = z.infer<typeof TelemetryPacketSchema>;
