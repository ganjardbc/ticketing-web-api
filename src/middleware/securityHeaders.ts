import { Request, Response, NextFunction } from 'express';

/**
 * Security Headers Middleware
 * Adds security headers to prevent common attacks:
 * - Content-Security-Policy: Prevents XSS attacks
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - Strict-Transport-Security: Enforces HTTPS
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Content-Security-Policy: Prevent XSS attacks
  res.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'"
  );

  // X-Frame-Options: Prevent clickjacking
  res.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options: Prevent MIME sniffing
  res.set('X-Content-Type-Options', 'nosniff');

  // Strict-Transport-Security: Enforce HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // X-XSS-Protection: Legacy XSS protection header
  res.set('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy: Control referrer information
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy: Control browser features
  res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
}
