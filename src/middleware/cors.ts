import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = new Logger('CORS');

/**
 * CORS Middleware with origin validation
 * Validates request origin against whitelist
 * Allows configured origins only
 * Supports credentials in cross-origin requests
 */
export function corsMiddleware(allowedOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.get('origin');
    const requestMethod = req.method;

    // Check if origin is in whitelist
    const isOriginAllowed = !origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*');

    if (isOriginAllowed) {
      // Set CORS headers
      res.set('Access-Control-Allow-Origin', origin || '*');
      res.set('Access-Control-Allow-Credentials', 'true');
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Access-Control-Max-Age', '86400');

      logger.debug(`CORS allowed for origin: ${origin || 'no-origin'}`);
    } else {
      logger.warn(`CORS rejected for origin: ${origin}`);
    }

    // Handle preflight requests
    if (requestMethod === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  };
}
