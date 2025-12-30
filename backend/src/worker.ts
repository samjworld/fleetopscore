import { Database } from './infra/database';
import { RedisClient } from './infra/redis';
import { AnalyticsWorker } from './modules/analytics/analytics.worker';
import { logger } from './utils/logger';

async function bootstrap() {
  logger.info('🤖 FleetOps Worker Node Starting...');

  try {
    // 1. Connect Infra
    await Database.connect();
    await RedisClient.connect();

    const redis = RedisClient.getInstance();

    // 2. Start Analytics Processor
    // This worker consumes from Redis Streams using consumer groups
    const analyticsWorker = new AnalyticsWorker();
    await analyticsWorker.start();

    // 3. Worker Heartbeat (Health check for monitoring tools)
    const heartbeatInterval = setInterval(async () => {
        await redis.set('worker:heartbeat', Date.now().toString(), 'EX', 30);
    }, 15000);

    logger.info('✅ Worker Processors Active and Polling');

    // 4. Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Cleaning up worker node...`);
      clearInterval(heartbeatInterval);
      
      // Give consumers time to finish active work
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await Database.disconnect();
      await RedisClient.disconnect();
      logger.info('👋 Shutdown complete.');
      // Fix: Cast process to any to access Node.js exit method
      (process as any).exit(0);
    };

    // Fix: Cast process to any to access Node.js on method for signals
    (process as any).on('SIGTERM', () => shutdown('SIGTERM'));
    (process as any).on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('CRITICAL: Worker failed to start', error);
    // Fix: Cast process to any to access Node.js exit method
    (process as any).exit(1);
  }
}

bootstrap();