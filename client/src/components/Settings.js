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
  Divider,
  Stack,
  IconButton,
  Tooltip,
  Paper
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
  History as ActivityIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';
import { useSettings } from '../contexts/SettingsContext';

function Settings({ user }) {
  const theme = useTheme();
  const { settings: globalSettings, toggleDarkMode, changeLanguage, updateSettings, t } = useSettings();
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
    timezone: 'EST',
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
    } else if (name === 'theme') {
      const newTheme = value;
      const newDarkMode = newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setSettings(prev => ({ ...prev, theme: newTheme, darkMode: newDarkMode }));
      if (newTheme === 'system') {
        const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        updateSettings({ darkMode: systemDarkMode, theme: 'system' });
      } else {
        updateSettings({ darkMode: newTheme === 'dark', theme: newTheme });
      }
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
        {
          ...settings,
          darkMode: settings.darkMode,
          theme: settings.theme,
          language: settings.language
        },
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );

      updateSettings({
        darkMode: settings.darkMode,
        theme: settings.theme,
        language: settings.language
      });

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
          {t('pleaseLogin')}
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

  const SettingSection = ({ title, icon, children }) => (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 2,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        {icon}
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {t('settings')}
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <SettingSection 
            title={t('appearance')} 
            icon={<PaletteIcon sx={{ color: 'primary.main' }} />}
          >
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {t('darkMode')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {settings.darkMode ? 'Dark theme enabled' : 'Light theme enabled'}
                  </Typography>
                </Box>
                <Switch
                  checked={settings.darkMode}
                  onChange={handleChange}
                  name="darkMode"
                />
              </Box>

              <FormControl fullWidth>
                <InputLabel>{t('language')}</InputLabel>
                <Select
                  value={settings.language}
                  onChange={handleChange}
                  name="language"
                  label={t('language')}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="hi">हिंदी (Hindi)</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </SettingSection>

          <SettingSection 
            title={t('notifications')} 
            icon={<NotificationsIcon sx={{ color: 'primary.main' }} />}
          >
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {t('emailNotifications')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Receive updates via email
                  </Typography>
                </Box>
                <Switch
                  checked={settings.emailNotifications}
                  onChange={handleChange}
                  name="emailNotifications"
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {t('pushNotifications')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Get instant browser notifications
                  </Typography>
                </Box>
                <Switch
                  checked={settings.pushNotifications}
                  onChange={handleChange}
                  name="pushNotifications"
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {t('commentNotifications')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Get notified about new comments
                  </Typography>
                </Box>
                <Switch
                  checked={settings.commentNotifications}
                  onChange={handleChange}
                  name="commentNotifications"
                />
              </Box>
            </Stack>
          </SettingSection>

          <SettingSection 
            title={t('security')} 
            icon={<SecurityIcon sx={{ color: 'primary.main' }} />}
          >
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {t('twoFactorAuth')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add an extra layer of security
                  </Typography>
                </Box>
                <Switch
                  checked={settings.twoFactorAuth}
                  onChange={handleChange}
                  name="twoFactorAuth"
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {t('activityLogging')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Keep track of account activity
                  </Typography>
                </Box>
                <Switch
                  checked={settings.activityLogging}
                  onChange={handleChange}
                  name="activityLogging"
                />
              </Box>
            </Stack>
          </SettingSection>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 2,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              position: 'sticky',
              top: 24
            }}
          >
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>{t('timezone')}</InputLabel>
                <Select
                  value={settings.timezone}
                  onChange={handleChange}
                  name="timezone"
                  label={t('timezone')}
                >
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="EST">EST</MenuItem>
                  <MenuItem value="PST">PST</MenuItem>
                  <MenuItem value="IST">IST</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {t('autoSave')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Automatically save changes
                  </Typography>
                </Box>
                <Switch
                  checked={settings.autoSave}
                  onChange={handleChange}
                  name="autoSave"
                />
              </Box>

              <Divider />

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {saving ? t('saving') : t('save')}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          {t('saved')}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Settings; 