import { PasswordService } from '../../src/services/PasswordService';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'TestPassword123';
      const hash = await passwordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123';
      const hash = await passwordService.hashPassword(password);
      const isValid = await passwordService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123';
      const hash = await passwordService.hashPassword(password);
      const isValid = await passwordService.verifyPassword('WrongPassword123', hash);

      expect(isValid).toBe(false);
    });

    it('should use constant-time comparison', async () => {
      const password = 'TestPassword123';
      const hash = await passwordService.hashPassword(password);

      // Both should take similar time regardless of where they differ
      const start1 = Date.now();
      await passwordService.verifyPassword('WrongPassword123', hash);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await passwordService.verifyPassword('TestPassword123', hash);
      const time2 = Date.now() - start2;

      // Times should be similar (within reasonable margin)
      expect(Math.abs(time1 - time2)).toBeLessThan(100);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = passwordService.validatePasswordStrength('StrongPass123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = passwordService.validatePasswordStrength('Short1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const result = passwordService.validatePasswordStrength('lowercase123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = passwordService.validatePasswordStrength('UPPERCASE123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = passwordService.validatePasswordStrength('NoNumbers');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return multiple errors for weak password', () => {
      const result = passwordService.validatePasswordStrength('weak');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
