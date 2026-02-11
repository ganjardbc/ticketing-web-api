const express = require('express');
const router = express.Router();
const { formatResponse } = require('../utils/response');
const db = require('../db/database');

router.get('/', (req, res) => {
  let filtered = [...db.getTickets()];
  const { search, status, page = 1, limit = 10 } = req.query;
  
  if (search) {
    filtered = filtered.filter(t => 
      t.code.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  if (status) {
    filtered = filtered.filter(t => t.status === status);
  }
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginatedTickets = filtered.slice(start, start + limitNum);
  
  res.json(formatResponse(true, {
    tickets: paginatedTickets,
    total: filtered.length,
    page: pageNum,
    limit: limitNum
  }));
});

router.get('/:id', (req, res) => {
  const ticket = db.getTicketById(req.params.id);
  
  if (!ticket) {
    return res.status(404).json(formatResponse(false, null, 'Ticket not found'));
  }
  
  res.json(formatResponse(true, ticket));
});

router.post('/', (req, res) => {
  const { price } = req.body;
  
  if (!price) {
    return res.status(400).json(formatResponse(false, null, 'Price is required'));
  }
  
  const newTicket = db.createTicket({ price });
  res.status(201).json(formatResponse(true, newTicket));
});

router.put('/:id', (req, res) => {
  const ticket = db.getTicketById(req.params.id);
  
  if (!ticket) {
    return res.status(404).json(formatResponse(false, null, 'Ticket not found'));
  }
  
  const { price, status } = req.body;
  
  if (price === undefined || !status) {
    return res.status(400).json(formatResponse(false, null, 'Price and status are required'));
  }
  
  const updated = db.updateTicket(req.params.id, { price, status });
  res.json(formatResponse(true, updated));
});

router.patch('/:id/status', (req, res) => {
  const ticket = db.getTicketById(req.params.id);
  
  if (!ticket) {
    return res.status(404).json(formatResponse(false, null, 'Ticket not found'));
  }
  
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json(formatResponse(false, null, 'Status is required'));
  }
  
  const updated = db.updateTicket(req.params.id, { status });
  res.json(formatResponse(true, updated));
});

router.delete('/:id', (req, res) => {
  const ticket = db.getTicketById(req.params.id);
  
  if (!ticket) {
    return res.status(404).json(formatResponse(false, null, 'Ticket not found'));
  }
  
  const updated = db.updateTicket(req.params.id, { status: 'hidden' });
  res.json(formatResponse(true, updated, 'Ticket hidden'));
});

router.get('/stats/summary', (req, res) => {
  const stats = db.getTicketStats();
  res.json(formatResponse(true, stats));
});

module.exports = router;
