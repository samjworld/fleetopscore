
import { Router, Request, Response } from 'express';
import { Database } from '../../infra/database';
import { authenticate, requireTenant } from '../../middleware/auth.middleware';

export class FuelRoutes {
  public router: Router;

  constructor() {
    this.router = Router({ mergeParams: true });
    this.initRoutes();
  }

  private initRoutes() {
    this.router.use(authenticate);
    this.router.use(requireTenant);

    /**
     * @route   GET /api/v1/fleet/:id/fuel
     * @desc    Retrieve fuel consumption analytics and theft incident summary
     */
    this.router.get('/:id/fuel', async (req: Request, res: Response) => {
      try {
        const vehicleId = req.params.id;

        const result = await Database.getPool().query(`
            WITH daily_stats AS (
                SELECT 
                    date_trunc('day', time) as day,
                    MAX(fuel_level) - MIN(fuel_level) as diff_pct,
                    AVG(fuel_level) as avg_level
                FROM telemetry_log
                WHERE vehicle_id = $1 AND time > NOW() - INTERVAL '30 days'
                GROUP BY 1
            )
            SELECT 
                json_agg(json_build_object(
                    'date', day,
                    'consumptionPct', diff_pct,
                    'avgLevel', avg_level
                ) ORDER BY day DESC) as history,
                (SELECT COUNT(*) FROM alerts WHERE vehicle_id = $1 AND type = 'fuel_theft') as theft_incidents
            FROM daily_stats
        `, [vehicleId]);

        const data = result.rows[0];
        
        res.json({
            data: {
                vehicleId: vehicleId,
                totalTheftAlerts: parseInt(data.theft_incidents) || 0,
                consumptionHistory: data.history || []
            }
        });
      } catch (error) {
        res.status(500).json({ error: 'Fuel calculation engine error' });
      }
    });
  }
}
