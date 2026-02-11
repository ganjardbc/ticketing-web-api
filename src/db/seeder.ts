import { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { Logger } from '../utils/logger';

const logger = new Logger('Seeder');

/**
 * Seed data for all tables
 */
export class Seeder {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Check if tables already have data
   */
  private async hasData(): Promise<boolean> {
    try {
      const [rows] = await this.pool.query('SELECT COUNT(*) as count FROM users');
      const result = rows as any[];
      return result[0].count > 0;
    } catch (error) {
      logger.error('Failed to check if data exists', error);
      return false;
    }
  }

  /**
   * Seed users table
   */
  private async seedUsers(): Promise<string[]> {
    const userIds: string[] = [];
    const users = [
      {
        id: uuidv4(),
        email: 'admin@ticketing.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
      },
      {
        id: uuidv4(),
        email: 'user1@ticketing.com',
        password: 'user123',
        name: 'John Doe',
        role: 'user',
      },
      {
        id: uuidv4(),
        email: 'user2@ticketing.com',
        password: 'user123',
        name: 'Jane Smith',
        role: 'user',
      },
      {
        id: uuidv4(),
        email: 'user3@ticketing.com',
        password: 'user123',
        name: 'Bob Johnson',
        role: 'user',
      },
    ];

    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      await this.pool.query(
        'INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.email, passwordHash, user.name, user.role]
      );
      userIds.push(user.id);
      logger.info(`Seeded user: ${user.email}`);
    }

    return userIds;
  }

  /**
   * Seed tickets table
   */
  private async seedTickets(): Promise<string[]> {
    const ticketIds: string[] = [];
    const tickets = [
      {
        id: uuidv4(),
        code: 'TICKET-001',
        price: 50000,
        status: 'visible',
      },
      {
        id: uuidv4(),
        code: 'TICKET-002',
        price: 75000,
        status: 'visible',
      },
      {
        id: uuidv4(),
        code: 'TICKET-003',
        price: 100000,
        status: 'visible',
      },
      {
        id: uuidv4(),
        code: 'TICKET-VIP-001',
        price: 150000,
        status: 'visible',
      },
      {
        id: uuidv4(),
        code: 'TICKET-HIDDEN-001',
        price: 25000,
        status: 'hidden',
      },
    ];

    for (const ticket of tickets) {
      await this.pool.query(
        'INSERT INTO tickets (id, code, price, status) VALUES (?, ?, ?, ?)',
        [ticket.id, ticket.code, ticket.price, ticket.status]
      );
      ticketIds.push(ticket.id);
      logger.info(`Seeded ticket: ${ticket.code}`);
    }

    return ticketIds;
  }

  /**
   * Seed orders table
   */
  private async seedOrders(userIds: string[], ticketIds: string[]): Promise<void> {
    const orders = [
      {
        id: uuidv4(),
        order_code: 'ORD-001',
        user_id: userIds[1],
        ticket_id: ticketIds[0],
        visitor_name: 'John Doe',
        visit_date: new Date('2026-03-15 10:00:00'),
        qty: 2,
        type: 'regular',
        payment_type: 'cash',
        total_amount: 100000,
        status: 'completed',
      },
      {
        id: uuidv4(),
        order_code: 'ORD-002',
        user_id: userIds[2],
        ticket_id: ticketIds[1],
        visitor_name: 'Jane Smith',
        visit_date: new Date('2026-03-20 14:00:00'),
        qty: 1,
        type: 'vip',
        payment_type: 'non-cash',
        total_amount: 75000,
        status: 'completed',
      },
      {
        id: uuidv4(),
        order_code: 'ORD-003',
        user_id: userIds[3],
        ticket_id: ticketIds[3],
        visitor_name: 'Bob Johnson',
        visit_date: new Date('2026-04-01 18:00:00'),
        qty: 3,
        type: 'group',
        payment_type: 'non-cash',
        total_amount: 450000,
        status: 'pending',
      },
      {
        id: uuidv4(),
        order_code: 'ORD-004',
        user_id: userIds[1],
        ticket_id: ticketIds[2],
        visitor_name: 'Alice Brown',
        visit_date: new Date('2026-04-10 11:00:00'),
        qty: 1,
        type: 'regular',
        payment_type: 'cash',
        total_amount: 100000,
        status: 'pending',
      },
    ];

    for (const order of orders) {
      await this.pool.query(
        `INSERT INTO orders 
        (id, order_code, user_id, ticket_id, visitor_name, visit_date, qty, type, payment_type, total_amount, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          order.order_code,
          order.user_id,
          order.ticket_id,
          order.visitor_name,
          order.visit_date,
          order.qty,
          order.type,
          order.payment_type,
          order.total_amount,
          order.status,
        ]
      );
      logger.info(`Seeded order: ${order.order_code}`);
    }
  }

  /**
   * Run all seeders
   */
  async run(): Promise<void> {
    try {
      const hasData = await this.hasData();
      if (hasData) {
        logger.info('Database already has data, skipping seeding');
        return;
      }

      logger.info('Starting database seeding...');

      const userIds = await this.seedUsers();
      const ticketIds = await this.seedTickets();
      await this.seedOrders(userIds, ticketIds);

      logger.info('Database seeding completed successfully');
    } catch (error) {
      logger.error('Database seeding failed', error);
      throw error;
    }
  }
}
