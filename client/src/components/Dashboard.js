import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Button,
  IconButton,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  Badge,
  TextField,
  InputBase,
  alpha,
  Drawer,
  ListItemIcon,
  LinearProgress,
  Tabs,
  Tab,
  Fab,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  Link
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Comment as CommentIcon,
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Star as StarIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { debounce } from 'lodash';
import { format } from 'date-fns';

// Add API URL constant
const API_URL = 'http://localhost:5000';

// Styled components
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.black, 0.05),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.black, 0.08),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
    minWidth: '350px',
  },
  [theme.breakpoints.up('md')]: {
    width: '500px',
  },
  [theme.breakpoints.up('lg')]: {
    width: '600px',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.5, 1, 1.5, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    fontSize: '1.1rem',
    [theme.breakpoints.up('md')]: {
      width: '100%',
    },
  },
}));

// Add new styled components for search results
const SearchResultsContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 1000,
  marginTop: theme.spacing(1),
  maxHeight: '500px',
  overflowY: 'auto',
  boxShadow: theme.shadows[4],
  borderRadius: theme.shape.borderRadius,
}));

const SearchResultItem = styled(ListItem)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  cursor: 'pointer',
  padding: theme.spacing(2),
}));

const drawerWidth = 240;

// Add a helper function for date formatting
const formatDate = (date) => {
  try {
    if (!date) return 'Invalid date';
    const parsedDate = new Date(date);
    // Check if date is valid and not in the future
    if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
      return 'Invalid date';
    }
    return format(parsedDate, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const formatDateTime = (date) => {
  try {
    if (!date) return 'Invalid date';
    const parsedDate = new Date(date);
    // Check if date is valid and not in the future
    if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
      return 'Invalid date';
    }
    return format(parsedDate, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const Dashboard = memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPdfs: 0,
    totalComments: 0,
    totalViews: 0,
    totalDownloads: 0
  });
  const [recentPdfs, setRecentPdfs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    console.log('Initializing user from localStorage:', storedUser);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [selectedTab, setSelectedTab] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [pdfDescription, setPdfDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPdfForComment, setSelectedPdfForComment] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [commentSectionOpen, setCommentSectionOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState(null);

  // Enhanced search function
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/pdf/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'x-auth-token': token
        }
      });

      const data = await response.json();
      if (response.ok) {
        // Ensure all dates are properly formatted
        const formattedResults = data.map(pdf => ({
          ...pdf,
          createdAt: pdf.createdAt ? new Date(pdf.createdAt).toISOString() : null,
          updatedAt: pdf.updatedAt ? new Date(pdf.updatedAt).toISOString() : null,
          views: Array.isArray(pdf.views) ? pdf.views.length : 0,
          downloads: Array.isArray(pdf.downloads) ? pdf.downloads.length : 0
        }));

        // Sort results by relevance (if available) or by date
        const sortedResults = formattedResults.sort((a, b) => {
          if (a.relevance && b.relevance) {
            return b.relevance - a.relevance;
          }
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        setSearchResults(sortedResults);
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Error searching PDFs',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      setSnackbar({
        open: true,
        message: 'Error searching PDFs',
        severity: 'error'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query) => {
      handleSearch(query);
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Add new function to handle search result click
  const handleSearchResultClick = (pdf) => {
    handlePdfClick(pdf._id);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCommentClick = (pdf, e) => {
    e.stopPropagation();
    // Fetch the PDF with comments before opening the dialog
    const fetchPdfWithComments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/pdf/${pdf._id}`, {
          headers: {
            'x-auth-token': token
          }
        });
        const data = await response.json();
        if (response.ok) {
          setSelectedPdfForComment(data);
          setCommentDialogOpen(true);
        } else {
          setSnackbar({
            open: true,
            message: data.message || 'Error fetching PDF comments',
            severity: 'error'
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Error fetching PDF comments',
          severity: 'error'
        });
      }
    };
    fetchPdfWithComments();
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) {
      setSnackbar({
        open: true,
        message: 'Comment cannot be empty',
        severity: 'error'
      });
      return;
    }

    try {
      setCommenting(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to add comments');
      }

      const response = await fetch(`${API_URL}/pdf/${selectedPdfForComment._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          content: commentText.trim(),
          formattedContent: commentText.trim(),
          page: 1,
          position: { x: 0, y: 0 }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error adding comment');
      }

      // Update the comments in the selected PDF with the new comment
      setSelectedPdfForComment(prev => ({
        ...prev,
        comments: [...(prev.comments || []), {
          ...data.comments[data.comments.length - 1],
          user: {
            _id: user._id,
            name: user.name,
            email: user.email
          }
        }]
      }));

      // Update the comment count in the PDF list
      setRecentPdfs(prev => prev.map(pdf => 
        pdf._id === selectedPdfForComment._id
          ? { 
              ...pdf, 
              comments: [...(pdf.comments || []), {
                ...data.comments[data.comments.length - 1],
                user: {
                  _id: user._id,
                  name: user.name,
                  email: user.email
                }
              }]
            }
          : pdf
      ));
      
      setSnackbar({
        open: true,
        message: 'Comment added successfully',
        severity: 'success'
      });
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error adding comment',
        severity: 'error'
      });
    } finally {
      setCommenting(false);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyText.trim()) {
      setSnackbar({
        open: true,
        message: 'Reply cannot be empty',
        severity: 'error'
      });
      return;
    }

    try {
      setCommenting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/pdf/${selectedPdfForComment._id}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          content: replyText.trim(),
          formattedContent: replyText.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update the comments in the selected PDF with the new reply
        setSelectedPdfForComment(prev => ({
          ...prev,
          comments: prev.comments.map(comment => 
            comment._id === commentId 
              ? { 
                  ...comment, 
                  replies: [...(comment.replies || []), {
                    ...data.comments.find(c => c._id === commentId).replies.slice(-1)[0],
                    user: {
                      _id: user._id,
                      name: user.name,
                      email: user.email
                    }
                  }]
                }
              : comment
          )
        }));

        // Update the comment count in the PDF list
        setRecentPdfs(prev => prev.map(pdf => 
          pdf._id === selectedPdfForComment._id
            ? {
                ...pdf,
                comments: pdf.comments.map(comment =>
                  comment._id === commentId
                    ? { 
                        ...comment, 
                        replies: [...(comment.replies || []), {
                          ...data.comments.find(c => c._id === commentId).replies.slice(-1)[0],
                          user: {
                            _id: user._id,
                            name: user.name,
                            email: user.email
                          }
                        }]
                      }
                    : comment
                )
              }
            : pdf
        ));

        setSnackbar({
          open: true,
          message: 'Reply added successfully',
          severity: 'success'
        });
        setReplyText('');
        setReplyTo(null);
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Error adding reply',
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error adding reply',
        severity: 'error'
      });
    } finally {
      setCommenting(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    console.log('Dashboard mount - Token:', token);
    console.log('Dashboard mount - Stored user:', storedUser);

    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }

    // Validate token by fetching user profile
    const validateToken = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        });

        if (!response.ok) {
          throw new Error('Token validation failed');
        }

        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        await fetchDashboardData();
      } catch (error) {
        console.error('Token validation error:', error);
        handleLogout();
      }
    };

    validateToken();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        handleLogout();
        return;
      }

      console.log('Fetching user profile with token:', token);
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      const data = await response.json();
      console.log('Profile response:', data);

      if (response.ok) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        await fetchDashboardData();
      } else {
        console.error('Failed to fetch user profile:', data.message);
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found for dashboard data');
        handleLogout();
        return;
      }

      console.log('Fetching dashboard data');
      const response = await fetch('http://localhost:5000/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      const data = await response.json();
      console.log('Dashboard data response:', data);
      
      if (response.ok) {
        // Format the data before setting state
        setStats({
          totalPdfs: data.stats?.totalPdfs || 0,
          totalComments: data.stats?.totalComments || 0,
          totalViews: data.stats?.totalViews || 0,
          totalDownloads: data.stats?.totalDownloads || 0
        });

        // Format recent PDFs to ensure views and downloads are numbers
        setRecentPdfs(data.recentPdfs.map(pdf => ({
          ...pdf,
          views: Array.isArray(pdf.views) ? pdf.views.length : 0,
          downloads: Array.isArray(pdf.downloads) ? pdf.downloads.length : 0
        })));

        // Update recent activity
        setRecentActivity(data.recentActivity || []);
      } else {
        console.error('Failed to fetch dashboard data:', data.message);
        setSnackbar({
          open: true,
          message: data.message || 'Failed to fetch dashboard data',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      setSnackbar({
        open: true,
        message: 'Error fetching dashboard data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPdfName(file.name.replace('.pdf', ''));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('name', pdfName);
      formData.append('description', pdfDescription);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/pdf/upload', {
        method: 'POST',
        headers: {
          'x-auth-token': token
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        // Reset form and close dialog
        setSelectedFile(null);
        setPdfName('');
        setPdfDescription('');
        setUploadDialogOpen(false);
        
        // Refresh dashboard data
        fetchDashboardData();
      } else {
        console.error('Upload failed:', data.message);
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleShare = async (pdfId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/pdf/share/${pdfId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          email: shareEmail,
          isPublic: isPublic
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to share PDF');
      }

      if (isPublic) {
        // Use the shareLink from the server response if available
        const shareLink = data.shareLink || `${window.location.origin}/shared/${data.shareToken}`;
        setShareLink(shareLink);
        setSnackbar({
          open: true,
          message: 'Share link generated successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'PDF shared successfully with ' + shareEmail,
          severity: 'success'
        });
      }
      setOpenShareDialog(false);
      setShareEmail('');
      setIsPublic(false);
    } catch (error) {
      console.error('Error sharing PDF:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error sharing PDF',
        severity: 'error'
      });
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setSnackbar({
      open: true,
      message: 'Share link copied to clipboard',
      severity: 'success'
    });
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({ open: true, message: 'Please login to delete PDFs', severity: 'error' });
        return;
      }

      console.log('Attempting to delete PDF:', id);
      const response = await fetch(`${API_URL}/pdf/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      const data = await response.json();
      console.log('Delete response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete PDF');
      }

      // Remove the deleted PDF from both recentPdfs and searchResults
      setRecentPdfs(prevPdfs => prevPdfs.filter(pdf => pdf._id !== id));
      setSearchResults(prevResults => prevResults.filter(pdf => pdf._id !== id));
      
      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        totalPdfs: prevStats.totalPdfs - 1
      }));

      setSnackbar({ open: true, message: 'PDF deleted successfully', severity: 'success' });
    } catch (error) {
      console.error('Error deleting PDF:', error);
      setSnackbar({ 
        open: true, 
        message: error.message || 'Error deleting PDF', 
        severity: 'error' 
      });
    }
  };

  const handleDeleteClick = async (e, pdfId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this PDF?')) {
      try {
        await handleDelete(pdfId);
      } catch (error) {
        console.error('Error in handleDeleteClick:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete PDF. Please try again.',
          severity: 'error'
        });
      }
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleUploadClick = () => {
    navigate('/upload');
  };

  const handleSearchClick = () => {
    navigate('/search');
  };

  const handlePdfClick = (pdfId) => {
    navigate(`/pdf/${pdfId}`);
  };

  const handleShareClick = (e, pdfId) => {
    e.stopPropagation();
    navigate(`/share/${pdfId}`);
  };

  // Add click outside handler to close search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchResults.length > 0 && !event.target.closest('.MuiPaper-root')) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchResults]);

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PdfIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
          SpotDraft
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem button selected={selectedTab === 0} onClick={() => setSelectedTab(0)}>
          <ListItemIcon>
            <DashboardIcon color={selectedTab === 0 ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button selected={selectedTab === 1} onClick={() => setSelectedTab(1)}>
          <ListItemIcon>
            <DescriptionIcon color={selectedTab === 1 ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="My PDFs" />
        </ListItem>
        <ListItem button selected={selectedTab === 2} onClick={() => setSelectedTab(2)}>
          <ListItemIcon>
            <FolderIcon color={selectedTab === 2 ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Shared with me" />
        </ListItem>
        <ListItem button selected={selectedTab === 3} onClick={() => setSelectedTab(3)}>
          <ListItemIcon>
            <BarChartIcon color={selectedTab === 3 ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Analytics" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem button>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>
          Error: {error}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={fetchDashboardData}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Loading user profile...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f5f5f5', minHeight: '100vh' }}>
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
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {/* Top App Bar */}
        <AppBar 
          position="fixed" 
          color="default" 
          elevation={1} 
          sx={{ 
            bgcolor: 'white',
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexGrow: 1,
              maxWidth: '100%',
              mx: 2
            }}>
              <Search>
                <SearchIconWrapper>
                  <SearchIcon sx={{ fontSize: '1.75rem' }} />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder="Search PDFs by name, description, or content..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  endAdornment={
                    searchLoading ? (
                      <CircularProgress
                        size={24}
                        sx={{ mr: 2 }}
                      />
                    ) : searchQuery ? (
                      <IconButton
                        size="medium"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        sx={{ mr: 1 }}
                      >
                        <CloseIcon sx={{ fontSize: '1.25rem' }} />
                      </IconButton>
                    ) : null
                  }
                />
                {searchResults.length > 0 && (
                  <SearchResultsContainer>
                    <List>
                      {searchResults.map((pdf) => (
                        <SearchResultItem
                          key={pdf._id}
                          onClick={() => handleSearchResultClick(pdf)}
                        >
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                bgcolor: 'primary.main',
                                width: 48,
                                height: 48
                              }}
                            >
                              <PdfIcon sx={{ fontSize: '1.5rem' }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography component="div" variant="h6" sx={{ mb: 0.5 }}>
                                {pdf.name}
                              </Typography>
                            }
                            secondary={
                              <Box component="div">
                                <Typography 
                                  component="div" 
                                  variant="body1" 
                                  color="text.primary"
                                  sx={{ display: 'block', mb: 1 }}
                                >
                                  {pdf.description}
                                </Typography>
                                <Stack 
                                  direction="row" 
                                  spacing={2} 
                                  alignItems="center"
                                  component="div"
                                >
                                  <Typography 
                                    component="span" 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                  >
                                    <CalendarIcon sx={{ fontSize: '1.25rem' }} />
                                    {pdf.createdAt ? formatDate(new Date(pdf.createdAt)) : 'Unknown date'}
                                  </Typography>
                                  <Typography 
                                    component="span" 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                  >
                                    <ViewIcon sx={{ fontSize: '1.25rem' }} />
                                    {pdf.views} views
                                  </Typography>
                                  <Typography 
                                    component="span" 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                  >
                                    <DownloadIcon sx={{ fontSize: '1.25rem' }} />
                                    {pdf.downloads} downloads
                                  </Typography>
                                </Stack>
                              </Box>
                            }
                          />
                        </SearchResultItem>
                      ))}
                    </List>
                  </SearchResultsContainer>
                )}
              </Search>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <IconButton color="inherit" sx={{ mr: 2 }}>
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <Box 
              onClick={handleProfileMenuOpen}
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                bgcolor: 'primary.main',
                borderRadius: 2,
                px: 2,
                py: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'translateY(-1px)',
                  boxShadow: 2
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  mr: 1,
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontWeight: 600,
                  border: '2px solid white'
                }}
              >
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Typography variant="body1" sx={{ color: 'white', mr: 1, fontWeight: 500 }}>
                {user.name || 'User'}
              </Typography>
              <AccountIcon sx={{ color: 'white' }} />
            </Box>

            {/* Profile Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }
              }}
            >
              <MenuItem onClick={() => {
                setOpenProfileDialog(true);
                handleProfileMenuClose();
              }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => {
                setOpenLogoutDialog(true);
                handleProfileMenuClose();
              }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText sx={{ color: 'error.main' }}>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Main Content Area */}
        <Box sx={{ mt: 8, mb: 4 }}>
          {/* Welcome Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              Welcome back, {user?.name || 'User'}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's an overview of your PDFs and activity.
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
              <Tab label="Overview" />
              <Tab label="My PDFs" />
              <Tab label="Shared with me" />
              <Tab label="Analytics" />
            </Tabs>
          </Box>

          {/* Content based on selected tab */}
          {selectedTab === 0 && (
            <>
              {/* Stats Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    height: '100%', 
                    position: 'relative', 
                    overflow: 'visible',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)'
                    }
                  }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'primary.main',
                            width: 48,
                            height: 48
                          }}
                        >
                          <PdfIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 600 }}>
                            {stats.totalPdfs || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total PDFs
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    height: '100%', 
                    position: 'relative', 
                    overflow: 'visible',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)'
                    }
                  }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'success.main',
                            width: 48,
                            height: 48
                          }}
                        >
                          <CommentIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 600 }}>
                            {stats.totalComments || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Comments
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    height: '100%', 
                    position: 'relative', 
                    overflow: 'visible',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)'
                    }
                  }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'info.main',
                            width: 48,
                            height: 48
                          }}
                        >
                          <ViewIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 600 }}>
                            {stats.totalViews || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Views
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    height: '100%', 
                    position: 'relative', 
                    overflow: 'visible',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)'
                    }
                  }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'warning.main',
                            width: 48,
                            height: 48
                          }}
                        >
                          <DownloadIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 600 }}>
                            {stats.totalDownloads || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Downloads
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Recent Activity and PDFs */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Recent PDFs
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Sort">
                          <IconButton>
                            <SortIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Filter">
                          <IconButton>
                            <FilterIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                    <List>
                      {recentPdfs.length > 0 ? (
                        recentPdfs.map((pdf) => (
                          <React.Fragment key={pdf._id}>
                            <ListItem
                              sx={{
                                py: 2,
                                borderRadius: 1,
                                '&:hover': {
                                  bgcolor: 'action.hover'
                                },
                                cursor: 'pointer'
                              }}
                              onClick={() => handlePdfClick(pdf._id)}
                            >
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  <PdfIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography component="div" variant="body2" color="text.secondary">
                                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }} component="div">
                                      <Typography component="span" variant="caption" color="text.secondary">
                                        {formatDate(pdf.updatedAt)}
                                      </Typography>
                                      <Typography component="span" variant="caption" color="text.secondary">
                                        {pdf.views} views
                                      </Typography>
                                      <Typography component="span" variant="caption" color="text.secondary">
                                        {pdf.downloads} downloads
                                      </Typography>
                                    </Stack>
                                  </Typography>
                                }
                              />
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="Comments">
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => handleCommentClick(pdf, e)}
                                  >
                                    <Badge 
                                      badgeContent={pdf.comments?.length || 0} 
                                      color="primary"
                                      max={99}
                                    >
                                      <CommentIcon />
                                    </Badge>
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Share">
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => handleShareClick(e, pdf._id)}
                                  >
                                    <ShareIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={(e) => handleDeleteClick(e, pdf._id)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText 
                            primary="No PDFs found" 
                            secondary="Upload your first PDF to get started"
                          />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Recent Activity
                    </Typography>
                    <List>
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                          <React.Fragment key={activity._id || index}>
                            <ListItem sx={{ py: 1.5 }}>
                              <ListItemAvatar>
                                <Avatar sx={{ 
                                  bgcolor: activity.type === 'comment' ? 'success.main' : 
                                          activity.type === 'view' ? 'info.main' : 
                                          'warning.main'
                                }}>
                                  {activity.type === 'comment' ? <CommentIcon /> :
                                   activity.type === 'view' ? <ViewIcon /> :
                                   <DownloadIcon />}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography component="div" variant="body1">
                                    {String(activity.user?.name || 'Unknown user')} {activity.type === 'comment' ? 'commented on' : activity.type === 'view' ? 'viewed' : 'downloaded'} {String(activity.pdfName || '')}
                                  </Typography>
                                }
                                secondary={
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    {activity.timestamp ? formatDate(new Date(activity.timestamp)) : 'Unknown date'}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            {index < recentActivity.length - 1 && <Divider />}
                          </React.Fragment>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText 
                            primary="No recent activity" 
                            secondary="Your activity will appear here"
                          />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}

          {selectedTab === 1 && (
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  My PDFs
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Sort">
                    <IconButton>
                      <SortIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Filter">
                    <IconButton>
                      <FilterIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              <List>
                {recentPdfs.length > 0 ? (
                  recentPdfs.map((pdf) => (
                    <React.Fragment key={pdf._id}>
                      <ListItem
                        sx={{
                          py: 2,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'action.hover'
                          },
                          cursor: 'pointer'
                        }}
                        onClick={() => handlePdfClick(pdf._id)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PdfIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography component="div" variant="body2" color="text.secondary">
                              <Stack direction="row" spacing={2} sx={{ mt: 0.5 }} component="div">
                                <Typography component="span" variant="caption" color="text.secondary">
                                  {formatDate(pdf.updatedAt)}
                                </Typography>
                                <Typography component="span" variant="caption" color="text.secondary">
                                  {pdf.views} views
                                </Typography>
                                <Typography component="span" variant="caption" color="text.secondary">
                                  {pdf.downloads} downloads
                                </Typography>
                              </Stack>
                            </Typography>
                          }
                        />
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Comments">
                            <IconButton 
                              size="small"
                              onClick={(e) => handleCommentClick(pdf, e)}
                            >
                              <Badge 
                                badgeContent={pdf.comments?.length || 0} 
                                color="primary"
                                max={99}
                              >
                                <CommentIcon />
                              </Badge>
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Share">
                            <IconButton 
                              size="small"
                              onClick={(e) => handleShareClick(e, pdf._id)}
                            >
                              <ShareIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={(e) => handleDeleteClick(e, pdf._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    py: 4,
                    color: 'text.secondary'
                  }}>
                    <PdfIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" gutterBottom>
                      No PDFs Found
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Upload your first PDF to get started
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => setUploadDialogOpen(true)}
                    >
                      Upload PDF
                    </Button>
                  </Box>
                )}
              </List>
            </Paper>
          )}

          {selectedTab === 2 && (
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Shared with me</Typography>
              {/* Shared PDFs content */}
            </Paper>
          )}

          {selectedTab === 3 && (
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Analytics</Typography>
              {/* Analytics content */}
            </Paper>
          )}
        </Box>

        {/* Upload FAB */}
        <Fab
          color="primary"
          aria-label="upload"
          onClick={() => setUploadDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <UploadIcon />
        </Fab>

        {/* Upload Dialog */}
        <Dialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Upload PDF</DialogTitle>
          <DialogContent>
            <Box sx={{ p: 2 }}>
              <input
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                id="pdf-upload"
                onChange={handleFileSelect}
              />
              <label htmlFor="pdf-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {selectedFile ? selectedFile.name : 'Choose PDF'}
                </Button>
              </label>
              <TextField
                fullWidth
                label="PDF Name"
                variant="outlined"
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                variant="outlined"
                multiline
                rows={3}
                value={pdfDescription}
                onChange={(e) => setPdfDescription(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Profile Dialog */}
        <Dialog 
          open={openProfileDialog} 
          onClose={() => setOpenProfileDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar 
                sx={{ 
                  width: 56, 
                  height: 56,
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem'
                }}
              >
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h6">{user.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PersonIcon color="action" />
                      <Typography>{user.name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <EmailIcon color="action" />
                      <Typography>{user.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CalendarIcon color="action" />
                      <Typography>
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account Statistics
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total PDFs
                      </Typography>
                      <Typography variant="h6">
                        {stats.totalPdfs}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Comments
                      </Typography>
                      <Typography variant="h6">
                        {stats.totalComments}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setOpenProfileDialog(false)}
              variant="outlined"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Logout Confirmation Dialog */}
        <Dialog
          open={openLogoutDialog}
          onClose={() => setOpenLogoutDialog(false)}
          PaperProps={{
            sx: {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: 'error.light',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <LogoutIcon />
            Confirm Logout
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography>
              Are you sure you want to logout?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setOpenLogoutDialog(false)}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLogout} 
              color="error"
              variant="contained"
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </DialogActions>
        </Dialog>

        {/* Share Dialog */}
        <Dialog
          open={openShareDialog}
          onClose={() => setOpenShareDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Share PDF</DialogTitle>
          <DialogContent>
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
              }
              label="Make public"
              sx={{ mb: 2 }}
            />
            {!isPublic && (
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}
            {shareLink && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Share Link:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Link href={shareLink} target="_blank" rel="noopener">
                    {shareLink}
                  </Link>
                  <IconButton onClick={copyShareLink} size="small">
                    <CopyIcon />
                  </IconButton>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenShareDialog(false)}>Cancel</Button>
            <Button
              onClick={() => handleShare(selectedPdf._id)}
              variant="contained"
              disabled={!isPublic && !shareEmail}
            >
              Share
            </Button>
          </DialogActions>
        </Dialog>

        {/* Comment Dialog */}
        <Dialog
          open={commentDialogOpen}
          onClose={() => {
            setCommentDialogOpen(false);
            setReplyTo(null);
            setReplyText('');
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Comments
              </Typography>
              {selectedPdfForComment && (
                <Typography variant="subtitle1" color="text.secondary">
                  {selectedPdfForComment.name}
                </Typography>
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            {/* Comment Input */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Add a comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleCommentSubmit}
                disabled={commenting || !commentText.trim()}
                sx={{ float: 'right' }}
              >
                {commenting ? 'Adding Comment...' : 'Add Comment'}
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Comments List */}
            <List>
              {selectedPdfForComment?.comments?.map((comment) => (
                <React.Fragment key={comment._id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {comment.user?.name?.[0]?.toUpperCase() || 'A'}
                      </Avatar>
                    </ListItemAvatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography component="span" variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {comment.user?.name || 'Anonymous'}
                        </Typography>
                        <Typography component="span" variant="caption" color="text.secondary">
                          {formatDateTime(comment.createdAt)}
                        </Typography>
                      </Box>
                      <Typography component="div" variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                        {comment.content}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => setReplyTo(comment._id)}
                      >
                        Reply
                      </Button>
                    </Box>
                  </ListItem>

                  {/* Replies */}
                  {comment.replies?.map((reply) => (
                    <ListItem key={reply._id} sx={{ pl: 9 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
                          {reply.user?.name?.[0]?.toUpperCase() || 'A'}
                        </Avatar>
                      </ListItemAvatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography component="span" variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {reply.user?.name || 'Anonymous'}
                          </Typography>
                          <Typography component="span" variant="caption" color="text.secondary">
                            {formatDateTime(reply.createdAt)}
                          </Typography>
                        </Box>
                        <Typography component="div" variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
                          {reply.content}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}

                  {/* Reply Input */}
                  {replyTo === comment._id && (
                    <Box sx={{ pl: 9, pr: 2, py: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        sx={{ mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          onClick={() => {
                            setReplyTo(null);
                            setReplyText('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleReply(comment._id)}
                          disabled={commenting || !replyText.trim()}
                        >
                          {commenting ? 'Adding Reply...' : 'Reply'}
                        </Button>
                      </Box>
                    </Box>
                  )}
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setCommentDialogOpen(false);
              setReplyTo(null);
              setReplyText('');
            }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
});

// Add HMR handling
if (module.hot) {
  module.hot.accept();
}

export default Dashboard; 