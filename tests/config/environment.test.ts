import { config, validateConfig } from '../../src/config/environment';

describe('Environment Configuration', () => {
  describe('config object', () => {
    it('should have port configured', () => {
      expect(config.port).toBeDefined();
      expect(typeof config.port).toBe('number');
      expect(config.port).toBeGreaterThan(0);
    });

    it('should have database configuration', () => {
      expect(config.database).toBeDefined();
      expect(config.database.host).toBeDefined();
      expect(config.database.port).toBeGreaterThan(0);
      expect(config.database.user).toBeDefined();
      expect(config.database.database).toBeDefined();
    });

    it('should have JWT configuration', () => {
      expect(config.jwt).toBeDefined();
      expect(config.jwt.secret).toBeDefined();
      expect(config.jwt.accessTokenExpiry).toBeGreaterThan(0);
      expect(config.jwt.refreshTokenExpiry).toBeGreaterThan(0);
    });

    it('should have CORS configuration', () => {
      expect(config.cors).toBeDefined();
      expect(Array.isArray(config.cors.origins)).toBe(true);
    });

    it('should have rate limit configuration', () => {
      expect(config.rateLimit).toBeDefined();
      expect(config.rateLimit.windowMs).toBeGreaterThan(0);
      expect(config.rateLimit.maxRequests).toBeGreaterThan(0);
    });

    it('should have logging configuration', () => {
      expect(config.logging).toBeDefined();
      expect(config.logging.level).toBeDefined();
      expect(config.logging.dir).toBeDefined();
    });

    it('should have security configuration', () => {
      expect(config.security).toBeDefined();
      expect(config.security.bcryptSaltRounds).toBeGreaterThanOrEqual(10);
    });
  });

  describe('validateConfig', () => {
    it('should not throw when required variables are set', () => {
      // Set required environment variables for this test
      process.env.DB_HOST = 'localhost';
      process.env.DB_USER = 'root';
      process.env.DB_PASSWORD = 'password';
      process.env.DB_NAME = 'ticketing_api';
      process.env.JWT_SECRET = 'test-secret';

      expect(() => validateConfig()).not.toThrow();
    });
  });
});
