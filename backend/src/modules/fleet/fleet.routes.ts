
import { Router, Request, Response } from 'express';
import { Database } from '../../infra/database';
import { authenticate, requireTenant } from '../../middleware/auth.middleware';

export class FleetRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.use(authenticate);
    this.router.use(requireTenant);

    /**
     * @route   GET /api/v1/fleet
     * @desc    List all machines belonging to the authenticated tenant
     */
    this.router.get('/', async (req: Request, res: Response) => {
      try {
        const result = await Database.getPool().query(`
          SELECT 
            v.*,
            (SELECT json_build_object('lat', lat, 'lng', lng, 'speed', speed, 'fuelLevel', fuel_level, 'timestamp', time) 
             FROM telemetry_log 
             WHERE vehicle_id = v.id 
             ORDER BY time DESC LIMIT 1) as "lastTelemetry"
          FROM vehicles v
          WHERE v.tenant_id = $1 AND v.deleted_at IS NULL
          ORDER BY v.name ASC
        `, [req.user!.tenantId]);
        res.json({ data: result.rows });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve fleet registry' });
      }
    });

    /**
     * @route   GET /api/v1/fleet/:id
     * @desc    Retrieve detailed machine profile
     */
    this.router.get('/:id', async (req: Request, res: Response) => {
      try {
        const vehicle = await Database.getPool().query(
          'SELECT * FROM vehicles WHERE id = $1 AND tenant_id = $2',
          [req.params.id, req.user!.tenantId]
        );
        
        if (vehicle.rows.length === 0) {
          return res.status(404).json({ error: 'Resource not found' });
        }

        res.json({ data: vehicle.rows[0] });
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve asset details' });
      }
    });
  }
}
