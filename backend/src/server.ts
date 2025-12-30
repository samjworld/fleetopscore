
import { App } from './app';
import { Database } from './infra/database';
import { RedisClient } from './infra/redis';
import { logger } from './utils/logger';
import dotenv from 'dotenv';

// 0. Load environment
dotenv.config();

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  try {
    // 1. Initialize Infrastructure
    await Database.connect();
    await RedisClient.connect();

    // 2. Start Application
    const app = new App();
    app.listen(Number(PORT));

    // 3. Graceful Shutdown
    const handleExit = async (signal: string) => {
      logger.info(`${signal} received. Initiating graceful shutdown...`);
      await Database.disconnect();
      await RedisClient.disconnect();
      // Fix: Cast process to any to access Node.js exit method
      (process as any).exit(0);
    };

    // Fix: Cast process to any to access Node.js on method for signals
    (process as any).on('SIGTERM', () => handleExit('SIGTERM'));
    (process as any).on('SIGINT', () => handleExit('SIGINT'));

  } catch (error) {
    logger.error('Bootstrap sequence failed', error);
    // Fix: Cast process to any to access Node.js exit method
    (process as any).exit(1);
  }
}

bootstrap();