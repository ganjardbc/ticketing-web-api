import { Router, Request, Response, NextFunction } from 'express';
import { ticketService } from '../services/TicketService';
import { TokenBlacklistRepository } from '../repositories/TokenBlacklistRepository';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();

const tokenBlacklistRepository = new TokenBlacklistRepository();
const authenticate = jwtAuth(tokenBlacklistRepository);

/**
 * GET /tickets
 * Get all tickets with pagination and filtering
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await ticketService.getAllTickets({
      page,
      limit,
      status: status as 'visible' | 'hidden' | undefined,
      search,
    });

    res.json({
      success: true,
      data: result.tickets,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      },
      message: 'Tickets retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /tickets/stats/summary
 * Get ticket statistics
 * Must be defined before /:id route to avoid route matching conflict
 */
router.get('/stats/summary', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await ticketService.getTicketStatistics();

    res.json({
      success: true,
      data: stats,
      message: 'Ticket statistics retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /tickets/:id
 * Get a specific ticket by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const ticket = await ticketService.getTicketById(id);

    if (!ticket) {
      res.status(404).json({
        success: false,
        data: null,
        message: 'Ticket not found',
      });
      return;
    }

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /tickets
 * Create a new ticket (requires authentication)
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, price, status } = req.body;

    const ticket = await ticketService.createTicket({
      code,
      price,
      status,
    });

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Ticket created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /tickets/:id
 * Update a ticket (requires authentication)
 */
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { price, status } = req.body;

    const ticket = await ticketService.updateTicket(id, {
      price,
      status,
    });

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /tickets/:id/status
 * Update ticket status (requires authentication)
 */
router.patch('/:id/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Status is required',
        errors: [{ field: 'status', message: 'Status is required' }],
      });
      return;
    }

    const ticket = await ticketService.updateTicketStatus(id, status);

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket status updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /tickets/:id
 * Delete a ticket (soft delete - requires authentication)
 */
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await ticketService.deleteTicket(id);

    res.json({
      success: true,
      data: null,
      message: 'Ticket deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
