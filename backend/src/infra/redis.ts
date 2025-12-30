
import Redis from 'ioredis';
import { logger } from '../utils/logger';

export class RedisClient {
  private static client: Redis;

  public static async connect() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.client.on('error', (err) => logger.error('Redis Error', err));
    this.client.on('connect', () => logger.info('✅ Redis Connected Successfully'));
  }

  public static getInstance(): Redis {
    return this.client;
  }

  public static async disconnect() {
    await this.client.quit();
  }
}
