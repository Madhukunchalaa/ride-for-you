const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const { initPaymentScheduler } = require('./src/services/paymentScheduler');

const app = express();

// Database & Scheduler
connectDB();
initPaymentScheduler();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// API Routes
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/riders', require('./src/routes/rider'));
app.use('/api/invoices', require('./src/routes/invoice'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/payments', require('./src/routes/payment'));

// Serve Static Files in Production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
