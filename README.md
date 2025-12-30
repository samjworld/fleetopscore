# FleetOps Frontend Architecture Technical Specification

## 1. Project Overview
FleetOps is an enterprise-grade fleet management and telemetry visualization interface. It serves as the primary command node for monitoring high-value assets, managing operational shifts, and analyzing equipment utilization.

### 1.1 Purpose and Scope
The application provides a high-integrity interface for real-time asset tracking and organizational resource management. It solves the problem of data fragmentation in large-scale fleet operations by consolidating telemetry, maintenance logs, and personnel assignments into a unified temporal window.

### 1.2 Non-Goals
- This application does not perform heavy analytical computations or machine learning on the client side; these are backend-first responsibilities.
- It does not store long-term historical data in local state; it acts as a window into the enterprise data lake.
- It is not a general-purpose ERP; it is strictly focused on fleet and field logistics.

## 2. Architecture Overview

### 2.1 Technical Stack
- UI Library: React 19
- Type Safety: TypeScript
- Data Validation: Zod
- Server State: TanStack Query (React Query) v5
- High-Frequency State: Zustand
- Styling: Tailwind CSS
- Geospatial: Leaflet with Marker Clustering
- Real-time Comms: Socket.io-client
- Virtualization: React-Window

### 2.2 Directory Structure
- **schemas/**: Contains Zod contracts defining the enterprise data structure. These are used at every ingress point to ensure data integrity.
- **services/**: Low-level I/O management. Contains the API client (Fetch wrapper) and the Socket transport manager.
- **store/**: Zustand stores for volatile, high-frequency data (e.g., telemetry) that requires atomic updates outside the React Query lifecycle.
- **hooks/**: Encapsulated business logic, including authorization checks and React Query wrappers.
- **components/Guard.tsx**: A declarative authorization layer for granular UI control.

## 3. Data Flow Model

### 3.1 Standard Server State
Standard operational data (Jobs, Sites, Users) follows a strict pull-based flow:
UI Component -> Custom Query Hook -> API Service -> Zod Validation -> TanStack Query Cache -> UI Component.

Components are designed to be presentationally "dumb," relying on hooks to provide validated data snapshots.

### 3.2 Real-time Telemetry Flow
Telemetry data utilizes a push-based, throttled buffer model to ensure UI stability:
Socket Transport -> Telemetry Service (500ms Buffer) -> Zod Validation -> Zustand Atomic Update -> UI Component.

This flow prevents DOM thrashing by batching multiple asset updates into single state transitions.

## 4. Security Model

### 4.1 Authentication and Identity
The application implements a token-based authentication flow. JWTs are handled at the Service Layer and injected into the Authorization header of all requests. Token expiry signals are caught globally by the API Service to trigger session termination.

### 4.2 RBAC (Role-Based Access Control)
Authorization is enforced via three layers:
1. **Route Guard**: Prevents navigation to unauthorized modules.
2. **Permission Guard**: A functional wrapper that conditionally renders UI elements (buttons, tabs) based on the user's functional mandate.
3. **Module IDs**: Functional areas are identified by static strings (e.g., 'vehicles', 'maintenance') mapped to roles in the ConfigContext.

## 5. Performance Strategy

### 5.1 Virtualization
For datasets exceeding 100 entries (Log Ingestion, User Directories), the application utilizes `react-window` for list virtualization. This ensures that memory consumption remains constant regardless of the total record count.

### 5.2 Geospatial Optimization
Map markers are managed via `react-leaflet-cluster`. High-density views utilize chunked loading and memoized marker components to prevent unnecessary re-renders of the map overlay during telemetry updates.

### 5.3 Memoization Rules
Components involved in telemetry loops (Markers, KPI Cards, Progress Bars) implement strict memoization. Re-renders only occur if critical telemetry properties (Latitude, Longitude, Fuel Level) change.

## 6. Real-time Telemetry Engine
The Telemetry Service implements an Enterprise-grade throttling mechanism. It maintains a 500ms flush interval. During this window, incoming socket packets for the same Asset ID are de-duplicated, keeping only the latest state. This significantly reduces the overhead of high-frequency asset movement on the main thread.

## 7. Engineering Rules for Developers
1. **No Direct Fetch**: All HTTP communication must go through the API Service.
2. **Mandatory Validation**: Every API call must provide a Zod schema to validate the response. Untrusted data is rejected at the boundary.
3. **Deny by Default**: UI elements requiring permissions must be wrapped in a `PermissionGuard`.
4. **Stable Keys**: Use UUIDs from the entity schemas as React keys. Never use array indices.
5. **Separation of State**: Do not put cacheable server data into Zustand. Do not put high-frequency telemetry into TanStack Query.

## 8. Known Limitations
- Initial socket handshakes utilize polling before upgrading to WebSockets to ensure compatibility with enterprise proxies.
- Map history replay is currently limited to the last 72 operational hours.
- Concurrent editing of site configurations is managed via "Last Write Wins" at the API level.
