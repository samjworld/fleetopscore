
import { Router } from 'express';
import { FuelController } from './modules/fuel/fuel.controller';
import { TelemetryController } from './modules/telemetry/telemetry.controller';
import { auditMiddleware } from './middleware/audit.middleware';

const router = Router();
const fuelController = new FuelController();
const telemetryController = new TelemetryController();

// --- Middleware ---
router.use(auditMiddleware);

// --- Telemetry Ingestion (Write) ---
// POST /api/v1/telemetry
router.post('/telemetry', telemetryController.ingest);

// --- Read APIs ---

// 1. Machines
// router.get('/machines', machineController.getAll);

// 2. Dashboard
// router.get('/dashboard/overview', dashboardController.getOverview);

// 3. Fuel Stats
// GET /api/v1/machines/{id}/fuel
router.get('/machines/:id/fuel', fuelController.getMachineFuelStats);

// 4. Utilization
// router.get('/machines/:id/utilization', utilizationController.getStats);

export default router;
import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default router;
