const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDF = require('../models/PDF');
const User = require('../models/User');
const auth = require('../middleware/auth');
const sgMail = require('@sendgrid/mail');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const router = express.Router();

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeFilename = uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, safeFilename);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    console.log('Multer fileFilter:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (file.mimetype !== 'application/pdf') {
      console.error('Invalid file type:', file.mimetype);
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Delete PDF - must be first route with :id parameter
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Delete PDF request received:', {
      pdfId: req.params.id,
      userId: req.user.id,
      path: req.path,
      method: req.method
    });

    // Find the PDF
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) {
      console.log('PDF not found:', req.params.id);
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Check if user is the owner
    if (pdf.owner.toString() !== req.user.id) {
      console.log('User not authorized to delete PDF:', {
        userId: req.user.id,
        ownerId: pdf.owner.toString()
      });
      return res.status(403).json({ message: 'Not authorized to delete this PDF' });
    }

    // Delete the physical file
    const filePath = path.normalize(pdf.filePath);
    console.log('Attempting to delete file:', filePath);
    
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('Physical file deleted successfully:', filePath);
      } catch (error) {
        console.error('Error deleting physical file:', error);
        // Continue with database deletion even if file deletion fails
      }
    } else {
      console.log('Physical file not found:', filePath);
    }

    // Delete from database
    const deletedPdf = await PDF.findByIdAndDelete(req.params.id);
    if (!deletedPdf) {
      console.log('Failed to delete PDF from database:', req.params.id);
      return res.status(500).json({ message: 'Failed to delete PDF from database' });
    }
    
    console.log('PDF deleted successfully from database:', req.params.id);
    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('Error deleting PDF:', {
      error: error.message,
      stack: error.stack,
      pdfId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({ 
      message: 'Error deleting PDF', 
      error: error.message 
    });
  }
});

// Get all PDFs for a user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching PDFs for user:', req.user.id);
    
    const pdfs = await PDF.find({
      $or: [
        { owner: req.user.id },
        { 'sharedWith.user': req.user.id }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('owner', 'name')
    .lean();

    console.log(`Found ${pdfs.length} PDFs for user`);
    res.json(pdfs);
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({ 
      message: 'Error fetching PDFs', 
      error: error.message 
    });
  }
});

// Search PDFs
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    console.log('Search request received:', { query: q, userId: req.user.id });
    
    if (!q) {
      return res.json([]);
    }

    // First, find PDFs that match the search term
    const searchQuery = {
      $and: [
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
          ]
        },
        {
          $or: [
            { owner: req.user.id },
            { 'sharedWith.user': req.user.id }
          ]
        }
      ]
    };

    console.log('Executing search query:', JSON.stringify(searchQuery, null, 2));

    const pdfs = await PDF.find(searchQuery)
      .select('name description views downloads createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log(`Found ${pdfs.length} PDFs matching search query`);

    // Format the response with default values for views and downloads
    const formattedPdfs = pdfs.map(pdf => ({
      ...pdf,
      views: pdf.views || 0,
      downloads: pdf.downloads || 0
    }));

    res.json(formattedPdfs);
  } catch (error) {
    console.error('Search error:', {
      error: error.message,
      stack: error.stack,
      query: req.query.q,
      userId: req.user.id
    });
    res.status(500).json({ 
      message: 'Error searching PDFs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  console.error('Multer error:', {
    error: err.message,
    code: err.code,
    field: err.field,
    storageErrors: err.storageErrors
  });

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 10MB' });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

// Upload PDF
router.post('/upload', auth, (req, res, next) => {
  console.log('Starting PDF upload process...');
  upload.single('pdf')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', {
        error: err.message,
        code: err.code,
        field: err.field,
        storageErrors: err.storageErrors,
        stack: err.stack
      });
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, async (req, res) => {
  try {
    // Log the full request details
    console.log('Upload request received:', {
      headers: req.headers,
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        fieldname: req.file.fieldname,
        filename: req.file.filename
      } : null,
      user: req.user ? {
        id: req.user.id,
        email: req.user.email
      } : null
    });

    // Check if user is authenticated
    if (!req.user) {
      console.error('No authenticated user found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { name, description } = req.body;
    const file = req.file;
    
    if (!file) {
      console.error('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file type
    if (file.mimetype !== 'application/pdf') {
      console.error('Invalid file type:', file.mimetype);
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkError) {
        console.error('Error deleting invalid file:', unlinkError);
      }
      return res.status(400).json({ message: 'Only PDF files are allowed' });
    }

    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.log('Creating uploads directory:', uploadsDir);
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
      } catch (mkdirError) {
        console.error('Error creating uploads directory:', mkdirError);
        return res.status(500).json({ 
          message: 'Error creating uploads directory',
          error: mkdirError.message
        });
      }
    }

    // Normalize the file path for Windows
    const normalizedPath = path.normalize(file.path);
    console.log('File details:', {
      originalname: file.originalname,
      filename: file.filename,
      path: normalizedPath,
      mimetype: file.mimetype,
      size: file.size,
      uploadsDir,
      dirExists: fs.existsSync(uploadsDir),
      fileExists: fs.existsSync(normalizedPath)
    });

    // Verify file exists after upload
    if (!fs.existsSync(normalizedPath)) {
      console.error('File not found after upload:', normalizedPath);
      return res.status(500).json({ 
        message: 'File upload failed - file not found',
        error: 'The uploaded file could not be found on the server'
      });
    }

    try {
      // Create new PDF document with relative path
      const filePath = `uploads/${file.filename}`;
      console.log('Creating PDF document with path:', {
        filePath,
        normalizedPath,
        uploadsDir,
        dirExists: fs.existsSync(uploadsDir),
        fileExists: fs.existsSync(normalizedPath),
        file: {
          filename: file.filename,
          path: file.path,
          originalname: file.originalname
        }
      });

      // Create the PDF document with explicit filePath
      const pdfData = {
        name: name || file.originalname.replace('.pdf', ''),
        description: description || '',
        filePath: filePath,
        owner: req.user.id
      };

      console.log('Creating PDF with data:', pdfData);

      // Create and save the PDF document
      try {
        const pdf = new PDF(pdfData);
        console.log('PDF document created:', {
          name: pdf.name,
          description: pdf.description,
          filePath: pdf.filePath,
          owner: pdf.owner,
          model: pdf.toObject()
        });

        const savedPdf = await pdf.save();
        console.log('PDF saved successfully:', {
          id: savedPdf._id,
          name: savedPdf.name,
          description: savedPdf.description,
          filePath: savedPdf.filePath,
          fileExists: fs.existsSync(normalizedPath),
          model: savedPdf.toObject()
        });

        // Return the PDF data without the full path
        const pdfResponse = savedPdf.toObject();
        delete pdfResponse.filePath; // Remove the full path from the response
        res.status(201).json(pdfResponse);
      } catch (saveError) {
        console.error('Error saving PDF:', {
          error: saveError.message,
          stack: saveError.stack,
          name: saveError.name,
          code: saveError.code,
          errors: saveError.errors,
          model: pdfData
        });
        throw saveError;
      }
    } catch (error) {
      console.error('Error uploading PDF:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name,
        file: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          filename: req.file.filename
        } : null
      });
      
      // If there's an error, delete the uploaded file
      if (req.file && req.file.path) {
        try {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (unlinkError) {
          console.error('Error deleting file after failed upload:', unlinkError);
        }
      }
      
      res.status(500).json({ 
        message: 'Error uploading PDF',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error uploading PDF:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        filename: req.file.filename
      } : null
    });
    
    // If there's an error, delete the uploaded file
    if (req.file && req.file.path) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (unlinkError) {
        console.error('Error deleting file after failed upload:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      message: 'Error uploading PDF',
      error: error.message
    });
  }
});

// Share PDF
router.post('/share/:id', auth, async (req, res) => {
  try {
    const { 
      shareType,
      password,
      linkExpiry,
      allowDownload,
      allowComments,
      notifyOnAccess,
      maxAccesses
    } = req.body;
    
    console.log('Share request received:', {
      pdfId: req.params.id,
      shareType,
      hasPassword: !!password,
      linkExpiry,
      allowDownload,
      allowComments
    });

    const pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      console.log('PDF not found:', req.params.id);
      return res.status(404).json({ message: 'PDF not found' });
    }

    if (pdf.owner.toString() !== req.user.id) {
      console.log('User not authorized:', {
        userId: req.user.id,
        ownerId: pdf.owner.toString()
      });
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Generate a more secure share token
    const shareToken = crypto.randomBytes(16).toString('hex');
    
    // Hash the share token for storage
    const hashedToken = crypto.createHash('sha256').update(shareToken).digest('hex');
    pdf.shareToken = hashedToken;

    // Update share settings
    pdf.isPublic = shareType === 'public';
    pdf.shareSettings = {
      ...pdf.shareSettings,
      password: password ? await bcrypt.hash(password, 12) : undefined,
      createdAt: new Date(),
      expiresAt: linkExpiry ? new Date(Date.now() + getExpiryTime(linkExpiry)) : undefined,
      allowDownload: allowDownload !== undefined ? allowDownload : true,
      allowComments: allowComments !== undefined ? allowComments : true,
      notifyOnAccess: notifyOnAccess !== undefined ? notifyOnAccess : false,
      maxAccessAttempts: 5,
      accessAttempts: 0,
      lastAccessAttempt: null,
      maxAccesses: maxAccesses || 1,
      accessCount: 0,
      accessHistory: [],
      visitors: [],
      lastAccessed: null
    };

    await pdf.save();
    
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareLink = `${baseUrl}/shared/${shareToken}`;
    
    console.log('Share link generated:', {
      pdfId: pdf._id,
      shareToken,
      shareLink,
      hasPassword: !!password,
      expiresAt: pdf.shareSettings.expiresAt
    });

    return res.json({ 
      message: `${shareType === 'password' ? 'Password-protected' : 'Public'} share link generated successfully`,
      shareToken,
      shareLink,
      hasPassword: !!password,
      expiresAt: pdf.shareSettings.expiresAt,
      allowDownload: pdf.shareSettings.allowDownload,
      allowComments: pdf.shareSettings.allowComments,
      securityFeatures: {
        maxAccessAttempts: pdf.shareSettings.maxAccessAttempts,
        maxAccesses: pdf.shareSettings.maxAccesses,
        expiresAt: pdf.shareSettings.expiresAt
      }
    });
  } catch (error) {
    console.error('Error sharing PDF:', {
      error: error.message,
      stack: error.stack,
      pdfId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({ 
      message: 'Error sharing PDF', 
      error: error.message 
    });
  }
});

// Helper function to convert expiry string to milliseconds
function getExpiryTime(expiry) {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1));
  
  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'm':
      return value * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
  }
}

// Verify share password with enhanced security
router.post('/shared/:token/verify', async (req, res) => {
  try {
    const { password, email, accessToken } = req.body;
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const pdf = await PDF.findOne({ shareToken: hashedToken }).select('+shareSettings.password');

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    if (!pdf.shareSettings?.password) {
      return res.status(400).json({ message: 'This PDF is not password protected' });
    }

    // Check if link has expired
    if (pdf.shareSettings.expiresAt && new Date() > pdf.shareSettings.expiresAt) {
      return res.status(403).json({ message: 'This share link has expired' });
    }

    // Check access attempts
    if (pdf.shareSettings.accessAttempts >= pdf.shareSettings.maxAccessAttempts) {
      const timeSinceLastAttempt = new Date() - new Date(pdf.shareSettings.lastAccessAttempt);
      if (timeSinceLastAttempt < 15 * 60 * 1000) { // 15 minutes cooldown
        return res.status(429).json({ 
          message: 'Too many failed attempts. Please try again later.',
          retryAfter: Math.ceil((15 * 60 * 1000 - timeSinceLastAttempt) / 1000)
        });
      }
      // Reset attempts after cooldown
      pdf.shareSettings.accessAttempts = 0;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, pdf.shareSettings.password);
    if (!isValid) {
      pdf.shareSettings.accessAttempts += 1;
      pdf.shareSettings.lastAccessAttempt = new Date();
      await pdf.save();
      return res.status(401).json({ message: 'Invalid password' });
    }

    // If email is required, validate it
    if (pdf.shareSettings.requireEmail && !email) {
      return res.status(400).json({ message: 'Email is required for access' });
    }

    // Check unique access if required
    if (pdf.shareSettings.requireUniqueAccess) {
      if (!accessToken) {
        return res.status(400).json({ message: 'Access token is required' });
      }

      // Check if access token has already been used
      if (pdf.shareSettings.uniqueAccessTokens.includes(accessToken)) {
        return res.status(403).json({ message: 'This access token has already been used' });
      }

      // Check if maximum unique accesses reached
      if (pdf.shareSettings.uniqueAccessTokens.length >= pdf.shareSettings.maxUniqueAccesses) {
        return res.status(403).json({ message: 'Maximum number of unique accesses reached' });
      }

      // Add access token to used tokens
      pdf.shareSettings.uniqueAccessTokens.push(accessToken);
    }

    // Reset access attempts on successful verification
    pdf.shareSettings.accessAttempts = 0;
    pdf.shareSettings.lastAccessAttempt = new Date();
    
    // Record access history
    if (email) {
      pdf.shareSettings.accessHistory.push({
        email,
        timestamp: new Date(),
        accessToken: accessToken || null
      });
    }
    
    await pdf.save();

    res.json({ 
      message: 'Password verified successfully',
      accessGranted: true,
      expiresAt: pdf.shareSettings.expiresAt,
      uniqueAccess: pdf.shareSettings.requireUniqueAccess,
      remainingAccesses: pdf.shareSettings.maxUniqueAccesses - pdf.shareSettings.uniqueAccessTokens.length
    });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({ message: 'Error verifying password', error: error.message });
  }
});

// Get PDF and comments
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('PDF request received:', {
      pdfId: req.params.id,
      userId: req.user.id,
      query: req.query,
      headers: req.headers
    });

    // Validate PDF ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        message: 'Invalid PDF ID format',
        details: {
          providedId: req.params.id,
          expectedFormat: 'MongoDB ObjectId'
        }
      });
    }

    // Build the query with proper population
    const query = PDF.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('comments.user', 'name email')
      .populate('comments.replies.user', 'name email');

    // Execute the query
    const pdf = await query.exec();

    if (!pdf) {
      return res.status(404).json({ 
        message: 'PDF not found',
        details: {
          pdfId: req.params.id,
          userId: req.user.id
        }
      });
    }

    // Check if user has permission to view the PDF
    const hasPermission = 
      pdf.owner._id.toString() === req.user.id ||
      pdf.sharedWith.some(share => share.user.toString() === req.user.id) ||
      pdf.isPublic;

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Not authorized to view this PDF',
        details: {
          userId: req.user.id,
          ownerId: pdf.owner._id.toString(),
          isPublic: pdf.isPublic
        }
      });
    }

    // Calculate total comments including replies
    const totalComments = pdf.comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? comment.replies.length : 0);
    }, 0);

    // Prepare response data
    const response = {
      ...pdf.toObject(),
      totalComments,
      totalViews: Array.isArray(pdf.views) ? pdf.views.length : 0,
      totalDownloads: pdf.downloads.length,
      filePath: pdf.filePath
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching PDF:', {
      error: error.message,
      stack: error.stack,
      pdfId: req.params.id,
      userId: req.user.id
    });
    res.status(500).json({ 
      message: 'Error fetching PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Debug route to check PDF structure
router.get('/:id/debug', auth, async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Check comments structure
    const commentsCheck = pdf.comments.map((comment, index) => ({
      index,
      hasText: Boolean(comment.text),
      textType: typeof comment.text,
      hasUser: Boolean(comment.user),
      hasReplies: Boolean(comment.replies),
      replyCount: comment.replies ? comment.replies.length : 0
    }));

    res.json({
      pdfId: pdf._id,
      commentCount: pdf.comments.length,
      commentsCheck,
      rawComments: pdf.comments
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error checking PDF structure', 
      error: error.message 
    });
  }
});

// Add comment to PDF
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Check if user has permission to comment
    const hasPermission = 
      pdf.owner.toString() === req.user.id ||
      pdf.sharedWith.includes(req.user.id) ||
      pdf.isPublic;

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to comment on this PDF' });
    }

    // Get user info before creating comment
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create comment with explicit timestamps
    const now = new Date();
    const comment = {
      user: user._id,
      content: req.body.content,
      formattedContent: req.body.formattedContent,
      page: req.body.page,
      position: req.body.position,
      createdAt: now,
      updatedAt: now
    };

    pdf.comments.push(comment);
    await pdf.save();

    // Fetch the updated PDF with populated user information
    const updatedPdf = await PDF.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('comments.user', 'name email')
      .populate('comments.replies.user', 'name email');

    // Calculate total comments including replies
    const totalComments = updatedPdf.comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? comment.replies.length : 0);
    }, 0);

    // Ensure the new comment has user information
    const response = {
      ...updatedPdf.toObject(),
      totalComments,
      totalViews: updatedPdf.views.length,
      totalDownloads: updatedPdf.downloads.length
    };

    // Ensure the last comment (newly added) has user information
    if (response.comments && response.comments.length > 0) {
      const lastComment = response.comments[response.comments.length - 1];
      if (lastComment) {
        lastComment.user = {
          _id: user._id,
          name: user.name,
          email: user.email
        };
        // Ensure timestamps are properly set
        lastComment.createdAt = now;
        lastComment.updatedAt = now;
      }
    }

    res.json(response);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add reply to a comment
router.post('/:id/comments/:commentId/replies', auth, async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Check if user has permission to reply
    const hasPermission = 
      pdf.owner.toString() === req.user.id ||
      pdf.sharedWith.includes(req.user.id) ||
      pdf.isPublic;

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to reply on this PDF' });
    }

    const comment = pdf.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = {
      user: req.user.id,
      content: req.body.content,
      formattedContent: req.body.formattedContent
    };

    comment.replies.push(reply);
    await pdf.save();

    // Fetch the updated PDF with populated user information
    const updatedPdf = await PDF.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('comments.user', 'name email')
      .populate('comments.replies.user', 'name email');

    // Calculate total comments including replies
    const totalComments = updatedPdf.comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? comment.replies.length : 0);
    }, 0);

    res.json({
      ...updatedPdf.toObject(),
      totalComments,
      totalViews: updatedPdf.views.length,
      totalDownloads: updatedPdf.downloads.length
    });
  } catch (err) {
    console.error('Error adding reply:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for PDF
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id)
      .populate('comments.user', 'name email')
      .populate('comments.replies.user', 'name email');

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Check if user has permission to view comments
    const canView = pdf.owner.toString() === req.user.id || 
      pdf.sharedWith.some(share => share.user.toString() === req.user.id) ||
      pdf.isPublic;

    if (!canView) {
      return res.status(403).json({ message: 'Not authorized to view comments' });
    }

    // Return comments with their replies
    res.json(pdf.comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update comment
router.put('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const { content, formattedContent } = req.body;
    const pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    const comment = pdf.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the comment author
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    comment.content = content;
    comment.formattedContent = formattedContent;
    comment.updatedAt = Date.now();
    await pdf.save();

    res.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    const comment = pdf.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the comment author or PDF owner
    if (comment.user.toString() !== req.user.id && pdf.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Remove comment and its replies
    const commentIndex = pdf.comments.indexOf(comment);
    pdf.comments.splice(commentIndex, 1);
    await pdf.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get PDF file
router.get('/:id/file', auth, async (req, res) => {
  try {
    console.log('PDF file request received:', {
      pdfId: req.params.id,
      userId: req.user.id,
      headers: req.headers
    });

    const pdf = await PDF.findById(req.params.id);
    if (!pdf) {
      console.log('PDF not found:', req.params.id);
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Check if user has permission to view the PDF
    const hasPermission = 
      pdf.owner.toString() === req.user.id ||
      pdf.sharedWith.some(share => share.user.toString() === req.user.id) ||
      pdf.isPublic;

    if (!hasPermission) {
      console.log('User not authorized:', {
        userId: req.user.id,
        ownerId: pdf.owner.toString(),
        isPublic: pdf.isPublic
      });
      return res.status(403).json({ message: 'Not authorized to view this PDF' });
    }

    // Check if file exists locally
    const localFilePath = path.join(__dirname, '..', pdf.filePath);
    console.log('Checking local file:', {
      filePath: pdf.filePath,
      localFilePath,
      exists: fs.existsSync(localFilePath)
    });

    if (fs.existsSync(localFilePath)) {
      // Serve local file
      console.log('Serving local file:', localFilePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdf.name}.pdf"`);
      
      const fileStream = fs.createReadStream(localFilePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error('Error streaming local file:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming PDF file' });
        }
      });

      // Increment view count only if last view was more than 5 minutes ago
      const lastView = pdf.lastViewed || new Date(0);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      if (lastView < fiveMinutesAgo) {
        await pdf.incrementViews();
        console.log('View count incremented:', {
          pdfId: pdf._id,
          views: pdf.views.length,
          lastViewed: pdf.lastViewed
        });
      }
    } else {
      // Try to serve from S3
      console.log('Local file not found, trying S3:', pdf.filePath);
      try {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: pdf.filePath
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
        console.log('Generated signed URL for PDF:', {
          pdfId: pdf._id,
          filePath: pdf.filePath,
          urlLength: signedUrl.length
        });

        // Redirect to the signed URL
        res.redirect(signedUrl);

        // Increment view count only if last view was more than 5 minutes ago
        const lastView = pdf.lastViewed || new Date(0);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        if (lastView < fiveMinutesAgo) {
          await pdf.incrementViews();
          console.log('View count incremented:', {
            pdfId: pdf._id,
            views: pdf.views.length,
            lastViewed: pdf.lastViewed
          });
        }
      } catch (s3Error) {
        console.error('Error generating signed URL:', {
          error: s3Error.message,
          stack: s3Error.stack,
          pdfId: pdf._id,
          filePath: pdf.filePath
        });
        return res.status(500).json({ 
          message: 'Error accessing PDF file',
          error: process.env.NODE_ENV === 'development' ? s3Error.message : undefined
        });
      }
    }
  } catch (error) {
    console.error('Error serving PDF file:', {
      error: error.message,
      stack: error.stack,
      pdfId: req.params.id,
      userId: req.user.id
    });
    res.status(500).json({ 
      message: 'Error serving PDF file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Record PDF view
router.post('/:id/view', auth, async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    pdf.views.push({
      user: req.user.id,
      timestamp: new Date()
    });
    pdf.lastViewed = new Date();
    await pdf.save();

    res.json({ message: 'View recorded' });
  } catch (error) {
    console.error('Error recording view:', error);
    res.status(500).json({ message: 'Error recording view' });
  }
});

// Download PDF
router.get('/:id/download', auth, async (req, res) => {
  try {
    console.log('Download request for PDF:', req.params.id, 'by user:', req.user.id);
    
    const pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      console.log('PDF not found');
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Check if user has permission to download
    const hasPermission = 
      pdf.owner.toString() === req.user.id ||
      pdf.sharedWith.includes(req.user.id) ||
      pdf.isPublic;

    if (!hasPermission) {
      console.log('User does not have permission to download PDF');
      return res.status(403).json({ message: 'Not authorized to download this PDF' });
    }

    // Normalize file path
    const filePath = path.normalize(pdf.filePath);
    console.log('File path:', filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File does not exist:', filePath);
      return res.status(404).json({ message: 'PDF file not found' });
    }

    // Increment download count
    pdf.downloads.push({ timestamp: new Date() });
    await pdf.save();

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.name}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error downloading file' });
      }
    });

  } catch (err) {
    console.error('Error downloading PDF:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve shared PDF file
router.get('/shared/:token/file', async (req, res) => {
  try {
    const token = req.params.token;
    console.log('Shared PDF file request received:', {
      token,
      headers: req.headers,
      query: req.query,
      url: req.url
    });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('Hashed token:', hashedToken);

    const pdf = await PDF.findOne({ shareToken: hashedToken });
    
    if (!pdf) {
      console.log('Shared PDF not found:', token);
      return res.status(404).json({ message: 'Shared PDF not found' });
    }

    // Check if the share link has expired
    if (pdf.shareSettings?.expiresAt && new Date(pdf.shareSettings.expiresAt) < new Date()) {
      console.log('Share link expired:', {
        token,
        expiresAt: pdf.shareSettings.expiresAt
      });
      return res.status(403).json({ message: 'Share link has expired' });
    }

    // Check if max accesses reached
    if (pdf.shareSettings?.maxAccesses && 
        pdf.shareSettings.accessCount >= pdf.shareSettings.maxAccesses) {
      console.log('Max accesses reached:', {
        token,
        accessCount: pdf.shareSettings.accessCount,
        maxAccesses: pdf.shareSettings.maxAccesses
      });
      return res.status(403).json({ message: 'Maximum access limit reached for this PDF' });
    }

    // First try to serve from local storage
    const localFilePath = path.join(__dirname, '..', pdf.filePath);
    if (fs.existsSync(localFilePath)) {
      console.log('Serving file from local storage:', localFilePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdf.name}.pdf"`);
      
      const fileStream = fs.createReadStream(localFilePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error('Error streaming local file:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming PDF file' });
        }
      });
    } else {
      // If not in local storage, try S3
      console.log('File not found locally, trying S3:', pdf.filePath);
      try {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: pdf.filePath
        });

        // Generate a signed URL with CORS headers
        const signedUrl = await getSignedUrl(s3Client, command, { 
          expiresIn: 3600,
          signableHeaders: new Set(['host'])
        });

        // Instead of redirecting, proxy the file through our server
        const response = await fetch(signedUrl);
        if (!response.ok) {
          throw new Error(`S3 request failed with status ${response.status}`);
        }

        // Set appropriate headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${pdf.name}.pdf"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Stream the file
        response.body.pipe(res);
      } catch (s3Error) {
        console.error('Error accessing S3:', {
          error: s3Error.message,
          stack: s3Error.stack,
          pdfId: pdf._id,
          filePath: pdf.filePath
        });
        return res.status(500).json({ 
          message: 'Error accessing PDF file',
          error: process.env.NODE_ENV === 'development' ? s3Error.message : undefined
        });
      }
    }

    // Update view count and last viewed timestamp
    await pdf.incrementViews();

    console.log('Updated view count for shared PDF:', {
      pdfId: pdf._id,
      views: pdf.views.length,
      lastViewed: pdf.lastViewed
    });
  } catch (error) {
    console.error('Error serving shared PDF file:', {
      error: error.message,
      stack: error.stack,
      token: req.params.token
    });
    res.status(500).json({ 
      message: 'Error serving PDF file', 
      error: error.message 
    });
  }
});

// Get shared PDF (public access)
router.get('/shared/:token', async (req, res) => {
  try {
    const token = req.params.token;
    console.log('Shared PDF request received:', {
      token,
      headers: req.headers,
      query: req.query,
      url: req.url
    });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('Hashed token:', hashedToken);
    
    // Find the PDF with the given share token
    const pdf = await PDF.findOne({ shareToken: hashedToken })
      .populate('comments.user', 'name')
      .populate('comments.replies.user', 'name')
      .populate('owner', 'name');
    
    if (!pdf) {
      console.log('PDF not found for token:', token);
      return res.status(404).json({ message: 'PDF not found or not accessible' });
    }

    console.log('Found PDF:', {
      id: pdf._id,
      name: pdf.name,
      filePath: pdf.filePath,
      shareToken: pdf.shareToken
    });

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
    console.error('Error fetching shared PDF:', {
      error: error.message,
      stack: error.stack,
      token: req.params.token
    });
    res.status(500).json({ 
      message: 'Error fetching PDF', 
      error: error.message 
    });
  }
});

// Add comment to shared PDF (no authentication required)
router.post('/shared/:token/comments', async (req, res) => {
  try {
    const { content, name, email, page, position } = req.body;
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const pdf = await PDF.findOne({ shareToken: hashedToken });

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Check if comments are allowed
    if (!pdf.shareSettings?.allowComments) {
      return res.status(403).json({ message: 'Comments are not allowed for this PDF' });
    }

    // Initialize comments array if it doesn't exist
    if (!pdf.comments) {
      pdf.comments = [];
    }

    // Create a new comment
    const comment = {
      content: content,
      page: page || 1,
      position: position || { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      guestInfo: {
        name: name || 'Anonymous',
        email: email || null
      }
    };

    // Add the comment to the PDF
    pdf.comments.push(comment);
    await pdf.save();

    // Calculate total comments including replies
    const totalComments = pdf.comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? comment.replies.length : 0);
    }, 0);

    // Return the updated PDF data
    res.json({
      comments: pdf.comments,
      totalComments,
      totalViews: pdf.views.length,
      totalDownloads: pdf.downloads.length
    });
  } catch (error) {
    console.error('Error adding comment to shared PDF:', error);
    res.status(500).json({ 
      message: 'Error adding comment', 
      error: error.message 
    });
  }
});

// Add reply to a comment on shared PDF (no authentication required)
router.post('/shared/:token/comments/:commentId/replies', async (req, res) => {
  try {
    const { content, name, email } = req.body;
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    
    if (!content) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const pdf = await PDF.findOne({ shareToken: hashedToken });

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Check if comments are allowed
    if (!pdf.shareSettings?.allowComments) {
      return res.status(403).json({ message: 'Comments are not allowed for this PDF' });
    }

    // Find the comment
    const comment = pdf.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Initialize replies array if it doesn't exist
    if (!comment.replies) {
      comment.replies = [];
    }

    // Create a new reply
    const reply = {
      content: content,
      createdAt: new Date(),
      updatedAt: new Date(),
      guestInfo: {
        name: name || 'Anonymous',
        email: email || null
      }
    };

    // Add the reply to the comment
    comment.replies.push(reply);
    await pdf.save();

    // Calculate total comments including replies
    const totalComments = pdf.comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? comment.replies.length : 0);
    }, 0);

    // Return the updated PDF data
    res.json({
      ...pdf.toObject(),
      totalComments,
      totalViews: pdf.views.length,
      totalDownloads: pdf.downloads.length
    });
  } catch (error) {
    console.error('Error adding reply to shared PDF comment:', error);
    res.status(500).json({ 
      message: 'Error adding reply', 
      error: error.message 
    });
  }
});

// Get comments for shared PDF (no authentication required)
router.get('/shared/:token/comments', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const pdf = await PDF.findOne({ shareToken: hashedToken })
      .populate('comments.user', 'name email')
      .populate('comments.replies.user', 'name email');

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Check if comments are allowed
    if (!pdf.shareSettings?.allowComments) {
      return res.status(403).json({ message: 'Comments are not allowed for this PDF' });
    }

    // Calculate total comments including replies
    const totalComments = pdf.comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? comment.replies.length : 0);
    }, 0);

    // Return comments with their replies
    res.json({
      comments: pdf.comments,
      totalComments,
      totalViews: pdf.views.length,
      totalDownloads: pdf.downloads.length
    });
  } catch (error) {
    console.error('Error fetching comments for shared PDF:', error);
    res.status(500).json({ 
      message: 'Error fetching comments', 
      error: error.message 
    });
  }
});

// Grant access to PDF
router.post('/:id/grant-access', auth, async (req, res) => {
  try {
    const { email, permissions, shareSettings } = req.body;
    console.log('Grant access request received:', {
      pdfId: req.params.id,
      email,
      permissions,
      shareSettings
    });

    const pdf = await PDF.findById(req.params.id);
    if (!pdf) {
      console.log('PDF not found:', req.params.id);
      return res.status(404).json({ message: 'PDF not found' });
    }

    if (pdf.owner.toString() !== req.user.id) {
      console.log('User not authorized:', {
        userId: req.user.id,
        ownerId: pdf.owner.toString()
      });
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Generate a secure share token
    const shareToken = crypto.randomBytes(16).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(shareToken).digest('hex');

    // Update PDF with share settings
    pdf.shareToken = hashedToken;
    pdf.isPublic = true;
    pdf.shareSettings = {
      ...pdf.shareSettings,
      createdAt: new Date(),
      expiresAt: shareSettings?.linkExpiry ? new Date(Date.now() + getExpiryTime(shareSettings.linkExpiry)) : undefined,
      allowDownload: permissions?.canDownload ?? true,
      allowComments: permissions?.canComment ?? true,
      notifyOnAccess: shareSettings?.notifyOnAccess ?? false,
      maxAccessAttempts: 5,
      accessAttempts: 0,
      lastAccessAttempt: null,
      maxAccesses: shareSettings?.maxAccesses || 1,
      accessCount: 0,
      accessHistory: [],
      visitors: [],
      lastAccessed: null
    };

    // Add to sharedWith array if not already present
    const existingShare = pdf.sharedWith.find(share => share.email === email);
    if (!existingShare) {
      pdf.sharedWith.push({
        email,
        permissions: {
          canView: permissions?.canView ?? true,
          canComment: permissions?.canComment ?? true,
          canDownload: permissions?.canDownload ?? true
        },
        sharedAt: new Date()
      });
    }

    await pdf.save();

    // Send email notification if configured
    if (shareSettings?.notifyOnAccess) {
      try {
        const shareUrl = `${process.env.CLIENT_URL}/shared/${shareToken}`;
        const msg = {
          to: email,
          from: process.env.EMAIL_FROM,
          subject: `${req.user.name} has shared a PDF with you`,
          text: `You have been granted access to view the PDF "${pdf.name}". Click here to access: ${shareUrl}`,
          html: `
            <h2>PDF Access Granted</h2>
            <p>${req.user.name} has granted you access to view the PDF "${pdf.name}".</p>
            <p>Click the button below to access the PDF:</p>
            <a href="${shareUrl}" style="
              display: inline-block;
              padding: 10px 20px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            ">Access PDF</a>
            <p>This link will expire in ${shareSettings.linkExpiry || '7 days'}.</p>
          `
        };
        await sgMail.send(msg);
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      message: 'Access granted successfully',
      token: shareToken,
      shareUrl: `${process.env.CLIENT_URL}/shared/${shareToken}`,
      expiresAt: pdf.shareSettings.expiresAt
    });
  } catch (error) {
    console.error('Error granting access:', error);
    res.status(500).json({ 
      message: 'Error granting access',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 