import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

// Assuming you have a DB connection pool exported
import { Database } from '../infra/database'; 

export const auditMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Only audit state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const originalSend = res.send;
    
    // Intercept response to ensure we only log successful or attempted operations
    res.send = function (body) {
      const auditLog = {
        action: req.method,
        resource: req.baseUrl + req.path,
        // Assuming auth middleware populates req.user
        user_id: (req as any).user?.id || null, 
        payload: JSON.stringify(req.body),
        ip_address: req.ip,
      };

      // Fire and forget audit log insertion
      Database.getPool().query(
        `INSERT INTO audit_logs (action, resource, user_id, payload, ip_address) 
         VALUES ($1, $2, $3, $4, $5)`,
        [auditLog.action, auditLog.resource, auditLog.user_id, auditLog.payload, auditLog.ip_address]
      ).catch(err => console.error('Audit Log Error:', err));

      return originalSend.apply(this, arguments as any);
    };
  }
  next();
};