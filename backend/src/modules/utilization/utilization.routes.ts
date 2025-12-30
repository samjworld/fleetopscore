
import { Router, Request, Response } from 'express';
import { Database } from '../../infra/database';
import { authenticate, requireTenant } from '../../middleware/auth.middleware';

export class UtilizationRoutes {
  public router: Router;

  constructor() {
    this.router = Router({ mergeParams: true });
    this.initRoutes();
  }

  private initRoutes() {
    this.router.use(authenticate);
    this.router.use(requireTenant);

    /**
     * @route   GET /api/v1/fleet/:id/utilization
     * @desc    Calculate active vs idle time distribution for a specific asset
     */
    this.router.get('/:id/utilization', async (req: Request, res: Response) => {
      try {
        const vehicleId = req.params.id;

        const result = await Database.getPool().query(`
            SELECT 
                COUNT(*) FILTER (WHERE speed < 1 AND ignition = true) as idle_ticks,
                COUNT(*) FILTER (WHERE speed >= 1 AND ignition = true) as active_ticks,
                COUNT(*) as total_ticks
            FROM telemetry_log
            WHERE vehicle_id = $1 AND time > NOW() - INTERVAL '7 days'
        `, [vehicleId]);

        const stats = result.rows[0];
        const total = parseInt(stats.total_ticks) || 1;
        const idlePct = (parseInt(stats.idle_ticks) / total) * 100;
        const activePct = (parseInt(stats.active_ticks) / total) * 100;

        res.json({
            data: {
                vehicleId: vehicleId,
                timeframe: '7d',
                utilizationScore: Math.round(activePct),
                idlePercentage: Math.round(idlePct),
                metrics: {
                    totalHours: (total * 10) / 3600, 
                    idleHours: (parseInt(stats.idle_ticks) * 10) / 3600
                }
            }
        });
      } catch (error) {
        res.status(500).json({ error: 'Utilization engine failed' });
      }
    });
  }
}
