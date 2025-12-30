
import { Request, Response } from 'express';
import { Database } from './database';
import { RedisClient } from './redis';

export class HealthController {
  
  /**
   * Liveness Probe
   * Checks if the process is running. K8s will restart pod if this fails.
   */
  public async liveness(req: Request, res: Response) {
    // Basic check: Process is up and can respond
    res.status(200).json({ status: 'UP' });
  }

  /**
   * Readiness Probe
   * Checks if dependencies (DB, Redis) are ready. K8s will stop sending traffic if this fails.
   */
  public async readiness(req: Request, res: Response) {
    const checks = {
      database: false,
      redis: false
    };

    try {
      // Check Postgres (Fast lightweight query)
      await Database.getPool().query('SELECT 1');
      checks.database = true;
    } catch (e) {
      checks.database = false;
    }

    try {
      // Check Redis
      const pong = await RedisClient.getInstance().ping();
      checks.redis = pong === 'PONG';
    } catch (e) {
      checks.redis = false;
    }

    const isHealthy = checks.database && checks.redis;

    if (isHealthy) {
      res.status(200).json({ status: 'READY', checks });
    } else {
      res.status(503).json({ status: 'NOT_READY', checks });
    }
  }
}
