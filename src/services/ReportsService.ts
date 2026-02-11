import { getConnection } from '../db/connection';
import { Logger } from '../utils/logger';

const logger = new Logger('ReportsService');

export interface TicketReport {
  id: string;
  code: string;
  price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrderReport {
  id: string;
  order_code: string;
  user_id: string;
  ticket_id: string;
  visitor_name: string;
  visit_date: string;
  qty: number;
  type: string;
  payment_type: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface SalesReport {
  date: string;
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface UserActivityReport {
  user_id: string;
  email: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
}

export interface SummaryReport {
  totalTickets: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  topPaymentType: string;
  topOrderType: string;
}

/**
 * Reports Service
 * Generates detailed reports with filters
 */
export class ReportsService {
  /**
   * Get ticket report with filters
   */
  async getTicketReport(filters?: {
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  }): Promise<TicketReport[]> {
    try {
      const connection = await getConnection();

      let query = 'SELECT * FROM tickets WHERE deleted_at IS NULL';
      const params: any[] = [];

      if (filters?.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters?.minPrice !== undefined) {
        query += ' AND price >= ?';
        params.push(filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        query += ' AND price <= ?';
        params.push(filters.maxPrice);
      }

      query += ' ORDER BY created_at DESC';

      if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }

      const [rows] = await connection.query(query, params);
      connection.release();

      return rows as TicketReport[];
    } catch (error) {
      logger.error('Failed to get ticket report', error);
      throw error;
    }
  }

  /**
   * Get order report with filters
   */
  async getOrderReport(filters?: {
    status?: string;
    type?: string;
    paymentType?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<OrderReport[]> {
    try {
      const connection = await getConnection();

      let query = 'SELECT * FROM orders WHERE deleted_at IS NULL';
      const params: any[] = [];

      if (filters?.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters?.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }

      if (filters?.paymentType) {
        query += ' AND payment_type = ?';
        params.push(filters.paymentType);
      }

      if (filters?.userId) {
        query += ' AND user_id = ?';
        params.push(filters.userId);
      }

      query += ' ORDER BY created_at DESC';

      if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }

      const [rows] = await connection.query(query, params);
      connection.release();

      return rows as OrderReport[];
    } catch (error) {
      logger.error('Failed to get order report', error);
      throw error;
    }
  }

  /**
   * Get sales report by date
   */
  async getSalesReport(filters?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<SalesReport[]> {
    try {
      const connection = await getConnection();

      let query = `
        SELECT 
          DATE(created_at) as date,
          SUM(total_amount) as totalSales,
          COUNT(*) as orderCount,
          AVG(total_amount) as averageOrderValue
        FROM orders
        WHERE deleted_at IS NULL AND status = 'completed'
      `;
      const params: any[] = [];

      if (filters?.startDate) {
        query += ' AND created_at >= ?';
        params.push(filters.startDate);
      }

      if (filters?.endDate) {
        query += ' AND created_at <= ?';
        params.push(filters.endDate);
      }

      query += ' GROUP BY DATE(created_at) ORDER BY date DESC';

      if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const [rows] = await connection.query(query, params);
      connection.release();

      return (rows as any[]).map((row: any) => ({
        date: row.date,
        totalSales: row.totalSales || 0,
        orderCount: row.orderCount || 0,
        averageOrderValue: row.averageOrderValue || 0,
      }));
    } catch (error) {
      logger.error('Failed to get sales report', error);
      throw error;
    }
  }

  /**
   * Get user activity report
   */
  async getUserActivityReport(filters?: {
    limit?: number;
    offset?: number;
  }): Promise<UserActivityReport[]> {
    try {
      const connection = await getConnection();

      let query = `
        SELECT 
          u.id as user_id,
          u.email,
          u.name,
          COUNT(o.id) as totalOrders,
          SUM(o.total_amount) as totalSpent,
          MAX(o.created_at) as lastOrderDate
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id AND o.deleted_at IS NULL
        WHERE u.deleted_at IS NULL
        GROUP BY u.id, u.email, u.name
        ORDER BY totalOrders DESC
      `;
      const params: any[] = [];

      if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }

      const [rows] = await connection.query(query, params);
      connection.release();

      return (rows as any[]).map((row: any) => ({
        user_id: row.user_id,
        email: row.email,
        name: row.name,
        totalOrders: row.totalOrders || 0,
        totalSpent: row.totalSpent || 0,
        lastOrderDate: row.lastOrderDate,
      }));
    } catch (error) {
      logger.error('Failed to get user activity report', error);
      throw error;
    }
  }

  /**
   * Get summary report
   */
  async getSummaryReport(): Promise<SummaryReport> {
    try {
      const connection = await getConnection();

      // Get ticket count
      const [ticketStats] = await connection.query(
        'SELECT COUNT(*) as count FROM tickets WHERE deleted_at IS NULL'
      );

      // Get order stats
      const [orderStats] = await connection.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(total_amount) as revenue,
          AVG(total_amount) as avgValue
        FROM orders
        WHERE deleted_at IS NULL
      `);

      // Get top payment type
      const [paymentStats] = await connection.query(`
        SELECT payment_type, COUNT(*) as count
        FROM orders
        WHERE deleted_at IS NULL
        GROUP BY payment_type
        ORDER BY count DESC
        LIMIT 1
      `);

      // Get top order type
      const [typeStats] = await connection.query(`
        SELECT type, COUNT(*) as count
        FROM orders
        WHERE deleted_at IS NULL
        GROUP BY type
        ORDER BY count DESC
        LIMIT 1
      `);

      connection.release();

      const ticketData = (ticketStats as any[])[0] || {};
      const orderData = (orderStats as any[])[0] || {};
      const paymentData = (paymentStats as any[])[0] || {};
      const typeData = (typeStats as any[])[0] || {};

      return {
        totalTickets: ticketData.count || 0,
        totalOrders: orderData.total || 0,
        totalRevenue: orderData.revenue || 0,
        averageOrderValue: orderData.avgValue || 0,
        completedOrders: orderData.completed || 0,
        pendingOrders: orderData.pending || 0,
        cancelledOrders: orderData.cancelled || 0,
        topPaymentType: paymentData.payment_type || 'N/A',
        topOrderType: typeData.type || 'N/A',
      };
    } catch (error) {
      logger.error('Failed to get summary report', error);
      throw error;
    }
  }
}
