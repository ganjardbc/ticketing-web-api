import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/environment';
import { Logger } from '../utils/logger';
import { UserRepository } from '../repositories/UserRepository';
import { TokenBlacklistRepository } from '../repositories/TokenBlacklistRepository';

const logger = new Logger('AuthService');

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  iss: string;
}

export interface RefreshTokenPayload {
  sub: string;
  type: string;
  iat: number;
  exp: number;
  iss: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

/**
 * Authentication Service
 * Handles JWT token generation, validation, and user authentication
 */
export class AuthService {
  private userRepository: UserRepository;
  private tokenBlacklistRepository: TokenBlacklistRepository;

  constructor(
    userRepository: UserRepository,
    tokenBlacklistRepository: TokenBlacklistRepository
  ) {
    this.userRepository = userRepository;
    this.tokenBlacklistRepository = tokenBlacklistRepository;
  }

  /**
   * Authenticate user with email and password
   * Returns tokens if credentials are valid
   */
  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    logger.info(`Login attempt for email: ${email}`);

    // Get user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      logger.warn(`Login failed: User not found for email: ${email}`);
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      logger.warn(`Login failed: Invalid password for email: ${email}`);
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role);

    logger.info(`Login successful for user: ${user.id}`);

    // Return user without password hash
    const userResponse: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
    };

    return { user: userResponse, tokens };
  }

  /**
   * Logout user by blacklisting their tokens
   */
  async logout(token: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
      const tokenHash = this.hashToken(token);

      await this.tokenBlacklistRepository.create({
        id: uuidv4(),
        token_hash: tokenHash,
        user_id: decoded.sub,
        expires_at: new Date(decoded.exp * 1000),
      });

      logger.info(`User ${decoded.sub} logged out`);
    } catch (error) {
      logger.error('Logout failed', error);
      throw new Error('Failed to logout');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as RefreshTokenPayload;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.tokenBlacklistRepository.findByTokenHash(
        this.hashToken(refreshToken)
      );
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      // Get user
      const user = await this.userRepository.findById(decoded.sub);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user.id, user.email, user.role);

      logger.info(`Access token refreshed for user: ${user.id}`);

      return accessToken;
    } catch (error) {
      if (error instanceof Error && (error.message === 'Token has been revoked' || error.message === 'Invalid token type' || error.message === 'User not found')) {
        throw error;
      }
      logger.error('Token refresh failed', error);
      throw new Error('Failed to refresh token');
    }
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<TokenPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.tokenBlacklistRepository.findByTokenHash(
        this.hashToken(token)
      );
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      // Verify token signature and expiration
      const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof Error && error.message === 'Token has been revoked') {
        throw error;
      }
      logger.warn('Token validation failed', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(userId: string, email: string, role: string): AuthTokens {
    const accessToken = this.generateAccessToken(userId, email, role);
    const refreshToken = this.generateRefreshToken(userId);

    return { accessToken, refreshToken };
  }

  /**
   * Generate access token (1 hour expiration)
   */
  private generateAccessToken(userId: string, email: string, role: string): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = config.jwt.accessTokenExpiry;

    const payload: TokenPayload = {
      sub: userId,
      email,
      role,
      iat: now,
      exp: now + expiresIn,
      iss: 'ticketing-api',
    };

    return jwt.sign(payload, config.jwt.secret, { algorithm: 'HS256' });
  }

  /**
   * Generate refresh token (7 days expiration)
   */
  private generateRefreshToken(userId: string): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = config.jwt.refreshTokenExpiry;

    const payload: RefreshTokenPayload = {
      sub: userId,
      type: 'refresh',
      iat: now,
      exp: now + expiresIn,
      iss: 'ticketing-api',
    };

    return jwt.sign(payload, config.jwt.secret, { algorithm: 'HS256' });
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = config.security.bcryptSaltRounds;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Hash token for storage in blacklist
   */
  private hashToken(token: string): string {
    // Simple hash for token - in production, use crypto.createHash
    return require('crypto').createHash('sha256').update(token).digest('hex');
  }
}
