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
  useMediaQuery
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
  Comment as CommentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

function Analytics() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalPdfs: 0,
      totalViews: 0,
      totalDownloads: 0,
      totalComments: 0
    },
    recentPdfs: []
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URL}/api/dashboard`, {
        headers: {
          'x-auth-token': token
        }
      });
      setDashboardData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: { xs: '300px', md: '400px' } 
      }}>
        <CircularProgress size={isMobile ? 30 : 40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            '& .MuiAlert-icon': {
              fontSize: { xs: 20, md: 24 }
            }
          }}
        >
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={fetchDashboardData}
          startIcon={<RefreshIcon />}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (dashboardData.stats.totalPdfs === 0) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 3, md: 4 }, 
          textAlign: 'center',
          borderRadius: 2,
          bgcolor: 'background.default',
          mx: { xs: 2, md: 0 }
        }}
      >
        <Typography 
          variant="h6" 
          color="text.secondary" 
          gutterBottom
          sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
        >
          No analytics data available yet
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
        >
          Upload and share PDFs to start seeing analytics
        </Typography>
      </Paper>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color }) => (
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
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 1, 
            fontWeight: 'bold',
            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
          }}
        >
          Analytics Dashboard
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
        >
          Overview of your PDF documents and their performance
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Overview Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Views"
            value={dashboardData.stats.totalViews}
            icon={VisibilityIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Downloads"
            value={dashboardData.stats.totalDownloads}
            icon={DownloadIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total PDFs"
            value={dashboardData.stats.totalPdfs}
            icon={DescriptionIcon}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Comments"
            value={dashboardData.stats.totalComments}
            icon={CommentIcon}
            color="warning"
          />
        </Grid>

        {/* Recent PDFs */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: { xs: 2, md: 3 }, 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}
              >
                Recent PDFs
              </Typography>
              <Grid container spacing={{ xs: 1.5, md: 2 }}>
                {dashboardData.recentPdfs?.map((pdf) => (
                  <Grid item xs={12} sm={6} md={4} key={pdf._id}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: { xs: 1.5, md: 2 },
                        height: '100%',
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <DescriptionIcon sx={{ 
                          mr: 1, 
                          color: 'primary.main',
                          fontSize: { xs: 18, md: 20 }
                        }} />
                        <Typography 
                          variant="subtitle1" 
                          noWrap 
                          sx={{ 
                            fontWeight: 'medium',
                            fontSize: { xs: '0.9rem', md: '1rem' }
                          }}
                        >
                          {pdf.name}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        mt: 1,
                        fontSize: { xs: '0.75rem', md: '0.875rem' }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <VisibilityIcon sx={{ 
                            fontSize: { xs: 14, md: 16 }, 
                            mr: 0.5, 
                            color: 'text.secondary' 
                          }} />
                          <Typography variant="body2" color="text.secondary">
                            {pdf.views?.length || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DownloadIcon sx={{ 
                            fontSize: { xs: 14, md: 16 }, 
                            mr: 0.5, 
                            color: 'text.secondary' 
                          }} />
                          <Typography variant="body2" color="text.secondary">
                            {pdf.downloads?.length || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Analytics; 