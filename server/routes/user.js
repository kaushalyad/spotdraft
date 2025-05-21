const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get user settings
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return default settings if none exist
    const settings = user.settings || {
      emailNotifications: true,
      darkMode: false,
      theme: 'light',
      autoSave: true,
      language: 'en',
      pushNotifications: true,
      commentNotifications: true,
      timezone: 'UTC',
      twoFactorAuth: false,
      activityLogging: true
    };

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user settings
router.post('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate settings before updating
    const validSettings = {
      emailNotifications: typeof req.body.emailNotifications === 'boolean' ? req.body.emailNotifications : user.settings.emailNotifications,
      darkMode: typeof req.body.darkMode === 'boolean' ? req.body.darkMode : user.settings.darkMode,
      theme: ['light', 'dark', 'system'].includes(req.body.theme) ? req.body.theme : user.settings.theme,
      autoSave: typeof req.body.autoSave === 'boolean' ? req.body.autoSave : user.settings.autoSave,
      language: ['en', 'hi', 'es', 'fr'].includes(req.body.language) ? req.body.language : user.settings.language,
      pushNotifications: typeof req.body.pushNotifications === 'boolean' ? req.body.pushNotifications : user.settings.pushNotifications,
      commentNotifications: typeof req.body.commentNotifications === 'boolean' ? req.body.commentNotifications : user.settings.commentNotifications,
      timezone: req.body.timezone || user.settings.timezone,
      twoFactorAuth: typeof req.body.twoFactorAuth === 'boolean' ? req.body.twoFactorAuth : user.settings.twoFactorAuth,
      activityLogging: typeof req.body.activityLogging === 'boolean' ? req.body.activityLogging : user.settings.activityLogging
    };

    // Update settings
    user.settings = validSettings;
    await user.save();

    res.json(user.settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      message: 'Error updating settings',
      error: error.message 
    });
  }
});

module.exports = router; 