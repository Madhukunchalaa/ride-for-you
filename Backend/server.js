require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');

const app = express();

// Database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Auth Routes
app.use('/api/auth', require('./src/routes/auth'));

// Rider Routes
app.use('/api/riders', require('./src/routes/rider'));

// Invoice Routes
app.use('/api/invoices', require('./src/routes/invoice'));

// Analytics Routes
app.use('/api/analytics', require('./src/routes/analytics'));

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
