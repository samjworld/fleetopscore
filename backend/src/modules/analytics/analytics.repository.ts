
import { Database } from '../../infra/database';

export class AnalyticsRepository {
  public async getLogsForExport(filters: { 
    tenantId: string, 
    vehicleId?: string, 
    start?: string, 
    end?: string 
  }) {
    let query = `
      SELECT 
        l.timestamp, 
        v.name as vehicle_name, 
        l.lat, 
        l.lng, 
        l.speed, 
        l.fuel_level, 
        l.rpm, 
        l.engine_hours
      FROM telemetry_log l
      JOIN vehicles v ON l.vehicle_id = v.id
      WHERE v.tenant_id = $1
    `;
    const params: any[] = [filters.tenantId];

    if (filters.vehicleId && filters.vehicleId !== 'all') {
      params.push(filters.vehicleId);
      query += ` AND l.vehicle_id = $${params.length}`;
    }

    if (filters.start) {
      params.push(filters.start);
      query += ` AND l.timestamp >= $${params.length}`;
    }

    if (filters.end) {
      params.push(filters.end);
      query += ` AND l.timestamp <= $${params.length}`;
    }

    query += ` ORDER BY l.timestamp DESC LIMIT 10000`; // Safety limit for CSV

    const result = await Database.getPool().query(query, params);
    return result.rows;
  }
}
