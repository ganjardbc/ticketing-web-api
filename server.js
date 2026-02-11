const express = require('express');
const cors = require('cors');
const { delayMiddleware } = require('./src/middleware/delay');
const authRoutes = require('./src/routes/auth');
const ticketRoutes = require('./src/routes/tickets');
const orderRoutes = require('./src/routes/orders');
const analyticsRoutes = require('./src/routes/analytics');
const reportsRoutes = require('./src/routes/reports');
const { formatResponse } = require('./src/utils/response');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(delayMiddleware);

// Routes
app.use('/auth', authRoutes);
app.use('/tickets', ticketRoutes);
app.use('/orders', orderRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/reports', reportsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json(formatResponse(true, { status: 'ok' }));
});

// Error handling
app.use((req, res) => {
  res.status(404).json(formatResponse(false, null, 'Endpoint not found'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});
