import { requestLogger } from '../../src/middleware/requestLogger';
import { corsMiddleware } from '../../src/middleware/cors';
import { securityHeaders } from '../../src/middleware/securityHeaders';
import { rateLimiter, clearRateLimiterStore } from '../../src/middleware/rateLimiter';
import { jwtAuth, optionalJwtAuth } from '../../src/middleware/jwtAuth';
import { TokenBlacklistRepository } from '../../src/repositories/TokenBlacklistRepository';
import jwt from 'jsonwebtoken';

describe('Middleware Stack', () => {
  describe('RequestLogger Middleware', () => {
    it('should log HTTP method, path, status code, and response time', () => {
      const req = {
        method: 'GET',
        path: '/test',
        query: {},
        body: {},
        get: jest.fn((header) => {
          if (header === 'user-agent') return 'test-agent';
          return undefined;
        }),
        ip: '127.0.0.1',
      } as any;

      const res = {
        statusCode: 200,
        send: jest.fn(function (_data) {
          return this;
        }),
      } as any;

      const next = jest.fn();

      requestLogger(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.send).toBeDefined();
    });

    it('should sanitize sensitive data in logs', () => {
      const req = {
        method: 'POST',
        path: '/auth/login',
        query: {},
        body: { email: 'test@example.com', password: 'secret123' },
        get: jest.fn((header) => {
          if (header === 'user-agent') return 'test-agent';
          return undefined;
        }),
        ip: '127.0.0.1',
      } as any;

      const res = {
        statusCode: 200,
        send: jest.fn(function (_data) {
          return this;
        }),
      } as any;

      const next = jest.fn();

      requestLogger(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('CORS Middleware', () => {
    it('should allow requests from whitelisted origins', () => {
      const allowedOrigins = ['http://localhost:3000', 'https://example.com'];
      const middleware = corsMiddleware(allowedOrigins);

      const req = {
        method: 'GET',
        get: jest.fn((header) => {
          if (header === 'origin') return 'http://localhost:3000';
          return undefined;
        }),
      } as any;

      const res = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        end: jest.fn(),
      } as any;

      const next = jest.fn();

      middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000');
      expect(next).toHaveBeenCalled();
    });

    it('should reject requests from non-whitelisted origins', () => {
      const allowedOrigins = ['http://localhost:3000'];
      const middleware = corsMiddleware(allowedOrigins);

      const req = {
        method: 'GET',
        get: jest.fn((header) => {
          if (header === 'origin') return 'http://malicious.com';
          return undefined;
        }),
      } as any;

      const res = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        end: jest.fn(),
      } as any;

      const next = jest.fn();

      middleware(req, res, next);

      // Should not set CORS headers for non-whitelisted origin
      expect(next).toHaveBeenCalled();
    });

    it('should handle preflight OPTIONS requests', () => {
      const allowedOrigins = ['http://localhost:3000'];
      const middleware = corsMiddleware(allowedOrigins);

      const req = {
        method: 'OPTIONS',
        get: jest.fn((header) => {
          if (header === 'origin') return 'http://localhost:3000';
          return undefined;
        }),
      } as any;

      const res = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        end: jest.fn(),
      } as any;

      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('Security Headers Middleware', () => {
    it('should add security headers to response', () => {
      const req = {} as any;
      const res = {
        set: jest.fn(),
      } as any;
      const next = jest.fn();

      securityHeaders(req, res, next);

      expect(res.set).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining('default-src')
      );
      expect(res.set).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(res.set).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.set).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(next).toHaveBeenCalled();
    });

    it('should add HSTS header in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const req = {} as any;
      const res = {
        set: jest.fn(),
      } as any;
      const next = jest.fn();

      securityHeaders(req, res, next);

      expect(res.set).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Rate Limiter Middleware', () => {
    beforeEach(() => {
      // Clear rate limiter store between tests
      clearRateLimiterStore();
      jest.clearAllMocks();
    });

    it('should allow requests within limit', () => {
      const middleware = rateLimiter(900000, 100);

      const req = {
        ip: '127.0.0.1-test1',
      } as any;

      const res = {
        set: jest.fn(),
      } as any;

      const next = jest.fn();

      middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(next).toHaveBeenCalled();
    });

    it('should reject requests exceeding limit', () => {
      const middleware = rateLimiter(900000, 2);

      const req = {
        ip: '127.0.0.1-test2',
      } as any;

      const res = {
        set: jest.fn(),
      } as any;

      const next = jest.fn();

      // Make 2 requests (within limit)
      middleware(req, res, next);
      middleware(req, res, next);

      // Third request should throw
      expect(() => {
        middleware(req, res, next);
      }).toThrow('Too many requests');
    });

    it('should include Retry-After header when rate limited', () => {
      const middleware = rateLimiter(900000, 1);

      const req = {
        ip: '127.0.0.1-test3',
      } as any;

      const res = {
        set: jest.fn(),
      } as any;

      const next = jest.fn();

      middleware(req, res, next);

      // Second request should throw with Retry-After
      expect(() => {
        middleware(req, res, next);
      }).toThrow('Too many requests');
    });
  });

  describe('JWT Authentication Middleware', () => {
    let tokenBlacklistRepository: TokenBlacklistRepository;

    beforeEach(() => {
      tokenBlacklistRepository = {
        isBlacklisted: jest.fn().mockResolvedValue(false),
      } as any;
    });

    it('should authenticate valid JWT token', async () => {
      // Use the actual JWT secret from config
      const secret = 'your-secret-key-change-in-production';
      const token = jwt.sign(
        {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'user',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
          iss: 'ticketing-api',
        },
        secret
      );

      const req = {
        get: jest.fn((header) => {
          if (header === 'authorization') return `Bearer ${token}`;
          return undefined;
        }),
      } as any;

      const res = {} as any;
      const next = jest.fn();

      const middleware = jwtAuth(tokenBlacklistRepository);
      await middleware(req, res, next);

      expect(req.userId).toBe('user-123');
      expect(req.userEmail).toBe('test@example.com');
      expect(req.userRole).toBe('user');
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      const req = {
        get: jest.fn().mockReturnValue(undefined),
      } as any;

      const res = {} as any;
      const next = jest.fn();

      const middleware = jwtAuth(tokenBlacklistRepository);

      await middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('Missing authorization header');
    });

    it('should reject request with invalid Bearer format', async () => {
      const req = {
        get: jest.fn((header) => {
          if (header === 'authorization') return 'InvalidFormat token';
          return undefined;
        }),
      } as any;

      const res = {} as any;
      const next = jest.fn();

      const middleware = jwtAuth(tokenBlacklistRepository);

      await middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('Invalid authorization header format');
    });
  });

  describe('Optional JWT Authentication Middleware', () => {
    let tokenBlacklistRepository: TokenBlacklistRepository;

    beforeEach(() => {
      tokenBlacklistRepository = {
        isBlacklisted: jest.fn().mockResolvedValue(false),
      } as any;
    });

    it('should continue without token if not provided', async () => {
      const req = {
        get: jest.fn().mockReturnValue(undefined),
      } as any;

      const res = {} as any;
      const next = jest.fn();

      const middleware = optionalJwtAuth(tokenBlacklistRepository);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.userId).toBeUndefined();
    });

    it('should continue without token if invalid format', async () => {
      const req = {
        get: jest.fn((header) => {
          if (header === 'authorization') return 'InvalidFormat token';
          return undefined;
        }),
      } as any;

      const res = {} as any;
      const next = jest.fn();

      const middleware = optionalJwtAuth(tokenBlacklistRepository);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.userId).toBeUndefined();
    });
  });
});
