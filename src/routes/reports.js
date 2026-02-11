const express = require('express');
const router = express.Router();
const { formatResponse } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');
const db = require('../db/database');

router.get('/tickets', authMiddleware, (req, res) => {
  const { status } = req.query;
  
  const filters = {};
  if (status) filters.status = status;
  
  const report = db.getTicketReport(filters);
  res.json(formatResponse(true, report));
});

router.get('/orders', authMiddleware, (req, res) => {
  const { status, type, paymentType, userId } = req.query;
  
  const filters = {};
  if (status) filters.status = status;
  if (type) filters.type = type;
  if (paymentType) filters.paymentType = paymentType;
  if (userId) filters.userId = userId;
  
  const report = db.getOrderReport(filters);
  res.json(formatResponse(true, report));
});

router.get('/sales', authMiddleware, (req, res) => {
  const orders = db.getOrders();
  const completed = orders.filter(o => o.status === 'completed');
  
  const salesByDate = {};
  completed.forEach(order => {
    const date = new Date(order.completedAt).toISOString().split('T')[0];
    if (!salesByDate[date]) {
      salesByDate[date] = { count: 0, amount: 0 };
    }
    salesByDate[date].count += 1;
    salesByDate[date].amount += order.totalAmount;
  });
  
  res.json(formatResponse(true, {
    totalSales: completed.length,
    totalRevenue: completed.reduce((sum, o) => sum + o.totalAmount, 0),
    salesByDate
  }));
});

router.get('/user-activity', authMiddleware, (req, res) => {
  const orders = db.getOrders();
  const users = db.getAllUsers();
  
  const userActivity = users.map(user => {
    const userOrders = orders.filter(o => o.userId === user.id);
    const totalSpent = userOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    return {
      userId: user.id,
      userName: user.name,
      email: user.email,
      totalOrders: userOrders.length,
      totalSpent,
      completedOrders: userOrders.filter(o => o.status === 'completed').length,
      pendingOrders: userOrders.filter(o => o.status === 'pending').length
    };
  });
  
  res.json(formatResponse(true, {
    total: userActivity.length,
    users: userActivity
  }));
});

router.get('/summary', authMiddleware, (req, res) => {
  const ticketReport = db.getTicketReport();
  const orderReport = db.getOrderReport();
  
  res.json(formatResponse(true, {
    tickets: ticketReport.summary,
    orders: orderReport.summary,
    overview: {
      totalTickets: ticketReport.total,
      totalOrders: orderReport.total,
      totalRevenue: orderReport.summary.totalAmount,
      averageOrderValue: orderReport.summary.averageAmount
    }
  }));
});

module.exports = router;
