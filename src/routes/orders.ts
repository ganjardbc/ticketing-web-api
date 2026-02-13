import { Router, Request, Response, NextFunction } from 'express';
import { orderService } from '../services/OrderService';
import { TokenBlacklistRepository } from '../repositories/TokenBlacklistRepository';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();
const tokenBlacklistRepository = new TokenBlacklistRepository();
const authenticate = jwtAuth(tokenBlacklistRepository);

/**
 * GET /orders/stats/summary
 * Get order statistics (requires authentication)
 */
router.get('/stats/summary', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await orderService.getOrderStatistics();

    res.json({
      success: true,
      data: stats,
      message: 'Order statistics retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /orders/user/:userId
 * Get orders by user ID (requires authentication)
 */
router.get('/user/:userId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await orderService.getOrdersByUserId(userId, page, limit);

    res.json({
      success: true,
      data: result.orders,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      },
      message: 'User orders retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /orders
 * Get all orders with pagination and filtering (requires authentication)
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get query parameters
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;
    const paymentType = req.query.paymentType as string | undefined;
    const userId = req.query.userId as string | undefined;

    const result = await orderService.getAllOrders({
      page,
      limit,
      status: status as 'pending' | 'completed' | 'cancelled' | undefined,
      type: type as 'regular' | 'vip' | 'group' | undefined,
      paymentType: paymentType as 'cash' | 'non-cash' | undefined,
      userId,
    });

    res.json({
      success: true,
      data: result.orders,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      },
      message: 'Orders retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /orders/:id
 * Get a specific order by ID with authorization (requires authentication)
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const order = await orderService.getOrderById(id, userId);

    if (!order) {
      res.status(404).json({
        success: false,
        data: null,
        message: 'Order not found',
      });
      return;
    }

    res.json({
      success: true,
      data: order,
      message: 'Order retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /orders
 * Create a new order (requires authentication)
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, ticket_id, visitor_name, visit_date, qty, type, payment_type, total_amount, status } = req.body;

    const order = await orderService.createOrder({
      user_id,
      ticket_id,
      visitor_name,
      visit_date: new Date(visit_date),
      qty,
      type,
      payment_type,
      total_amount,
      status,
    });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /orders/:id/status
 * Update order status (requires authentication)
 */
router.patch('/:id/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).userId;

    if (!status) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Status is required',
        errors: [{ field: 'status', message: 'Status is required' }],
      });
      return;
    }

    const order = await orderService.updateOrderStatus(id, status, userId);

    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
