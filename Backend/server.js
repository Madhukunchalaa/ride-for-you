const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const { initPaymentScheduler } = require('./src/services/paymentScheduler');
const { initCronJobs } = require('./src/utils/cronJobs');

const app = express();

// Database & Scheduler
connectDB();
initPaymentScheduler();
initCronJobs();

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

// API Routes
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/riders', require('./src/routes/rider'));
app.use('/api/invoices', require('./src/routes/invoice'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/payments', require('./src/routes/payment'));

// Serve Static Files in Production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.resolve(__dirname, 'frontend', 'dist');
  const rootFrontendPath = path.resolve(__dirname, '..', 'frontend', 'dist');
  
  const finalPath = require('fs').existsSync(frontendPath) ? frontendPath : rootFrontendPath;
  
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
