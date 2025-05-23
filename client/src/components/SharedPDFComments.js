import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Comment as CommentIcon,
  Reply as ReplyIcon,
  Send as SendIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

const SharedPDFComments = ({ onCommentAdd }) => {
  const { shareId } = useParams();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [shareId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.API_URL}/pdf/shared/${shareId}/comments`);
      setComments(response.data.comments || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      const response = await axios.post(`${config.API_URL}/pdf/shared/${shareId}/comments`, {
        content: newComment,
        name: guestName || 'Anonymous',
        email: guestEmail || null
      });

      setComments(response.data.comments || []);
      setNewComment('');
      setSuccess('Comment added successfully');
      if (onCommentAdd) {
        onCommentAdd(response.data);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (commentId) => {
    if (!replyContent.trim()) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${config.API_URL}/pdf/shared/${shareId}/comments/${commentId}/replies`,
        {
          content: replyContent,
          name: guestName || 'Anonymous',
          email: guestEmail || null
        }
      );

      setComments(response.data.comments || []);
      setReplyContent('');
      setReplyTo(null);
      setSuccess('Reply added successfully');
      if (onCommentAdd) {
        onCommentAdd(response.data);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      setError('Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleGuestInfoSubmit = () => {
    if (guestName.trim()) {
      setOpenDialog(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Comments
        </Typography>

        {/* Guest Info Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Enter Your Information</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Your Name"
              fullWidth
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
            />
            <TextField
              margin="dense"
              label="Your Email (optional)"
              fullWidth
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleGuestInfoSubmit} variant="contained">
              Continue
            </Button>
          </DialogActions>
        </Dialog>

        {/* New Comment Form */}
        <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onClick={() => !guestName && setOpenDialog(true)}
            sx={{ mb: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            endIcon={<SendIcon />}
            disabled={loading || !newComment.trim()}
          >
            Post Comment
          </Button>
        </Box>

        {/* Comments List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {comments.map((comment) => (
              <React.Fragment key={comment._id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1">
                        {comment.guestInfo?.name || 'Anonymous'}
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          {formatDate(comment.createdAt)}
                        </Typography>
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body1"
                          color="text.primary"
                          sx={{ display: 'block', mb: 1 }}
                        >
                          {comment.content}
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<ReplyIcon />}
                          onClick={() => {
                            if (!guestName) {
                              setOpenDialog(true);
                            } else {
                              setReplyTo(comment._id);
                            }
                          }}
                        >
                          Reply
                        </Button>
                      </>
                    }
                  />
                </ListItem>

                {/* Replies */}
                {comment.replies?.map((reply) => (
                  <ListItem
                    key={reply._id}
                    alignItems="flex-start"
                    sx={{ pl: 9 }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2">
                          {reply.guestInfo?.name || 'Anonymous'}
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            {formatDate(reply.createdAt)}
                          </Typography>
                        </Typography>
                      }
                      secondary={reply.content}
                    />
                  </ListItem>
                ))}

                {/* Reply Form */}
                {replyTo === comment._id && (
                  <Box sx={{ pl: 9, pr: 2, py: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleReplySubmit(comment._id)}
                        disabled={loading || !replyContent.trim()}
                      >
                        Reply
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setReplyTo(null);
                          setReplyContent('');
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SharedPDFComments; 