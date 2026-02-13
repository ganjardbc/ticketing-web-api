import { orderRepository, Order, CreateOrderInput, OrderFilter } from '../repositories/OrderRepository';
import { ticketRepository } from '../repositories/TicketRepository';
import { UserRepository } from '../repositories/UserRepository';

export class OrderService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Create a new order with validation
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    // Validate input
    const errors: any[] = [];

    if (!input.user_id || typeof input.user_id !== 'string') {
      errors.push({ field: 'user_id', message: 'User ID is required' });
    }

    if (!input.ticket_id || typeof input.ticket_id !== 'string') {
      errors.push({ field: 'ticket_id', message: 'Ticket ID is required' });
    }

    if (!input.visitor_name || typeof input.visitor_name !== 'string' || input.visitor_name.trim() === '') {
      errors.push({ field: 'visitor_name', message: 'Visitor name is required and must be a non-empty string' });
    }

    if (!input.visit_date) {
      errors.push({ field: 'visit_date', message: 'Visit date is required' });
    }

    if (input.qty === undefined || input.qty === null) {
      errors.push({ field: 'qty', message: 'Quantity is required' });
    } else if (typeof input.qty !== 'number' || input.qty < 1 || !Number.isInteger(input.qty)) {
      errors.push({ field: 'qty', message: 'Quantity must be a positive integer' });
    }

    if (input.total_amount === undefined || input.total_amount === null) {
      errors.push({ field: 'total_amount', message: 'Total amount is required' });
    } else if (typeof input.total_amount !== 'number' || input.total_amount < 0) {
      errors.push({ field: 'total_amount', message: 'Total amount must be a non-negative number' });
    }

    if (input.type && !['regular', 'vip', 'group'].includes(input.type)) {
      errors.push({ field: 'type', message: 'Type must be one of: regular, vip, group' });
    }

    if (input.payment_type && !['cash', 'non-cash'].includes(input.payment_type)) {
      errors.push({ field: 'payment_type', message: 'Payment type must be either "cash" or "non-cash"' });
    }

    if (input.status && !['pending', 'completed', 'cancelled'].includes(input.status)) {
      errors.push({ field: 'status', message: 'Status must be one of: pending, completed, cancelled' });
    }

    if (errors.length > 0) {
      const error = new Error('Validation failed');
      (error as any).statusCode = 422;
      (error as any).errors = errors;
      throw error;
    }

    // Check if user exists
    const user = await this.userRepository.findById(input.user_id);
    if (!user) {
      const error = new Error('User not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Check if ticket exists
    const ticket = await ticketRepository.findById(input.ticket_id);
    if (!ticket) {
      const error = new Error('Ticket not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return orderRepository.create(input);
  }

  /**
   * Get order by ID with authorization check
   */
  async getOrderById(id: string, userId?: string): Promise<Order | null> {
    if (!id || typeof id !== 'string') {
      const error = new Error('Invalid order ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const order = await orderRepository.findById(id);

    // Check authorization if userId is provided
    if (order && userId && order.user_id !== userId) {
      const error = new Error('You do not have permission to access this order');
      (error as any).statusCode = 403;
      throw error;
    }

    return order;
  }

  /**
   * Get all orders with filtering and pagination
   */
  async getAllOrders(filter: OrderFilter = {}): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;

    // Validate pagination
    if (page < 1 || !Number.isInteger(page)) {
      const error = new Error('Page must be a positive integer');
      (error as any).statusCode = 400;
      throw error;
    }

    if (limit < 1 || limit > 100 || !Number.isInteger(limit)) {
      const error = new Error('Limit must be an integer between 1 and 100');
      (error as any).statusCode = 400;
      throw error;
    }

    if (filter.status && !['pending', 'completed', 'cancelled'].includes(filter.status)) {
      const error = new Error('Status must be one of: pending, completed, cancelled');
      (error as any).statusCode = 400;
      throw error;
    }

    if (filter.type && !['regular', 'vip', 'group'].includes(filter.type)) {
      const error = new Error('Type must be one of: regular, vip, group');
      (error as any).statusCode = 400;
      throw error;
    }

    if (filter.paymentType && !['cash', 'non-cash'].includes(filter.paymentType)) {
      const error = new Error('Payment type must be either "cash" or "non-cash"');
      (error as any).statusCode = 400;
      throw error;
    }

    const result = await orderRepository.findAll({ ...filter, page, limit });
    return {
      ...result,
      page,
      limit,
    };
  }

  /**
   * Get orders by user ID
   */
  async getOrdersByUserId(userId: string, page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
    if (!userId || typeof userId !== 'string') {
      const error = new Error('Invalid user ID');
      (error as any).statusCode = 400;
      throw error;
    }

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const result = await orderRepository.findByUserId(userId, page, limit);
    return {
      ...result,
      page,
      limit,
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, status: 'pending' | 'completed' | 'cancelled', userId?: string): Promise<Order> {
    if (!id || typeof id !== 'string') {
      const error = new Error('Invalid order ID');
      (error as any).statusCode = 400;
      throw error;
    }

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      const error = new Error('Status must be one of: pending, completed, cancelled');
      (error as any).statusCode = 422;
      throw error;
    }

    // Check if order exists
    const existing = await orderRepository.findById(id);
    if (!existing) {
      const error = new Error('Order not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Check authorization if userId is provided
    if (userId && existing.user_id !== userId) {
      const error = new Error('You do not have permission to update this order');
      (error as any).statusCode = 403;
      throw error;
    }

    const updated = await orderRepository.update(id, { status });
    if (!updated) {
      const error = new Error('Failed to update order status');
      (error as any).statusCode = 500;
      throw error;
    }

    return updated;
  }

  /**
   * Get order statistics
   */
  async getOrderStatistics(): Promise<{
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    revenue: number;
  }> {
    return orderRepository.getStatistics();
  }
}

export const orderService = new OrderService();
