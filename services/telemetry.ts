import { socketManager } from './socket.ts';
import { TelemetryPacketSchema } from '../schemas/fleet.ts';
import { useFleetStore } from '../store/fleetStore.ts';
import { logger } from '../utils/logger.ts';
import { z } from 'zod';

/**
 * Enterprise Telemetry Processor
 * Batches high-frequency updates to prevent UI thread blocking
 */
class TelemetryService {
  private buffer = new Map<string, z.infer<typeof TelemetryPacketSchema>>();
  private flushInterval = 500; // ms
  private timer: any = null;
  private activeVehicleIds = new Set<string>(); // Filter for visible assets

  constructor() {
    this.start();
  }

  public start() {
    // 1. Listen for raw telemetry from socket manager
    socketManager.subscribe('telemetry:packet', (raw) => {
      const result = TelemetryPacketSchema.safeParse(raw);
      
      if (!result.success) {
        logger.warn('[Telemetry] Dropped malformed packet', result.error);
        return;
      }

      const packet = result.data;

      // 2. Viewport Filtering (Scale Optimization)
      // Only buffer if we care about this vehicle (visible or tracked)
      if (this.activeVehicleIds.size > 0 && !this.activeVehicleIds.has(packet.deviceId)) {
        return;
      }

      // 3. Update Buffer (O(1) Map update ensures we only keep the LATEST state)
      this.buffer.set(packet.deviceId, packet);
    });

    // 4. Batch Commit Timer
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  /**
   * Defines which vehicles the UI currently needs updates for.
   * Typically called by map components on moveend.
   */
  public setFocusList(vehicleIds: string[]) {
    this.activeVehicleIds = new Set(vehicleIds);
  }

  private flush() {
    if (this.buffer.size === 0) return;

    const packets = Array.from(this.buffer.values());
    this.buffer.clear();

    // Commit to Global Store in a single atomic action
    useFleetStore.getState().batchUpdateTelemetry(packets);
  }

  public stop() {
    if (this.timer) clearInterval(this.timer);
  }
}

export const telemetryService = new TelemetryService();