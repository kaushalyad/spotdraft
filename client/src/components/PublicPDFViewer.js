import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page } from 'react-pdf';
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
  Snackbar,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';

// Import PDF.js worker
import 'pdfjs-dist/build/pdf.worker.entry';

const API_URL = 'http://localhost:5000';

const PublicPDFViewer = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [pdf, setPdf] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [replyingTo, setReplyingTo] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize the PDF options
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
    cMapPacked: true,
  }), []);

  useEffect(() => {
    fetchPublicPdf();
  }, [token]);

  const fetchPublicPdf = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/pdf/shared/${token}`);
      const data = await response.json();
      if (response.ok) {
        setPdf(data);
      } else {
        setError(data.message || 'Error fetching PDF');
        setSnackbar({
          open: true,
          message: data.message || 'Error fetching PDF',
          severity: 'error'
        });
        navigate('/login');
      }
    } catch (error) {
      setError('Failed to load PDF');
      setSnackbar({
        open: true,
        message: 'Error fetching PDF',
        severity: 'error'
      });
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    setError('Failed to load PDF document');
    console.error('Error loading PDF:', error);
  };

  const handleCommentSubmit = async (parentCommentId = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Please log in to comment',
          severity: 'warning'
        });
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/pdf/${pdf._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          text: newComment,
          parentCommentId
        })
      });
      const data = await response.json();
      if (response.ok) {
        setPdf(data);
        setNewComment('');
        setReplyingTo(null);
        setSnackbar({
          open: true,
          message: 'Comment added successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Error adding comment',
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error adding comment',
        severity: 'error'
      });
    }
  };

  const renderComment = (comment, level = 0) => (
    <Box key={comment._id} sx={{ ml: level * 2 }}>
      <ListItem alignItems="flex-start">
        <ListItemText
          primary={
            <Box component="span" sx={{ display: 'block' }}>
              <Typography variant="subtitle2" component="span">
                {comment.user.name} • {new Date(comment.createdAt).toLocaleString()}
              </Typography>
            </Box>
          }
          secondary={
            <Box component="span" sx={{ display: 'block' }}>
              <Typography variant="body2" color="text.primary" component="span">
                {comment.text}
              </Typography>
              <Button
                size="small"
                onClick={() => setReplyingTo(comment._id)}
                sx={{ mt: 1 }}
              >
                Reply
              </Button>
            </Box>
          }
        />
      </ListItem>
      {replyingTo === comment._id && (
        <Box sx={{ ml: 2, mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a reply..."
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={() => handleCommentSubmit(comment._id)}
            >
              Post Reply
            </Button>
            <Button onClick={() => setReplyingTo(null)}>Cancel</Button>
          </Box>
        </Box>
      )}
      {comment.replies?.map((reply) => renderComment(reply, level + 1))}
    </Box>
  );

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error">{error}</Typography>
          <Button 
            variant="contained" 
            onClick={fetchPublicPdf}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!pdf) {
    return (
      <Container>
        <Typography variant="h6">PDF not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Document
                file={`${API_URL}${pdf.url}`}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                }
                error={
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="error">Failed to load PDF!</Typography>
                    <Button 
                      variant="contained" 
                      onClick={fetchPublicPdf}
                      sx={{ mt: 2 }}
                    >
                      Retry
                    </Button>
                  </Box>
                }
                options={pdfOptions}
              >
                <Page 
                  pageNumber={pageNumber} 
                  width={window.innerWidth * 0.6}
                  loading={
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  }
                  error={
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="error">Failed to load page!</Typography>
                    </Box>
                  }
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </Box>
            {numPages && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber(pageNumber - 1)}
                >
                  Previous
                </Button>
                <Typography>
                  Page {pageNumber} of {numPages}
                </Typography>
                <Button
                  disabled={pageNumber >= numPages}
                  onClick={() => setPageNumber(pageNumber + 1)}
                >
                  Next
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Comments</Typography>
            <List>
              {pdf.comments.map((comment) => renderComment(comment))}
            </List>
            <Divider sx={{ my: 2 }} />
            <TextField
              fullWidth
              multiline
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={() => handleCommentSubmit()}
              disabled={!newComment.trim()}
            >
              Post Comment
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PublicPDFViewer; 