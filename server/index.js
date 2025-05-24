require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const fetch = require('node-fetch');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const app = express();

// Import models
const PDF = require('./models/PDF');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

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
app.get('/shared/:token', async (req, res) => {
  try {
    const token = req.params.token;
    console.log('Shared PDF request received:', {
      token,
      headers: req.headers,
      query: req.query,
      url: req.url,
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('Hashed token:', hashedToken);
    
    // Find the PDF with the given share token
    const pdf = await PDF.findOne({ shareToken: hashedToken })
      .populate('comments.user', 'name')
      .populate('comments.replies.user', 'name')
      .populate('owner', 'name');
    
    console.log('PDF search result:', {
      found: !!pdf,
      id: pdf?._id,
      name: pdf?.name,
      shareToken: pdf?.shareToken,
      hashedToken
    });

    if (!pdf) {
      console.log('PDF not found for token:', token);
      return res.status(404).json({ message: 'PDF not found or not accessible' });
    }

    // Check if share is expired
    if (pdf.shareSettings.expiresAt && new Date() > pdf.shareSettings.expiresAt) {
      console.log('Share link expired:', {
        token,
        expiresAt: pdf.shareSettings.expiresAt
      });
      return res.status(403).json({ message: 'This share link has expired' });
    }

    // Check if max accesses reached
    if (pdf.shareSettings.maxAccesses && 
        pdf.shareSettings.accessCount >= pdf.shareSettings.maxAccesses) {
      console.log('Max accesses reached:', {
        token,
        accessCount: pdf.shareSettings.accessCount,
        maxAccesses: pdf.shareSettings.maxAccesses
      });
      return res.status(403).json({ message: 'Maximum access limit reached for this PDF' });
    }

    // Increment access count and update last accessed
    pdf.shareSettings.accessCount = (pdf.shareSettings.accessCount || 0) + 1;
    pdf.shareSettings.lastAccessed = new Date();
    
    // Initialize visitors array if it doesn't exist
    if (!pdf.shareSettings.visitors) {
      pdf.shareSettings.visitors = [];
    }
    
    // Record visitor info
    const visitorInfo = {
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ip: req.ip
    };
    pdf.shareSettings.visitors.push(visitorInfo);
    
    await pdf.save();

    // Calculate total comments including replies
    const totalComments = pdf.comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? comment.replies.length : 0);
    }, 0);

    // Only return necessary data for shared PDF
    const responseData = {
      id: pdf._id,
      name: pdf.name,
      description: pdf.description,
      filePath: pdf.filePath,
      shareToken: pdf.shareToken,
      comments: pdf.comments,
      totalComments,
      totalViews: pdf.views.length,
      totalDownloads: pdf.downloads.length,
      shareSettings: {
        allowDownload: pdf.shareSettings.allowDownload,
        allowComments: pdf.shareSettings.allowComments,
        expiresAt: pdf.shareSettings.expiresAt,
        remainingAccesses: pdf.shareSettings.maxAccesses ? 
          pdf.shareSettings.maxAccesses - pdf.shareSettings.accessCount : 
          null
      },
      owner: {
        name: pdf.owner.name
      }
    };

    console.log('Sending shared PDF response:', {
      id: responseData.id,
      name: responseData.name,
      totalComments: responseData.totalComments,
      totalViews: responseData.totalViews,
      totalDownloads: responseData.totalDownloads
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error handling shared PDF request:', error);
    res.status(500).json({ message: 'Error accessing shared PDF' });
  }
});

app.get('/shared/:token/file', async (req, res) => {
  try {
    const token = req.params.token;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const pdf = await PDF.findOne({ shareToken: hashedToken });
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Check if share is expired
    if (pdf.shareSettings.expiresAt && new Date() > pdf.shareSettings.expiresAt) {
      return res.status(403).json({ message: 'This share link has expired' });
    }

    // Check if max accesses reached
    if (pdf.shareSettings.maxAccesses && 
        pdf.shareSettings.accessCount >= pdf.shareSettings.maxAccesses) {
      return res.status(403).json({ message: 'Maximum access limit reached for this PDF' });
    }

    // Check if file exists locally
    const localFilePath = path.join(__dirname, pdf.filePath);
    if (fs.existsSync(localFilePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdf.name}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');
      
      const fileStream = fs.createReadStream(localFilePath);
      fileStream.pipe(res);
    } else {
      // Try to serve from S3
      if (!process.env.AWS_S3_BUCKET || !process.env.AWS_REGION) {
        return res.status(500).json({ message: 'S3 configuration error' });
      }

      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: pdf.filePath
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      const response = await fetch(signedUrl);
      
      if (!response.ok) {
        throw new Error(`S3 request failed with status ${response.status}`);
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdf.name}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');

      response.body.pipe(res);
    }
  } catch (error) {
    console.error('Error handling shared PDF file request:', error);
    res.status(500).json({ message: 'Error accessing shared PDF file' });
  }
});

app.get('/shared/:token/comments', async (req, res) => {
  try {
    const token = req.params.token;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const pdf = await PDF.findOne({ shareToken: hashedToken })
      .populate('comments.user', 'name')
      .populate('comments.replies.user', 'name');
    
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Calculate total comments including replies
    const totalComments = pdf.comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? comment.replies.length : 0);
    }, 0);

    res.json({
      comments: pdf.comments,
      totalComments,
      totalViews: pdf.views.length,
      totalDownloads: pdf.downloads.length
    });
  } catch (error) {
    console.error('Error handling shared PDF comments request:', error);
    res.status(500).json({ message: 'Error accessing shared PDF comments' });
  }
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
} else {
  // Handle shared URLs without /pdf prefix in development
  app.get('/shared/:token', (req, res) => {
    res.redirect(`/pdf/shared/${req.params.token}`);
  });

  app.get('/shared/:token/file', (req, res) => {
    res.redirect(`/pdf/shared/${req.params.token}/file`);
  });

  app.get('/shared/:token/comments', (req, res) => {
    res.redirect(`/pdf/shared/${req.params.token}/comments`);
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