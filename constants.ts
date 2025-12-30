
import { Box, Truck, AlertTriangle, Fuel, Wrench, Map as MapIcon, Users, BarChart, Briefcase, Clipboard, Package, Settings, MessageSquare, Eye, FileSpreadsheet, CalendarClock, PieChart, MapPin } from 'lucide-react';
import { Job, Role, Vehicle, ModuleId, FuelType, MaintenanceRecord, MaintenanceType, Shift, Site } from './types.ts';

// Added RoleDetail interface to fix import error in AdminSettings.tsx
export interface RoleDetail {
  label: string;
  category: string;
  reportsTo?: Role;
}

// Enterprise Configuration
export const API_BASE_URL = 'http://localhost:3001/api/v1';
export const APP_NAME = 'FleetOps Enterprise';
export const ENABLE_MOCK_FALLBACK = true;

export interface NavItem {
  id: ModuleId;
  label: string;
  path: string;
  icon: any;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/app', icon: BarChart },
  { id: 'map', label: 'Site Map', path: '/app/map', icon: MapIcon },
  { id: 'sites', label: 'Sites Registry', path: '/app/sites', icon: MapPin },
  { id: 'team_chat', label: 'Team Chat', path: '/app/chat', icon: MessageSquare },
  { id: 'shifts', label: 'Site Shifts', path: '/app/shifts', icon: CalendarClock },
  { id: 'utilization_report', label: 'Utilization Intel', path: '/app/utilization-report', icon: PieChart },
  { id: 'jobs', label: 'Work Orders', path: '/app/jobs', icon: Briefcase },
  { id: 'vehicles', label: 'Equipment', path: '/app/vehicles', icon: Truck },
  { id: 'utilization_logs', label: 'Log Ingestion', path: '/app/utilization', icon: FileSpreadsheet },
  { id: 'devices', label: 'IoT Sensors', path: '/app/devices', icon: Box },
  { id: 'alerts', label: 'Alerts', path: '/app/alerts', icon: AlertTriangle },
  { id: 'maintenance', label: 'Maintenance', path: '/app/maintenance', icon: Wrench },
  { id: 'inventory', label: 'Parts Inventory', path: '/app/inventory', icon: Package },
  { id: 'fuel', label: 'Fuel & DEF', path: '/app/fuel', icon: Fuel },
  { id: 'users', label: 'Operators', path: '/app/users', icon: Users },
  { id: 'settings', label: 'Admin Settings', path: '/app/settings', icon: Settings }
];

export const DEFAULT_PERMISSIONS: Record<Role, ModuleId[]> = {
  [Role.SUPER_ADMIN]: ['dashboard', 'map', 'sites', 'jobs', 'vehicles', 'utilization_logs', 'devices', 'alerts', 'maintenance', 'inventory', 'fuel', 'users', 'settings', 'team_chat', 'shifts', 'utilization_report'],
  [Role.TENANT_ADMIN]: ['dashboard', 'map', 'sites', 'jobs', 'vehicles', 'utilization_logs', 'devices', 'alerts', 'maintenance', 'inventory', 'fuel', 'users', 'team_chat', 'shifts', 'utilization_report'],
  [Role.SITE_MANAGER]: ['dashboard', 'map', 'sites', 'jobs', 'vehicles', 'utilization_logs', 'devices', 'alerts', 'maintenance', 'inventory', 'fuel', 'users', 'team_chat', 'shifts', 'utilization_report'],
  [Role.FLEET_MANAGER]: ['dashboard', 'map', 'sites', 'jobs', 'vehicles', 'utilization_logs', 'devices', 'alerts', 'maintenance', 'fuel', 'team_chat', 'shifts', 'utilization_report'],
  [Role.INVENTORY_MANAGER]: ['dashboard', 'inventory', 'jobs', 'team_chat'],
  [Role.MAINTENANCE_MANAGER]: ['dashboard', 'maintenance', 'vehicles', 'jobs', 'team_chat', 'utilization_report'],
  [Role.MAINTENANCE_LEAD]: ['dashboard', 'maintenance', 'vehicles', 'jobs', 'team_chat'],
  [Role.SUPERVISOR]: ['dashboard', 'map', 'sites', 'jobs', 'alerts', 'team_chat', 'shifts', 'utilization_report'],
  [Role.DRIVER]: ['dashboard', 'jobs', 'team_chat'],
  [Role.INVENTORY_WORKER]: ['inventory', 'team_chat'],
  [Role.MAINTENANCE_WORKER]: ['maintenance', 'jobs', 'vehicles', 'team_chat'],
  [Role.VIEWER]: ['dashboard', 'map', 'sites', 'vehicles', 'utilization_report'],
};

// Updated ROLE_DEFINITIONS with RoleDetail type and reporting structure for hierarchy visualization
export const ROLE_DEFINITIONS: Record<Role, RoleDetail> = {
  [Role.SUPER_ADMIN]: { label: 'Super Admin', category: 'Administrative' },
  [Role.TENANT_ADMIN]: { label: 'Tenant Admin', category: 'Administrative', reportsTo: Role.SUPER_ADMIN },
  [Role.SITE_MANAGER]: { label: 'Site Manager', category: 'Operational', reportsTo: Role.TENANT_ADMIN },
  [Role.FLEET_MANAGER]: { label: 'Fleet Manager', category: 'Operational', reportsTo: Role.TENANT_ADMIN },
  [Role.INVENTORY_MANAGER]: { label: 'Inventory Manager', category: 'Operational', reportsTo: Role.SITE_MANAGER },
  [Role.MAINTENANCE_MANAGER]: { label: 'Maintenance Manager', category: 'Operational', reportsTo: Role.SITE_MANAGER },
  [Role.MAINTENANCE_LEAD]: { label: 'Maintenance Lead', category: 'Field', reportsTo: Role.MAINTENANCE_MANAGER },
  [Role.SUPERVISOR]: { label: 'Supervisor', category: 'Operational', reportsTo: Role.SITE_MANAGER },
  [Role.DRIVER]: { label: 'Operator / Driver', category: 'Field', reportsTo: Role.FLEET_MANAGER },
  [Role.INVENTORY_WORKER]: { label: 'Inventory Clerk', category: 'Field', reportsTo: Role.INVENTORY_MANAGER },
  [Role.MAINTENANCE_WORKER]: { label: 'Technician', category: 'Field', reportsTo: Role.MAINTENANCE_LEAD },
  [Role.VIEWER]: { label: 'Viewer', category: 'Administrative', reportsTo: Role.SUPER_ADMIN },
};

const BASE_ENTITY_MOCK = {
  tenantId: 'mock-tenant-1',
  version: 1,
  createdBy: 'system',
  updatedBy: 'system',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const MOCK_VEHICLES: Vehicle[] = [
  { id: '1', name: 'Excavator X1', make: 'CAT', model: '320 GC', year: 2021, vin: 'CAT320X001', status: 'active', fuelLevel: 75, engineHours: 1250, lastLat: 34.0522, lastLng: -118.2437, lastSeen: new Date().toISOString(), fuelType: FuelType.DIESEL, odometer: 5000, ...BASE_ENTITY_MOCK },
  { id: '2', name: 'Dozer D5', make: 'Komatsu', model: 'D51EX', year: 2020, vin: 'KOMD51X002', status: 'active', fuelLevel: 45, engineHours: 3400, lastLat: 34.0622, lastLng: -118.2537, lastSeen: new Date().toISOString(), fuelType: FuelType.DIESEL, odometer: 12000, ...BASE_ENTITY_MOCK },
  { id: '3', name: 'Crane C2', make: 'Liebherr', model: 'LTM 1060', year: 2019, vin: 'LIEB1060X03', status: 'maintenance', fuelLevel: 10, engineHours: 5100, lastLat: 34.0422, lastLng: -118.2337, lastSeen: new Date(Date.now() - 86400000).toISOString(), fuelType: FuelType.DIESEL, odometer: 15000, ...BASE_ENTITY_MOCK },
  { id: '4', name: 'Loader L4', make: 'Volvo', model: 'L90H', year: 2022, vin: 'VOLL90X004', status: 'offline', fuelLevel: 88, engineHours: 850, lastLat: 34.0722, lastLng: -118.2637, lastSeen: new Date(Date.now() - 172800000).toISOString(), fuelType: FuelType.DIESEL, odometer: 3200, ...BASE_ENTITY_MOCK },
  { id: '5', name: 'Backhoe B1', make: 'JCB', model: '3CX', year: 2018, vin: 'JCB3CX005', status: 'active', fuelLevel: 30, engineHours: 4200, lastLat: 34.0550, lastLng: -118.2400, lastSeen: new Date().toISOString(), fuelType: FuelType.DIESEL, odometer: 21000, ...BASE_ENTITY_MOCK },
  { id: '6', name: 'Skid Steer S2', make: 'Bobcat', model: 'S650', year: 2021, vin: 'BOBS650X06', status: 'maintenance', fuelLevel: 60, engineHours: 1100, lastLat: 34.0400, lastLng: -118.2500, lastSeen: new Date(Date.now() - 43200000).toISOString(), fuelType: FuelType.DIESEL, odometer: 4500, ...BASE_ENTITY_MOCK },
];

export const MOCK_SITES: Site[] = [
  { id: 'site_01', name: 'Zone Alpha Staging', location: 'Los Angeles, CA', managerName: 'Steve Rodgers', activeAssets: 12, riskLevel: 'low', status: 'operational', ...BASE_ENTITY_MOCK },
  { id: 'site_02', name: 'Sector Bravo Extraction', location: 'San Bernardino, CA', managerName: 'Natasha Romanoff', activeAssets: 24, riskLevel: 'medium', status: 'operational', ...BASE_ENTITY_MOCK },
  { id: 'site_03', name: 'Highway 405 Project', location: 'Santa Monica, CA', managerName: 'Clint Barton', activeAssets: 5, riskLevel: 'high', status: 'restricted', ...BASE_ENTITY_MOCK },
  { id: 'site_04', name: 'Logistics Hub 9', location: 'Torrance, CA', managerName: 'Tony Stark', activeAssets: 42, riskLevel: 'low', status: 'operational', ...BASE_ENTITY_MOCK },
];

export const MOCK_SHIFTS: Shift[] = [
  { id: 's1', operatorId: 'd1', operatorName: 'Mike Ross', vehicleId: '1', vehicleName: 'Excavator X1', siteName: 'Sector A', plannedDate: new Date().toISOString().split('T')[0], plannedStartTime: '08:00', plannedEndTime: '17:00', status: 'planned', ...BASE_ENTITY_MOCK },
  { id: 's2', operatorId: 'd2', operatorName: 'Harvey Specter', vehicleId: '2', vehicleName: 'Dozer D5', siteName: 'Sector B', plannedDate: new Date().toISOString().split('T')[0], plannedStartTime: '09:00', plannedEndTime: '18:00', status: 'in_progress', actualStartTime: '09:05', ...BASE_ENTITY_MOCK },
];

export const MOCK_MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  { id: 'm1', machineId: '1', type: MaintenanceType.PREVENTATIVE, status: 'completed', title: '1000 Hr Engine Service', scheduledDate: '2023-08-15T09:00:00Z', completedDate: '2023-08-15T16:00:00Z', costParts: 450, costLabor: 300, engineHoursAtService: 1000, checklist: [], ...BASE_ENTITY_MOCK },
  { id: 'm2', machineId: '1', type: MaintenanceType.INSPECTION, status: 'completed', title: 'Monthly Safety Audit', scheduledDate: '2023-09-12T08:00:00Z', completedDate: '2023-09-12T10:00:00Z', costParts: 0, costLabor: 120, engineHoursAtService: 1150, checklist: [], ...BASE_ENTITY_MOCK },
  { id: 'm3', machineId: '2', type: MaintenanceType.CORRECTIVE, status: 'completed', title: 'Track Re-tensioning', scheduledDate: '2023-10-05T13:00:00Z', completedDate: '2023-10-05T15:30:00Z', costParts: 85, costLabor: 250, engineHoursAtService: 3200, checklist: [], ...BASE_ENTITY_MOCK },
  { id: 'm4', machineId: '3', type: MaintenanceType.EMERGENCY, status: 'completed', title: 'Hydraulic Hose Failure', scheduledDate: '2023-11-01T10:00:00Z', completedDate: '2023-11-01T14:45:00Z', costParts: 320, costLabor: 400, engineHoursAtService: 5050, checklist: [], ...BASE_ENTITY_MOCK },
  { id: 'm5', machineId: '1', type: MaintenanceType.INSPECTION, status: 'scheduled', title: 'Quarterly Brake Check', scheduledDate: '2024-02-20T10:00:00Z', costParts: 0, costLabor: 0, engineHoursAtService: 1250, checklist: [], ...BASE_ENTITY_MOCK }
];

export const MOCK_DRIVERS = [
  { id: 'd1', name: 'Mike Ross', status: 'available', rating: 4.8, skills: ['Heavy Machinery', 'Excavation'] },
  { id: 'd2', name: 'Harvey Specter', status: 'busy', rating: 5.0, skills: ['Logistics', 'Crane Operation'] },
  { id: 'd3', name: 'Donna Paulsen', status: 'busy', rating: 4.9, skills: ['Safety', 'Site Supervision'] },
  { id: 'd4', name: 'Louis Litt', status: 'available', rating: 4.2, skills: ['Maintenance', 'Logistics'] },
  { id: 'd5', name: 'Rachel Zane', status: 'on_leave', rating: 4.7, skills: ['Excavation', 'First Aid'] }
];

// Added missing priority, dueDate, and estimatedHours properties to fix Job interface compatibility errors
export const MOCK_JOBS: Job[] = [
  { id: 'j1', title: 'Excavation Sector A', description: 'Grade foundation for new block.', vehicleId: '1', vehicleName: 'Excavator X1', driverName: 'Mike Ross', status: 'in_progress', location: 'Site A, North', priority: 'high', dueDate: new Date().toISOString(), estimatedHours: 40, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'j2', title: 'Site Debris Cleanup', description: 'Clear entrance 2.', vehicleId: '2', vehicleName: 'Dozer D5', driverName: 'Louis Litt', status: 'assigned', location: 'Site B, West', priority: 'medium', dueDate: new Date().toISOString(), estimatedHours: 8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'j3', title: 'Steel Beam Lift', description: 'Lift beams to floor 4.', vehicleId: '3', vehicleName: 'Crane C2', driverName: 'Harvey Specter', status: 'completed', location: 'Site A, Block 1', priority: 'critical', dueDate: new Date(Date.now() - 86400000).toISOString(), estimatedHours: 12, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 43200000).toISOString() }
];
