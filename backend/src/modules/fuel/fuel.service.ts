
import { FuelRepository } from './fuel.repository';
import { TelemetryData } from '../telemetry/telemetry.repository';
import { eventBus, EventType } from '../../infra/event-bus';

export class FuelService {
  private repo: FuelRepository;

  constructor() {
    this.repo = new FuelRepository();
    // Register listener for background processing
    eventBus.subscribe(EventType.TELEMETRY_RECEIVED, this.processTelemetry.bind(this));
  }

  /**
   * BACKGROUND WORKER
   * Triggered when new telemetry arrives.
   * Calculates consumption and updates daily aggregates.
   */
  private async processTelemetry(data: TelemetryData) {
    console.log(`[FuelEngine] Processing data for machine: ${data.machineId}`);

    // Get previous reading to calculate delta
    const previous = await this.repo.getPreviousReadingForCalc(data.machineId, data.timestamp);
    
    if (previous) {
      const fuelDelta = previous.fuel_level - data.fuelLevel;
      
      // Logic: Only count positive consumption (ignore refuels)
      if (fuelDelta > 0) {
        await this.repo.incrementDailyConsumption(
            data.machineId, 
            new Date(data.timestamp), 
            fuelDelta
        );
      }
      
      // Theft Logic: If drop > 10% in short time
      if (fuelDelta > 10) {
          eventBus.publish(EventType.FUEL_THEFT_DETECTED, { 
              machineId: data.machineId, 
              amount: fuelDelta 
          });
      }
    }
  }

  /**
   * READ API
   * Called by Controller for frontend display
   */
  async getFuelStats(machineId: string) {
    // Reads from the pre-calculated aggregate table
    return this.repo.getDailyStats(machineId);
  }
}
