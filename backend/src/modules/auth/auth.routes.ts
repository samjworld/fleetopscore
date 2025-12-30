
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Database } from '../../infra/database';
import { authLimiter } from '../../middleware/rate-limit.middleware';
import { logger } from '../../utils/logger';

export class AuthRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post('/login', authLimiter, async (req: Request, res: Response) => {
      const { email, password } = req.body;
      const secret = process.env.JWT_SECRET;

      if (!secret || (process.env.NODE_ENV === 'production' && secret === 'dev-secret')) {
        logger.error('CRITICAL: Insecure JWT configuration. Refusing login.');
        return res.status(500).json({ error: 'System configuration error' });
      }
      
      try {
        const result = await Database.getPool().query(
            'SELECT id, name, role, tenant_id, password_hash FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            // Constant time response to prevent user enumeration
            await bcrypt.compare(password, '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgNIvY.o9s0k52f.v.m0vL5O3A1K');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { sub: user.id, role: user.role, tenantId: user.tenant_id },
            secret,
            { expiresIn: '12h' }
        );

        // Security: Don't return the hash to the frontend
        const { password_hash, ...userProfile } = user;
        res.json({ token, user: userProfile });
      } catch (error) {
        logger.error('Login system failure', error);
        res.status(500).json({ error: 'Login failed' });
      }
    });
  }
}
