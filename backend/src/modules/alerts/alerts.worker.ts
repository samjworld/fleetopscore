
import { EventBus } from '../../shared/infra/event-bus';
import { Database } from '../../infra/database';
import { RedisClient } from '../../infra/redis';
import { logger } from '../../utils/logger';

// Configuration
const STREAM_INPUT = 'telemetry:stream';
const STREAM_OUTPUT = 'events:alerts:generated';

export class AlertsWorker {
  private bus: EventBus;
  private redis = RedisClient.getInstance();

  constructor() {
    this.bus = new EventBus('alerts-service-group');
  }

  public async start() {
    await this.bus.subscribe(STREAM_INPUT, async (telemetry: any, msgId) => {
      await this.processTelemetry(telemetry);
    });
  }

  private async processTelemetry(data: any) {
    // 1. Speed Check Rule
    if (data.location?.speed > 110) {
      await this.triggerAlert(data, 'overspeed', 'critical', `Speed detected: ${data.location.speed} km/h`);
    }

    // 2. Geofence Rule (Stateful Check)
    // Needs to know "Was inside?" vs "Is inside?"
    const geofenceKey = `state:${data.deviceId}:geofence`;
    const wasInside = await this.redis.get(geofenceKey) === '1';
    const isInside = this.checkGeofencePolygon(data.location.lat, data.location.lng);

    if (wasInside && !isInside) {
      await this.triggerAlert(data, 'geofence_exit', 'medium', 'Vehicle left authorized zone');
      await this.redis.set(geofenceKey, '0');
    } else if (!wasInside && isInside) {
      await this.redis.set(geofenceKey, '1');
    }
  }

  private async triggerAlert(data: any, type: string, severity: string, msg: string) {
    const alert = {
      id: crypto.randomUUID(),
      vehicleId: data.deviceId,
      type,
      severity,
      message: msg,
      timestamp: new Date().toISOString(),
      location: data.location
    };

    // A. Persist to DB
    await Database.getPool().query(
      `INSERT INTO alerts (id, vehicle_id, type, severity, message, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
      [alert.id, alert.vehicleId, alert.type, alert.severity, alert.message, alert.timestamp]
    );

    // B. Emit Event for Push Notifications/UI
    await this.bus.publish(STREAM_OUTPUT, 'AlertCreated', alert);
    
    logger.info(`[Alert Generated] ${type} for ${data.deviceId}`);
  }

  // Placeholder for Point-in-Polygon logic
  private checkGeofencePolygon(lat: number, lng: number): boolean {
    // Mock logic: Center of LA, 10km radius
    const center = { lat: 34.0522, lng: -118.2437 };
    const dist = Math.sqrt(Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2));
    return dist < 0.1; 
  }
}
