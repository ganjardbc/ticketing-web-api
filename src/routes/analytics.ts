import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { TokenBlacklistRepository } from '../repositories/TokenBlacklistRepository';
import { jwtAuth } from '../middleware/jwtAuth';
import { Logger } from '../utils/logger';

const router = Router();
const analyticsService = new AnalyticsService();
const logger = new Logger('AnalyticsRoutes');

const tokenBlacklistRepository = new TokenBlacklistRepository();
const authenticate = jwtAuth(tokenBlacklistRepository);

/**
 * GET /analytics/dashboard
 * Get combined ticket and order statistics
 */
router.get('/dashboard', authenticate, async (_req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getDashboardAnalytics();
    res.json({
      success: true,
      data: analytics,
      message: 'Dashboard analytics retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get dashboard analytics', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve dashboard analytics',
    });
  }
});

/**
 * GET /analytics/tickets
 * Get ticket statistics
 */
router.get('/tickets', authenticate, async (_req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getTicketAnalytics();
    res.json({
      success: true,
      data: analytics,
      message: 'Ticket analytics retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get ticket analytics', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve ticket analytics',
    });
  }
});

/**
 * GET /analytics/orders
 * Get order statistics
 */
router.get('/orders', authenticate, async (_req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getOrderAnalytics();
    res.json({
      success: true,
      data: analytics,
      message: 'Order analytics retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get order analytics', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve order analytics',
    });
  }
});

/**
 * GET /analytics/revenue
 * Get revenue breakdown by payment type
 */
router.get('/revenue', authenticate, async (_req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getRevenueAnalytics();
    res.json({
      success: true,
      data: analytics,
      message: 'Revenue analytics retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get revenue analytics', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve revenue analytics',
    });
  }
});

/**
 * GET /analytics/ticket-types
 * Get order distribution by ticket type
 */
router.get('/ticket-types', authenticate, async (_req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getTicketTypeDistribution();
    res.json({
      success: true,
      data: analytics,
      message: 'Ticket type distribution retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get ticket type distribution', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve ticket type distribution',
    });
  }
});

/**
 * GET /analytics/ticket-status
 * Get order distribution by status
 */
router.get('/ticket-status', authenticate, async (_req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getStatusDistribution();
    res.json({
      success: true,
      data: analytics,
      message: 'Status distribution retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get status distribution', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve status distribution',
    });
  }
});

export default router;
