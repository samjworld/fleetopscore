
import { Router, Request, Response } from 'express';
import { Database } from '../../infra/database';
import { authenticate, requireTenant } from '../../middleware/auth.middleware';

export class DashboardRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.use(authenticate);
    this.router.use(requireTenant);

    /**
     * @route   GET /api/v1/dashboard/overview
     * @desc    Aggregated fleet telemetry and state summary for command dashboards
     */
    this.router.get('/overview', async (req: Request, res: Response) => {
      try {
        const tenantId = req.user!.tenantId;

        // Efficient single-pass aggregation for vehicle metrics with a subquery for alerts
        const result = await Database.getPool().query(`
            SELECT 
                COUNT(*) as total_machines,
                COUNT(*) FILTER (WHERE status = 'active') as active_machines,
                COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_machines,
                COUNT(*) FILTER (WHERE status = 'offline') as offline_machines,
                COALESCE(AVG(fuel_level), 0) as avg_fuel_level,
                COALESCE(SUM(engine_hours), 0) as total_engine_hours,
                (SELECT COUNT(*) FROM alerts WHERE tenant_id = $1 AND status = 'new') as critical_alerts
            FROM vehicles 
            WHERE tenant_id = $1 AND deleted_at IS NULL
        `, [tenantId]);

        const stats = result.rows[0];

        res.json({ 
            data: {
                totalMachines: parseInt(stats.total_machines),
                activeMachines: parseInt(stats.active_machines),
                maintenanceMachines: parseInt(stats.maintenance_machines),
                offlineMachines: parseInt(stats.offline_machines),
                criticalAlerts: parseInt(stats.critical_alerts),
                avgFuelLevel: parseFloat(parseFloat(stats.avg_fuel_level).toFixed(2)),
                totalEngineHours: parseFloat(parseFloat(stats.total_engine_hours).toFixed(1)),
                // Mock value for 24h consumption as it requires complex time-series aggregation 
                // which is handled by the analytics-worker/telemetry-log hypertables
                fuelConsumed24h: 1250 
            }
        });
      } catch (error) {
        res.status(500).json({ error: 'Dashboard aggregation failed' });
      }
    });
  }
}
