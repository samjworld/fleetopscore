
import { Request, Response, NextFunction } from 'express';
import { IngestionService } from './ingestion.service';
import { TelemetryPayloadSchema, BatchTelemetrySchema } from './ingestion.validation';
import { logger } from '../../utils/logger';
import { ProtocolAdapter } from './adapters/protocol.adapter';

export class IngestionController {
  private service: IngestionService;
  private adapter: ProtocolAdapter;

  constructor() {
    this.service = new IngestionService();
    this.adapter = new ProtocolAdapter();
  }

  /**
   * Single Packet Ingestion
   */
  public ingestHttp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Normalize Payload (Convert compact JSON to internal Standard)
      const normalizedEvent = this.adapter.normalizeHttp(req.body);

      // 2. Validate Standard Schema
      const validation = TelemetryPayloadSchema.safeParse(normalizedEvent);
      if (!validation.success) {
        return res.status(400).json({ error: 'Schema Validation Failed', details: validation.error.errors });
      }

      // 3. Process
      const result = await this.service.processEvent(validation.data);

      if (result.duplicate) {
         return res.status(200).json({ status: 'ignored_duplicate' });
      }

      return res.status(202).json({ accepted: true });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Batch Ingestion (Handling offline data dumps)
   */
  public ingestBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = BatchTelemetrySchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Batch Validation Failed', details: validation.error.errors });
        }

        // Process in parallel, but handle failures individually
        const promises = validation.data.events.map(async (rawEvent) => {
            try {
                const normalized = this.adapter.normalizeHttp(rawEvent);
                // In a batch, we validate individually. If one fails, we log but don't fail the whole batch.
                const validEvent = TelemetryPayloadSchema.parse(normalized);
                await this.service.processEvent(validEvent);
                return { success: true };
            } catch (e) {
                return { success: false, error: e };
            }
        });

        const results = await Promise.all(promises);
        const failures = results.filter(r => !r.success).length;

        return res.status(200).json({ 
            received: results.length, 
            processed: results.length - failures,
            failures 
        });

    } catch (error) {
        next(error);
    }
  };
}
