import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
  Box,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import axios from 'axios';
import config from '../config';

const SharePDF = ({ pdf, open, onClose }) => {
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState({
    view: true,
    comment: true,
    download: true
  });
  const [shareLink, setShareLink] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePermissionChange = (permission) => (event) => {
    setPermissions({
      ...permissions,
      [permission]: event.target.checked
    });
  };

  const handleShare = async () => {
    try {
      setError('');
      setSuccess('');
      
      if (!email) {
        setError('Please enter an email address');
        return;
      }

      const response = await axios.post(
        `${config.API_URL}/pdf/${pdf._id}/share`,
        {
          email,
          permissions,
          shareSettings: {
            shareType: 'public',
            linkExpiry: '7d',
            allowDownload: permissions.download,
            allowComments: permissions.comment,
            notifyOnAccess: true
          }
        },
        {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        }
      );

      // Generate the full share URL using frontend URL from config
      const shareUrl = `${config.FRONTEND_URL}/#/shared/${response.data.token}`;
      setShareLink(shareUrl);
      setSuccess('Access granted successfully! The user will receive an email with access instructions.');
    } catch (error) {
      setError(error.response?.data?.message || 'Error granting access');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setSuccess('Link copied to clipboard!');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share PDF</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle2" gutterBottom>
            Permissions:
          </Typography>
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={permissions.view}
                  onChange={handlePermissionChange('view')}
                  disabled
                />
              }
              label="View"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={permissions.comment}
                  onChange={handlePermissionChange('comment')}
                />
              }
              label="Comment"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={permissions.download}
                  onChange={handlePermissionChange('download')}
                />
              }
              label="Download"
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {shareLink && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Share Link:
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
                <Tooltip title="Copy to clipboard">
                  <IconButton onClick={copyToClipboard} size="small">
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleShare} 
          variant="contained" 
          disabled={!email.trim()}
        >
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SharePDF; 