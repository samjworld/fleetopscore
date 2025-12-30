
// ==========================================
// ROLES & AUTH
// ==========================================

/**
 * Organizational roles for access control and hierarchy.
 */
export enum Role {
  SUPER_ADMIN = 'super_admin',
  TENANT_ADMIN = 'tenant_admin',
  SITE_MANAGER = 'site_manager',
  FLEET_MANAGER = 'fleet_manager',
  INVENTORY_MANAGER = 'inventory_manager',
  MAINTENANCE_MANAGER = 'maintenance_manager',
  MAINTENANCE_LEAD = 'maintenance_lead',
  SUPERVISOR = 'supervisor',
  DRIVER = 'driver',
  INVENTORY_WORKER = 'inventory_worker',
  MAINTENANCE_WORKER = 'maintenance_worker',
  VIEWER = 'viewer',
}

/**
 * Base properties for all enterprise entities.
 */
export interface EnterpriseEntity {
  tenantId: string;
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User profile within the organization.
 */
export interface User extends EnterpriseEntity {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  skills?: string[];
}

// ==========================================
// FLEET & EQUIPMENT
// ==========================================

/**
 * Supported fuel types for equipment.
 */
export enum FuelType {
  DIESEL = 'DIESEL',
  GASOLINE = 'GASOLINE',
  ELECTRIC = 'ELECTRIC',
  DEF = 'DEF',
}

/**
 * Vehicle or heavy equipment asset.
 */
export interface Vehicle extends EnterpriseEntity {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  status: 'active' | 'maintenance' | 'offline' | 'idle';
  fuelLevel: number;
  fuelType: FuelType;
  engineHours: number;
  odometer: number;
  lastLat: number;
  lastLng: number;
  lastSeen: string;
}

// ==========================================
// SITES & LOGISTICS
// ==========================================

/**
 * Organizational work zone or site.
 */
export interface Site extends EnterpriseEntity {
  id: string;
  name: string;
  location: string;
  managerName: string;
  activeAssets: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'operational' | 'restricted' | 'closed';
}

// ==========================================
// SHIFT MANAGEMENT
// ==========================================

export type ShiftStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface ShiftLog {
  id: string;
  timestamp: string;
  event: string;
  status?: ShiftStatus;
  details?: string;
  actor: string;
}

export interface Shift extends EnterpriseEntity {
  id: string;
  operatorId: string;
  operatorName: string;
  vehicleId: string;
  vehicleName: string;
  siteName: string;
  plannedDate: string;
  plannedStartTime: string;
  plannedEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  workHours?: number;
  idleHours?: number;
  status: ShiftStatus;
  logs?: ShiftLog[];
}

// ==========================================
// UTILIZATION & PROCESSING
// ==========================================

/**
 * Record processed from Excel ingestion for utilization analysis.
 */
export interface ProcessedUtilizationRecord {
  id: string;
  machineId: string;
  startReading: number;
  closingReading: number;
  totalWorked: number;
  fuelIssued: number;
  avgConsumption: number;
  isValid: boolean;
  notes?: string;
}

// ==========================================
// MAINTENANCE
// ==========================================

/**
 * Maintenance service categories.
 */
export enum MaintenanceType {
  PREVENTATIVE = 'preventative',
  CORRECTIVE = 'corrective',
  INSPECTION = 'inspection',
  EMERGENCY = 'emergency',
  BREAKDOWN = 'breakdown',
}

/**
 * Record of maintenance performed on an asset.
 */
export interface MaintenanceRecord extends EnterpriseEntity {
  id: string;
  machineId: string;
  type: MaintenanceType;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  title: string;
  scheduledDate: string;
  completedDate?: string;
  costParts: number;
  costLabor: number;
  engineHoursAtService: number;
  checklist: string[];
}

// ==========================================
// JOBS & DISPATCH
// ==========================================

/**
 * Possible states for a work order.
 */
export type JobStatus = 'created' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Audit trail for job status transitions.
 */
export interface JobHistory {
  status: JobStatus;
  timestamp: string;
  description: string;
  actorName: string;
}

/**
 * Work order or operational assignment.
 */
export interface Job {
  id: string;
  title: string;
  description: string;
  vehicleId: string;
  vehicleName: string;
  driverName: string;
  status: JobStatus;
  location: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  estimatedHours: number;
  createdAt: string;
  updatedAt: string;
  statusHistory?: JobHistory[];
}

// ==========================================
// IOT & SENSORS
// ==========================================

/**
 * IoT sensor or gateway device.
 */
export interface Device extends EnterpriseEntity {
  id: string;
  serialNumber: string;
  apiKey: string;
  status: 'active' | 'offline';
  lastHeartbeat: string;
}

// ==========================================
// ALERTS
// ==========================================

/**
 * System-generated alert or emergency notification.
 */
export interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  status: 'new' | 'acknowledged' | 'resolved';
  vehicleName?: string;
}

// ==========================================
// REMINDERS
// ==========================================

export type ReminderPriority = 'low' | 'medium' | 'high';
export type ReminderCategory = 'safety' | 'machine' | 'route' | 'personal';

export interface OperatorReminder {
  id: string;
  date: string; // ISO string (YYYY-MM-DD)
  text: string;
  completed: boolean;
  priority: ReminderPriority;
  category: ReminderCategory;
}

// ==========================================
// APP CONFIG & UTILS
// ==========================================

/**
 * Identifier for application functional modules.
 */
export type ModuleId = 'dashboard' | 'map' | 'team_chat' | 'jobs' | 'vehicles' | 'sites' | 'devices' | 'alerts' | 'maintenance' | 'inventory' | 'fuel' | 'users' | 'settings' | 'user_settings' | 'utilization_logs' | 'shifts' | 'utilization_report';

/**
 * Global application configuration.
 */
export interface AppConfig {
    permissions: Record<Role, ModuleId[]>;
}
