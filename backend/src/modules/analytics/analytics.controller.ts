
import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { logger } from '../../utils/logger';

export class AnalyticsController {
  private service: AnalyticsService;

  constructor() {
    this.service = new AnalyticsService();
  }

  public getTelemetry = async (req: Request, res: Response) => {
    // ... logic from previous routes.ts
  };

  public getFuelStats = async (req: Request, res: Response) => {
    // ... logic from previous routes.ts
  };

  public getUtilization = async (req: Request, res: Response) => {
    // ... logic from previous routes.ts
  };

  public exportLogs = async (req: Request, res: Response) => {
    try {
      const { start, end, vehicleId } = req.query;
      const tenantId = req.user!.tenantId;

      const csvContent = await this.service.generateCsvExport({
        tenantId,
        vehicleId: vehicleId as string,
        start: start as string,
        end: end as string
      });

      const filename = `fleet-logs-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (error) {
      logger.error('Export Failed', error);
      res.status(500).json({ error: 'Failed to generate export' });
    }
  };
}
