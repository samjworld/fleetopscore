/** THIS SCHEMA IS TRANSPORT-LEVEL ONLY. NO BUSINESS MEANING. */
import { z } from 'zod';
import { TransportBaseSchema } from './common.ts';

export const VehicleTransportSchema = TransportBaseSchema.extend({
  id: z.string(),
  name: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number(),
  vin: z.string(),
  status: z.string(),
  fuelLevel: z.number(),
  fuelType: z.string(),
  engineHours: z.number(),
  odometer: z.number(),
  lastLat: z.number(),
  lastLng: z.number(),
  lastSeen: z.string(),
});

// Fix: Aliased to match project usage
export const VehicleSchema = VehicleTransportSchema;

export const TelemetryPacketTransportSchema = z.object({
  deviceId: z.string(),
  timestamp: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    speed: z.number(),
    heading: z.number().optional(),
  }),
  metrics: z.object({
    fuelLevel: z.number().optional(),
    engineHours: z.number().optional(),
    rpm: z.number().optional(),
    ignition: z.boolean().optional(),
  }),
});

// Fix: Aliased to match project usage
export const TelemetryPacketSchema = TelemetryPacketTransportSchema;

export const FuelRecordTransportSchema = z.object({
  id: z.string(),
  vehicleId: z.string(),
  vehicleName: z.string(),
  volume: z.number(),
  cost: z.number(),
  odometer: z.number(),
  date: z.string(),
  time: z.string(),
  operator: z.string(),
});

// Fix: Aliased to match project usage
export const FuelEventSchema = FuelRecordTransportSchema;