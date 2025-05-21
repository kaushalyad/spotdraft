import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Download as DownloadIcon,
  Comment as CommentIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import axios from 'axios';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// API base URL
const API_BASE_URL = 'http://localhost:5000';

const SharedPDFViewer = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [pdfData, setPdfData] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoadError, setPdfLoadError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: ''
  });
  const [authError, setAuthError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchPublicPdf = async () => {
      try {
        console.log('Fetching shared PDF with token:', token);
        const response = await axios.get(`${API_BASE_URL}/api/pdf/shared/${token}`);
        console.log('PDF data received:', response.data);
        setPdfData(response.data);
        
        // Show password dialog if PDF is password protected
        if (response.data.shareSettings?.hasPassword) {
          setShowPasswordDialog(true);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching shared PDF:', error);
        setError(error.response?.data?.message || 'Error loading PDF');
        setLoading(false);
      }
    };

    fetchPublicPdf();
  }, [token]);

  const handleAuthSubmit = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, authForm);
      localStorage.setItem('token', response.data.token);
      setShowAuthDialog(false);
      setSnackbar({
        open: true,
        message: 'Successfully authenticated',
        severity: 'success'
      });
      // Retry the comment submission after successful authentication
      if (newComment.trim()) {
        handleAddComment();
      }
    } catch (error) {
      setAuthError(error.response?.data?.message || 'Authentication failed');
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/pdf/shared/${token}/verify`, {
        password
      });
      
      if (response.data.message === 'Password verified successfully') {
        setIsPasswordVerified(true);
        setShowPasswordDialog(false);
        setPasswordError('');
      }
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Invalid password');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('PDF loaded successfully, pages:', numPages);
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF document:', error);
    setPdfLoadError(error.message || 'Error loading PDF document');
  };

  const handleAddComment = async () => {
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
      const response = await axios.post(
        `${API_BASE_URL}/api/pdf/shared/${token}/comments`,
        {
          content: newComment.trim(),
          formattedContent: newComment.trim(),
          page: pageNumber,
          position: { x: 0, y: 0 }
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      setPdfData(response.data);
      setNewComment('');
      setSnackbar({
        open: true,
        message: 'Comment added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.response?.status === 401) {
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
          message: error.response?.data?.message || 'Error adding comment',
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
        handleAddComment();
      }
    }
  }, [localStorage.getItem('token')]);

  const handleAddReply = async (commentId) => {
    if (!replyText.trim()) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/pdf/shared/${token}/comments/${commentId}/replies`, {
        content: replyText.trim(),
        name: 'Anonymous', // You can add a form field for name if needed
        email: '' // You can add a form field for email if needed
      });

      setPdfData(response.data);
      setReplyText('');
      setReplyTo(null);
      setSnackbar({
        open: true,
        message: 'Reply added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to add reply. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/pdf/${pdfData._id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', pdfData.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!pdfData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">PDF not found</Alert>
      </Box>
    );
  }

  // Password protection dialog
  if (showPasswordDialog && !isPasswordVerified) {
    return (
      <Dialog open={showPasswordDialog} onClose={() => {}}>
        <DialogTitle>Password Protected PDF</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This PDF is password protected. Please enter the password to view it.
          </Typography>
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!passwordError}
            helperText={passwordError}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordSubmit} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const pdfUrl = `${API_BASE_URL}/api/pdf/${pdfData._id}/file?shareId=${token}`;
  console.log('Loading PDF from URL:', pdfUrl);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">{pdfData.name}</Typography>
          <Stack direction="row" spacing={1}>
            {pdfData.shareSettings?.allowDownload && (
              <Tooltip title="Download">
                <IconButton onClick={handleDownload}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={`Views: ${pdfData.totalViews}`}>
              <IconButton>
                <VisibilityIcon />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {pdfData.totalViews}
                </Typography>
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            }
            error={
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Alert severity="error">{pdfLoadError || 'Error loading PDF'}</Alert>
              </Box>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
          {numPages && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setPageNumber(page => Math.max(1, page - 1))}
                disabled={pageNumber <= 1}
              >
                Previous
              </Button>
              <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                Page {pageNumber} of {numPages}
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setPageNumber(page => Math.min(numPages, page + 1))}
                disabled={pageNumber >= numPages}
              >
                Next
              </Button>
            </Box>
          )}
        </Box>

        {pdfData.shareSettings?.allowComments && (
          <Box sx={{ width: { xs: '100%', md: 300 } }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Comments ({pdfData.totalComments})
              </Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder={localStorage.getItem('token') ? "Add a comment..." : "Sign in to add a comment"}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  {localStorage.getItem('token') ? "Add Comment" : "Sign in to Comment"}
                </Button>
              </Box>
              {pdfData.comments?.map((comment) => (
                <Box key={comment._id} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    {comment.guestInfo?.name || comment.user?.name || 'Anonymous'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {comment.content}
                  </Typography>
                  {comment.replies?.map((reply) => (
                    <Box key={reply._id} sx={{ ml: 2, mb: 1 }}>
                      <Typography variant="subtitle2">
                        {reply.guestInfo?.name || reply.user?.name || 'Anonymous'}
                      </Typography>
                      <Typography variant="body2">
                        {reply.content}
                      </Typography>
                    </Box>
                  ))}
                  {replyTo === comment._id ? (
                    <Box sx={{ ml: 2, mt: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        sx={{ mb: 1 }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleAddReply(comment._id)}
                        disabled={!replyText.trim()}
                      >
                        Reply
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setReplyTo(comment._id)}
                    >
                      Reply
                    </Button>
                  )}
                </Box>
              ))}
            </Paper>
          </Box>
        )}
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

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onClose={() => setShowAuthDialog(false)}>
        <DialogTitle>Authentication Required</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please sign in to add comments
          </Typography>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={authForm.email}
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            error={!!authError}
            helperText={authError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAuthDialog(false)}>Cancel</Button>
          <Button onClick={() => navigate('/register')}>Register</Button>
          <Button onClick={handleAuthSubmit} variant="contained">
            Sign In
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SharedPDFViewer; 