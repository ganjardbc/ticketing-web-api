import { Router, Request, Response } from 'express';
import { ReportsService } from '../services/ReportsService';
import { TokenBlacklistRepository } from '../repositories/TokenBlacklistRepository';
import { jwtAuth } from '../middleware/jwtAuth';
import { Logger } from '../utils/logger';

const router = Router();
const reportsService = new ReportsService();
const logger = new Logger('ReportsRoutes');

const tokenBlacklistRepository = new TokenBlacklistRepository();
const authenticate = jwtAuth(tokenBlacklistRepository);

/**
 * GET /reports/tickets
 * Get detailed ticket report with filters
 */
router.get('/tickets', authenticate, async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const report = await reportsService.getTicketReport(filters);
    res.json({
      success: true,
      data: report,
      message: 'Ticket report retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get ticket report', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve ticket report',
    });
  }
});

/**
 * GET /reports/orders
 * Get detailed order report with filters
 */
router.get('/orders', authenticate, async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      type: req.query.type as string,
      paymentType: req.query.paymentType as string,
      userId: req.query.userId as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const report = await reportsService.getOrderReport(filters);
    res.json({
      success: true,
      data: report,
      message: 'Order report retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get order report', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve order report',
    });
  }
});

/**
 * GET /reports/sales
 * Get sales report by date
 */
router.get('/sales', authenticate, async (req: Request, res: Response) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
    };

    const report = await reportsService.getSalesReport(filters);
    res.json({
      success: true,
      data: report,
      message: 'Sales report retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get sales report', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve sales report',
    });
  }
});

/**
 * GET /reports/user-activity
 * Get user activity report
 */
router.get('/user-activity', authenticate, async (req: Request, res: Response) => {
  try {
    const filters = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const report = await reportsService.getUserActivityReport(filters);
    res.json({
      success: true,
      data: report,
      message: 'User activity report retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get user activity report', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve user activity report',
    });
  }
});

/**
 * GET /reports/summary
 * Get complete report summary
 */
router.get('/summary', authenticate, async (_req: Request, res: Response) => {
  try {
    const report = await reportsService.getSummaryReport();
    res.json({
      success: true,
      data: report,
      message: 'Summary report retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get summary report', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to retrieve summary report',
    });
  }
});

export default router;
