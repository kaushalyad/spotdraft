import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  Divider,
  FormControlLabel,
  Switch,
  Link,
  CircularProgress,
  Avatar,
  Chip,
  Badge,
  Card,
  CardContent,
  Stack,
  Tooltip,
  MenuItem,
  AppBar,
  Toolbar
} from '@mui/material';
import { 
  Share as ShareIcon, 
  ContentCopy as CopyIcon, 
  ThumbUp as ThumbUpIcon, 
  ThumbUpOutlined as ThumbUpOutlinedIcon, 
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon, 
  Upload as UploadIcon,
  PictureAsPdf as PictureAsPdfIcon,
  CheckCircle as CheckCircleIcon,
  Comment as CommentIcon,
  AccessTime as AccessTimeIcon,
  Download as DownloadIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Public as PublicIcon,
  Login as LoginIcon,
  ArrowBack as ArrowBackIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateRightIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import axios from 'axios';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import config from '../config';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const API_URL = config.API_URL;

export function PDFViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pdf, setPdf] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isPublic, setIsPublic] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [shareSettings, setShareSettings] = useState({
    shareType: 'public',
    password: '',
    linkExpiry: '7d',
    allowDownload: true,
    allowComments: true,
    notifyOnAccess: false,
    maxAccesses: 1
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: ''
  });
  const [comments, setComments] = useState([]);
  const [isSharedAccess, setIsSharedAccess] = useState(false);
  const [shareToken, setShareToken] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [pageScale, setPageScale] = useState(1.0);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    setError('Failed to load PDF document');
    console.error('Error loading PDF:', error);
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        return false;
      }

      const response = await axios.get(`${API_URL}/auth/verify`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.status === 200) {
        setIsAuthenticated(true);
        return true;
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      return false;
    }
  };

  const fetchPdfAndComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // Check if this is a shared PDF access
      const isSharedAccess = window.location.pathname.includes('/shared/');
      
      if (!isSharedAccess && !token) {
        setError('Please log in to access this PDF');
        setSnackbar({
          open: true,
          message: 'Please log in to access this PDF',
          severity: 'error'
        });
        return;
      }

      // First get the current user info
      let currentUser = null;
      if (token) {
        const userResponse = await fetch(`${API_URL}/auth/verify`, {
          headers: {
            'x-auth-token': token
          }
        });
        if (userResponse.ok) {
          currentUser = await userResponse.json();
        }
      }

      // Then fetch the PDF metadata with populated user information
      const metadataResponse = await fetch(`${API_URL}/pdf/${id}?populate=user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        }
      });
      
      let metadata;
      try {
        metadata = await metadataResponse.json();
      } catch (error) {
        console.error('Error parsing PDF metadata response:', error);
        throw new Error('Invalid response from server');
      }

      if (metadataResponse.ok) {
        // Ensure comments have user information
        if (metadata.comments) {
          metadata.comments = metadata.comments.map(comment => {
            // If user is just an ID, use the current user info if it matches
            if (typeof comment.user === 'string' && currentUser && comment.user === currentUser.id) {
              comment.user = {
                id: currentUser.id,
                name: currentUser.name
              };
            } else if (typeof comment.user === 'string') {
              // If it's a different user ID, we need to fetch their info
              comment.user = { name: 'Anonymous' };
            }

            // Handle replies similarly
            if (comment.replies) {
              comment.replies = comment.replies.map(reply => {
                if (typeof reply.user === 'string' && currentUser && reply.user === currentUser.id) {
                  reply.user = {
                    id: currentUser.id,
                    name: currentUser.name
                  };
                } else if (typeof reply.user === 'string') {
                  reply.user = { name: 'Anonymous' };
                }
                return reply;
              });
            }

            return comment;
          });
        }
        setPdf(metadata);
      } else {
        console.error('Error fetching PDF metadata:', {
          status: metadataResponse.status,
          statusText: metadataResponse.statusText,
          data: metadata
        });

        if (metadataResponse.status === 401) {
          setError('Please log in to access this PDF');
          setSnackbar({
            open: true,
            message: 'Please log in to access this PDF',
            severity: 'error'
          });
        } else if (metadataResponse.status === 404) {
          setError('PDF not found');
          setSnackbar({
            open: true,
            message: 'PDF not found',
            severity: 'error'
          });
        } else {
          setError(metadata.message || 'Error fetching PDF');
          setSnackbar({
            open: true,
            message: metadata.message || 'Error fetching PDF',
            severity: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching PDF:', error);
      setError('Failed to load PDF');
      setSnackbar({
        open: true,
        message: 'Error fetching PDF',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Update the fileProps configuration
  const fileProps = useMemo(() => ({
    url: `${API_URL}/pdf/${id}/file`,
    httpHeaders: {
      'Content-Type': 'application/pdf',
      'x-auth-token': localStorage.getItem('token'),
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    withCredentials: true
  }), [id]);

  // Update the PDF options
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/standard_fonts/',
    disableStream: false,
    disableAutoFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    maxCanvasPixels: 16777216,
    disableFontFace: true,
    verbosity: 0,
    workerSrc: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
    rangeChunkSize: 65536,
    maxImageSize: 1024 * 1024 * 10
  }), []);

  // Update the Document component
  const PDFDocument = useMemo(() => (
    <Document
      file={fileProps}
      onLoadSuccess={onDocumentLoadSuccess}
      onLoadError={(error) => {
        console.error('Error loading PDF:', error);
        onDocumentLoadError(error);
      }}
      loading={
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '200px'
        }}>
          <CircularProgress />
        </Box>
      }
      error={
        <Box sx={{ 
          p: 3, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          <Typography color="error">Failed to load PDF</Typography>
          <Button 
            variant="contained" 
            onClick={fetchPdfAndComments}
            size="small"
          >
            Retry
          </Button>
        </Box>
      }
      options={pdfOptions}
    >
      <Page 
        pageNumber={pageNumber} 
        scale={scale}
        renderTextLayer={true}
        renderAnnotationLayer={true}
        width={Math.min(window.innerWidth * 0.9, 800)}
        loading={
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        }
        error={
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="error">Failed to load page</Typography>
          </Box>
        }
        onLoadError={(error) => {
          console.error('Error loading page:', error);
        }}
      />
    </Document>
  ), [fileProps, pageNumber, scale, pdfOptions, fetchPdfAndComments]);

  useEffect(() => {
    // Check if this is a shared PDF access
    const path = window.location.pathname;
    if (path.includes('/shared/')) {
      const token = path.split('/shared/')[1].split('/')[0];
      setShareToken(token);
      setIsSharedAccess(true);
      fetchSharedPdf(token);
    } else if (id) {
      checkAuth();
      fetchPdfAndComments();
    }
  }, [id]);

  const fetchSharedPdf = async (token) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/pdf/shared/${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setPdf(data);
        if (data.shareSettings?.hasPassword) {
          setShowPasswordDialog(true);
        }
      } else {
        setError(data.message || 'Error fetching shared PDF');
        setSnackbar({
          open: true,
          message: data.message || 'Error fetching shared PDF',
          severity: 'error'
        });
      }
    } catch (error) {
      setError('Failed to load shared PDF');
      setSnackbar({
        open: true,
        message: 'Error fetching shared PDF',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    // Check if user is authenticated
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      // Store the current comment and URL before redirecting
      localStorage.setItem('pendingComment', newComment);
      localStorage.setItem('returnUrl', window.location.pathname);
      
      // Redirect to login page
      navigate('/login', { 
        state: { 
          from: window.location.pathname,
          message: 'Please sign in to add comments'
        }
      });
      return;
    }

    try {
      // First get the current user info
      const userResponse = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'x-auth-token': authToken
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to verify user');
      }

      const user = await userResponse.json();

      // Then add the comment
      const response = await fetch(`${API_URL}/pdf/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({
          content: newComment.trim(),
          formattedContent: newComment.trim(),
          page: pageNumber,
          position: { x: 0, y: 0 }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const updatedPdf = await response.json();

      // Ensure the new comment has user information
      if (updatedPdf.comments) {
        const lastComment = updatedPdf.comments[updatedPdf.comments.length - 1];
        if (lastComment) {
          lastComment.user = {
            id: user.id,
            name: user.name
          };
        }
      }

      // Update the PDF state with the new comment
      setPdf(prevPdf => ({
        ...prevPdf,
        comments: updatedPdf.comments.map(comment => {
          // If this is the new comment, ensure it has user info
          if (comment._id === updatedPdf.comments[updatedPdf.comments.length - 1]._id) {
            return {
              ...comment,
              user: {
                id: user.id,
                name: user.name
              }
            };
          }
          // For existing comments, preserve their user info
          return {
            ...comment,
            user: comment.user || { name: 'Anonymous' },
            replies: comment.replies?.map(reply => ({
              ...reply,
              user: reply.user || { name: 'Anonymous' }
            })) || []
          };
        })
      }));

      setNewComment('');
      setSnackbar({
        open: true,
        message: 'Comment added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.message === 'Failed to verify user') {
        // Clear invalid token
        localStorage.removeItem('token');
        // Store the current comment and URL before redirecting
        localStorage.setItem('pendingComment', newComment);
        localStorage.setItem('returnUrl', window.location.pathname);
        
        // Redirect to login page
        navigate('/login', { 
          state: { 
            from: window.location.pathname,
            message: 'Your session has expired. Please sign in again.'
          }
        });
      } else {
        setSnackbar({
          open: true,
          message: error.message || 'Error adding comment',
          severity: 'error'
        });
      }
    }
  };

  // Add useEffect to handle pending comments after login
  useEffect(() => {
    const pendingComment = localStorage.getItem('pendingComment');
    const returnUrl = localStorage.getItem('returnUrl');
    
    if (pendingComment && localStorage.getItem('token')) {
      setNewComment(pendingComment);
      localStorage.removeItem('pendingComment');
      localStorage.removeItem('returnUrl');
      
      // If we're not on the return URL, navigate to it
      if (returnUrl && window.location.pathname !== returnUrl) {
        navigate(returnUrl);
      } else {
        // Automatically trigger comment submission
        handleCommentSubmit();
      }
    }
  }, [localStorage.getItem('token')]);

  const handleReply = async (parentCommentId) => {
    if (!newComment.trim()) {
      setSnackbar({
        open: true,
        message: 'Reply cannot be empty',
        severity: 'error'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Please log in to reply',
          severity: 'error'
        });
        return;
      }

      // First get the current user info
      const userResponse = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to verify user');
      }

      const user = await userResponse.json();

      // Then add the reply
      const response = await fetch(`${API_URL}/pdf/${id}/comments/${parentCommentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          content: newComment.trim(),
          formattedContent: newComment.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add reply');
      }

      const updatedPdf = await response.json();

      // Ensure the new reply has user information
      if (updatedPdf.comments) {
        const parentComment = updatedPdf.comments.find(c => c._id === parentCommentId);
        if (parentComment && parentComment.replies) {
          const lastReply = parentComment.replies[parentComment.replies.length - 1];
          if (lastReply && !lastReply.user) {
            lastReply.user = {
              id: user.id,
              name: user.name
            };
          }
        }
      }

      setPdf(updatedPdf);
      setNewComment('');
      setReplyingTo(null);
      setSnackbar({
        open: true,
        message: 'Reply added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error in handleReply:', error);
      if (error.message === 'Failed to verify user') {
        // Clear invalid token
        localStorage.removeItem('token');
        // Store the current comment and URL before redirecting
        localStorage.setItem('pendingComment', newComment);
        localStorage.setItem('returnUrl', window.location.pathname);
        
        // Redirect to login page
        navigate('/login', { 
          state: { 
            from: window.location.pathname,
            message: 'Your session has expired. Please sign in again.'
          }
        });
      } else {
        setSnackbar({
          open: true,
          message: error.message || 'Error adding reply',
          severity: 'error'
        });
      }
    }
  };

  const handleShare = async () => {
    try {
      if (!isAuthenticated) {
        setError('Please log in to share PDFs');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/pdf/share/${pdf._id}`, 
        shareSettings,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      setShareLink(response.data.shareLink);
      setShowShareDialog(true);
    } catch (error) {
      console.error('Error sharing PDF:', error);
      setError('Error sharing PDF');
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error sharing PDF',
        severity: 'error'
      });
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      const response = await axios.post(`${API_URL}/pdf/shared/${shareToken}/verify`, {
        password,
        ...guestInfo
      });

      if (response.data.accessGranted) {
        setShowPasswordDialog(false);
        fetchSharedPdf(shareToken);
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setError('Invalid password');
      setSnackbar({
        open: true,
        message: 'Invalid password',
        severity: 'error'
      });
    }
  };

  const handleComment = async (comment) => {
    try {
      const endpoint = isSharedAccess 
        ? `${API_URL}/pdf/shared/${shareToken}/comments`
        : `${API_URL}/pdf/${id}/comments`;

      const response = await axios.post(endpoint, {
        ...comment,
        ...(isSharedAccess ? guestInfo : {})
      });

      setComments(response.data.comments);
      setSnackbar({
        open: true,
        message: 'Comment added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      setSnackbar({
        open: true,
        message: 'Error adding comment',
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

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return Math.floor(seconds) + ' seconds ago';
  };

  const renderBadge = (user) => {
    // This would come from your user data
    const badges = ['365 Days Badge', '100 Days Badge 2025'];
    return badges.map((badge, index) => (
      <Chip
        key={index}
        label={badge}
        size="small"
        sx={{
          mr: 1,
          backgroundColor: 'rgba(25, 118, 210, 0.08)',
          color: 'primary.main',
          fontSize: '0.75rem',
          height: '20px'
        }}
      />
    ));
  };

  const renderComment = (comment) => {
    if (!comment || typeof comment !== 'object') {
      console.error('Invalid comment object:', comment);
      return null;
    }

    const hasReplies = Array.isArray(comment.replies) && comment.replies.length > 0;
    const isExpanded = expandedReplies[comment._id];
    
    // Get user information with proper fallback
    const userName = comment.user?.name || 'Anonymous';
    const userInitial = userName.charAt(0).toUpperCase();
    const commentContent = comment.content || '';

    return (
      <Box 
        key={comment._id} 
        sx={{ 
          mb: 2,
          '&:last-child': { mb: 0 }
        }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2,
            backgroundColor: 'transparent',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.02)'
            }
          }}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: 'primary.main',
                fontSize: '0.875rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {userInitial}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  {userName}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    fontSize: '0.75rem'
                  }}
                >
                  {comment.createdAt ? getTimeAgo(comment.createdAt) : 'Unknown time'}
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 1,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                  color: 'text.primary'
                }}
              >
                {commentContent}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  onClick={() => setReplyingTo(comment._id)}
                  sx={{ 
                    textTransform: 'none',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  Reply
                </Button>
                {hasReplies && (
                  <Button
                    size="small"
                    onClick={() => toggleReplies(comment._id)}
                    sx={{ 
                      textTransform: 'none',
                      color: 'text.secondary',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    {isExpanded ? 'Hide Replies' : `Show Replies (${comment.replies.length})`}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Replies */}
        {hasReplies && isExpanded && (
          <Box sx={{ ml: 4, mt: 1 }}>
            {comment.replies.map((reply) => {
              const replyUserName = reply.user?.name || 'Anonymous';
              const replyUserInitial = replyUserName.charAt(0).toUpperCase();
              
              return (
                <Box 
                  key={reply._id}
                  sx={{ 
                    mb: 1,
                    '&:last-child': { mb: 0 }
                  }}
                >
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2,
                      backgroundColor: 'transparent',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Avatar 
                        sx={{ 
                          width: 24, 
                          height: 24,
                          bgcolor: 'secondary.main',
                          fontSize: '0.75rem'
                        }}
                      >
                        {replyUserInitial}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 600,
                              color: 'text.primary',
                              fontSize: '0.875rem'
                            }}
                          >
                            {replyUserName}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: '0.75rem'
                            }}
                          >
                            {reply.createdAt ? getTimeAgo(reply.createdAt) : 'Unknown time'}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            lineHeight: 1.5,
                            color: 'text.primary',
                            fontSize: '0.875rem'
                          }}
                        >
                          {reply.content}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Reply Input */}
        {replyingTo === comment._id && (
          <Box sx={{ ml: 4, mt: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a reply..."
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                onClick={() => {
                  setReplyingTo(null);
                  setNewComment('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() => handleReply(comment._id)}
                disabled={!newComment.trim()}
              >
                Reply
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  // Calculate total comments including replies
  const calculateTotalComments = (comments) => {
    if (!comments || !Array.isArray(comments)) return 0;
    return comments.reduce((total, comment) => {
      const replyCount = comment.replies ? comment.replies.length : 0;
      return total + 1 + replyCount;
    }, 0);
  };

  // Add login prompt component
  const LoginPrompt = () => (
    <Box sx={{ 
      p: 3, 
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2
    }}>
      <Typography variant="h6" color="error">
        Authentication Required
      </Typography>
      <Typography color="text.secondary">
        Please log in to access this PDF
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/login')}
        startIcon={<LoginIcon />}
      >
        Log In
      </Button>
    </Box>
  );

  // Add password dialog component
  const renderPasswordDialog = () => (
    <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)}>
      <DialogTitle>Enter Password</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Your Name"
          value={guestInfo.name}
          onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Your Email"
          type="email"
          value={guestInfo.email}
          onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
        <Button 
          onClick={handlePasswordSubmit}
          variant="contained"
          disabled={!password || !guestInfo.name || !guestInfo.email}
        >
          Access PDF
        </Button>
      </DialogActions>
    </Dialog>
  );

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.min(Math.max(1, newPageNumber), numPages);
    });
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 2.0));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoom = (direction) => {
    setPageScale((prev) => {
      const newScale = direction === 'in' ? prev + 0.1 : prev - 0.1;
      return Math.min(Math.max(0.5, newScale), 2.0);
    });
  };

  const handleSearch = async (text) => {
    if (!text.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/pdf/${id}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setCurrentSearchIndex(0);
        if (results.length > 0) {
          setPageNumber(results[0].page);
        }
      }
    } catch (error) {
      console.error('Error searching PDF:', error);
      setSnackbar({
        open: true,
        message: 'Error searching PDF',
        severity: 'error'
      });
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Please log in to download PDFs',
          severity: 'error'
        });
        return;
      }

      console.log('Initiating download for PDF:', id);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = `${API_URL}/pdf/${id}/download`;
      link.setAttribute('download', pdf.name || 'document.pdf');
      
      // Add auth token to headers
      const response = await fetch(link.href, {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to download PDF');
      }

      // Get the blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      link.href = url;

      // Trigger the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Update the PDF state to reflect new download count
      setPdf(prevPdf => ({
        ...prevPdf,
        downloads: (prevPdf.downloads || 0) + 1
      }));

      setSnackbar({
        open: true,
        message: 'PDF downloaded successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error downloading PDF',
        severity: 'error'
      });
    }
  };

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup function
      setPdf(null);
      setComments([]);
      setNewComment('');
      setShareLink('');
      setReplyingTo(null);
      setExpandedReplies({});
      setError(null);
      setLoading(true);
    };
  }, []);

  // Update the PDF document cleanup
  const cleanupPDFDocument = useCallback(() => {
    if (pdf) {
      setPdf(null);
      setNumPages(null);
      setPageNumber(1);
      setScale(1.0);
      setRotation(0);
    }
  }, [pdf]);

  // Update the main render to handle authentication
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error === 'Please log in to access this PDF') {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}>
        <Typography variant="h6" color="error">
          Authentication Required
        </Typography>
        <Typography color="text.secondary">
          Please log in to access this PDF
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/login')}
          startIcon={<LoginIcon />}
        >
          Log In
        </Button>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}>
        <Typography variant="h6" color="error">{error}</Typography>
        <Button 
          variant="contained" 
          onClick={fetchPdfAndComments}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!pdf) {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}>
        <Typography variant="h6">PDF not found</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar sx={{ 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          py: { xs: 1, sm: 0 },
          justifyContent: 'center'
        }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: { xs: 0, sm: 2 } }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1,
              textAlign: 'center',
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            {pdf?.name || 'PDF Viewer'}
          </Typography>
          <Stack 
            direction="row" 
            spacing={1}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              justifyContent: 'center'
            }}
          >
            <Tooltip title="Zoom In">
              <IconButton onClick={() => handleZoom('in')} size="small">
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton onClick={() => handleZoom('out')} size="small">
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rotate">
              <IconButton onClick={handleRotate} size="small">
                <RotateRightIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              <IconButton onClick={handleFullscreen} size="small">
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              size="small"
            >
              Download
            </Button>
            <Button
              startIcon={<ShareIcon />}
              onClick={() => setOpenShareDialog(true)}
              size="small"
            >
              Share
            </Button>
            <Button
              startIcon={<CommentIcon />}
              onClick={() => setShowShareDialog(true)}
              size="small"
            >
              Comments ({pdf?.totalComments || 0})
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        mt: { xs: 7, sm: 8 }, 
        p: { xs: 1, sm: 2, md: 3 }, 
        flexGrow: 1, 
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        width: '100%'
      }}>
        {/* PDF Viewer Section */}
        <Box sx={{ 
          flex: { lg: '1 1 60%' },
          width: '100%',
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Paper sx={{ 
            p: { xs: 1, sm: 2 }, 
            mb: 2, 
            width: '100%', 
            maxWidth: { xs: '100%', sm: 600, md: 800 }
          }}>
            <Stack 
              direction="row" 
              spacing={2} 
              justifyContent="center" 
              alignItems="center"
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              <Button
                onClick={() => changePage(-1)}
                disabled={pageNumber <= 1}
                size="small"
              >
                Previous
              </Button>
              <Typography variant="body2" sx={{ minWidth: '100px', textAlign: 'center' }}>
                Page {pageNumber} of {numPages || '--'}
              </Typography>
              <Button
                onClick={() => changePage(1)}
                disabled={pageNumber >= numPages}
                size="small"
              >
                Next
              </Button>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button onClick={zoomOut} size="small">-</Button>
                <Typography variant="body2">{Math.round(scale * 100)}%</Typography>
                <Button onClick={zoomIn} size="small">+</Button>
              </Stack>
            </Stack>
          </Paper>

          <Box sx={{ 
            width: '100%', 
            maxWidth: { xs: '100%', sm: 600, md: 800 },
            overflow: 'auto',
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 1,
            display: 'flex',
            justifyContent: 'center',
            '& .react-pdf__Document': {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            },
            '& .react-pdf__Page': {
              maxWidth: '100%',
              height: 'auto !important',
              '& canvas': {
                maxWidth: '100%',
                height: 'auto !important'
              }
            }
          }}>
            {PDFDocument}
          </Box>
        </Box>

        {/* Comments Section */}
        <Paper sx={{ 
          flex: { lg: '1 1 40%' },
          width: '100%',
          maxWidth: { xs: '100%', sm: 600, md: 800, lg: '100%' },
          height: { lg: 'calc(100vh - 120px)' },
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 2, sm: 3 }
        }}>
          <Typography variant="h6" gutterBottom>
            Comments ({calculateTotalComments(pdf?.comments)})
          </Typography>
          
          {/* Add Comment Form */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              variant="outlined"
              size="small"
              sx={{ 
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    '& > fieldset': { borderColor: 'primary.main' }
                  }
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleCommentSubmit}
              disabled={!newComment.trim()}
              fullWidth
              sx={{ 
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }
              }}
            >
              Post Comment
            </Button>
          </Box>

          {/* Comments List */}
          <Box sx={{ 
            flex: 1,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0, 0, 0, 0.05)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.3)',
              },
            },
          }}>
            {pdf?.comments?.length > 0 ? (
              pdf.comments.map((comment) => renderComment(comment))
            ) : (
              <Typography 
                color="text.secondary" 
                align="center"
                sx={{ py: 4 }}
              >
                No comments yet
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>

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

      <Dialog open={openShareDialog} onClose={() => setOpenShareDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShareIcon />
            Share PDF
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Choose Sharing Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant={shareSettings.shareType === 'public' ? 'contained' : 'outlined'}
                onClick={() => {
                  setShareSettings(prev => ({ ...prev, shareType: 'public', password: '' }));
                  setShareLink(''); // Clear existing link when changing type
                }}
                startIcon={<PublicIcon />}
                sx={{ flex: 1 }}
              >
                Public Link
              </Button>
              <Button
                variant={shareSettings.shareType === 'password' ? 'contained' : 'outlined'}
                onClick={() => {
                  setShareSettings(prev => ({ ...prev, shareType: 'password' }));
                  setShareLink(''); // Clear existing link when changing type
                }}
                startIcon={<LockIcon />}
                sx={{ flex: 1 }}
              >
                Password Protected
              </Button>
            </Box>

            {shareSettings.shareType === 'public' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Anyone with the link can access this PDF
              </Alert>
            )}

            {shareSettings.shareType === 'password' && (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This link will require a password to access
                </Alert>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={shareSettings.password}
                  onChange={(e) => {
                    setShareSettings(prev => ({ ...prev, password: e.target.value }));
                    setShareLink(''); // Clear existing link when changing password
                  }}
                  sx={{ mb: 2 }}
                  helperText="Set a password to protect the PDF"
                  required
                  error={!shareSettings.password}
                />
              </>
            )}

            <TextField
              select
              fullWidth
              label="Link Expiry"
              value={shareSettings.linkExpiry}
              onChange={(e) => setShareSettings(prev => ({ ...prev, linkExpiry: e.target.value }))}
              sx={{ mb: 2 }}
              helperText="Choose how long the share link should be valid"
            >
              <MenuItem value="1d">1 Day</MenuItem>
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="30d">30 Days</MenuItem>
              <MenuItem value="never">Never</MenuItem>
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={shareSettings.allowDownload}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, allowDownload: e.target.checked }))}
                />
              }
              label="Allow Download"
              sx={{ mb: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={shareSettings.allowComments}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, allowComments: e.target.checked }))}
                />
              }
              label="Allow Comments"
              sx={{ mb: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={shareSettings.notifyOnAccess}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, notifyOnAccess: e.target.checked }))}
                />
              }
              label="Notify me when someone accesses the PDF"
              sx={{ mb: 1 }}
            />
          </Box>

          {shareLink && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                {shareSettings.shareType === 'password' ? 'Password Protected Share Link' : 'Public Share Link'}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                bgcolor: 'background.paper',
                p: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography
                  sx={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.875rem'
                  }}
                >
                  {shareLink}
                </Typography>
                <IconButton 
                  onClick={copyShareLink} 
                  size="small"
                  sx={{ 
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText'
                    }
                  }}
                >
                  <CopyIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 1 }}>
                {shareSettings.shareType === 'password' && (
                  <Chip
                    icon={<LockIcon />}
                    label="Password Protected"
                    size="small"
                    color="warning"
                    sx={{ mr: 1, mb: 1 }}
                  />
                )}
                {shareSettings.shareType === 'public' && (
                  <Chip
                    icon={<PublicIcon />}
                    label="Public Access"
                    size="small"
                    color="success"
                    sx={{ mr: 1, mb: 1 }}
                  />
                )}
                {shareSettings.linkExpiry !== 'never' && (
                  <Chip
                    icon={<AccessTimeIcon />}
                    label={`Expires in ${shareSettings.linkExpiry}`}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                )}
                {shareSettings.allowDownload && (
                  <Chip
                    icon={<DownloadIcon />}
                    label="Download Allowed"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                )}
                {shareSettings.allowComments && (
                  <Chip
                    icon={<CommentIcon />}
                    label="Comments Allowed"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShareDialog(false)}>Cancel</Button>
          <Button
            onClick={handleShare}
            variant="contained"
            disabled={shareSettings.shareType === 'password' && !shareSettings.password}
            startIcon={<ShareIcon />}
          >
            Generate {shareSettings.shareType === 'password' ? 'Protected' : 'Public'} Link
          </Button>
        </DialogActions>
      </Dialog>

      {renderPasswordDialog()}

      <Dialog open={showShareDialog} onClose={() => setShowShareDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShareIcon />
            Share PDF
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Choose Sharing Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant={shareSettings.shareType === 'public' ? 'contained' : 'outlined'}
                onClick={() => {
                  setShareSettings(prev => ({ ...prev, shareType: 'public', password: '' }));
                  setShareLink(''); // Clear existing link when changing type
                }}
                startIcon={<PublicIcon />}
                sx={{ flex: 1 }}
              >
                Public Link
              </Button>
              <Button
                variant={shareSettings.shareType === 'password' ? 'contained' : 'outlined'}
                onClick={() => {
                  setShareSettings(prev => ({ ...prev, shareType: 'password' }));
                  setShareLink(''); // Clear existing link when changing type
                }}
                startIcon={<LockIcon />}
                sx={{ flex: 1 }}
              >
                Password Protected
              </Button>
            </Box>

            {shareSettings.shareType === 'public' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Anyone with the link can access this PDF
              </Alert>
            )}

            {shareSettings.shareType === 'password' && (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This link will require a password to access
                </Alert>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={shareSettings.password}
                  onChange={(e) => {
                    setShareSettings(prev => ({ ...prev, password: e.target.value }));
                    setShareLink(''); // Clear existing link when changing password
                  }}
                  sx={{ mb: 2 }}
                  helperText="Set a password to protect the PDF"
                  required
                  error={!shareSettings.password}
                />
              </>
            )}

            <TextField
              select
              fullWidth
              label="Link Expiry"
              value={shareSettings.linkExpiry}
              onChange={(e) => setShareSettings(prev => ({ ...prev, linkExpiry: e.target.value }))}
              sx={{ mb: 2 }}
              helperText="Choose how long the share link should be valid"
            >
              <MenuItem value="1d">1 Day</MenuItem>
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="30d">30 Days</MenuItem>
              <MenuItem value="never">Never</MenuItem>
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={shareSettings.allowDownload}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, allowDownload: e.target.checked }))}
                />
              }
              label="Allow Download"
              sx={{ mb: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={shareSettings.allowComments}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, allowComments: e.target.checked }))}
                />
              }
              label="Allow Comments"
              sx={{ mb: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={shareSettings.notifyOnAccess}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, notifyOnAccess: e.target.checked }))}
                />
              }
              label="Notify me when someone accesses the PDF"
              sx={{ mb: 1 }}
            />
          </Box>

          {shareLink && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                {shareSettings.shareType === 'password' ? 'Password Protected Share Link' : 'Public Share Link'}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                bgcolor: 'background.paper',
                p: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography
                  sx={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.875rem'
                  }}
                >
                  {shareLink}
                </Typography>
                <IconButton 
                  onClick={copyShareLink} 
                  size="small"
                  sx={{ 
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText'
                    }
                  }}
                >
                  <CopyIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 1 }}>
                {shareSettings.shareType === 'password' && (
                  <Chip
                    icon={<LockIcon />}
                    label="Password Protected"
                    size="small"
                    color="warning"
                    sx={{ mr: 1, mb: 1 }}
                  />
                )}
                {shareSettings.shareType === 'public' && (
                  <Chip
                    icon={<PublicIcon />}
                    label="Public Access"
                    size="small"
                    color="success"
                    sx={{ mr: 1, mb: 1 }}
                  />
                )}
                {shareSettings.linkExpiry !== 'never' && (
                  <Chip
                    icon={<AccessTimeIcon />}
                    label={`Expires in ${shareSettings.linkExpiry}`}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                )}
                {shareSettings.allowDownload && (
                  <Chip
                    icon={<DownloadIcon />}
                    label="Download Allowed"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                )}
                {shareSettings.allowComments && (
                  <Chip
                    icon={<CommentIcon />}
                    label="Comments Allowed"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowShareDialog(false)}>Cancel</Button>
          <Button
            onClick={handleShare}
            variant="contained"
            disabled={shareSettings.shareType === 'password' && !shareSettings.password}
            startIcon={<ShareIcon />}
          >
            Generate {shareSettings.shareType === 'password' ? 'Protected' : 'Public'} Link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Add display name for better debugging
PDFViewer.displayName = 'PDFViewer';

// Export as default
export default PDFViewer; 

