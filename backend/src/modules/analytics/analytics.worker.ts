
import { EventBus } from '../../shared/infra/event-bus';
import { AnalyticsService } from './analytics.service';
import { logger } from '../../utils/logger';

// Input Stream from Ingestion Service
const STREAM_INPUT = 'telemetry:stream';

export class AnalyticsWorker {
  private bus: EventBus;
  private service: AnalyticsService;

  constructor() {
    this.bus = new EventBus('analytics-processor-group');
    this.service = new AnalyticsService();
  }

  public async start() {
    logger.info('Analytics Worker subscribing to telemetry stream...');
    
    // Subscribe to raw telemetry
    await this.bus.subscribe(STREAM_INPUT, async (telemetry: any, msgId) => {
      try {
        await this.service.analyze(telemetry);
      } catch (error) {
        logger.error(`Error analyzing message ${msgId}`, error);
        // We don't throw here to avoid crashing the poller, but we log the logic failure
      }
    });
  }
}
