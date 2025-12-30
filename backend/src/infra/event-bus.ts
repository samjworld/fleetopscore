import { EventEmitter } from 'events';

export enum EventType {
  TELEMETRY_RECEIVED = 'TELEMETRY_RECEIVED',
  FUEL_THEFT_DETECTED = 'FUEL_THEFT_DETECTED'
}

/**
 * AppEventBus extends the Node.js EventEmitter class.
 * We ensure inherited methods are correctly accessed.
 */
class AppEventBus extends EventEmitter {
  constructor() {
    super();
  }

  // Fix: Ensure emit is recognized as a member of the EventEmitter subclass
  public publish(event: EventType, payload: any) {
    // The emit method is inherited from the base EventEmitter class
    (this as any).emit(event, payload);
  }

  // Fix: Ensure on is recognized as a member of the EventEmitter subclass
  public subscribe(event: EventType, callback: (payload: any) => void) {
    // The on method is inherited from the base EventEmitter class
    (this as any).on(event, callback);
  }
}

// Singleton instance
export const eventBus = new AppEventBus();