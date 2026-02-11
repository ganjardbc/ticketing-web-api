import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = new Logger('RequestLogger');

/**
 * Sanitize sensitive data from request/response for logging
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'authorization', 'refreshToken', 'accessToken'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Request Logger Middleware
 * Logs HTTP method, path, status code, and response time
 * Sanitizes sensitive data (passwords, tokens)
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response
  res.send = function (data: any) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log request/response
    const logData: Record<string, any> = {
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: (req as any).userId,
    };

    // Log body if present (sanitized)
    if (req.body && Object.keys(req.body).length > 0) {
      logData.requestBody = sanitizeData(req.body);
    }

    // Log based on status code
    if (statusCode >= 500) {
      logger.error(`${req.method} ${req.path} - ${statusCode}`, logData);
    } else if (statusCode >= 400) {
      logger.warn(`${req.method} ${req.path} - ${statusCode}`, logData);
    } else {
      logger.info(`${req.method} ${req.path} - ${statusCode}`, logData);
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}
