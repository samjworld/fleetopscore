
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RedisClient } from '../infra/redis';
import { logger } from '../utils/logger';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        tenantId: string;
      };
      auditContext?: {
        ip: string;
        userAgent: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/**
 * 1. Authenticate (Verify JWT)
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // A. Check Blacklist (Redis) - Instant Revocation Check
    const isBlacklisted = await RedisClient.getInstance().get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    // B. Verify Signature & Expiry
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // C. Context Injection (Tenant Isolation)
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      tenantId: decoded.tenantId
    };
    
    req.auditContext = {
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * 2. Authorize (RBAC)
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.sendStatus(401);

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access Denied: User ${req.user.id} (${req.user.role}) attempted to access protected resource.`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * 3. Tenant Guard (Double Check)
 * Ensures API endpoints strictly enforce tenant isolation boundaries.
 */
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.tenantId) {
    return res.status(403).json({ error: 'Tenant context missing' });
  }
  next();
};
