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
app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const { getCashfreeConfig } = require('./src/config/cashfree');
  const SystemConfig = require('./src/models/SystemConfig');
  
  const cashfreeConfig = await getCashfreeConfig();
  const dbRecord = await SystemConfig.findOne({ key: 'CASHFREE' });
  const isDbBacked = !!(dbRecord && dbRecord.value && dbRecord.value.appId);
  
  res.json({ 
    status: 'ok', 
    database: dbStatus,
    environment: process.env.NODE_ENV,
    time: new Date().toISOString(),
    config: {
      cashfree_configured: cashfreeConfig.isConfigured,
      cashfree_mode: cashfreeConfig.clientId?.startsWith('TEST') ? 'SANDBOX' : 'PRODUCTION',
      is_database_backed: isDbBacked,
      // SECURE TRUNCATED KEYS FOR DIAGNOSTICS
      app_id_preview: cashfreeConfig.clientId ? `${cashfreeConfig.clientId.substring(0, 4)}...${cashfreeConfig.clientId.slice(-4)}` : 'MISSING',
      secret_preview: cashfreeConfig.clientSecret ? `${cashfreeConfig.clientSecret.substring(0, 4)}...${cashfreeConfig.clientSecret.slice(-4)}` : 'MISSING'
    }
  });
});
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/riders', require('./src/routes/rider'));
app.use('/api/invoices', require('./src/routes/invoice'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/payments', require('./src/routes/payment'));
app.use('/api/customers', require('./src/routes/customer'));
app.use('/api/expenses', require('./src/routes/expense'));
app.use('/api/landing', require('./src/routes/landing'));
app.use('/api/whatsapp', require('./src/routes/whatsapp'));


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
