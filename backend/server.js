require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');

// Initialize database
require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Property Rental API is running' });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   Property Rental Platform - Server Running           ║
╠════════════════════════════════════════════════════════╣
║   Server: http://localhost:${PORT}                        ║
║   API: http://localhost:${PORT}/api                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                      ║
╠════════════════════════════════════════════════════════╣
║   SAMPLE CREDENTIALS                                   ║
║   Owner:    owner@example.com / owner123              ║
║   Customer: customer@example.com / customer123        ║
╚════════════════════════════════════════════════════════╝
  `);
});