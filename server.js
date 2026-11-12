const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/multivendor';

// ==========================================
// 1. CORE MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the frontend static directory
app.use(express.static(path.join(__dirname, 'frontend')));

// ==========================================
// 2. API ROUTES
// ==========================================
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const sellerRoutes = require('./routes/seller');
const publicRoutes = require('./routes/public');
const orderRoutes = require('./routes/order');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', publicRoutes); // /api/products, /api/categories

// Test route to verify server is alive
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Multi-Vendor E-Commerce API is running smoothly',
    timestamp: new Date()
  });
});

// ==========================================
// 3. GLOBAL ERROR HANDLER
// ==========================================
// Catches all thrown errors or next(err) in any route
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  const statusCode = res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected server error occurred',
    // Include stack trace only in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ==========================================
// 4. DATABASE CONNECTION & SERVER START
// ==========================================
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(` MongoDB Connected successfully to: ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(` Multi-Vendor E-Commerce Server Started!`);
      console.log(` URL: http://localhost:${PORT}`);
      console.log(` API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=================================================`);
    });
  })
  .catch((err) => {
    console.error(' MongoDB Connection Failed:', err.message);
    console.error('Please ensure MongoDB is running or configure MONGO_URI in .env');
    // Still allow the app to listen so users can see clear error messages or test frontend
    app.listen(PORT, () => {
      console.log(`Server started in offline DB mode on http://localhost:${PORT}`);
    });
  });

module.exports = app;
