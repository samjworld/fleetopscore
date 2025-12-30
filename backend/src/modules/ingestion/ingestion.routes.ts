
import { Router } from 'express';
import { IngestionController } from './ingestion.controller';
import { verifyDeviceSignature } from '../../middleware/device.auth.middleware';

export class IngestionRoutes {
  public router: Router;
  private controller: IngestionController;

  constructor() {
    this.router = Router();
    this.controller = new IngestionController();
    this.initRoutes();
  }

  private initRoutes() {
    // Standard HTTP Ingestion - Secured via HMAC
    this.router.post(
      '/telemetry', 
      verifyDeviceSignature, 
      this.controller.ingestHttp
    );
    
    // Batch Ingestion - Secured via HMAC
    this.router.post(
      '/telemetry/batch', 
      verifyDeviceSignature, 
      this.controller.ingestBatch
    );
  }
}
