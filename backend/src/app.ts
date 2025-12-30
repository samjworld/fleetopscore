
import express, { Application } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { DashboardRoutes } from './modules/dashboard/dashboard.routes';
import { FleetRoutes } from './modules/fleet/fleet.routes';
import { FuelRoutes } from './modules/fuel/fuel.routes';
import { UtilizationRoutes } from './modules/utilization/utilization.routes';
import { AlertsRoutes } from './modules/alerts/alerts.routes';
import { MaintenanceRoutes } from './modules/maintenance/maintenance.routes';
import { AuthRoutes } from './modules/auth/auth.routes';
import { IngestionRoutes } from './modules/ingestion/ingestion.routes';
import { AnalyticsRoutes } from './modules/analytics/analytics.routes';

import { errorMiddleware } from './middleware/error.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
import { apiLimiter } from './middleware/rate-limit.middleware';
import { HealthController } from './infra/health';
import { register, httpRequestDurationMicroseconds } from './infra/monitoring';
import { logger } from './utils/logger';

export class App {
  public app: Application;
  public httpServer: HttpServer;
  public io: SocketServer;
  private healthController: HealthController;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketServer(this.httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    this.healthController = new HealthController();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSocketLogic();
    this.initializeErrorHandling();
  }

  private initializeMiddleware() {
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
          imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://unpkg.com", "https://*.tile.openstreetmap.org"],
          connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "https://*.fleetops.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    }));

    this.app.use(express.json({ limit: '50kb' }));
    this.app.use(loggerMiddleware); 
    
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        httpRequestDurationMicroseconds
          .labels(req.method, req.route ? req.route.path : req.path, res.statusCode.toString())
          .observe(duration / 1000);
      });
      next();
    });

    this.app.use('/api', apiLimiter);
  }

  private initializeRoutes() {
    this.app.get('/health/liveness', this.healthController.liveness);
    this.app.get('/health/readiness', this.healthController.readiness);
    this.app.get('/metrics', async (req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });

    const apiV1 = express.Router();
    apiV1.use('/auth', new AuthRoutes().router);
    apiV1.use('/dashboard', new DashboardRoutes().router);

    const fleetRouter = express.Router();
    fleetRouter.use('/', new FleetRoutes().router);
    fleetRouter.use('/', new FuelRoutes().router);
    fleetRouter.use('/', new UtilizationRoutes().router);
    apiV1.use('/fleet', fleetRouter);

    apiV1.use('/maintenance', new MaintenanceRoutes().router);
    apiV1.use('/alerts', new AlertsRoutes().router);
    apiV1.use('/analytics', new AnalyticsRoutes().router);
    apiV1.use('/ingest', new IngestionRoutes().router);

    this.app.use('/api/v1', apiV1);
  }

  private initializeSocketLogic() {
    this.io.on('connection', (socket) => {
      logger.info(`[Socket] Terminal Link Established: ${socket.id}`);
      
      socket.on('disconnect', () => {
        logger.info(`[Socket] Terminal Link Terminated: ${socket.id}`);
      });
    });

    // Simulated Telemetry Stream for Frontend Map/Store verification
    setInterval(() => {
      const mockPacket = {
        deviceId: '1', // Excavator X1
        timestamp: new Date().toISOString(),
        location: {
          lat: 34.0522 + (Math.random() - 0.5) * 0.01,
          lng: -118.2437 + (Math.random() - 0.5) * 0.01,
          speed: Math.floor(Math.random() * 60)
        },
        metrics: {
          fuelLevel: Math.floor(Math.random() * 100),
          engineHours: 1250 + Math.random(),
          ignition: true
        }
      };
      this.io.emit('telemetry:packet', mockPacket);
    }, 2000);
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  public listen(port: number) {
    this.httpServer.listen(port, () => {
      console.log(`🚀 FleetOps Enterprise Backend running on port ${port}`);
    });
  }
}
