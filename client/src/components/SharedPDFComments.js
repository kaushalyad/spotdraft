import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Paper
} from '@mui/material';
import {
  Reply as ReplyIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

const API_URL = config.API_URL;

export default function SharedPDFComments({ onCommentAdd }) {
  const { token } = useParams();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [guestInfo, setGuestInfo] = useState({
    name: localStorage.getItem('guestName') || 'Anonymous',
    email: localStorage.getItem('guestEmail') || null
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error'
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid share token');
      setLoading(false);
      return;
    }

    // Check if guest info exists
    const storedName = localStorage.getItem('guestName');
    const storedEmail = localStorage.getItem('guestEmail');
    
    if (!storedName || !storedEmail) {
      setError('Please provide your information to view comments');
      setLoading(false);
      return;
    }

    setGuestInfo({
      name: storedName,
      email: storedEmail
    });

    fetchComments();
  }, [token]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching comments for token:', token);
      const response = await axios.get(`${API_URL}/pdf/shared/${token}/comments`);
      
      console.log('Comments fetched successfully:', response.data);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError(error.response?.data?.message || 'Failed to fetch comments');
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to fetch comments',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      setSnackbar({
        open: true,
        message: 'Comment cannot be empty',
        severity: 'error'
      });
      return;
    }

    if (!guestInfo.name || !guestInfo.email) {
      setSnackbar({
        open: true,
        message: 'Please provide your information to add comments',
        severity: 'error'
      });
      return;
    }

    try {
      console.log('Adding comment:', {
        token,
        content: newComment,
        page: pageNumber,
        guestInfo
      });

      const response = await axios.post(`${API_URL}/pdf/shared/${token}/comments`, {
        content: newComment.trim(),
        page: pageNumber,
        position: { x: 0, y: 0 },
        name: guestInfo.name,
        email: guestInfo.email
      });

      console.log('Comment added successfully:', response.data);

      // Update the comments state with the new comment
      setComments(prevComments => [...prevComments, {
        ...response.data,
        user: {
          name: guestInfo.name,
          email: guestInfo.email
        }
      }]);
      setNewComment('');
      setSnackbar({
        open: true,
        message: 'Comment added successfully',
        severity: 'success'
      });

      if (onCommentAdd) {
        onCommentAdd(response.data);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error adding comment',
        severity: 'error'
      });
    }
  };

  const handleReply = async (parentCommentId) => {
    if (!replyContent.trim()) {
      setSnackbar({
        open: true,
        message: 'Reply cannot be empty',
        severity: 'error'
      });
      return;
    }

    if (!guestInfo.name || !guestInfo.email) {
      setSnackbar({
        open: true,
        message: 'Please provide your information to add replies',
        severity: 'error'
      });
      return;
    }

    try {
      console.log('Adding reply:', {
        token,
        commentId: parentCommentId,
        content: replyContent,
        guestInfo
      });

      const response = await axios.post(`${API_URL}/pdf/shared/${token}/comments/${parentCommentId}/replies`, {
        content: replyContent.trim(),
        formattedContent: replyContent.trim(),
        name: guestInfo.name,
        email: guestInfo.email
      });

      console.log('Reply added successfully:', response.data);

      // Update the comments state with the new reply
      setComments(prevComments => 
        prevComments.map(comment => 
          comment._id === parentCommentId
            ? { 
                ...comment, 
                replies: [...(comment.replies || []), {
                  ...response.data,
                  user: {
                    name: guestInfo.name,
                    email: guestInfo.email
                  }
                }]
              }
            : comment
        )
      );
      setReplyContent('');
      setReplyTo(null);
      setSnackbar({
        open: true,
        message: 'Reply added successfully',
        severity: 'success'
      });

      if (onCommentAdd) {
        onCommentAdd(response.data);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error adding reply',
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
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

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Comments ({comments.length})
      </Typography>

      {/* Comment Input */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          variant="outlined"
          sx={{ mb: 1 }}
        />
        <span>
          <Button
            variant="contained"
            onClick={handleCommentSubmit}
            disabled={!newComment.trim()}
            fullWidth
          >
            Add Comment
          </Button>
        </span>
      </Paper>

      {/* Comments List */}
      <List>
        {comments.map((comment) => (
          <React.Fragment key={comment._id}>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar>{comment.user?.name?.[0] || 'A'}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">
                      {comment.user?.name || 'Anonymous'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(comment.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                      sx={{ display: 'block', mb: 1 }}
                    >
                      {comment.content}
                    </Typography>
                    <span>
                      <Button
                        size="small"
                        startIcon={<ReplyIcon />}
                        onClick={() => setReplyTo(comment._id)}
                      >
                        Reply
                      </Button>
                    </span>
                  </Box>
                }
              />
            </ListItem>

            {/* Reply Input */}
            {replyTo === comment._id && (
              <Box sx={{ pl: 7, pr: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <span>
                    <Button
                      size="small"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyContent('');
                      }}
                    >
                      Cancel
                    </Button>
                  </span>
                  <span>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleReply(comment._id)}
                      disabled={!replyContent.trim()}
                    >
                      Reply
                    </Button>
                  </span>
                </Box>
              </Box>
            )}

            {/* Replies */}
            {comment.replies?.map((reply) => (
              <ListItem key={reply._id} sx={{ pl: 7 }}>
                <ListItemAvatar>
                  <Avatar sx={{ width: 24, height: 24 }}>
                    {reply.user?.name?.[0] || 'A'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.875rem' }}>
                        {reply.user?.name || 'Anonymous'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(reply.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                  secondary={reply.content}
                />
              </ListItem>
            ))}
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
      </List>

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