import { Database } from '../../infra/database';
import { logger } from '../../utils/logger';

export interface AuditEntry {
  tenantId: string;
  actorId?: string;
  actorType: 'user' | 'system' | 'device';
  action: string;
  resourceType: string;
  resourceId: string;
  ip?: string;
  metadata?: any;
}

export class AuditService {
  /**
   * Asynchronously writes to the Audit Log.
   * Does not block the main request thread.
   */
  public static async log(entry: AuditEntry) {
    // Fire and forget (or queue in Redis/Kafka in high-scale)
    setTimeout(async () => {
      try {
        await Database.getPool().query(
          `INSERT INTO audit_logs 
           (tenant_id, actor_id, actor_type, action, resource_type, resource_id, ip_address, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            entry.tenantId,
            entry.actorId,
            entry.actorType,
            entry.action,
            entry.resourceType,
            entry.resourceId,
            entry.ip || '0.0.0.0',
            JSON.stringify(entry.metadata || {})
          ]
        );
      } catch (error) {
        // Fallback logging if DB fails - never lose an audit trail
        logger.error('CRITICAL: Failed to write audit log', { error, entry });
      }
    }, 0);
  }
}
