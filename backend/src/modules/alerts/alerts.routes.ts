
import { Router, Request, Response } from 'express';
import { Database } from '../../infra/database';
import { authenticate, authorize, requireTenant } from '../../middleware/auth.middleware';
// Note: io is assumed to be globally available or passed via app context. 
// For this architecture demo, we assume the persistence emits the event or we mock the socket call.

export class AlertsRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.use(authenticate);
    this.router.use(requireTenant);

    /**
     * @route   GET /api/v1/alerts
     * @desc    Get paginated alerts
     */
    this.router.get('/', async (req: Request, res: Response) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;
      const status = req.query.status;
      const severity = req.query.severity;

      try {
        let query = `
          SELECT a.*, v.name as "vehicleName" 
          FROM alerts a
          LEFT JOIN vehicles v ON a.vehicle_id = v.id
          WHERE (v.tenant_id = $1 OR a.tenant_id = $1)
        `;
        const params: any[] = [req.user!.tenantId];

        if (status && status !== 'all') {
            query += ` AND a.status = $${params.length + 1}`;
            params.push(status);
        }

        if (severity && severity !== 'all') {
            query += ` AND a.severity = $${params.length + 1}`;
            params.push(severity);
        }

        query += ` ORDER BY a.timestamp DESC LIMIT ${limit} OFFSET ${offset}`;

        const result = await Database.getPool().query(query, params);
        res.json({ data: result.rows });
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch alerts' });
      }
    });

    /**
     * @route   POST /api/v1/alerts
     * @desc    Create a manual alert (Emergency)
     */
    this.router.post('/', async (req: Request, res: Response) => {
      const { message, type, severity } = req.body;
      const tenantId = req.user!.tenantId;
      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      try {
        await Database.getPool().query(
          `INSERT INTO alerts (id, tenant_id, message, type, severity, timestamp, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'new')`,
          [id, tenantId, message, type || 'manual', severity || 'medium', timestamp]
        );

        // In a real setup, we would emit the socket event here
        // (req.app.get('io') as any).to(tenantId).emit('alert', { id, message, severity, ... });

        res.status(201).json({ id, message: 'Alert created' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create alert' });
      }
    });

    /**
     * @route   PATCH /api/v1/alerts/:id/status
     * @desc    Acknowledge or Resolve an alert
     */
    this.router.patch('/:id/status', async (req: Request, res: Response) => {
      const { status } = req.body;
      if (!['acknowledged', 'resolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      try {
        await Database.getPool().query(
          `UPDATE alerts SET status = $1 WHERE id = $2`,
          [status, req.params.id]
        );
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update alert' });
      }
    });
  }
}
