import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { TokenBlacklistRepository } from '../repositories/TokenBlacklistRepository';
import { Logger } from '../utils/logger';

const logger = new Logger('AuthRoutes');

/**
 * Create authentication routes
 */
export function createAuthRoutes(
  userRepository: UserRepository,
  tokenBlacklistRepository: TokenBlacklistRepository
): Router {
  const router = Router();
  const authService = new AuthService(userRepository, tokenBlacklistRepository);

  /**
   * POST /auth/login
   * Authenticate user with email and password
   * Returns access and refresh tokens
   */
  router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Email and password are required',
          errors: [
            ...((!email) ? [{ field: 'email', message: 'Email is required' }] : []),
            ...((!password) ? [{ field: 'password', message: 'Password is required' }] : []),
          ],
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Invalid email format',
          errors: [{ field: 'email', message: 'Email must be a valid email address' }],
        });
        return;
      }

      // Authenticate user
      const { user, tokens } = await authService.login(email, password);

      logger.info(`User ${user.id} logged in successfully`);

      res.status(200).json({
        success: true,
        data: {
          user,
          tokens,
        },
        message: 'Login successful',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        res.status(401).json({
          success: false,
          data: null,
          message: 'Invalid credentials',
        });
        return;
      }

      logger.error('Login error', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Internal server error',
      });
    }
  });

  /**
   * POST /auth/logout
   * Logout user by blacklisting their token
   */
  router.post('/logout', async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          data: null,
          message: 'Authorization token required',
        });
        return;
      }

      const token = authHeader.substring(7);

      // Logout user
      await authService.logout(token);

      logger.info('User logged out successfully');

      res.status(200).json({
        success: true,
        data: null,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout error', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Internal server error',
      });
    }
  });

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'Refresh token is required',
          errors: [{ field: 'refreshToken', message: 'Refresh token is required' }],
        });
        return;
      }

      // Refresh access token
      const accessToken = await authService.refreshAccessToken(refreshToken);

      logger.info('Access token refreshed successfully');

      res.status(200).json({
        success: true,
        data: {
          accessToken,
        },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      if (error instanceof Error && (error.message === 'Token has been revoked' || error.message === 'Invalid token type')) {
        res.status(401).json({
          success: false,
          data: null,
          message: 'Invalid or revoked refresh token',
        });
        return;
      }

      logger.error('Token refresh error', error);
      res.status(401).json({
        success: false,
        data: null,
        message: 'Failed to refresh token',
      });
    }
  });

  /**
   * GET /auth/me
   * Get current user profile
   * Requires valid access token
   */
  router.get('/me', async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          data: null,
          message: 'Authorization token required',
        });
        return;
      }

      const token = authHeader.substring(7);

      // Validate token
      const decoded = await authService.validateToken(token);

      // Get user
      const user = await userRepository.findById(decoded.sub);
      if (!user) {
        res.status(404).json({
          success: false,
          data: null,
          message: 'User not found',
        });
        return;
      }

      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
      };

      res.status(200).json({
        success: true,
        data: userResponse,
        message: 'User profile retrieved successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Token has been revoked') {
        res.status(401).json({
          success: false,
          data: null,
          message: 'Token has been revoked',
        });
        return;
      }

      logger.error('Get user profile error', error);
      res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid or expired token',
      });
    }
  });

  /**
   * GET /auth/users
   * Get all users
   * Requires valid access token
   */
  router.get('/users', async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          data: null,
          message: 'Authorization token required',
        });
        return;
      }

      const token = authHeader.substring(7);

      // Validate token
      await authService.validateToken(token);

      // Get all users
      const users = await userRepository.findAll();

      const usersResponse = users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
      }));

      res.status(200).json({
        success: true,
        data: usersResponse,
        message: 'Users retrieved successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Token has been revoked') {
        res.status(401).json({
          success: false,
          data: null,
          message: 'Token has been revoked',
        });
        return;
      }

      logger.error('Get users error', error);
      res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid or expired token',
      });
    }
  });

  /**
   * GET /auth/users/:id
   * Get specific user details
   * Requires valid access token
   */
  router.get('/users/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          data: null,
          message: 'Authorization token required',
        });
        return;
      }

      const token = authHeader.substring(7);
      const { id } = req.params;

      // Validate token
      await authService.validateToken(token);

      // Get user
      const user = await userRepository.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          data: null,
          message: 'User not found',
        });
        return;
      }

      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
      };

      res.status(200).json({
        success: true,
        data: userResponse,
        message: 'User retrieved successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Token has been revoked') {
        res.status(401).json({
          success: false,
          data: null,
          message: 'Token has been revoked',
        });
        return;
      }

      logger.error('Get user error', error);
      res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid or expired token',
      });
    }
  });

  return router;
}
