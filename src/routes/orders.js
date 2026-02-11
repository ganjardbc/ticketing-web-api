const express = require('express');
const router = express.Router();
const { formatResponse } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');
const db = require('../db/database');

router.get('/', authMiddleware, (req, res) => {
  let filtered = [...db.getOrders()];
  const { status, type, paymentType, userId, page = 1, limit = 10 } = req.query;
  
  if (status) {
    filtered = filtered.filter(o => o.status === status);
  }
  
  if (type) {
    filtered = filtered.filter(o => o.type === type);
  }

  if (paymentType) {
    filtered = filtered.filter(o => o.paymentType === paymentType);
  }
  
  if (userId) {
    filtered = filtered.filter(o => o.userId === userId);
  }
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginatedOrders = filtered.slice(start, start + limitNum);
  
  res.json(formatResponse(true, {
    orders: paginatedOrders,
    total: filtered.length,
    page: pageNum,
    limit: limitNum
  }));
});

router.get('/:id', authMiddleware, (req, res) => {
  const order = db.getOrderById(req.params.id);
  
  if (!order) {
    return res.status(404).json(formatResponse(false, null, 'Order not found'));
  }
  
  res.json(formatResponse(true, order));
});

router.get('/user/:userId', authMiddleware, (req, res) => {
  const orders = db.getOrdersByUserId(req.params.userId);
  
  res.json(formatResponse(true, {
    orders,
    total: orders.length
  }));
});

router.post('/', authMiddleware, (req, res) => {
  const { userId, ticketId, visitorName, visitDate, qty, type, paymentType, totalAmount } = req.body;
  
  if (!userId || !ticketId || !visitorName || !visitDate || !qty || !type || !paymentType || !totalAmount) {
    return res.status(400).json(formatResponse(false, null, 'Missing required fields'));
  }
  
  const newOrder = db.createOrder({ userId, ticketId, visitorName, visitDate, qty, type, paymentType, totalAmount });
  res.status(201).json(formatResponse(true, newOrder));
});

router.patch('/:id/status', authMiddleware, (req, res) => {
  const order = db.getOrderById(req.params.id);
  
  if (!order) {
    return res.status(404).json(formatResponse(false, null, 'Order not found'));
  }
  
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json(formatResponse(false, null, 'Status is required'));
  }
  
  const updated = db.updateOrder(req.params.id, { status });
  res.json(formatResponse(true, updated));
});

router.get('/stats/summary', authMiddleware, (req, res) => {
  const stats = db.getOrderStats();
  res.json(formatResponse(true, stats));
});

module.exports = router;
