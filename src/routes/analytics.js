const express = require('express');
const router = express.Router();
const { formatResponse } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');
const db = require('../db/database');

router.get('/dashboard', authMiddleware, (req, res) => {
  const analytics = db.getDashboardAnalytics();
  res.json(formatResponse(true, analytics));
});

router.get('/tickets', authMiddleware, (req, res) => {
  const stats = db.getTicketStats();
  res.json(formatResponse(true, stats));
});

router.get('/orders', authMiddleware, (req, res) => {
  const stats = db.getOrderStats();
  res.json(formatResponse(true, stats));
});

router.get('/revenue', authMiddleware, (req, res) => {
  const orders = db.getOrders();
  const completed = orders.filter(o => o.status === 'completed');
  
  const byPaymentType = {
    cash: completed.filter(o => o.paymentType === 'cash').reduce((sum, o) => sum + o.totalAmount, 0),
    nonCash: completed.filter(o => o.paymentType === 'non-cash').reduce((sum, o) => sum + o.totalAmount, 0)
  };
  
  const totalRevenue = byPaymentType.cash + byPaymentType.nonCash;
  
  res.json(formatResponse(true, {
    totalRevenue,
    byPaymentType,
    completedOrders: completed.length,
    averageOrderValue: completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0
  }));
});

router.get('/ticket-types', authMiddleware, (req, res) => {
  const orders = db.getOrders();
  
  const byType = {
    regular: orders.filter(o => o.type === 'regular').length,
    vip: orders.filter(o => o.type === 'vip').length,
    group: orders.filter(o => o.type === 'group').length
  };
  
  res.json(formatResponse(true, byType));
});

router.get('/ticket-status', authMiddleware, (req, res) => {
  const orders = db.getOrders();
  
  const byStatus = {
    completed: orders.filter(o => o.status === 'completed').length,
    pending: orders.filter(o => o.status === 'pending').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };
  
  res.json(formatResponse(true, byStatus));
});

module.exports = router;
