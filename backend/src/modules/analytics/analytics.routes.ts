
import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate, requireTenant } from '../../middleware/auth.middleware';

export class AnalyticsRoutes {
  public router: Router;
  private controller: AnalyticsController;

  constructor() {
    this.router = Router();
    this.controller = new AnalyticsController();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.use(authenticate);
    this.router.use(requireTenant);

    // Existing routes...
    this.router.get('/telemetry/:vehicleId', this.controller.getTelemetry);
    this.router.get('/fuel', this.controller.getFuelStats);
    this.router.get('/utilization', this.controller.getUtilization);

    // NEW: Export Logs Endpoint
    this.router.get('/export', this.controller.exportLogs);
  }
}
