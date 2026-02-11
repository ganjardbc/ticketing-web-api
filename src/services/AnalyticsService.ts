import { getConnection } from '../db/connection';
import { Logger } from '../utils/logger';

const logger = new Logger('AnalyticsService');

export interface DashboardAnalytics {
  totalTickets: number;
  visibleTickets: number;
  hiddenTickets: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export interface TicketAnalytics {
  totalTickets: number;
  visibleTickets: number;
  hiddenTickets: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
}

export interface OrderAnalytics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  totalOrderValue: number;
}

export interface RevenueAnalytics {
  cash: number;
  nonCash: number;
  total: number;
}

export interface TicketTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

/**
 * Analytics Service
 * Provides aggregated analytics and statistics
 */
export class AnalyticsService {
  /**
   * Get dashboard analytics (combined ticket and order stats)
   */
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    try {
      const connection = await getConnection();

      // Get ticket stats
      const [ticketStats] = await connection.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'visible' THEN 1 ELSE 0 END) as visible,
          SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END) as hidden
        FROM tickets
        WHERE deleted_at IS NULL
      `);

      // Get order stats
      const [orderStats] = await connection.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(total_amount) as revenue
        FROM orders
        WHERE deleted_at IS NULL
      `);

      connection.release();

      const ticketData = (ticketStats as any[])[0] || {};
      const orderData = (orderStats as any[])[0] || {};

      return {
        totalTickets: ticketData.total || 0,
        visibleTickets: ticketData.visible || 0,
        hiddenTickets: ticketData.hidden || 0,
        totalOrders: orderData.total || 0,
        completedOrders: orderData.completed || 0,
        pendingOrders: orderData.pending || 0,
        cancelledOrders: orderData.cancelled || 0,
        totalRevenue: orderData.revenue || 0,
      };
    } catch (error) {
      logger.error('Failed to get dashboard analytics', error);
      throw error;
    }
  }

  /**
   * Get ticket analytics
   */
  async getTicketAnalytics(): Promise<TicketAnalytics> {
    try {
      const connection = await getConnection();

      const [stats] = await connection.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'visible' THEN 1 ELSE 0 END) as visible,
          SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END) as hidden,
          AVG(price) as avgPrice,
          MIN(price) as minPrice,
          MAX(price) as maxPrice
        FROM tickets
        WHERE deleted_at IS NULL
      `);

      connection.release();

      const data = (stats as any[])[0] || {};

      return {
        totalTickets: data.total || 0,
        visibleTickets: data.visible || 0,
        hiddenTickets: data.hidden || 0,
        averagePrice: data.avgPrice || 0,
        minPrice: data.minPrice || 0,
        maxPrice: data.maxPrice || 0,
      };
    } catch (error) {
      logger.error('Failed to get ticket analytics', error);
      throw error;
    }
  }

  /**
   * Get order analytics
   */
  async getOrderAnalytics(): Promise<OrderAnalytics> {
    try {
      const connection = await getConnection();

      const [stats] = await connection.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          AVG(total_amount) as avgValue,
          SUM(total_amount) as totalValue
        FROM orders
        WHERE deleted_at IS NULL
      `);

      connection.release();

      const data = (stats as any[])[0] || {};

      return {
        totalOrders: data.total || 0,
        completedOrders: data.completed || 0,
        pendingOrders: data.pending || 0,
        cancelledOrders: data.cancelled || 0,
        averageOrderValue: data.avgValue || 0,
        totalOrderValue: data.totalValue || 0,
      };
    } catch (error) {
      logger.error('Failed to get order analytics', error);
      throw error;
    }
  }

  /**
   * Get revenue analytics by payment type
   */
  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    try {
      const connection = await getConnection();

      const [stats] = await connection.query(`
        SELECT 
          payment_type,
          SUM(total_amount) as amount
        FROM orders
        WHERE deleted_at IS NULL AND status = 'completed'
        GROUP BY payment_type
      `);

      connection.release();

      const data = (stats as any[]) || [];
      let cash = 0;
      let nonCash = 0;

      data.forEach((row: any) => {
        if (row.payment_type === 'cash') {
          cash = row.amount || 0;
        } else if (row.payment_type === 'non-cash') {
          nonCash = row.amount || 0;
        }
      });

      return {
        cash,
        nonCash,
        total: cash + nonCash,
      };
    } catch (error) {
      logger.error('Failed to get revenue analytics', error);
      throw error;
    }
  }

  /**
   * Get ticket type distribution
   */
  async getTicketTypeDistribution(): Promise<TicketTypeDistribution[]> {
    try {
      const connection = await getConnection();

      const [stats] = await connection.query(`
        SELECT 
          type,
          COUNT(*) as count
        FROM orders
        WHERE deleted_at IS NULL
        GROUP BY type
      `);

      connection.release();

      const data = (stats as any[]) || [];
      const total = data.reduce((sum, row) => sum + (row.count || 0), 0);

      return data.map((row: any) => ({
        type: row.type,
        count: row.count || 0,
        percentage: total > 0 ? ((row.count || 0) / total) * 100 : 0,
      }));
    } catch (error) {
      logger.error('Failed to get ticket type distribution', error);
      throw error;
    }
  }

  /**
   * Get status distribution
   */
  async getStatusDistribution(): Promise<StatusDistribution[]> {
    try {
      const connection = await getConnection();

      const [stats] = await connection.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM orders
        WHERE deleted_at IS NULL
        GROUP BY status
      `);

      connection.release();

      const data = (stats as any[]) || [];
      const total = data.reduce((sum, row) => sum + (row.count || 0), 0);

      return data.map((row: any) => ({
        status: row.status,
        count: row.count || 0,
        percentage: total > 0 ? ((row.count || 0) / total) * 100 : 0,
      }));
    } catch (error) {
      logger.error('Failed to get status distribution', error);
      throw error;
    }
  }
}
