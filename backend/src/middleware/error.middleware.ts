
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const status = 500;
  const message = error.message || 'Internal Server Error';

  logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`, error);

  res.status(status).json({
    error: true,
    message,
  });
};
