const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Helper function to send emails
const sendEmail = async (to, subject, text) => {
  try {
    // Log email configuration (without sensitive data)
    console.log('Email configuration check:');
    console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
    console.log('EMAIL_PASSWORD exists:', !!process.env.EMAIL_PASSWORD);
    console.log('FRONTEND_URL exists:', !!process.env.FRONTEND_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email configuration missing');
      throw new Error('Email configuration missing');
    }

    const mailOptions = {
      from: `"SpotDraft" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #666; line-height: 1.6;">${text}</p>
          <p style="color: #666; line-height: 1.6;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      `
    };

    console.log('Attempting to send email to:', to);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Please provide both email and password',
        error: 'MISSING_CREDENTIALS'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: 'SERVER_ERROR'
    });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('Fetching profile for user ID:', req.user.id);
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.error('User not found for ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Found user:', { id: user._id, name: user.name, email: user.email });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error in /profile endpoint:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Request password reset
router.post('/reset-password-request', async (req, res) => {
  try {
    console.log('Received reset password request');
    console.log('Request body:', req.body);
    
    const { email } = req.body;
    
    if (!email) {
      console.log('Email is missing from request');
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('Looking up user with email:', email);
    const user = await User.findOne({ email });

    if (!user) {
      console.log('No user found with email:', email);
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    console.log('User found, generating reset token');
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    console.log('Reset token generated and saved');

    // Determine the correct frontend URL based on environment
    const frontendUrl = process.env.FRONTEND_URL || 'https://spotdraft-w59a.onrender.com';

    // Send reset email using nodemailer
    const resetUrl = `${frontendUrl}/#/reset-password/${resetToken}`;
    console.log('Reset URL generated:', resetUrl);

    const emailText = `You are receiving this because you (or someone else) requested a password reset.\n\n
      Please click on the following link to reset your password:\n\n
      ${resetUrl}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`;

    try {
      console.log('Attempting to send reset password email');
      await sendEmail(user.email, 'Password Reset Request - SpotDraft', emailText);
      console.log('Reset password email sent successfully');
      res.json({ 
        message: 'Password reset instructions have been sent to your email',
        success: true
      });
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
      // If email fails, remove the reset token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      res.status(500).json({ 
        message: 'Failed to send reset email. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }
  } catch (error) {
    console.error('Error in reset password request:', error);
    res.status(500).json({ 
      message: 'An error occurred while processing your request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Validate reset token
router.get('/validate-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ message: 'Error validating token' });
  }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Verify token route
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    
    if (!token) {
      console.log('No token provided for verification');
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified for user:', decoded.id);
      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        console.log('User not found for ID:', decoded.id);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('User verified successfully:', user._id);
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      });
    } catch (err) {
      console.error('Token verification failed:', err);
      res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    console.error('Error in verify route:', error);
    res.status(500).json({ message: 'Error verifying token', error: error.message });
  }
});

// Add reset password route
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

module.exports = router; 