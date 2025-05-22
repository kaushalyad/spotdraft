import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  AutoFixHigh as AutoSaveIcon,
  AccessTime as TimeZoneIcon,
  History as ActivityIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';
import { useSettings } from '../contexts/SettingsContext';

function Settings({ user }) {
  const theme = useTheme();
  const { settings: globalSettings, toggleDarkMode, changeLanguage } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    darkMode: globalSettings.darkMode,
    theme: globalSettings.theme,
    autoSave: true,
    language: globalSettings.language,
    pushNotifications: true,
    commentNotifications: true,
    timezone: 'UTC',
    twoFactorAuth: false,
    activityLogging: true
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.get(`${config.API_URL}/api/user/settings`, {
        headers: {
          'x-auth-token': token
        }
      });
      const serverSettings = response.data;
      setSettings(prev => ({
        ...prev,
        ...serverSettings,
        darkMode: globalSettings.darkMode,
        theme: globalSettings.theme,
        language: globalSettings.language
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    
    if (name === 'darkMode') {
      setSettings(prev => ({ ...prev, darkMode: checked, theme: checked ? 'dark' : 'light' }));
      toggleDarkMode();
    } else if (name === 'language') {
      setSettings(prev => ({ ...prev, language: value }));
      changeLanguage(value);
    } else {
      setSettings(prev => ({ ...prev, [name]: value !== undefined ? value : checked }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.post(
        `${config.API_URL}/api/user/settings`,
        settings,
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">
          Please log in to access settings
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Appearance Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            transition: 'all 0.3s ease-in-out',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {settings.darkMode ? <DarkModeIcon color="primary" /> : <LightModeIcon color="primary" />}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Appearance
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.darkMode}
                    onChange={handleChange}
                    name="darkMode"
                  />
                }
                label="Dark Mode"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Language & Region Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            bgcolor: alpha(theme.palette.secondary.main, 0.05),
            transition: 'all 0.3s ease-in-out',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LanguageIcon color="secondary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Language & Region
                </Typography>
              </Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={settings.language}
                  onChange={handleChange}
                  name="language"
                  label="Language"
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="hi">हिंदी</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={settings.timezone}
                  onChange={handleChange}
                  name="timezone"
                  label="Timezone"
                >
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="EST">Eastern Time (EST)</MenuItem>
                  <MenuItem value="CST">Central Time (CST)</MenuItem>
                  <MenuItem value="PST">Pacific Time (PST)</MenuItem>
                  <MenuItem value="IST">Indian Standard Time (IST)</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            bgcolor: alpha(theme.palette.info.main, 0.05),
            transition: 'all 0.3s ease-in-out',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon color="info" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Notifications
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={handleChange}
                    name="emailNotifications"
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={handleChange}
                    name="pushNotifications"
                  />
                }
                label="Push Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.commentNotifications}
                    onChange={handleChange}
                    name="commentNotifications"
                  />
                }
                label="Comment Notifications"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Preferences Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            bgcolor: alpha(theme.palette.success.main, 0.05),
            transition: 'all 0.3s ease-in-out',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AutoSaveIcon color="success" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Preferences
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoSave}
                    onChange={handleChange}
                    name="autoSave"
                  />
                }
                label="Auto Save"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.activityLogging}
                    onChange={handleChange}
                    name="activityLogging"
                  />
                }
                label="Activity Logging"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Security Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            bgcolor: alpha(theme.palette.warning.main, 0.05),
            transition: 'all 0.3s ease-in-out',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon color="warning" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Security
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.twoFactorAuth}
                    onChange={handleChange}
                    name="twoFactorAuth"
                  />
                }
                label="Two-Factor Authentication"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Settings saved successfully
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Settings; 