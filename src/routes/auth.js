const express = require('express');
const router = express.Router();
const { formatResponse } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');
const db = require('../db/database');

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json(formatResponse(false, null, 'Email and password required'));
  }
  
  const user = db.getUser(email);
  if (!user || user.password !== password) {
    return res.status(401).json(formatResponse(false, null, 'Invalid credentials'));
  }
  
  const userResponse = { ...user };
  delete userResponse.password;
  
  res.json(formatResponse(true, {
    token: 'mock-' + Date.now() + '-' + user.id,
    user: userResponse
  }));
});

router.post('/logout', (req, res) => {
  res.json(formatResponse(true, null, 'Logged out successfully'));
});

router.get('/me', authMiddleware, (req, res) => {
  res.json(formatResponse(true, req.user));
});

router.get('/users', authMiddleware, (req, res) => {
  const users = db.getAllUsers();
  res.json(formatResponse(true, users));
});

router.get('/users/:id', authMiddleware, (req, res) => {
  const user = db.getUserById(req.params.id);
  
  if (!user) {
    return res.status(404).json(formatResponse(false, null, 'User not found'));
  }
  
  const userResponse = { ...user };
  delete userResponse.password;
  
  res.json(formatResponse(true, userResponse));
});

module.exports = router;
