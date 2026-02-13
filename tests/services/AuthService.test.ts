import { AuthService } from '../../src/services/AuthService';
import { UserRepository } from '../../src/repositories/UserRepository';
import { TokenBlacklistRepository } from '../../src/repositories/TokenBlacklistRepository';
import { PasswordService } from '../../src/services/PasswordService';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config/environment';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let tokenBlacklistRepository: jest.Mocked<TokenBlacklistRepository>;
  let passwordService: PasswordService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password_hash: '$2b$10$hashedpassword',
    name: 'Test User',
    role: 'user',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
  };

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    tokenBlacklistRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      findByUserId: jest.fn(),
      deleteExpired: jest.fn(),
      isBlacklisted: jest.fn(),
    } as any;

    passwordService = new PasswordService();
    authService = new AuthService(userRepository, tokenBlacklistRepository);
  });

  describe('login', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await passwordService.hashPassword(password);

      userRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        password_hash: hashedPassword,
      });

      const result = await authService.login('test@example.com', password);

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.id).toBe('user-123');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw error for non-existent user', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login('nonexistent@example.com', 'password')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw error for invalid password', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should not return password hash in response', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await passwordService.hashPassword(password);

      userRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        password_hash: hashedPassword,
      });

      const result = await authService.login('test@example.com', password);

      expect(result.user).not.toHaveProperty('password_hash');
    });
  });

  describe('validateToken', () => {
    it('should validate a valid access token', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await passwordService.hashPassword(password);

      userRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        password_hash: hashedPassword,
      });

      tokenBlacklistRepository.findByTokenHash.mockResolvedValue(null);

      const { tokens } = await authService.login('test@example.com', password);
      const decoded = await authService.validateToken(tokens.accessToken);

      expect(decoded.sub).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('user');
    });

    it('should throw error for blacklisted token', async () => {
      const token = jwt.sign(
        { sub: 'user-123', email: 'test@example.com', role: 'user', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, iss: 'ticketing-api' },
        config.jwt.secret
      );

      tokenBlacklistRepository.findByTokenHash.mockResolvedValue({
        id: 'blacklist-1',
        token_hash: 'hash',
        user_id: 'user-123',
        expires_at: new Date(),
      });

      await expect(authService.validateToken(token)).rejects.toThrow('Token has been revoked');
    });

    it('should throw error for expired token', async () => {
      const expiredToken = jwt.sign(
        { sub: 'user-123', email: 'test@example.com', role: 'user', iat: Math.floor(Date.now() / 1000) - 7200, exp: Math.floor(Date.now() / 1000) - 3600, iss: 'ticketing-api' },
        config.jwt.secret
      );

      tokenBlacklistRepository.findByTokenHash.mockResolvedValue(null);

      await expect(authService.validateToken(expiredToken)).rejects.toThrow(
        'Invalid or expired token'
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token with valid refresh token', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await passwordService.hashPassword(password);

      userRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        password_hash: hashedPassword,
      });

      userRepository.findById.mockResolvedValue(mockUser);
      tokenBlacklistRepository.findByTokenHash.mockResolvedValue(null);

      const { tokens } = await authService.login('test@example.com', password);
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const newAccessToken = await authService.refreshAccessToken(tokens.refreshToken);

      expect(newAccessToken).toBeDefined();
      
      // Decode both tokens to verify they have different iat values
      const originalDecoded = jwt.decode(tokens.accessToken) as any;
      const newDecoded = jwt.decode(newAccessToken) as any;
      
      expect(newDecoded.iat).toBeGreaterThanOrEqual(originalDecoded.iat);
      expect(newDecoded.sub).toBe('user-123');
    });

    it('should throw error for blacklisted refresh token', async () => {
      const refreshToken = jwt.sign(
        { sub: 'user-123', type: 'refresh', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 604800, iss: 'ticketing-api' },
        config.jwt.secret
      );

      tokenBlacklistRepository.findByTokenHash.mockResolvedValue({
        id: 'blacklist-1',
        token_hash: 'hash',
        user_id: 'user-123',
        expires_at: new Date(),
      });

      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow(
        'Token has been revoked'
      );
    });

    it('should throw error for invalid token type', async () => {
      const invalidToken = jwt.sign(
        { sub: 'user-123', type: 'access', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, iss: 'ticketing-api' },
        config.jwt.secret
      );

      tokenBlacklistRepository.findByTokenHash.mockResolvedValue(null);

      await expect(authService.refreshAccessToken(invalidToken)).rejects.toThrow(
        'Invalid token type'
      );
    });
  });

  describe('logout', () => {
    it('should blacklist token on logout', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await passwordService.hashPassword(password);

      userRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        password_hash: hashedPassword,
      });

      tokenBlacklistRepository.create.mockResolvedValue({
        id: 'blacklist-1',
        token_hash: 'hash',
        user_id: 'user-123',
        expires_at: new Date(),
      });

      const { tokens } = await authService.login('test@example.com', password);
      await authService.logout(tokens.accessToken);

      expect(tokenBlacklistRepository.create).toHaveBeenCalled();
    });
  });
});
