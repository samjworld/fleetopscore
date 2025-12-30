import { create } from 'zustand';
import { Vehicle } from '../types.ts';
import { z } from 'zod';
import { TelemetryPacketSchema } from '../schemas/fleet.ts';

type TelemetryPacket = z.infer<typeof TelemetryPacketSchema>;

interface FleetState {
  vehicles: Record<string, Vehicle>;
  
  // Actions
  setVehicles: (vehicles: Vehicle[]) => void;
  batchUpdateTelemetry: (packets: TelemetryPacket[]) => void;
}

/**
 * Performance Optimized Fleet Store
 * Prevents unnecessary re-renders via selective state slicing
 */
export const useFleetStore = create<FleetState>((set) => ({
  vehicles: {},

  setVehicles: (vehicles) => {
    const map = vehicles.reduce((acc, v) => {
      acc[v.id] = v;
      return acc;
    }, {} as Record<string, Vehicle>);
    set({ vehicles: map });
  },

  /**
   * Atomic Batch Update
   * Merges multiple telemetry packets into the state at once
   */
  batchUpdateTelemetry: (packets) => {
    set((state) => {
      const updatedVehicles = { ...state.vehicles };
      let hasChanges = false;

      packets.forEach(packet => {
        const existing = updatedVehicles[packet.deviceId];
        if (existing) {
          updatedVehicles[packet.deviceId] = {
            ...existing,
            lastLat: packet.location.lat,
            lastLng: packet.location.lng,
            fuelLevel: packet.metrics.fuelLevel ?? existing.fuelLevel,
            engineHours: packet.metrics.engineHours ?? existing.engineHours,
            lastSeen: packet.timestamp,
          };
          hasChanges = true;
        }
      });

      return hasChanges ? { vehicles: updatedVehicles } : state;
    });
  }
}));