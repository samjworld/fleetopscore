
import { TelemetryPayload } from './ingestion.validation';

export type TelemetryEvent = TelemetryPayload & {
  serverTimestamp?: string;
  tenantId?: string;
};
