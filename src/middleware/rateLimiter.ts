import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { RateLimitError } from './errorHandler';

const logger = new Logger('RateLimiter');

/**
 * In-memory rate limiter store
 * Maps IP address to array of request timestamps
 */
interface RateLimitStore {
  [ip: string]: number[];
}

const store: RateLimitStore = {};

/**
 * Clean up old entries from store periodically
 */
function cleanupStore(): void {
  const now = Date.now();
  for (const ip in store) {
    // Remove timestamps older than 15 minutes
    store[ip] = store[ip].filter((timestamp) => now - timestamp < 900000);
    // Remove IP if no recent requests
    if (store[ip].length === 0) {
      delete store[ip];
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupStore, 300000);

/**
 * Clear rate limiter store (for testing)
 */
export function clearRateLimiterStore(): void {
  for (const ip in store) {
    delete store[ip];
  }
}

/**
 * Rate Limiter Middleware
 * Limits requests per IP address
 * Default: 10000 requests per 15 minutes (very high for testing)
 * Returns 429 with Retry-After header when exceeded
 */
export function rateLimiter(
  windowMs: number = 900000,
  maxRequests: number = 10000,
  excludePaths: string[] = []
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip rate limiting for excluded paths
    if (excludePaths.some((path) => req.path.includes(path))) {
      next();
      return;
    }

    const ip = req.ip || 'unknown';
    const now = Date.now();

    // Initialize IP entry if not exists
    if (!store[ip]) {
      store[ip] = [];
    }

    // Remove timestamps outside the window
    store[ip] = store[ip].filter((timestamp) => now - timestamp < windowMs);

    // Check if limit exceeded
    if (store[ip].length >= maxRequests) {
      const oldestRequest = store[ip][0];
      const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);

      logger.warn(`Rate limit exceeded for IP: ${ip}`, {
        ip,
        requests: store[ip].length,
        maxRequests,
        retryAfter,
      });

      res.set('Retry-After', retryAfter.toString());
      throw new RateLimitError(
        `Too many requests. Please retry after ${retryAfter} seconds.`,
        { ip, retryAfter }
      );
    }

    // Add current request timestamp
    store[ip].push(now);

    // Add rate limit info to response headers
    const remaining = maxRequests - store[ip].length;
    res.set('X-RateLimit-Limit', maxRequests.toString());
    res.set('X-RateLimit-Remaining', Math.max(0, remaining).toString());
    res.set('X-RateLimit-Reset', (now + windowMs).toString());

    next();
  };
}
