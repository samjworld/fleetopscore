
import { Router, Request, Response } from 'express';
import { Database } from '../../infra/database';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.middleware';

export class MaintenanceRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.use(authenticate);
    this.router.use(requireTenant);

    /**
     * @route   GET /api/v1/maintenance
     * @desc    List maintenance schedules
     */
    this.router.get('/', async (req: Request, res: Response) => {
      try {
        const result = await Database.getPool().query(`
          SELECT m.*, v.name as "vehicleName"
          FROM maintenance_schedules m
          JOIN vehicles v ON m.vehicle_id = v.id
          WHERE v.tenant_id = $1
          ORDER BY m.due_date ASC
        `, [req.user!.tenantId]);
        res.json({ data: result.rows });
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch maintenance tasks' });
      }
    });

    /**
     * @route   POST /api/v1/maintenance
     * @desc    Schedule new maintenance
     */
    this.router.post('/', authorize(['maintenance_manager', 'super_admin']), async (req: Request, res: Response) => {
      const { vehicleId, type, dueDate, priority } = req.body;
      try {
        const id = crypto.randomUUID();
        await Database.getPool().query(
          `INSERT INTO maintenance_schedules (id, vehicle_id, type, due_date, priority, status)
           VALUES ($1, $2, $3, $4, $5, 'scheduled')`,
          [id, vehicleId, type, dueDate, priority]
        );
        res.status(201).json({ id, message: 'Maintenance scheduled' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to schedule maintenance' });
      }
    });
  }
}
