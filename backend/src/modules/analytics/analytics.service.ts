
import { RedisClient } from '../../infra/redis';
import { Database } from '../../infra/database';
import { logger } from '../../utils/logger';
import { TelemetryEvent } from '../ingestion/ingestion.types';
import { AnalyticsRepository } from './analytics.repository';

export class AnalyticsService {
  private repo: AnalyticsRepository;
  private redis = RedisClient.getInstance();

  constructor() {
    this.repo = new AnalyticsRepository();
  }

  /**
   * Main Pipeline for Telemetry Processing
   */
  public async analyze(event: TelemetryEvent) {
    try {
      const deviceId = event.deviceId;
      const tenantId = event.tenantId || 'unknown';

      // 1. Fetch Previous State from Redis
      const stateKey = `device:${deviceId}:last_state`;
      const rawPrevState = await this.redis.get(stateKey);
      const prevState = rawPrevState ? JSON.parse(rawPrevState) : null;

      // 2. Anomaly Detection
      await this.detectOverspeed(event, tenantId);
      if (prevState) {
        await this.detectFuelTheft(event, prevState, tenantId);
      }

      // 3. Update Aggregates (Utilization)
      await this.updateUtilization(event, prevState, tenantId);

      // 4. Save Current State to Redis for next iteration
      await this.redis.set(stateKey, JSON.stringify({
        fuelLevel: event.metrics.fuelLevel,
        timestamp: event.timestamp,
        lat: event.location.lat,
        lng: event.location.lng,
        odometer: event.metrics.odometer
      }), 'EX', 86400); // 24h TTL

    } catch (error) {
      logger.error(`Analysis failed for device ${event.deviceId}`, error);
    }
  }

  private async detectOverspeed(event: TelemetryEvent, tenantId: string) {
    const SPEED_THRESHOLD = 110; // km/h
    if (event.location.speed && event.location.speed > SPEED_THRESHOLD) {
      await this.generateAlert(tenantId, event.deviceId, 'overspeed', 'high', 
        `High Speed Violation: ${Math.round(event.location.speed)} km/h detected.`);
    }
  }

  private async detectFuelTheft(event: TelemetryEvent, prevState: any, tenantId: string) {
    if (event.metrics.fuelLevel === undefined || prevState.fuelLevel === undefined) return;

    const fuelDrop = prevState.fuelLevel - event.metrics.fuelLevel;
    const timeGapSeconds = (new Date(event.timestamp).getTime() - new Date(prevState.timestamp).getTime()) / 1000;

    // Logic: If fuel drops more than 5% within 2 minutes while engine is off or speed is 0
    if (fuelDrop > 5 && timeGapSeconds < 120 && (event.location.speed || 0) < 1) {
      await this.generateAlert(tenantId, event.deviceId, 'fuel_drop', 'critical', 
        `CRITICAL: Sudden fuel drop of ${fuelDrop.toFixed(1)}% detected while stationary.`);
    }
  }

  private async updateUtilization(event: TelemetryEvent, prevState: any, tenantId: string) {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    
    let distanceDelta = 0;
    if (prevState && event.metrics.odometer && prevState.odometer) {
        distanceDelta = Math.max(0, event.metrics.odometer - prevState.odometer);
    }

    const isIdle = (event.location.speed || 0) < 1 && event.metrics.ignition;
    const isActive = (event.location.speed || 0) >= 1 && event.metrics.ignition;

    // Period is assumed 10s based on typical ingestion frequency (or calc from timestamp)
    const tickSeconds = prevState 
        ? Math.min(60, (new Date(event.timestamp).getTime() - new Date(prevState.timestamp).getTime()) / 1000)
        : 10;

    const query = `
      INSERT INTO utilization_daily (tenant_id, machine_id, date, total_distance, engine_on_seconds, idle_seconds)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (machine_id, date) DO UPDATE SET
        total_distance = utilization_daily.total_distance + EXCLUDED.total_distance,
        engine_on_seconds = utilization_daily.engine_on_seconds + EXCLUDED.engine_on_seconds,
        idle_seconds = utilization_daily.idle_seconds + EXCLUDED.idle_seconds,
        updated_at = NOW()
    `;

    await Database.getPool().query(query, [
      tenantId,
      event.deviceId,
      date,
      distanceDelta,
      event.metrics.ignition ? tickSeconds : 0,
      isIdle ? tickSeconds : 0
    ]);
  }

  private async generateAlert(tenantId: string, vehicleId: string, type: string, severity: string, message: string) {
    const id = crypto.randomUUID();
    await Database.getPool().query(
      `INSERT INTO alerts (id, tenant_id, vehicle_id, type, severity, message, timestamp, status)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'new')`,
      [id, tenantId, vehicleId, type, severity, message]
    );
    logger.warn(`Alert Generated: [${type}] for vehicle ${vehicleId}`);
  }

  public async generateCsvExport(filters: { 
    tenantId: string, 
    vehicleId?: string, 
    start?: string, 
    end?: string 
  }): Promise<string> {
    const data = await this.repo.getLogsForExport(filters);
    
    if (data.length === 0) return "No data found for the selected period";

    const header = "Timestamp,Vehicle,Lat,Lng,Speed(km/h),Fuel(%),RPM,EngineHours\n";
    const rows = data.map(row => {
      return `${row.timestamp},"${row.vehicle_name}",${row.lat},${row.lng},${row.speed},${row.fuel_level},${row.rpm},${row.engine_hours}`;
    }).join("\n");

    return header + rows;
  }
}
