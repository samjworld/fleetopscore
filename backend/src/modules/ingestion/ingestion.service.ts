
import { RedisClient } from '../../infra/redis';
import { Database } from '../../infra/database';
import { logger } from '../../utils/logger';
import { TelemetryEvent } from './ingestion.types';
import * as crypto from 'crypto';

export class IngestionService {
  private redis = RedisClient.getInstance();

  /**
   * Core Pipeline
   */
  public async processEvent(event: TelemetryEvent): Promise<{ duplicate: boolean }> {
    // 1. Deduplication Check
    const isDuplicate = await this.checkDeduplication(event);
    if (isDuplicate) {
      logger.warn(`Duplicate telemetry dropped: ${event.deviceId} @ ${event.timestamp}`);
      return { duplicate: true };
    }

    // 2. Hot State Update (Redis)
    await this.updateHotState(event);

    // 3. Buffer to Stream (Redis Stream / Kafka)
    await this.pushToStream(event);

    // 4. Persistence to TimescaleDB
    this.persistToTimeScale(event);
    
    return { duplicate: false };
  }

  private async checkDeduplication(event: TelemetryEvent): Promise<boolean> {
    const signature = `${event.deviceId}:${event.timestamp}:${event.location.lat}:${event.location.lng}`;
    const hash = crypto.createHash('md5').update(signature).digest('hex');
    const key = `dedup:${hash}`;

    const result = await this.redis.set(key, '1', 'EX', 600, 'NX');
    return result === null; 
  }

  private async updateHotState(event: TelemetryEvent) {
    const isOfflineData = (Date.now() - new Date(event.timestamp).getTime()) > 1000 * 60 * 10;

    if (!isOfflineData) {
        await this.redis.hset(
            `device:${event.deviceId}:state`,
            {
                lat: event.location.lat,
                lng: event.location.lng,
                speed: event.location.speed,
                fuel: event.metrics.fuelLevel,
                lastSeen: event.timestamp
            }
        );
    }
  }

  private async pushToStream(event: TelemetryEvent) {
    await this.redis.xadd(
      'telemetry:stream',
      '*',
      'payload', JSON.stringify(event)
    );
  }

  /**
   * Writes to telemetry_log (Hypertable).
   * Note: In a high-scale production env, this would be batched 
   * or handled by a consumer worker reading from the stream.
   */
  private async persistToTimeScale(event: TelemetryEvent) {
    const query = `
      INSERT INTO telemetry_log (time, vehicle_id, lat, lng, speed, fuel_level, rpm, engine_hours, ignition)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    
    try {
      await Database.getPool().query(query, [
        event.timestamp,
        event.deviceId,
        event.location.lat,
        event.location.lng,
        event.location.speed,
        event.metrics.fuelLevel,
        event.metrics.rpm,
        event.metrics.engineHours,
        event.metrics.ignition
      ]);
    } catch (e) {
      logger.error('TimescaleDB Persist Error', e);
    }
  }
}
