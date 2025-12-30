import { TelemetryPayload } from '../ingestion.validation';
import { Buffer } from 'buffer';

/**
 * Protocol Adapter Layer
 * Decouples the API contract from the Database Schema.
 * Allows devices to send compact/proprietary formats.
 */
export class ProtocolAdapter {
  
  /**
   * Converts HTTP JSON (potentially compact) to Internal TelemetryPayload
   */
  public normalizeHttp(raw: any): any {
    // Scenario 1: Device sends standard format
    if (raw.location && raw.metrics) return raw;

    // Scenario 2: Device sends "Compact" bandwidth-saving format (d, ts, gps, m)
    // Example: { d: "v1", ts: 123, gps: [10, 20], m: { f: 50 } }
    if (raw.d && raw.gps) {
      return {
        deviceId: raw.d,
        timestamp: new Date(raw.ts || Date.now()).toISOString(),
        location: {
          lat: raw.gps[0],
          lng: raw.gps[1],
          speed: raw.s || 0,
          heading: raw.h || 0
        },
        metrics: {
          fuelLevel: raw.m?.f,
          engineHours: raw.m?.h,
          rpm: raw.m?.r,
          ignition: raw.m?.i === 1
        },
        events: []
      };
    }

    return raw; // Return raw and let Validator catch errors if unknown
  }

  /**
   * Converts Binary Buffer (TCP) to JSON
   * (Placeholder logic for architecture demonstration)
   */
  public normalizeTcp(buffer: Buffer): any {
    // 1. Read Header (e.g., Device IMEI)
    // 2. Read Body
    // 3. Return TelemetryPayload
    return {};
  }
}