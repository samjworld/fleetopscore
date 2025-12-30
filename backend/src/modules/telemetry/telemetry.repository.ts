
import { Database } from '../../infra/database';

export interface TelemetryData {
  machineId: string;
  timestamp: Date;
  fuelLevel: number;
  speed: number;
  rpm: number;
  payload: any;
}

export class TelemetryRepository {
  /**
   * Writes to the hypertable. 
   * TimescaleDB handles the partitioning automatically based on the 'time' column.
   */
  async save(data: TelemetryData): Promise<void> {
    const query = `
      INSERT INTO telemetry_log 
      (vehicle_id, time, fuel_level, speed, rpm)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    await Database.getPool().query(query, [
      data.machineId,
      data.timestamp,
      data.fuelLevel,
      data.speed,
      data.rpm
    ]);
  }
  
  /**
   * Uses the optimized index (vehicle_id, time DESC) for fast retrieval of the latest state.
   */
  async getLastReading(machineId: string): Promise<TelemetryData | null> {
    const query = `
        SELECT 
          vehicle_id as "machineId", 
          time as "timestamp", 
          fuel_level as "fuelLevel", 
          speed, 
          rpm
        FROM telemetry_log 
        WHERE vehicle_id = $1 
        ORDER BY time DESC 
        LIMIT 1
    `;
    const res = await Database.getPool().query(query, [machineId]);
    return res.rows[0] || null;
  }

  /**
   * Time-series bucketed query example
   */
  async getFuelHistory(machineId: string, interval: string = '1 hour') {
    const query = `
      SELECT 
        time_bucket($1, time) AS bucket,
        avg(fuel_level) as avg_fuel
      FROM telemetry_log
      WHERE vehicle_id = $2 AND time > NOW() - INTERVAL '24 hours'
      GROUP BY bucket
      ORDER BY bucket ASC
    `;
    const res = await Database.getPool().query(query, [interval, machineId]);
    return res.rows;
  }
}
