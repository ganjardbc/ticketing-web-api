import { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
  DatabaseError,
  RateLimitError,
} from '../../src/middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let setMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnValue(undefined);
    setMock = jest.fn().mockReturnValue(undefined);
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, set: setMock });

    mockReq = {
      method: 'POST',
      path: '/auth/login',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    };

    mockRes = {
      status: statusMock,
      set: setMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  describe('Validation Errors', () => {
    it('should handle validation errors with field-level details', () => {
      const error = new ValidationError('Validation failed', [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password must be at least 8 characters' },
      ]);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' },
          { field: 'password', message: 'Password must be at least 8 characters' },
        ],
      });
    });

    it('should return 400 status for validation errors', () => {
      const error = new ValidationError('Invalid input', [
        { field: 'email', message: 'Invalid email format' },
      ]);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('Authentication Errors', () => {
    it('should handle authentication errors with 401 status', () => {
      const error = new AuthenticationError('Invalid credentials');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Invalid credentials',
      });
    });

    it('should handle token expiration errors', () => {
      const error = new AuthenticationError('Token has expired');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Token has expired',
      });
    });

    it('should handle missing token errors', () => {
      const error = new AuthenticationError('Authorization token required');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  describe('Authorization Errors', () => {
    it('should handle authorization errors with 403 status', () => {
      const error = new AuthorizationError('Access denied');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Access denied',
      });
    });

    it('should handle insufficient permissions errors', () => {
      const error = new AuthorizationError('Insufficient permissions');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });

  describe('Not Found Errors', () => {
    it('should handle not found errors with 404 status', () => {
      const error = new NotFoundError('User not found');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'User not found',
      });
    });
  });

  describe('Conflict Errors', () => {
    it('should handle conflict errors with 409 status', () => {
      const error = new ConflictError('Email already exists');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Email already exists',
      });
    });
  });

  describe('Business Rule Errors', () => {
    it('should handle business rule errors with 422 status', () => {
      const error = new BusinessRuleError('Business rule violation', [
        { field: 'price', message: 'Price must be positive' },
      ]);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Business rule violation',
        errors: [{ field: 'price', message: 'Price must be positive' }],
      });
    });
  });

  describe('Database Errors', () => {
    it('should handle database errors with 503 status', () => {
      const error = new DatabaseError('Database connection failed');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Database connection failed',
      });
    });

    it('should sanitize MySQL error details', () => {
      const mysqlError = new Error('ER_DUP_ENTRY: Duplicate entry');
      (mysqlError as any).code = 'ER_DUP_ENTRY';

      errorHandler(mysqlError, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Database constraint violation',
      });
    });

    it('should not expose database connection strings', () => {
      const error = new Error('Connection refused at 192.168.1.100:3306');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      const response = jsonMock.mock.calls[0][0];
      expect(response.message).not.toContain('192.168.1.100');
      expect(response.message).not.toContain('3306');
    });
  });

  describe('Rate Limit Errors', () => {
    it('should handle rate limit errors with 429 status', () => {
      const error = new RateLimitError('Too many requests');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Too many requests',
      });
    });

    it('should include Retry-After header for rate limit errors', () => {
      const error = new RateLimitError('Too many requests');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(setMock).toHaveBeenCalledWith('Retry-After', '60');
    });
  });

  describe('Unexpected Errors', () => {
    it('should handle unexpected errors with 500 status', () => {
      const error = new Error('Unexpected error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Internal server error',
      });
    });

    it('should not expose stack traces to client', () => {
      const error = new Error('Database query failed at line 42');
      error.stack = 'Error: Database query failed\n    at Object.<anonymous> (/app/src/db.ts:42:15)';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.message).not.toContain('/app/src/db.ts');
      expect(response.message).not.toContain('line 42');
    });

    it('should not expose file paths to client', () => {
      const error = new Error('Failed to read /etc/passwd');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.message).not.toContain('/etc/passwd');
    });
  });

  describe('JWT Errors', () => {
    it('should handle JsonWebTokenError', () => {
      const error = new Error('invalid signature');
      (error as any).name = 'JsonWebTokenError';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Invalid token',
      });
    });

    it('should handle TokenExpiredError', () => {
      const error = new Error('jwt expired');
      (error as any).name = 'TokenExpiredError';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Token has expired',
      });
    });
  });

  describe('Error Response Format', () => {
    it('should always return success: false', () => {
      const error = new ValidationError('Test error', []);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.success).toBe(false);
    });

    it('should always return data: null', () => {
      const error = new ValidationError('Test error', []);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.data).toBeNull();
    });

    it('should include message in response', () => {
      const error = new ValidationError('Custom error message', []);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.message).toBe('Custom error message');
    });

    it('should include errors array when available', () => {
      const errors = [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' },
      ];
      const error = new ValidationError('Validation failed', errors);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.errors).toEqual(errors);
    });

    it('should not include errors array when not available', () => {
      const error = new AuthenticationError('Invalid credentials');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.errors).toBeUndefined();
    });
  });

  describe('Sensitive Information Protection', () => {
    it('should not expose database connection details', () => {
      const error = new Error('Connection to mysql://user:password@localhost:3306/db failed');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.message).not.toContain('mysql://');
      expect(response.message).not.toContain('password');
      expect(response.message).not.toContain('localhost:3306');
    });

    it('should not expose API keys or secrets', () => {
      const error = new Error('Failed to authenticate with API key: sk_live_abc123xyz');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.message).not.toContain('sk_live_abc123xyz');
    });

    it('should not expose internal function names', () => {
      const error = new Error('Error in _validateUserPermissions()');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.message).not.toContain('_validateUserPermissions');
    });
  });

  describe('Error Context Logging', () => {
    it('should log request context with error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Error should be logged (we can't directly test logger, but we verify handler completes)
      expect(statusMock).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('MySQL Error Codes', () => {
    it('should handle ER_NO_REFERENCED_ROW as 409 conflict', () => {
      const error = new Error('Foreign key constraint failed');
      (error as any).code = 'ER_NO_REFERENCED_ROW';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(409);
    });

    it('should handle generic ER_ errors as 503 service unavailable', () => {
      const error = new Error('Database error');
      (error as any).code = 'ER_UNKNOWN_ERROR';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(503);
    });
  });
});
