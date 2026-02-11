import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'http://localhost:3000';

describe('Ticketing Mock API - Full Endpoint Tests', () => {
  let api: AxiosInstance;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;
  let ticketId: string;
  let orderId: string;

  beforeAll(() => {
    api = axios.create({
      baseURL: BASE_URL,
      validateStatus: () => true, // Don't throw on any status
    });
  });

  // ==================== HEALTH CHECK ====================
  describe('Health Check', () => {
    it('GET /health - should return healthy status', async () => {
      const response = await api.get('/health');
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('healthy');
      expect(response.data.data.database).toBe('connected');
    });
  });

  // ==================== AUTH ENDPOINTS ====================
  describe('Auth Endpoints', () => {
    it('POST /auth/login - should login successfully', async () => {
      const response = await api.post('/auth/login', {
        email: 'admin@example.com',
        password: 'demo123',
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.tokens.accessToken).toBeDefined();
      expect(response.data.data.tokens.refreshToken).toBeDefined();
      expect(response.data.data.user.email).toBe('admin@example.com');

      accessToken = response.data.data.tokens.accessToken;
      refreshToken = response.data.data.tokens.refreshToken;
      userId = response.data.data.user.id;
    });

    it('POST /auth/login - should fail with invalid credentials', async () => {
      const response = await api.post('/auth/login', {
        email: 'admin@example.com',
        password: 'wrongpassword',
      });
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it('GET /auth/me - should get current user profile', async () => {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.email).toBe('admin@example.com');
    });

    it('GET /auth/users - should get all users', async () => {
      const response = await api.get('/auth/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    it('GET /auth/users/:id - should get specific user', async () => {
      const response = await api.get(`/auth/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(userId);
    });

    it('POST /auth/refresh - should refresh access token', async () => {
      const response = await api.post('/auth/refresh', {
        refreshToken: refreshToken,
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.accessToken).toBeDefined();
      accessToken = response.data.data.accessToken;
    });

    it('POST /auth/logout - should logout successfully', async () => {
      const response = await api.post(
        '/auth/logout',
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    // Re-login for subsequent tests
    it('Re-login for subsequent tests', async () => {
      const response = await api.post('/auth/login', {
        email: 'admin@example.com',
        password: 'demo123',
      });
      accessToken = response.data.data.tokens.accessToken;
    });
  });

  // ==================== TICKETS ENDPOINTS ====================
  describe('Tickets Endpoints', () => {
    it('GET /tickets - should get all tickets with pagination', async () => {
      const response = await api.get('/tickets?page=1&limit=10');
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.pagination).toBeDefined();
      expect(response.data.pagination.page).toBe(1);
      if (response.data.data.length > 0) {
        ticketId = response.data.data[0].id;
      }
    });

    it('GET /tickets - should filter by status', async () => {
      const response = await api.get('/tickets?status=visible');
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      response.data.data.forEach((ticket: any) => {
        expect(ticket.status).toBe('visible');
      });
    });

    it('GET /tickets - should search by code', async () => {
      const response = await api.get('/tickets?search=TCK');
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('GET /tickets/:id - should get specific ticket', async () => {
      if (!ticketId) {
        const ticketsResponse = await api.get('/tickets?limit=1');
        ticketId = ticketsResponse.data.data[0].id;
      }
      const response = await api.get(`/tickets/${ticketId}`);
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(ticketId);
    });

    it('POST /tickets - should create new ticket', async () => {
      const response = await api.post(
        '/tickets',
        {
          code: `TCK-${Date.now()}`,
          price: 100000,
          status: 'visible',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.code).toBeDefined();
    });

    it('PUT /tickets/:id - should update ticket', async () => {
      const response = await api.put(
        `/tickets/${ticketId}`,
        {
          price: 120000,
          status: 'visible',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('PATCH /tickets/:id/status - should update ticket status', async () => {
      const response = await api.patch(
        `/tickets/${ticketId}/status`,
        {
          status: 'hidden',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('GET /tickets/stats/summary - should get ticket statistics', async () => {
      const response = await api.get('/tickets/stats/summary');
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.total).toBeDefined();
      expect(response.data.data.visible).toBeDefined();
      expect(response.data.data.hidden).toBeDefined();
    });

    it('DELETE /tickets/:id - should delete ticket (soft delete)', async () => {
      const response = await api.delete(`/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ==================== ORDERS ENDPOINTS ====================
  describe('Orders Endpoints', () => {
    beforeAll(async () => {
      // Get a ticket for order creation
      const ticketsResponse = await api.get('/tickets?limit=1');
      if (ticketsResponse.data.data.length > 0) {
        ticketId = ticketsResponse.data.data[0].id;
      }
    });

    it('GET /orders - should get all orders with pagination', async () => {
      const response = await api.get('/orders?page=1&limit=10', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.pagination).toBeDefined();
      if (response.data.data.length > 0) {
        orderId = response.data.data[0].id;
      }
    });

    it('GET /orders - should filter by status', async () => {
      const response = await api.get('/orders?status=completed', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('GET /orders - should filter by type', async () => {
      const response = await api.get('/orders?type=regular', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('GET /orders - should filter by payment type', async () => {
      const response = await api.get('/orders?paymentType=cash', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('POST /orders - should create new order', async () => {
      const response = await api.post(
        '/orders',
        {
          user_id: userId,
          ticket_id: ticketId,
          visitor_name: 'Test Visitor',
          visit_date: new Date().toISOString(),
          qty: 2,
          type: 'regular',
          payment_type: 'cash',
          total_amount: 150000,
          status: 'pending',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      orderId = response.data.data.id;
    });

    it('GET /orders/:id - should get specific order', async () => {
      if (!orderId) {
        const ordersResponse = await api.get('/orders?limit=1', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        orderId = ordersResponse.data.data[0].id;
      }
      const response = await api.get(`/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(orderId);
    });

    it('GET /orders/user/:userId - should get orders by user', async () => {
      const response = await api.get(`/orders/user/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('PATCH /orders/:id/status - should update order status', async () => {
      const response = await api.patch(
        `/orders/${orderId}/status`,
        {
          status: 'completed',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('GET /orders/stats/summary - should get order statistics', async () => {
      const response = await api.get('/orders/stats/summary', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.total).toBeDefined();
      expect(response.data.data.completed).toBeDefined();
    });
  });

  // ==================== ANALYTICS ENDPOINTS ====================
  describe('Analytics Endpoints', () => {
    it('GET /analytics/dashboard - should get dashboard analytics', async () => {
      const response = await api.get('/analytics/dashboard', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.tickets).toBeDefined();
      expect(response.data.data.orders).toBeDefined();
    });

    it('GET /analytics/tickets - should get ticket analytics', async () => {
      const response = await api.get('/analytics/tickets', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('GET /analytics/orders - should get order analytics', async () => {
      const response = await api.get('/analytics/orders', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('GET /analytics/revenue - should get revenue analytics', async () => {
      const response = await api.get('/analytics/revenue', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.totalRevenue).toBeDefined();
      expect(response.data.data.byPaymentType).toBeDefined();
    });

    it('GET /analytics/ticket-types - should get ticket type distribution', async () => {
      const response = await api.get('/analytics/ticket-types', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('GET /analytics/ticket-status - should get ticket status distribution', async () => {
      const response = await api.get('/analytics/ticket-status', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ==================== REPORTS ENDPOINTS ====================
  describe('Reports Endpoints', () => {
    it('GET /reports/tickets - should get ticket report', async () => {
      const response = await api.get('/reports/tickets', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('GET /reports/tickets - should filter by status', async () => {
      const response = await api.get('/reports/tickets?status=visible', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('GET /reports/tickets - should filter by price range', async () => {
      const response = await api.get('/reports/tickets?minPrice=50000&maxPrice=150000', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('GET /reports/orders - should get order report', async () => {
      const response = await api.get('/reports/orders', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('GET /reports/orders - should filter by status', async () => {
      const response = await api.get('/reports/orders?status=completed', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('GET /reports/sales - should get sales report', async () => {
      const response = await api.get('/reports/sales', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.totalSales).toBeDefined();
      expect(response.data.data.totalRevenue).toBeDefined();
    });

    it('GET /reports/user-activity - should get user activity report', async () => {
      const response = await api.get('/reports/user-activity', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.users).toBeDefined();
    });

    it('GET /reports/summary - should get report summary', async () => {
      const response = await api.get('/reports/summary', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.tickets).toBeDefined();
      expect(response.data.data.orders).toBeDefined();
    });
  });

  // ==================== ERROR HANDLING ====================
  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const response = await api.get('/nonexistent');
      expect(response.status).toBe(404);
    });

    it('should return 401 for missing auth token', async () => {
      const response = await api.get('/orders');
      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid request body', async () => {
      const response = await api.post(
        '/auth/login',
        {
          email: 'admin@example.com',
          // missing password
        }
      );
      expect(response.status).toBe(400);
    });
  });
});
