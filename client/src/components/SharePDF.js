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
  Tooltip
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
          permissions
        },
        {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        }
      );

      setShareLink(response.data.shareLink);
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
      <DialogTitle>Grant Access to PDF</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <TextField
          fullWidth
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          type="email"
          required
          helperText="Enter the email address to grant access to"
        />

        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          Access Permissions
        </Typography>

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

        {shareLink && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Access Link Generated
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                sx={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {shareLink}
              </Typography>
              <Tooltip title="Copy Link">
                <IconButton onClick={copyToClipboard} size="small">
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleShare}
          variant="contained"
          disabled={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
        >
          Grant Access
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SharePDF; 