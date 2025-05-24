require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

// Enhanced error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Don't exit in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Middleware
app.use(cors({
  origin: [
    'https://spotdraft-w59a.onrender.com',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-auth-token',
    'cache-control',
    'pragma',
    'if-none-match',
    'if-modified-since'
  ],
  exposedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-auth-token',
    'cache-control',
    'pragma',
    'if-none-match',
    'if-modified-since'
  ],
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', 'inline');
      res.set('Cache-Control', 'public, max-age=31536000');
      res.set('Access-Control-Allow-Origin', 'https://spotdraft-w59a.onrender.com');
      res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
  }
}));

// MongoDB connection function
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectDB, 5000);
});

// Initial connection
connectDB();

// Import routes
const authRoutes = require('./routes/auth');
const pdfRoutes = require('./routes/pdf');
const dashboardRoutes = require('./routes/dashboard');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/user');

// Register routes
app.use('/auth', authRoutes);
app.use('/pdf', pdfRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user', userRoutes);

// Handle shared URLs without /pdf prefix
app.get('/shared/:token', (req, res) => {
  res.redirect(`/pdf/shared/${req.params.token}`);
});

app.get('/shared/:token/file', (req, res) => {
  res.redirect(`/pdf/shared/${req.params.token}/file`);
});

app.get('/shared/:token/comments', (req, res) => {
  res.redirect(`/pdf/shared/${req.params.token}/comments`);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React build directory
  app.use(express.static(path.join(__dirname, '../client/build'), {
    setHeaders: (res, filePath) => {
      // Set proper MIME types for JavaScript files
      if (filePath.endsWith('.js')) {
        res.set('Content-Type', 'application/javascript');
      }
      // Set proper MIME types for CSS files
      if (filePath.endsWith('.css')) {
        res.set('Content-Type', 'text/css');
      }
      // Set cache headers
      res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
  }));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'), {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  });
}

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

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const startServer = (port) => {
  try {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  }
};

const PORT = process.env.PORT || 5000;
startServer(PORT); 