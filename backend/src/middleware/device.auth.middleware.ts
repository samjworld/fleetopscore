
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
// Fix: Import Buffer from 'buffer' to resolve missing global name error
import { Buffer } from 'buffer';
import { Database } from '../infra/database';
import { RedisClient } from '../infra/redis';
import { logger } from '../utils/logger';

/**
 * IoT HMAC Authentication
 * Enforces strict verification of device identity and request integrity.
 */
export const verifyDeviceSignature = async (req: Request, res: Response, next: NextFunction) => {
  const deviceId = req.headers['x-device-id'] as string;
  const timestamp = req.headers['x-timestamp'] as string;
  const signature = req.headers['x-signature'] as string;
  const nonce = req.headers['x-nonce'] as string; // Required for strict replay protection

  if (!deviceId || !timestamp || !signature || !nonce) {
    return res.status(401).json({ error: 'Missing device authentication headers' });
  }

  // 1. Time Drift Protection (5 minute window)
  const reqTime = new Date(timestamp).getTime();
  if (isNaN(reqTime) || Math.abs(Date.now() - reqTime) > 5 * 60 * 1000) {
    return res.status(401).json({ error: 'Request timestamp expired or invalid' });
  }

  try {
    const redis = RedisClient.getInstance();
    
    // 2. Replay Protection via Nonce
    const nonceKey = `nonce:${deviceId}:${nonce}`;
    const seen = await redis.set(nonceKey, '1', 'EX', 600, 'NX');
    if (!seen) {
        return res.status(401).json({ error: 'Replayed request detected' });
    }

    // 3. Fetch Device Secret
    // Production: Secrets are hashed and encrypted; we use a cached raw secret if possible
    const result = await Database.getPool().query(
      'SELECT secret_key_enc, is_active FROM device_keys WHERE device_id = $1',
      [deviceId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(403).json({ error: 'Device unrecognized or decommissioned' });
    }

    const secret = result.rows[0].secret_key_enc;

    // 4. Reconstruct Signature
    // Canonical String: timestamp | nonce | JSON.stringify(body)
    const payload = `${timestamp}|${nonce}|${JSON.stringify(req.body)}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // 5. Constant Time Comparison (Prevent Timing Attacks)
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      logger.warn(`Invalid signature from device ${deviceId}`);
      return res.status(403).json({ error: 'Invalid signature' });
    }

    next();

  } catch (error) {
    logger.error('Device Auth Pipeline Error', error);
    res.status(500).json({ error: 'Internal Security Error' });
  }
};