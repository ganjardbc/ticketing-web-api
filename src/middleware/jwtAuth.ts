import { Request, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/environment';
import { Logger } from '../utils/logger';
import { AuthenticationError } from './errorHandler';
import { TokenBlacklistRepository } from '../repositories/TokenBlacklistRepository';

const logger = new Logger('JWTAuth');

/**
 * Extend Express Request to include user info
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: string;
      token?: string;
    }
  }
}

/**
 * JWT Token Payload
 */
interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  iss: string;
}

/**
 * Hash token for blacklist checking
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * JWT Authentication Middleware
 * Extracts token from Authorization header
 * Validates token signature and expiration
 * Checks token blacklist
 * Attaches user info to request object
 * Returns 401 for invalid/missing tokens
 */
export function jwtAuth(tokenBlacklistRepository: TokenBlacklistRepository) {
  return async (req: Request, _res: any, next: NextFunction): Promise<void> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.get('authorization');
      if (!authHeader) {
        return next(new AuthenticationError('Missing authorization header'));
      }

      // Check Bearer scheme
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        return next(new AuthenticationError('Invalid authorization header format'));
      }

      const token = parts[1];
      req.token = token;

      // Verify token signature and expiration
      let payload: TokenPayload;
      try {
        payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
      } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
          return next(new AuthenticationError('Token has expired'));
        }
        if (error.name === 'JsonWebTokenError') {
          return next(new AuthenticationError('Invalid token'));
        }
        return next(error);
      }

      // Check token blacklist
      const tokenHash = hashToken(token);
      const isBlacklisted = await tokenBlacklistRepository.isBlacklisted(tokenHash);
      if (isBlacklisted) {
        return next(new AuthenticationError('Token has been revoked'));
      }

      // Attach user info to request
      req.userId = payload.sub;
      req.userEmail = payload.email;
      req.userRole = payload.role;

      logger.debug(`JWT authenticated user: ${payload.email}`, {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      });

      next();
    } catch (error) {
      logger.error('JWT authentication error', error);
      next(new AuthenticationError('Authentication failed'));
    }
  };
}

/**
 * Optional JWT Authentication Middleware
 * Same as jwtAuth but doesn't throw if token is missing
 * Useful for endpoints that work with or without authentication
 */
export function optionalJwtAuth(tokenBlacklistRepository: TokenBlacklistRepository) {
  return async (req: Request, _res: any, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.get('authorization');
      if (!authHeader) {
        // No token provided, continue without authentication
        next();
        return;
      }

      // Token provided, validate it
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        // Invalid format, continue without authentication
        next();
        return;
      }

      const token = parts[1];
      req.token = token;

      // Verify token signature and expiration
      let payload: TokenPayload;
      try {
        payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
      } catch (error: any) {
        // Invalid token, continue without authentication
        logger.debug('Optional JWT validation failed, continuing without auth', { error: error.message });
        next();
        return;
      }

      // Check token blacklist
      const tokenHash = hashToken(token);
      const isBlacklisted = await tokenBlacklistRepository.isBlacklisted(tokenHash);
      if (isBlacklisted) {
        // Token blacklisted, continue without authentication
        logger.debug('Token is blacklisted, continuing without auth');
        next();
        return;
      }

      // Attach user info to request
      req.userId = payload.sub;
      req.userEmail = payload.email;
      req.userRole = payload.role;

      logger.debug(`Optional JWT authenticated user: ${payload.email}`, {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      });

      next();
    } catch (error) {
      logger.error('Optional JWT authentication error', error);
      // Continue without authentication on error
      next();
    }
  };
}
