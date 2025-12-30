
import { TelemetryRepository, TelemetryData } from './telemetry.repository';
import { eventBus, EventType } from '../../infra/event-bus';

export class TelemetryService {
  private repo: TelemetryRepository;

  constructor() {
    this.repo = new TelemetryRepository();
  }

  async ingest(data: TelemetryData): Promise<void> {
    // 1. Write to Raw Storage (Truth source)
    await this.repo.save(data);

    // 2. Emit Event for Background Processing
    // This decouples "saving data" from "calculating insights"
    eventBus.publish(EventType.TELEMETRY_RECEIVED, data);
  }
}
