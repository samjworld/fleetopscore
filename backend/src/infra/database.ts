
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

export class Database {
  private static pool: Pool;

  public static async connect() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      logger.error('DATABASE_URL environment variable is missing');
      // Fix: Cast process to any to access Node.js exit method
      (process as any).exit(1);
    }

    this.pool = new Pool({
      connectionString,
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
    });

    try {
      const client = await this.pool.connect();
      logger.info('✅ Database Connected Successfully');

      // Schema sanity check
      await client.query('SELECT NOW()');

      client.release();
      
      if (process.env.NODE_ENV === 'development' || process.env.AUTO_MIGRATE === 'true') {
          // Fix: Cast process to any to access Node.js cwd method
          const schemaPath = path.join((process as any).cwd(), 'schema.sql');
          if (fs.existsSync(schemaPath)) {
              // Fix: Cast process to any to access Node.js cwd method
              await this.runMigration(path.join((process as any).cwd(), 'schema.sql'));
          }
      }

    } catch (error) {
      logger.error('❌ Database connection sequence failed', error);
      throw error;
    }
  }

  public static getPool(): Pool {
    if (!this.pool) throw new Error('Database pool not initialized');
    return this.pool;
  }

  public static async disconnect() {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database pool closed');
    }
  }
  
  public static async runMigration(filePath: string) {
    try {
        const sql = fs.readFileSync(filePath, 'utf8');
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('COMMIT');
            logger.info(`Schema synchronization: ${path.basename(filePath)} applied`);
        } catch (e) {
            await client.query('ROLLBACK');
            logger.error(`Migration failure in ${filePath}`, e);
            throw e;
        } finally {
            client.release();
        }
    } catch (e) {
        logger.warn(`Migration skipped or failed: ${filePath}`);
    }
  }
}
