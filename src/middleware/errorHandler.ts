import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = new Logger('ErrorHandler');

/**
 * Error response format
 */
export interface ErrorResponse {
  success: false;
  data: null;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Array<{ field: string; message: string }>,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    errors: Array<{ field: string; message: string }>,
    context?: Record<string, any>
  ) {
    super(400, message, errors, context);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: Record<string, any>) {
    super(401, message, undefined, context);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', context?: Record<string, any>) {
    super(403, message, undefined, context);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: Record<string, any>) {
    super(404, message, undefined, context);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error class (e.g., duplicate resource)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', context?: Record<string, any>) {
    super(409, message, undefined, context);
    this.name = 'ConflictError';
  }
}

/**
 * Business rule violation error class
 */
export class BusinessRuleError extends AppError {
  constructor(
    message: string,
    errors?: Array<{ field: string; message: string }>,
    context?: Record<string, any>
  ) {
    super(422, message, errors, context);
    this.name = 'BusinessRuleError';
  }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', context?: Record<string, any>) {
    super(503, message, undefined, context);
    this.name = 'DatabaseError';
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', context?: Record<string, any>) {
    super(429, message, undefined, context);
    this.name = 'RateLimitError';
  }
}

/**
 * Sanitize error for client response
 * Removes sensitive information like stack traces, database details, etc.
 */
function sanitizeError(error: any): { message: string; statusCode: number; errors?: any[] } {
  // Handle known application errors
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      errors: error.errors,
    };
  }

  // Handle database errors
  if (error.code === 'ER_DUP_ENTRY' || error.code === 'ER_NO_REFERENCED_ROW') {
    return {
      message: 'Database constraint violation',
      statusCode: 409,
    };
  }

  if (error.code && error.code.startsWith('ER_')) {
    return {
      message: 'Database operation failed',
      statusCode: 503,
    };
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      message: 'Invalid token',
      statusCode: 401,
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      message: 'Token has expired',
      statusCode: 401,
    };
  }

  // Handle validation errors from libraries
  if (error.name === 'ValidationError' && !error.statusCode) {
    return {
      message: 'Validation failed',
      statusCode: 400,
      errors: error.errors,
    };
  }

  // Default to generic error
  return {
    message: 'Internal server error',
    statusCode: 500,
  };
}

/**
 * Extract request context for logging
 */
function extractRequestContext(req: Request): Record<string, any> {
  return {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).userId,
  };
}

/**
 * Error handler middleware
 * Catches all errors and returns consistent error responses
 * Ensures sensitive information is not exposed to clients
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestContext = extractRequestContext(req);
  const sanitized = sanitizeError(err);

  // Log error with full context
  const logContext = {
    ...requestContext,
    errorName: err.name,
    errorMessage: err.message,
    statusCode: sanitized.statusCode,
    ...(err.context && { appContext: err.context }),
  };

  if (sanitized.statusCode >= 500) {
    logger.error(`${err.name}: ${err.message}`, { ...logContext, stack: err.stack });
  } else if (sanitized.statusCode >= 400) {
    logger.warn(`${err.name}: ${err.message}`, logContext);
  }

  // Build error response
  const response: ErrorResponse = {
    success: false,
    data: null,
    message: sanitized.message,
  };

  // Include field-level errors if available
  if (sanitized.errors && sanitized.errors.length > 0) {
    response.errors = sanitized.errors;
  }

  // Set appropriate status code
  const statusCode = sanitized.statusCode || 500;

  // Add rate limit headers if applicable
  if (statusCode === 429) {
    res.set('Retry-After', '60');
  }

  res.status(statusCode).json(response);
}

/**
 * Async error wrapper for route handlers
 * Catches errors in async route handlers and passes them to error handler
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
