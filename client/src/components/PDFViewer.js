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
  Toolbar,
  Checkbox
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
  FullscreenExit as FullscreenExitIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
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
  const [isRendering, setIsRendering] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Initialize arrays with empty arrays instead of undefined
  const [views, setViews] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [sharedWith, setSharedWith] = useState([]);

  // Add useEffect to initialize arrays when pdf data is loaded
  useEffect(() => {
    if (pdf) {
      setViews(pdf.views || []);
      setDownloads(pdf.downloads || []);
      setSharedWith(pdf.sharedWith || []);
    }
  }, [pdf]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF document. Please try again.');
    setSnackbar({
      open: true,
      message: 'Failed to load PDF document. Please try again.',
      severity: 'error'
    });
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
      
      if (!token) {
        setError('Please log in to access this PDF');
        setSnackbar({
          open: true,
          message: 'Please log in to access this PDF',
          severity: 'error'
        });
        return;
      }

      console.log('Fetching PDF with ID:', id);
      console.log('Using token:', token ? 'Token exists' : 'No token');

      // First fetch PDF metadata
      const response = await fetch(`${API_URL}/pdf/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }

      const pdfData = await response.json();
      setPdf(pdfData);
      setComments(pdfData.comments || []);

      // Then fetch the actual PDF file
      const pdfFileResponse = await fetch(`${API_URL}/pdf/${id}/file`, {
        method: 'GET',
        headers: {
          'x-auth-token': token
        }
      });

      if (!pdfFileResponse.ok) {
        throw new Error(`Failed to fetch PDF file: ${pdfFileResponse.statusText}`);
      }

      // Create a blob URL for the PDF
      const pdfBlob = await pdfFileResponse.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrl);

      // Record view
      try {
        await fetch(`${API_URL}/pdf/${id}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        });
      } catch (viewError) {
        console.error('Error recording view:', viewError);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching PDF:', error);
      setError(error.message);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
      setLoading(false);
    }
  }, [id, API_URL]);

  // Update the fileProps configuration
  const fileProps = useMemo(() => ({
    url: `${API_URL}/pdf/${id}/file`,
    httpHeaders: {
      'Content-Type': 'application/pdf',
      'x-auth-token': localStorage.getItem('token') || '',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    withCredentials: true,
    onLoadSuccess: ({ numPages }) => {
      console.log('PDF loaded successfully:', { numPages });
      setNumPages(numPages);
      setError(null);
      setIsLoadingPage(false);
    },
    onLoadError: (error) => {
      console.error('Error loading PDF:', error);
      setError('Failed to load PDF document. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to load PDF document. Please try again.',
        severity: 'error'
      });
      setIsLoadingPage(false);
    },
    onSourceSuccess: () => {
      console.log('PDF source loaded successfully');
    },
    onSourceError: (error) => {
      console.error('Error loading PDF source:', error);
      setError('Failed to load PDF source. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to load PDF source. Please try again.',
        severity: 'error'
      });
      setIsLoadingPage(false);
    }
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
    maxImageSize: 1024 * 1024 * 10,
    httpHeaders: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'x-auth-token': localStorage.getItem('token') || ''
    }
  }), []);

  // Update the PDF document component
  const PDFDocument = useMemo(() => {
    return (
      <Document
        file={fileProps}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        }
        error={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="error">Failed to load PDF</Typography>
          </Box>
        }
        options={pdfOptions}
      >
        <Page 
          pageNumber={pageNumber} 
          scale={scale}
          rotate={rotation}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          onRenderSuccess={() => {
            console.log('Page rendered successfully:', { pageNumber });
            setIsLoadingPage(false);
            setIsRendering(false);
          }}
          onRenderError={(error) => {
            console.error('Error rendering page:', error);
            setIsLoadingPage(false);
            setIsRendering(false);
          }}
          loading={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          }
        />
      </Document>
    );
  }, [fileProps, pageNumber, scale, rotation, onDocumentLoadSuccess, onDocumentLoadError, pdfOptions]);

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
      
      const response = await fetch(`${config.API_URL}/pdf/shared/${token}`);
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

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Please log in to add comments',
          severity: 'error'
        });
        return;
      }

      console.log('Adding comment:', {
        pdfId: id,
        content: newComment,
        page: pageNumber
      });

      const response = await fetch(`${API_URL}/pdf/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          content: newComment.trim(),
          page: pageNumber,
          position: { x: 0, y: 0 }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add comment');
      }

      const data = await response.json();
      console.log('Comment added successfully:', data);

      // Update the PDF state with the new comment
      setPdf(prevPdf => ({
        ...prevPdf,
        comments: [...(prevPdf.comments || []), data.comment]
      }));

      setNewComment('');
      setSnackbar({
        open: true,
        message: data.message || 'Comment added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error adding comment',
        severity: 'error'
      });
    }
  };

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

      console.log('Adding reply:', {
        pdfId: id,
        commentId: parentCommentId,
        content: newComment
      });

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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add reply');
      }

      const data = await response.json();
      console.log('Reply added successfully:', data);

      // Update the PDF state with the new reply
      setPdf(prevPdf => {
        const updatedComments = prevPdf.comments.map(comment => {
          if (comment._id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), data.reply]
            };
          }
          return comment;
        });
        return {
          ...prevPdf,
          comments: updatedComments
        };
      });

      setNewComment('');
      setReplyingTo(null);
      setSnackbar({
        open: true,
        message: data.message || 'Reply added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error adding reply',
        severity: 'error'
      });
    }
  };

  const handleShareClick = () => {
    setShowEmailDialog(true);
  };

  const handleEmailSubmit = async () => {
    if (!shareEmail.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter an email address',
        severity: 'error'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid email address',
        severity: 'error'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Please log in to share PDFs',
          severity: 'error'
        });
        return;
      }

      // Grant access and generate share link in one request
      const response = await fetch(`${API_URL}/pdf/${id}/grant-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ 
          email: shareEmail,
          permissions: {
            canView: true,
            canComment: true,
            canDownload: true
          },
          shareSettings: {
            shareType: 'public',
            linkExpiry: '7d',
            allowDownload: true,
            allowComments: true,
            notifyOnAccess: true
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to grant access');
      }

      const data = await response.json();
      console.log('Access granted and link generated:', data);

      // Generate the full share URL using frontend URL from config
      const shareUrl = `${config.FRONTEND_URL}/#/shared/${data.token}`;
      setShareLink(shareUrl);

      // Close email dialog and show success message with copy option
      setShowEmailDialog(false);
      
      // Show the share link dialog
      setShowShareDialog(true);

      setSnackbar({
        open: true,
        message: `Access granted to ${shareEmail} and share link generated`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error granting access:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error granting access',
        severity: 'error'
      });
    }
  };

  const handleShare = async () => {
    try {
      if (!isAuthenticated) {
        setError('Please log in to share PDFs');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Please log in to share PDFs',
          severity: 'error'
        });
        return;
      }

      console.log('Generating share link for PDF:', id);
      console.log('Share settings:', shareSettings);

      const response = await fetch(`${API_URL}/pdf/${id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          ...shareSettings,
          recipientEmail: shareEmail,
          permissions: {
            canView: true,
            canComment: shareSettings.allowComments,
            canDownload: shareSettings.allowDownload
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate share link');
      }

      const data = await response.json();
      console.log('Share link generated:', data);

      // Generate the full share URL using frontend URL from config
      const shareUrl = `${config.FRONTEND_URL}/#/shared/${data.token}`;
      setShareLink(shareUrl);
      setShowShareDialog(true);

      setSnackbar({
        open: true,
        message: 'Share link generated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error generating share link',
        severity: 'error'
      });
    }
  };

  const copyShareLink = () => {
    if (!shareLink) return;

    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Share link copied to clipboard',
          severity: 'success'
        });
      })
      .catch((error) => {
        console.error('Error copying to clipboard:', error);
        setSnackbar({
          open: true,
          message: 'Failed to copy share link',
          severity: 'error'
        });
      });
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
    
    const userName = comment.user?.name || 'Anonymous';
    const userInitial = userName.charAt(0).toUpperCase();
    const commentContent = comment.content || '';

    return (
      <Box 
        key={comment._id} 
        sx={{ 
          mb: 1.5,
          '&:last-child': { mb: 0 }
        }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            p: 1.5,
            backgroundColor: 'transparent',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.02)'
            }
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Avatar 
              sx={{ 
                width: 28, 
                height: 28,
                bgcolor: 'primary.main',
                fontSize: '0.875rem'
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
                    color: 'text.primary',
                    fontSize: '0.875rem'
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
                  lineHeight: 1.4,
                  color: 'text.primary',
                  fontSize: '0.875rem'
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
                    fontSize: '0.75rem',
                    minWidth: 'auto',
                    px: 1,
                    py: 0.5
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
                      fontSize: '0.75rem',
                      minWidth: 'auto',
                      px: 1,
                      py: 0.5
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
          <Box sx={{ ml: 3, mt: 1 }}>
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
                      p: 1.5,
                      backgroundColor: 'transparent',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
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
                              fontSize: '0.75rem'
                            }}
                          >
                            {replyUserName}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: '0.7rem'
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
                            lineHeight: 1.4,
                            color: 'text.primary',
                            fontSize: '0.75rem'
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
          <Box sx={{ ml: 3, mt: 1 }}>
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
                sx={{ fontSize: '0.75rem' }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() => handleReply(comment._id)}
                disabled={!newComment.trim()}
                sx={{ fontSize: '0.75rem' }}
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
        downloads: [...(prevPdf.downloads || []), {
          timestamp: new Date().toISOString(),
          user: prevPdf.owner?._id
        }]
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

  // Add useEffect to update view count with debounce
  useEffect(() => {
    let timeoutId;
    let isViewCounted = false;

    const updateViewCount = async () => {
      if (!pdf || !id || isViewCounted) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Clear any existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Set a new timeout
        timeoutId = setTimeout(async () => {
          if (isViewCounted) return; // Double check to prevent multiple calls
          
          const response = await fetch(`${API_URL}/pdf/${id}/view`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            }
          });

          if (response.ok) {
            isViewCounted = true; // Mark as counted
            const updatedPdf = await response.json();
            setPdf(prevPdf => ({
              ...prevPdf,
              views: updatedPdf.views
            }));
          }
        }, 2000); // 2 second debounce
      } catch (error) {
        console.error('Error updating view count:', error);
      }
    };

    updateViewCount();

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [id, pdf]);

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

  // Update the PDF.js worker configuration
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }, []);

  // Update the main render to handle loading state
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
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      bgcolor: 'background.default'
    }}>
      {/* Toolbar */}
      <AppBar position="static" color="default" elevation={1} sx={{ 
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Toolbar sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          px: { xs: 1, sm: 2 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => navigate(-1)} size="small">
            <ArrowBackIcon />
          </IconButton>
            <Typography variant="h6" sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600,
              color: 'text.primary'
            }}>
            {pdf?.name || 'PDF Viewer'}
          </Typography>
          </Box>
          
          {/* Stats */}
          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' }, 
            alignItems: 'center', 
            gap: 2,
            mr: 2
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              color: 'text.secondary'
            }}>
              <VisibilityIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {pdf?.views?.length || 0} views
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              color: 'text.secondary'
            }}>
              <DownloadIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {pdf?.downloads?.length || 0} downloads
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
            <Tooltip title="Fullscreen">
              <IconButton onClick={handleFullscreen} size="small">
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton onClick={handleDownload} size="small">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton onClick={handleShareClick} size="small">
                <ShareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Comments">
              <IconButton onClick={() => setShowComments(true)} size="small">
                <Badge 
                  badgeContent={calculateTotalComments(pdf?.comments || [])} 
                  color="primary"
                  sx={{ 
                    '& .MuiBadge-badge': {
                      fontSize: '0.75rem',
                      height: '20px',
                      minWidth: '20px',
                      borderRadius: '10px'
                    }
                  }}
                >
                  <CommentIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1,
        overflow: 'hidden',
        flexDirection: { xs: 'column', md: 'row' },
        position: 'relative'
      }}>
        {/* PDF viewer */}
        <Box sx={{ 
          flexGrow: 1,
          overflow: 'auto',
          p: { xs: 1, sm: 2 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          bgcolor: 'background.paper',
          width: { xs: '100%', md: 'auto' },
          position: 'relative'
        }}>
          {/* PDF Controls */}
          <Box sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            gap: 1,
            bgcolor: 'background.paper',
            borderRadius: 1,
            p: 0.5,
            boxShadow: 1,
            zIndex: 1
          }}>
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
          </Box>

          {isLoadingPage ? (
      <Box sx={{ 
        display: 'flex',
              justifyContent: 'center', 
        alignItems: 'center',
              height: '100%',
              width: '100%'
            }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ 
              display: 'flex', 
        justifyContent: 'center',
              alignItems: 'center', 
              height: '100%',
        width: '100%'
      }}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : !pdf ? (
        <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              width: '100%'
            }}>
              <Typography>PDF not found</Typography>
            </Box>
          ) : (
            <Box sx={{ 
          width: '100%',
              maxWidth: { xs: '100%', sm: '500px', md: '600px', lg: '800px' },
              minHeight: '100%',
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
              gap: 2,
              p: { xs: 1, sm: 2 }
        }}>
              <Box sx={{
            width: '100%', 
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
                overflow: 'hidden'
              }}>
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                      <CircularProgress />
                    </Box>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    onRenderSuccess={() => setIsLoadingPage(false)}
                    onRenderError={(error) => {
                      console.error('Error rendering page:', error);
                      setError('Error rendering PDF page');
                    }}
                  />
                </Document>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                gap: 2,
                width: '100%',
                bgcolor: 'background.paper',
                borderRadius: 1,
                p: 1,
                boxShadow: 1
              }}>
                <IconButton 
                onClick={() => changePage(-1)}
                disabled={pageNumber <= 1}
                size="small"
              >
                  <ChevronLeftIcon />
                </IconButton>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Page {pageNumber} of {numPages}
              </Typography>
                <IconButton 
                onClick={() => changePage(1)}
                disabled={pageNumber >= numPages}
                size="small"
              >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>

        {/* Comments panel */}
          <Box sx={{ 
          width: { xs: '100%', md: '500px', lg: '600px' },
          borderLeft: { xs: 0, md: '1px solid' },
          borderTop: { xs: '1px solid', md: 0 },
          borderColor: 'divider',
          overflow: 'hidden',
            bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
          height: { xs: '50vh', md: 'auto' }
        }}>
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600
            }}>
              Comments ({calculateTotalComments(pdf?.comments || [])})
          </Typography>
            <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
                placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              sx={{ 
                mb: 1,
                '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleCommentSubmit}
              disabled={!newComment.trim()}
              fullWidth
              sx={{ 
                  borderRadius: 1,
                textTransform: 'none',
                  fontWeight: 500
              }}
            >
                Add Comment
            </Button>
          </Box>
          </Box>
          <Box sx={{ 
            flex: 1,
            overflow: 'auto', 
            p: 2,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'rgba(0,0,0,0.2)',
            }
          }}>
            {pdf?.comments?.map((comment) => renderComment(comment))}
          </Box>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 1,
            boxShadow: 2
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Email Dialog */}
      <Dialog 
        open={showEmailDialog} 
        onClose={() => setShowEmailDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            Grant Access
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Enter the email address to grant access to this PDF. A share link will be generated automatically.
            </Typography>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="Enter email address"
              sx={{ mt: 2 }}
              autoFocus
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Access Permissions:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={<Checkbox checked={true} disabled />}
                  label="View PDF"
                />
                <FormControlLabel
                  control={<Checkbox checked={true} disabled />}
                  label="Add Comments"
                />
                <FormControlLabel
                  control={<Checkbox checked={true} disabled />}
                  label="Download PDF"
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEmailDialog(false)}>Cancel</Button>
          <Button
            onClick={handleEmailSubmit}
            variant="contained"
            disabled={!shareEmail.trim()}
            startIcon={<ShareIcon />}
          >
            Grant Access & Generate Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Link Dialog */}
      <Dialog 
        open={showShareDialog} 
        onClose={() => setShowShareDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShareIcon />
            Share Link Generated
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Access has been granted to {shareEmail}. Share this link to provide access:
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              bgcolor: 'background.paper',
              p: 1,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              mt: 2
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
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Access Details:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  icon={<PersonIcon />}
                  label={`Recipient: ${shareEmail}`}
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  icon={<AccessTimeIcon />}
                  label="Expires in 7 days"
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  icon={<DownloadIcon />}
                  label="Download Allowed"
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  icon={<CommentIcon />}
                  label="Comments Allowed"
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowShareDialog(false)}>Close</Button>
          <Button
            onClick={copyShareLink}
            variant="contained"
            startIcon={<CopyIcon />}
          >
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>

      {renderPasswordDialog()}

      {/* Comments Section */}
      <Dialog
        open={showComments}
        onClose={() => setShowComments(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            height: { xs: '100%', sm: '80vh' },
            maxHeight: { xs: '100%', sm: '80vh' },
            width: { xs: '100%', sm: '400px' },
            maxWidth: { xs: '100%', sm: '400px' },
            position: { xs: 'fixed', sm: 'relative' },
            top: { xs: 0, sm: 'auto' },
            right: { xs: 0, sm: 'auto' },
            bottom: { xs: 0, sm: 'auto' },
            left: { xs: 0, sm: 'auto' },
            margin: { xs: 0, sm: 'auto' },
            borderRadius: { xs: 0, sm: 1 }
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Comments ({calculateTotalComments(pdf?.comments || [])})
          </Typography>
          <IconButton onClick={() => setShowComments(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ 
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          <Box sx={{ 
            flex: 1,
            overflow: 'auto',
            p: 2
          }}>
            {pdf?.comments?.map(renderComment)}
          </Box>
          <Box sx={{ 
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleCommentSubmit}
                disabled={!newComment.trim()}
                size="small"
              >
                Comment
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

// Add display name for better debugging
PDFViewer.displayName = 'PDFViewer';

// Export as default
export default PDFViewer; 

