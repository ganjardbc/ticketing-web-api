import { v4 as uuidv4 } from 'uuid';
import { getConnection } from '../db/connection';
import { Logger } from '../utils/logger';

const logger = new Logger('OrderRepository');

export interface Order {
  id: string;
  order_code: string;
  user_id: string;
  ticket_id: string;
  visitor_name: string;
  visit_date: Date;
  qty: number;
  type: 'regular' | 'vip' | 'group';
  payment_type: 'cash' | 'non-cash';
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
  deleted_at: Date | null;
}

export interface CreateOrderInput {
  user_id: string;
  ticket_id: string;
  visitor_name: string;
  visit_date: Date;
  qty: number;
  type?: 'regular' | 'vip' | 'group';
  payment_type?: 'cash' | 'non-cash';
  total_amount: number;
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface UpdateOrderInput {
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface OrderFilter {
  status?: 'pending' | 'completed' | 'cancelled';
  type?: 'regular' | 'vip' | 'group';
  paymentType?: 'cash' | 'non-cash';
  userId?: string;
  page?: number;
  limit?: number;
}

export class OrderRepository {
  /**
   * Create a new order
   */
  async create(input: CreateOrderInput): Promise<Order> {
    let connection;
    try {
      connection = await getConnection();
      const id = uuidv4();
      const order_code = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const now = new Date();
      const type = input.type || 'regular';
      const payment_type = input.payment_type || 'cash';
      const status = input.status || 'pending';

      const query = `
        INSERT INTO orders (
          id, order_code, user_id, ticket_id, visitor_name, visit_date,
          qty, type, payment_type, total_amount, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(query, [
        id,
        order_code,
        input.user_id,
        input.ticket_id,
        input.visitor_name,
        input.visit_date,
        input.qty,
        type,
        payment_type,
        input.total_amount,
        status,
        now,
        now,
      ]);

      logger.info(`Order created: ${id}`);
      return {
        id,
        order_code,
        user_id: input.user_id,
        ticket_id: input.ticket_id,
        visitor_name: input.visitor_name,
        visit_date: input.visit_date,
        qty: input.qty,
        type,
        payment_type,
        total_amount: input.total_amount,
        status,
        created_at: now,
        updated_at: now,
        completed_at: null,
        deleted_at: null,
      };
    } catch (error) {
      logger.error(`Failed to create order: ${error}`);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Get order by ID
   */
  async findById(id: string): Promise<Order | null> {
    let connection;
    try {
      connection = await getConnection();
      const query = `
        SELECT id, order_code, user_id, ticket_id, visitor_name, visit_date,
               qty, type, payment_type, total_amount, status, created_at, updated_at,
               completed_at, deleted_at
        FROM orders
        WHERE id = ? AND deleted_at IS NULL
      `;

      const [rows] = await connection.execute(query, [id]);
      const orders = rows as any[];
      return orders.length > 0 ? orders[0] : null;
    } catch (error) {
      logger.error(`Failed to find order by ID: ${error}`);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Get all orders with filtering and pagination
   */
  async findAll(filter: OrderFilter = {}): Promise<{ orders: Order[]; total: number }> {
    let connection;
    try {
      connection = await getConnection();
      const page = filter.page || 1;
      const limit = filter.limit || 10;
      const offset = (page - 1) * limit;

      let query = `
        SELECT id, order_code, user_id, ticket_id, visitor_name, visit_date,
               qty, type, payment_type, total_amount, status, created_at, updated_at,
               completed_at, deleted_at
        FROM orders
        WHERE deleted_at IS NULL
      `;
      const params: any[] = [];

      if (filter.status) {
        query += ` AND status = ?`;
        params.push(filter.status);
      }

      if (filter.type) {
        query += ` AND type = ?`;
        params.push(filter.type);
      }

      if (filter.paymentType) {
        query += ` AND payment_type = ?`;
        params.push(filter.paymentType);
      }

      if (filter.userId) {
        query += ` AND user_id = ?`;
        params.push(filter.userId);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [rows] = await connection.execute(query, params);
      const orders = rows as Order[];

      // Get total count
      let countQuery = `SELECT COUNT(*) as count FROM orders WHERE deleted_at IS NULL`;
      const countParams: any[] = [];

      if (filter.status) {
        countQuery += ` AND status = ?`;
        countParams.push(filter.status);
      }

      if (filter.type) {
        countQuery += ` AND type = ?`;
        countParams.push(filter.type);
      }

      if (filter.paymentType) {
        countQuery += ` AND payment_type = ?`;
        countParams.push(filter.paymentType);
      }

      if (filter.userId) {
        countQuery += ` AND user_id = ?`;
        countParams.push(filter.userId);
      }

      const [countRows] = await connection.execute(countQuery, countParams);
      const total = (countRows as any[])[0].count;

      return { orders, total };
    } catch (error) {
      logger.error(`Failed to find all orders: ${error}`);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Get orders by user ID
   */
  async findByUserId(userId: string, page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number }> {
    return this.findAll({ userId, page, limit });
  }

  /**
   * Update order
   */
  async update(id: string, input: UpdateOrderInput): Promise<Order | null> {
    let connection;
    try {
      connection = await getConnection();
      const now = new Date();

      // First check if order exists
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const updates: string[] = [];
      const params: any[] = [];

      if (input.status !== undefined) {
        updates.push('status = ?');
        params.push(input.status);

        // If status is completed, set completed_at
        if (input.status === 'completed') {
          updates.push('completed_at = ?');
          params.push(now);
        }
      }

      if (updates.length === 0) {
        return existing;
      }

      updates.push('updated_at = ?');
      params.push(now);
      params.push(id);

      const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`;

      await connection.execute(query, params);
      logger.info(`Order updated: ${id}`);
      return this.findById(id);
    } catch (error) {
      logger.error(`Failed to update order: ${error}`);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Soft delete order
   */
  async softDelete(id: string): Promise<boolean> {
    let connection;
    try {
      connection = await getConnection();
      const now = new Date();

      const query = `
        UPDATE orders
        SET deleted_at = ?, updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `;

      await connection.execute(query, [now, now, id]);
      logger.info(`Order soft deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to soft delete order: ${error}`);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Get order statistics
   */
  async getStatistics(): Promise<{
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    revenue: number;
  }> {
    let connection;
    try {
      connection = await getConnection();

      const [rows] = await connection.execute(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as revenue
        FROM orders
        WHERE deleted_at IS NULL
      `);

      const stats = (rows as any[])[0];
      return {
        total: stats.total || 0,
        completed: stats.completed || 0,
        pending: stats.pending || 0,
        cancelled: stats.cancelled || 0,
        revenue: stats.revenue || 0,
      };
    } catch (error) {
      logger.error(`Failed to get order statistics: ${error}`);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
}

export const orderRepository = new OrderRepository();
