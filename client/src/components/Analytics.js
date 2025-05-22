import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  useTheme,
  Paper,
  Divider,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
  Comment as CommentIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';
import { useSettings } from '../contexts/SettingsContext';
import { format } from 'date-fns';

function Analytics() {
  const theme = useTheme();
  const { t, settings } = useSettings();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    viewsByDay: [],
    downloadsByDay: [],
    topPdfs: [],
    userActivity: [],
    totalStats: {
      totalViews: 0,
      totalDownloads: 0
    }
  });

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${config.API_URL}/api/analytics`, {
        headers: {
          'x-auth-token': token
        }
      });

      setAnalyticsData(response.data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err.response?.data?.message || t('analytics.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      // Force re-render when language changes
      setAnalyticsData(prev => ({ ...prev }));
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, tooltip }) => (
    <Tooltip title={tooltip || ''} arrow>
      <Card 
        elevation={0}
        sx={{ 
          height: '100%',
          borderRadius: 2,
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)'
          }
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, md: 2 } }}>
            <Box 
              sx={{ 
                bgcolor: `${color}.lighter`,
                p: { xs: 0.75, md: 1 },
                borderRadius: 1,
                mr: { xs: 1.5, md: 2 }
              }}
            >
              <Icon sx={{ 
                color: `${color}.main`, 
                fontSize: { xs: 20, md: 24 } 
              }} />
            </Box>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.9rem', md: '1.1rem' },
                fontWeight: 500
              }}
            >
              {title}
            </Typography>
          </Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
            }}
          >
            {value.toLocaleString()}
          </Typography>
        </CardContent>
      </Card>
    </Tooltip>
  );

  const ActivityItem = ({ activity }) => (
    <ListItem sx={{ 
      py: 1.5,
      borderBottom: '1px solid',
      borderColor: 'divider'
    }}>
      <ListItemText
        primary={activity.description}
        secondary={format(new Date(activity.timestamp), 'PPpp')}
        primaryTypographyProps={{
          variant: 'body1',
          color: 'text.primary'
        }}
        secondaryTypographyProps={{
          variant: 'caption',
          color: 'text.secondary'
        }}
      />
    </ListItem>
  );

  const TimeSeriesCard = ({ title, data, type }) => (
    <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">
          {title}
        </Typography>
      </Box>
      {data.length > 0 ? (
        <List>
          {data.map((item, index) => (
            <ActivityItem
              key={index}
              activity={{
                description: `${item.count} ${t(`analytics.${type}`)} on ${format(new Date(item.date), 'PP')}`,
                timestamp: item.date
              }}
            />
          ))}
        </List>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          py: 4
        }}>
          <Typography variant="body2" color="text.secondary" align="center">
            {t('analytics.noData')}
          </Typography>
        </Box>
      )}
    </Paper>
  );

  return (
    <Box key={settings.language}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          {t('analytics.title')}
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchAnalyticsData}
          disabled={loading}
          variant="outlined"
        >
          {t('refresh')}
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={6}>
              <StatCard
                title={t('analytics.views')}
                value={analyticsData.totalStats.totalViews}
                icon={VisibilityIcon}
                color="info"
                tooltip={t('analytics.totalViewsTooltip')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <StatCard
                title={t('analytics.downloads')}
                value={analyticsData.totalStats.totalDownloads}
                icon={DownloadIcon}
                color="warning"
                tooltip={t('analytics.totalDownloadsTooltip')}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <TimeSeriesCard
                title={t('analytics.viewsOverTime')}
                data={analyticsData.viewsByDay}
                type="views"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TimeSeriesCard
                title={t('analytics.downloadsOverTime')}
                data={analyticsData.downloadsByDay}
                type="downloads"
              />
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CommentIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                {t('analytics.recentActivity')}
              </Typography>
            </Box>
            {analyticsData.userActivity.length > 0 ? (
              <List>
                {analyticsData.userActivity.map((activity, index) => (
                  <ActivityItem key={index} activity={activity} />
                ))}
              </List>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 4
              }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  {t('analytics.noData')}
                </Typography>
              </Box>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}

export default Analytics; 