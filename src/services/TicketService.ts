import { ticketRepository, Ticket, CreateTicketInput, UpdateTicketInput, TicketFilter } from '../repositories/TicketRepository';

export class TicketService {
  /**
   * Create a new ticket with validation
   */
  async createTicket(input: CreateTicketInput): Promise<Ticket> {
    // Validate input
    const errors: any[] = [];

    if (!input.code || typeof input.code !== 'string' || input.code.trim() === '') {
      errors.push({ field: 'code', message: 'Code is required and must be a non-empty string' });
    }

    if (input.price === undefined || input.price === null) {
      errors.push({ field: 'price', message: 'Price is required' });
    } else if (typeof input.price !== 'number' || input.price < 0) {
      errors.push({ field: 'price', message: 'Price must be a non-negative number' });
    }

    if (input.status && !['visible', 'hidden'].includes(input.status)) {
      errors.push({ field: 'status', message: 'Status must be either "visible" or "hidden"' });
    }

    if (errors.length > 0) {
      const error = new Error('Validation failed');
      (error as any).statusCode = 422;
      (error as any).errors = errors;
      throw error;
    }

    // Check if code already exists
    const existing = await ticketRepository.findByCode(input.code);
    if (existing) {
      const error = new Error('Ticket with this code already exists');
      (error as any).statusCode = 409;
      throw error;
    }

    return ticketRepository.create(input);
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(id: string): Promise<Ticket | null> {
    if (!id || typeof id !== 'string') {
      const error = new Error('Invalid ticket ID');
      (error as any).statusCode = 400;
      throw error;
    }

    return ticketRepository.findById(id);
  }

  /**
   * Get all tickets with filtering and pagination
   */
  async getAllTickets(filter: TicketFilter = {}): Promise<{ tickets: Ticket[]; total: number; page: number; limit: number }> {
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

    if (filter.status && !['visible', 'hidden'].includes(filter.status)) {
      const error = new Error('Status must be either "visible" or "hidden"');
      (error as any).statusCode = 400;
      throw error;
    }

    const result = await ticketRepository.findAll({ ...filter, page, limit });
    return {
      ...result,
      page,
      limit,
    };
  }

  /**
   * Update ticket
   */
  async updateTicket(id: string, input: UpdateTicketInput): Promise<Ticket> {
    if (!id || typeof id !== 'string') {
      const error = new Error('Invalid ticket ID');
      (error as any).statusCode = 400;
      throw error;
    }

    // Validate input
    const errors: any[] = [];

    if (input.price !== undefined) {
      if (typeof input.price !== 'number' || input.price < 0) {
        errors.push({ field: 'price', message: 'Price must be a non-negative number' });
      }
    }

    if (input.status !== undefined) {
      if (!['visible', 'hidden'].includes(input.status)) {
        errors.push({ field: 'status', message: 'Status must be either "visible" or "hidden"' });
      }
    }

    if (errors.length > 0) {
      const error = new Error('Validation failed');
      (error as any).statusCode = 422;
      (error as any).errors = errors;
      throw error;
    }

    // Check if ticket exists
    const existing = await ticketRepository.findById(id);
    if (!existing) {
      const error = new Error('Ticket not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const updated = await ticketRepository.update(id, input);
    if (!updated) {
      const error = new Error('Failed to update ticket');
      (error as any).statusCode = 500;
      throw error;
    }

    return updated;
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(id: string, status: 'visible' | 'hidden'): Promise<Ticket> {
    if (!id || typeof id !== 'string') {
      const error = new Error('Invalid ticket ID');
      (error as any).statusCode = 400;
      throw error;
    }

    if (!['visible', 'hidden'].includes(status)) {
      const error = new Error('Status must be either "visible" or "hidden"');
      (error as any).statusCode = 422;
      throw error;
    }

    // Check if ticket exists
    const existing = await ticketRepository.findById(id);
    if (!existing) {
      const error = new Error('Ticket not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const updated = await ticketRepository.update(id, { status });
    if (!updated) {
      const error = new Error('Failed to update ticket status');
      (error as any).statusCode = 500;
      throw error;
    }

    return updated;
  }

  /**
   * Delete ticket (soft delete)
   */
  async deleteTicket(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      const error = new Error('Invalid ticket ID');
      (error as any).statusCode = 400;
      throw error;
    }

    // Check if ticket exists
    const existing = await ticketRepository.findById(id);
    if (!existing) {
      const error = new Error('Ticket not found');
      (error as any).statusCode = 404;
      throw error;
    }

    await ticketRepository.softDelete(id);
  }

  /**
   * Get ticket statistics
   */
  async getTicketStatistics(): Promise<{
    total: number;
    visible: number;
    hidden: number;
  }> {
    return ticketRepository.getStatistics();
  }
}

export const ticketService = new TicketService();
