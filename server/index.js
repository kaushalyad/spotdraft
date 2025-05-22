require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const cors = require('cors');
const path = require('path');
const app = express();

// Enhanced error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Middleware
app.use(cors({
  origin: ['https://spotdraft-w59a.onrender.com', 'http://localhost:3000'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization', 'Accept', 'Cache-Control', 'Pragma', 'Origin', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  exposedHeaders: ['Content-Disposition', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options('*', cors({
  origin: ['https://spotdraft-w59a.onrender.com', 'http://localhost:3000'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization', 'Accept', 'Cache-Control', 'Pragma', 'Origin', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  exposedHeaders: ['Content-Disposition', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
}));

app.use(express.json());

// Enhanced request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
    url: req.originalUrl,
    baseUrl: req.baseUrl,
    ip: req.ip
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB with enhanced error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spotdraft';
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

connectDB();

// Import routes
const authRoutes = require('./routes/auth');
const pdfRoutes = require('./routes/pdf');
const dashboardRoutes = require('./routes/dashboard');

// Register routes
app.use('/auth', authRoutes);
app.use('/pdf', pdfRoutes);
app.use('/dashboard', dashboardRoutes);

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Status endpoint to show API is working
app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Server is up and running',
    version: '1.0.0'
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to SpotDraft API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      pdf: '/pdf',
      dashboard: '/dashboard',
      status: '/status',
      health: '/health'
    }
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  
  res.status(err.status || 500).json({
    message: err.message || 'Server error',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
    timestamp: new Date().toISOString()
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
    query: req.query,
    timestamp: new Date().toISOString()
  });
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/spotdraft');
  console.log('Server start time:', new Date().toISOString());
}); 