const fs = require('fs');
const path = require('path');

class Database {
  constructor() {
    this.ticketsPath = path.join(__dirname, '../../data/tickets.json');
    this.usersPath = path.join(__dirname, '../../data/users.json');
    this.ordersPath = path.join(__dirname, '../../data/orders.json');
    this.tickets = this.loadTickets();
    this.users = this.loadUsers();
    this.orders = this.loadOrders();
  }

  loadTickets() {
    try {
      const data = fs.readFileSync(this.ticketsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading tickets:', error);
      return [];
    }
  }

  loadUsers() {
    try {
      const data = fs.readFileSync(this.usersPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading users:', error);
      return {};
    }
  }

  loadOrders() {
    try {
      const data = fs.readFileSync(this.ordersPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  }

  saveTickets() {
    try {
      fs.writeFileSync(this.ticketsPath, JSON.stringify(this.tickets, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving tickets:', error);
    }
  }

  saveOrders() {
    try {
      fs.writeFileSync(this.ordersPath, JSON.stringify(this.orders, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving orders:', error);
    }
  }

  // Ticket methods
  getTickets() {
    return this.tickets;
  }

  getTicketById(id) {
    return this.tickets.find(t => t.id === id);
  }

  createTicket(ticketData) {
    const id = `ticket-${Date.now()}`;
    const code = `TCK-${String(this.tickets.length + 1).padStart(5, '0')}`;
    
    const newTicket = {
      id,
      code,
      price: ticketData.price,
      status: 'visible',
      createdAt: new Date().toISOString()
    };
    
    this.tickets.push(newTicket);
    this.saveTickets();
    return newTicket;
  }

  updateTicket(id, ticketData) {
    const ticket = this.getTicketById(id);
    if (!ticket) return null;
    
    Object.assign(ticket, ticketData);
    this.saveTickets();
    return ticket;
  }

  deleteTicket(id) {
    const ticket = this.getTicketById(id);
    if (!ticket) return null;
    
    ticket.status = 'hidden';
    this.saveTickets();
    return ticket;
  }

  // User methods
  getUser(email) {
    return Object.values(this.users).find(u => u.email === email);
  }

  getUserById(id) {
    return Object.values(this.users).find(u => u.id === id);
  }

  getAllUsers() {
    return Object.values(this.users).map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
  }

  // Order methods
  getOrders() {
    return this.orders;
  }

  getOrderById(id) {
    return this.orders.find(o => o.id === id);
  }

  getOrdersByUserId(userId) {
    return this.orders.filter(o => o.userId === userId);
  }

  createOrder(orderData) {
    const id = `order-${Date.now()}`;
    const orderCode = `ORD-${String(this.orders.length + 1).padStart(5, '0')}`;
    
    const newOrder = {
      id,
      orderCode,
      userId: orderData.userId,
      ticketId: orderData.ticketId,
      visitorName: orderData.visitorName,
      visitDate: orderData.visitDate,
      qty: orderData.qty,
      type: orderData.type,
      paymentType: orderData.paymentType,
      totalAmount: orderData.totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    
    this.orders.push(newOrder);
    this.saveOrders();
    return newOrder;
  }

  updateOrder(id, orderData) {
    const order = this.getOrderById(id);
    if (!order) return null;
    
    if (orderData.status === 'completed' && order.status !== 'completed') {
      orderData.completedAt = new Date().toISOString();
    }
    
    Object.assign(order, orderData);
    this.saveOrders();
    return order;
  }

  // Stats methods
  getTicketStats() {
    return {
      total: this.tickets.length,
      visible: this.tickets.filter(t => t.status === 'visible').length,
      hidden: this.tickets.filter(t => t.status === 'hidden').length
    };
  }

  getOrderStats() {
    const completed = this.orders.filter(o => o.status === 'completed');
    const totalRevenue = completed.reduce((sum, o) => sum + o.totalAmount, 0);
    
    return {
      total: this.orders.length,
      completed: completed.length,
      pending: this.orders.filter(o => o.status === 'pending').length,
      cancelled: this.orders.filter(o => o.status === 'cancelled').length,
      totalRevenue,
      averageOrderValue: completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0,
      byType: {
        regular: this.orders.filter(o => o.type === 'regular').length,
        vip: this.orders.filter(o => o.type === 'vip').length,
        group: this.orders.filter(o => o.type === 'group').length
      },
      byPaymentType: {
        cash: this.orders.filter(o => o.paymentType === 'cash').length,
        nonCash: this.orders.filter(o => o.paymentType === 'non-cash').length
      }
    };
  }

  getDashboardAnalytics() {
    const ticketStats = this.getTicketStats();
    const orderStats = this.getOrderStats();
    
    return {
      tickets: ticketStats,
      orders: orderStats,
      summary: {
        totalTickets: ticketStats.total,
        totalOrders: orderStats.total,
        totalRevenue: orderStats.totalRevenue,
        completedOrders: orderStats.completed
      }
    };
  }

  getTicketReport(filters = {}) {
    let filtered = [...this.tickets];
    
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    
    return {
      total: filtered.length,
      tickets: filtered,
      summary: {
        byStatus: {
          visible: filtered.filter(t => t.status === 'visible').length,
          hidden: filtered.filter(t => t.status === 'hidden').length
        }
      }
    };
  }

  getOrderReport(filters = {}) {
    let filtered = [...this.orders];
    
    if (filters.status) {
      filtered = filtered.filter(o => o.status === filters.status);
    }
    
    if (filters.type) {
      filtered = filtered.filter(o => o.type === filters.type);
    }

    if (filters.paymentType) {
      filtered = filtered.filter(o => o.paymentType === filters.paymentType);
    }
    
    if (filters.userId) {
      filtered = filtered.filter(o => o.userId === filters.userId);
    }
    
    const totalAmount = filtered.reduce((sum, o) => sum + o.totalAmount, 0);
    
    return {
      total: filtered.length,
      orders: filtered,
      summary: {
        byStatus: {
          completed: filtered.filter(o => o.status === 'completed').length,
          pending: filtered.filter(o => o.status === 'pending').length,
          cancelled: filtered.filter(o => o.status === 'cancelled').length
        },
        byType: {
          regular: filtered.filter(o => o.type === 'regular').length,
          vip: filtered.filter(o => o.type === 'vip').length,
          group: filtered.filter(o => o.type === 'group').length
        },
        byPaymentType: {
          cash: filtered.filter(o => o.paymentType === 'cash').length,
          nonCash: filtered.filter(o => o.paymentType === 'non-cash').length
        },
        totalAmount,
        averageAmount: filtered.length > 0 ? Math.round(totalAmount / filtered.length) : 0
      }
    };
  }
}

module.exports = new Database();
