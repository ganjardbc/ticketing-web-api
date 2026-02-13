import { v4 as uuidv4 } from 'uuid';
import { getConnection } from '../db/connection';
import { Logger } from '../utils/logger';

const logger = new Logger('TicketRepository');

export interface Ticket {
  id: string;
  code: string;
  price: number;
  status: 'visible' | 'hidden';
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CreateTicketInput {
  code: string;
  price: number;
  status?: 'visible' | 'hidden';
}

export interface UpdateTicketInput {
  price?: number;
  status?: 'visible' | 'hidden';
}

export interface TicketFilter {
  search?: string;
  status?: 'visible' | 'hidden';
  page?: number;
  limit?: number;
}

export class TicketRepository {
  /**
   * Create a new ticket
   */
  async create(input: CreateTicketInput): Promise<Ticket> {
    let connection;
    try {
      connection = await getConnection();
      const id = uuidv4();
      const now = new Date();
      const status = input.status || 'visible';

      const query = `
        INSERT INTO tickets (id, code, price, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(query, [id, input.code, input.price, status, now, now]);
      logger.info(`Ticket created: ${id}`);
      return {
        id,
        code: input.code,
        price: input.price,
        status,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
    } catch (error) {
      logger.error(`Failed to create ticket: ${error}`);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Get ticket by ID
   */
  async findById(id: string): Promise<Ticket | null> {
    let connection;
    try {
      connection = await getConnection();
      const query = `
        SELECT id, code, price, status, created_at, updated_at, deleted_at
        FROM tickets
        WHERE id = ? AND deleted_at IS NULL
      `;

      const [rows] = await connection.execute(query, [id]);
      const tickets = rows as any[];
      return tickets.length > 0 ? tickets[0] : null;
    } catch (error) {
      logger.error(`Failed to find ticket by ID: ${error}`);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Get ticket by code
   */
  async findByCode(code: string): Promise<Ticket | null> {
    let connection;
    try {
      connection = await getConnection();
      const query = `
        SELECT id, code, price, status, created_at, updated_at, deleted_at
        FROM tickets
        WHERE code = ? AND deleted_at IS NULL
      `;

      const [rows] = await connection.execute(query, [code]);
      const tickets = rows as any[];
      return tickets.length > 0 ? tickets[0] : null;
    } catch (error) {
      logger.error(`Failed to find ticket by code: ${error}`);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Get all tickets with filtering and pagination
   */
  async findAll(filter: TicketFilter = {}): Promise<{ tickets: Ticket[]; total: number }> {
    let connection;
    try {
      connection = await getConnection();
      const page = filter.page || 1;
      const limit = filter.limit || 10;
      const offset = (page - 1) * limit;

      let query = `
        SELECT id, code, price, status, created_at, updated_at, deleted_at
        FROM tickets
        WHERE deleted_at IS NULL
      `;
      const params: any[] = [];

      if (filter.status) {
        query += ` AND status = ?`;
        params.push(filter.status);
      }

      if (filter.search) {
        query += ` AND code LIKE ?`;
        params.push(`%${filter.search}%`);
      }

      query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const [rows] = await connection.execute(query, params);
      const tickets = rows as Ticket[];

      // Get total count
      let countQuery = `SELECT COUNT(*) as count FROM tickets WHERE deleted_at IS NULL`;
      const countParams: any[] = [];

      if (filter.status) {
        countQuery += ` AND status = ?`;
        countParams.push(filter.status);
      }

      if (filter.search) {
        countQuery += ` AND code LIKE ?`;
        countParams.push(`%${filter.search}%`);
      }

      const [countRows] = await connection.execute(countQuery, countParams);
      const total = (countRows as any[])[0].count;

      return { tickets, total };
    } catch (error) {
      logger.error(`Failed to find all tickets: ${error}`);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Update ticket
   */
  async update(id: string, input: UpdateTicketInput): Promise<Ticket | null> {
    let connection;
    try {
      connection = await getConnection();
      const now = new Date();

      // First check if ticket exists using the same connection
      const checkQuery = `
        SELECT id, code, price, status, created_at, updated_at, deleted_at
        FROM tickets
        WHERE id = ? AND deleted_at IS NULL
      `;

      const [rows] = await connection.execute(checkQuery, [id]);
      const tickets = rows as any[];
      if (tickets.length === 0) {
        return null;
      }

      const updates: string[] = [];
      const params: any[] = [];

      if (input.price !== undefined) {
        updates.push('price = ?');
        params.push(input.price);
      }

      if (input.status !== undefined) {
        updates.push('status = ?');
        params.push(input.status);
      }

      if (updates.length === 0) {
        return tickets[0];
      }

      updates.push('updated_at = ?');
      params.push(now);
      params.push(id);

      const query = `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`;

      await connection.execute(query, params);

      // Fetch the updated ticket using the same connection
      const [updatedRows] = await connection.execute(checkQuery, [id]);
      logger.info(`Ticket updated: ${id}`);
      const updatedTickets = updatedRows as any[];
      return updatedTickets.length > 0 ? updatedTickets[0] : null;
    } catch (error) {
      logger.error(`Failed to update ticket: ${error}`);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Soft delete ticket (set status to hidden)
   */
  async softDelete(id: string): Promise<boolean> {
    let connection;
    try {
      connection = await getConnection();
      const now = new Date();

      const query = `
        UPDATE tickets
        SET status = 'hidden', deleted_at = ?, updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `;

      await connection.execute(query, [now, now, id]);
      logger.info(`Ticket soft deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to soft delete ticket: ${error}`);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Get ticket statistics
   */
  async getStatistics(): Promise<{
    total: number;
    visible: number;
    hidden: number;
  }> {
    let connection;
    try {
      connection = await getConnection();

      const [rows] = await connection.execute(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'visible' THEN 1 ELSE 0 END) as visible,
          SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END) as hidden
        FROM tickets
        WHERE deleted_at IS NULL
      `);

      const stats = (rows as any[])[0];
      return {
        total: stats.total || 0,
        visible: stats.visible || 0,
        hidden: stats.hidden || 0,
      };
    } catch (error) {
      logger.error(`Failed to get ticket statistics: ${error}`);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
}

export const ticketRepository = new TicketRepository();
