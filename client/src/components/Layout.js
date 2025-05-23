import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSettings } from '../contexts/SettingsContext';

const drawerWidth = 240;

function Layout() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useSettings();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const isPDFViewer = location.pathname.startsWith('/pdf/');

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
          SpotDraft
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem button selected={location.pathname === '/dashboard'} onClick={() => navigate('/')}>
          <ListItemIcon>
            <DashboardIcon color={location.pathname === '/dashboard' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary={t('dashboard')} />
        </ListItem>
        <ListItem button selected={location.pathname === '/my-pdfs'} onClick={() => navigate('/my-pdfs')}>
          <ListItemIcon>
            <DescriptionIcon color={location.pathname === '/my-pdfs' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary={t('myPdfs')} />
        </ListItem>
        <ListItem button selected={location.pathname === '/shared'} onClick={() => navigate('/shared')}>
          <ListItemIcon>
            <FolderIcon color={location.pathname === '/shared' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary={t('sharedWithMe')} />
        </ListItem>
        <ListItem button selected={location.pathname === '/analytics'} onClick={() => navigate('/analytics')}>
          <ListItemIcon>
            <BarChartIcon color={location.pathname === '/analytics' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary={t('analytics')} />
        </ListItem>
        <ListItem button selected={location.pathname === '/settings'} onClick={() => navigate('/settings')}>
          <ListItemIcon>
            <SettingsIcon color={location.pathname === '/settings' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary={t('settings')} />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* App Bar */}
        <AppBar position="static" color="default" elevation={0} sx={{ mb: 3 }}>
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            {isPDFViewer && (
              <IconButton 
                edge="start" 
                color="inherit" 
                onClick={() => navigate(-1)}
                sx={{ mr: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {isPDFViewer ? 'PDF Viewer' : t('dashboard')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Refresh">
                <IconButton onClick={() => window.location.reload()}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Account">
                <IconButton onClick={handleMenuOpen}>
                  <AccountIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flex: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>

      {/* Account Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <AccountIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default Layout; 