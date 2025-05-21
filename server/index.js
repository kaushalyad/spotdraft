require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization', 'Accept', 'Cache-Control', 'Pragma'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Content-Disposition'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization', 'Accept', 'Cache-Control', 'Pragma'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
    url: req.originalUrl,
    baseUrl: req.baseUrl
  });
  next();
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spotdraft', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit if cannot connect to database
});

// Import routes
const authRoutes = require('./routes/auth');
const pdfRoutes = require('./routes/pdf');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/user');
const analyticsRoutes = require('./routes/analytics');

// Register routes
app.use('/auth', authRoutes);
app.use('/pdf', pdfRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/user', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Set development mode
process.env.NODE_ENV = 'development';

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code,
    path: req.path,
    method: req.method,
    body: req.body,
    file: req.file,
    headers: req.headers,
    originalUrl: req.originalUrl,
    errors: err.errors,
    keyPattern: err.keyPattern,
    keyValue: err.keyValue
  });

  // Always send detailed error information in development
  res.status(500).json({
    message: err.message,
    error: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code,
    details: err.errors || err.keyPattern || err.keyValue
  });
});

// 404 handler - must be last
app.use((req, res) => {
  console.log('404 Not Found:', {
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    baseUrl: req.baseUrl,
    headers: req.headers,
    body: req.body,
    query: req.query
  });
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method,
    url: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/spotdraft');
}); 