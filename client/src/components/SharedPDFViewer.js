import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Snackbar,
  Container,
  Chip,
  AppBar,
  Toolbar,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Download as DownloadIcon,
  Comment as CommentIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  ArrowBack as ArrowBackIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateRightIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  NavigateNext,
  NavigateBefore
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';
import { useSettings } from '../contexts/SettingsContext';
import SharedPDFComments from './SharedPDFComments';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function SharedPDFViewer() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useSettings();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfData, setPdfData] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [guestInfo, setGuestInfo] = useState({
    name: localStorage.getItem('guestName') || '',
    email: localStorage.getItem('guestEmail') || ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [passwordError, setPasswordError] = useState('');
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showRegistration, setShowRegistration] = useState(true);
  const [registrationError, setRegistrationError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Memoize the file props
  const fileProps = useMemo(() => ({
    url: `${config.API_URL}/shared/${token}/file`,
    httpHeaders: {
      'Content-Type': 'application/pdf',
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
    }
  }), [token]);

  // Memoize the PDF options
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

  useEffect(() => {
    const fetchSharedPDF = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`${config.API_URL}/shared/${token}`);
        setPdfData(response.data);
        
        if (response.data.requiresPassword) {
          setShowPasswordDialog(true);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired share link');
        setSnackbar({
          open: true,
          message: err.response?.data?.message || 'Invalid or expired share link',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSharedPDF();
  }, [token]);

  const handlePasswordSubmit = async () => {
    try {
      const response = await axios.post(`${config.API_URL}/pdf/shared/${token}/verify`, {
        password,
        ...guestInfo
      });

      if (response.data.accessGranted) {
        setShowPasswordDialog(false);
        setPdfData(response.data.pdf);
      }
    } catch (error) {
      setError('Invalid password');
      setSnackbar({
        open: true,
        message: 'Invalid password',
        severity: 'error'
      });
    }
  };

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
    setIsLoadingPage(false);
  };

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.min(Math.max(1, newPageNumber), numPages);
    });
  };

  const handleZoom = (direction) => {
    setScale(prevScale => {
      const newScale = direction === 'in' ? prevScale + 0.1 : prevScale - 0.1;
      return Math.min(Math.max(0.5, newScale), 2.0);
    });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/pdf/shared/${token}/file`, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/pdf',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfData?.name || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Download started',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download PDF',
        severity: 'error'
      });
    }
  };

  const calculateTotalComments = (comments) => {
    if (!comments || !Array.isArray(comments)) return 0;
    return comments.reduce((total, comment) => {
      const replyCount = comment.replies ? comment.replies.length : 0;
      return total + 1 + replyCount;
    }, 0);
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setRegistrationError('');

    if (!guestInfo.name.trim() || !guestInfo.email.trim()) {
      setRegistrationError('Please provide both name and email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestInfo.email)) {
      setRegistrationError('Please enter a valid email address');
      return;
    }

    try {
      // Store guest info in localStorage
      localStorage.setItem('guestName', guestInfo.name);
      localStorage.setItem('guestEmail', guestInfo.email);
      setShowRegistration(false);
    } catch (error) {
      setRegistrationError('Error saving registration information');
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
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (showRegistration) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom align="center">
            Access Shared PDF
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }} align="center">
            Please provide your information to access this shared PDF
          </Typography>
          
          {registrationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {registrationError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleRegistration}>
            <TextField
              fullWidth
              label="Your Name"
              value={guestInfo.name}
              onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
              required
              error={!!registrationError && !guestInfo.name.trim()}
            />
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={guestInfo.email}
              onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
              margin="normal"
              required
              error={!!registrationError && !guestInfo.email.trim()}
              helperText={registrationError && !guestInfo.email.trim() ? 'Email is required' : ''}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
            >
              Continue to PDF
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (!pdfData) {
    return null;
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      position: 'relative',
      bgcolor: 'background.default'
    }}>
      {/* Toolbar */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="Previous Page">
            <IconButton 
              onClick={() => changePage(-1)} 
              disabled={pageNumber <= 1}
              size={isMobile ? "small" : "medium"}
            >
              <NavigateBefore />
            </IconButton>
          </Tooltip>
          
          <Typography variant={isMobile ? "body2" : "body1"}>
            Page {pageNumber} of {numPages || '--'}
          </Typography>
          
          <Tooltip title="Next Page">
            <IconButton 
              onClick={() => changePage(1)} 
              disabled={pageNumber >= numPages}
              size={isMobile ? "small" : "medium"}
            >
              <NavigateNext />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="Zoom Out">
            <IconButton 
              onClick={() => handleZoom('out')} 
              disabled={scale <= 0.5}
              size={isMobile ? "small" : "medium"}
            >
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          <Typography variant={isMobile ? "body2" : "body1"}>
            {Math.round(scale * 100)}%
          </Typography>
          
          <Tooltip title="Zoom In">
            <IconButton 
              onClick={() => handleZoom('in')} 
              disabled={scale >= 2.0}
              size={isMobile ? "small" : "medium"}
            >
              <ZoomInIcon />
            </IconButton>
          </Tooltip>

          {pdfData?.shareSettings?.allowDownload && (
            <Tooltip title="Download">
              <IconButton 
                onClick={handleDownload}
                size={isMobile ? "small" : "medium"}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )}

          {pdfData?.shareSettings?.allowComments && (
            <Tooltip title="Comments">
              <IconButton 
                onClick={() => setShowComments(true)}
                size={isMobile ? "small" : "medium"}
              >
                <Badge 
                  badgeContent={calculateTotalComments(pdfData?.comments || [])} 
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
          )}
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* PDF Viewer */}
        <Box sx={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          p: isMobile ? 1 : 2,
          bgcolor: 'grey.100',
          height: '100%'
        }}>
          {loading && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%'
            }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%',
              p: 2
            }}>
              <Typography color="error" align="center">
                {error}
              </Typography>
            </Box>
          )}

          {!loading && !error && (
            <Document
              file={fileProps}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <CircularProgress />
                </Box>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={isMobile ? undefined : 800}
                loading={
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '100%'
                  }}>
                    <CircularProgress />
                  </Box>
                }
              />
            </Document>
          )}
        </Box>

        {/* Comments Panel - Desktop */}
        {!isMobile && pdfData?.shareSettings?.allowComments && (
          <Box sx={{
            width: '500px',
            minWidth: '500px',
            borderLeft: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            height: '100%'
          }}>
            <Box sx={{
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Typography variant="h6">
                Comments ({calculateTotalComments(pdfData?.comments || [])})
              </Typography>
              <IconButton 
                onClick={() => setShowComments(false)}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ 
              flex: 1,
              overflow: 'auto',
              p: 2
            }}>
              <SharedPDFComments
                token={token}
                onCommentAdd={(newComment) => {
                  setPdfData(prev => ({
                    ...prev,
                    comments: [...(prev.comments || []), newComment]
                  }));
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Comments Dialog - Mobile */}
      <Dialog
        open={showComments && isMobile}
        onClose={() => setShowComments(false)}
        fullScreen
        PaperProps={{
          sx: {
            height: '100%',
            maxHeight: '100vh',
            m: 0
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6">
            Comments ({calculateTotalComments(pdfData?.comments || [])})
          </Typography>
          <IconButton 
            onClick={() => setShowComments(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <SharedPDFComments
            token={token}
            onCommentAdd={(newComment) => {
              setPdfData(prev => ({
                ...prev,
                comments: [...(prev.comments || []), newComment]
              }));
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Comments Dialog - Desktop */}
      <Dialog
        open={showComments && !isMobile}
        onClose={() => setShowComments(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '80vh',
            width: '500px',
            maxWidth: '500px',
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            margin: 0,
            borderRadius: 0
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6">
            Comments ({calculateTotalComments(pdfData?.comments || [])})
          </Typography>
          <IconButton 
            onClick={() => setShowComments(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <SharedPDFComments
            token={token}
            onCommentAdd={(newComment) => {
              setPdfData(prev => ({
                ...prev,
                comments: [...(prev.comments || []), newComment]
              }));
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
  );
}

export default SharedPDFViewer; 