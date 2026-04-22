const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const { seedAdmin } = require('./src/utils/seedAdmin');
const { initPaymentScheduler } = require('./src/services/paymentScheduler');
const { initCronJobs } = require('./src/utils/cronJobs');
const { initAutomatedReminders } = require('./src/services/automatedReminders');

const app = express();

// Database & Scheduler
connectDB().then(() => {
  seedAdmin(); // Auto-seed on startup
  initAutomatedReminders(); // Start Auto-Reminders & Recovery tracking
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({ 
  origin: [
    process.env.FRONTEND_URL, 
    'http://localhost:5173',
    /\.railway\.app$/  // Allow all Railway subdomains to prevent mismatches
  ].filter(Boolean), 
  credentials: true 
}));
app.use(morgan('dev'));
app.use(express.json());

// Simple Request Logger for Debugging 502s
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// Prevent process crashes
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

// API Routes
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const cashfree = require('./src/config/cashfree');
  
  res.json({ 
    status: 'ok', 
    database: dbStatus,
    environment: process.env.NODE_ENV,
    time: new Date().toISOString(),
    config: {
      cashfree_configured: cashfree.isConfigured,
      cashfree_mode: cashfree.clientId?.startsWith('TEST') ? 'SANDBOX' : 'PRODUCTION',
      // SECURE TRUNCATED KEYS FOR DIAGNOSTICS
      app_id_preview: cashfree.clientId ? `${cashfree.clientId.substring(0, 4)}...${cashfree.clientId.slice(-4)}` : 'MISSING',
      secret_preview: cashfree.clientSecret ? `${cashfree.clientSecret.substring(0, 4)}...${cashfree.clientSecret.slice(-4)}` : 'MISSING',
      // DIAGNOSTIC: FIND SIMILAR KEYS
      found_cash_keys: Object.keys(process.env).filter(k => k.toUpperCase().includes('CASH'))
    }
  });
});
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/riders', require('./src/routes/rider'));
app.use('/api/invoices', require('./src/routes/invoice'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/payments', require('./src/routes/payment'));
app.use('/api/customers', require('./src/routes/customer'));

// Serve Static Files in Production
if (process.env.NODE_ENV === 'production') {
  const finalPath = path.resolve(__dirname, 'client', 'dist');
  
  console.log("📂 Serving frontend from:", finalPath);
  app.use(express.static(finalPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(finalPath, 'index.html'));
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
