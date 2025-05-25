import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container
} from '@mui/material';
import { styled } from '@mui/material/styles';
import config from '../config';
import axiosInstance from '../utils/axios';

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(8),
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: 400,
  margin: '0 auto'
}));

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenValid, setTokenValid] = useState(true);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Validate token when component mounts
    const validateToken = async () => {
      try {
        const response = await axiosInstance.get(`/auth/validate-reset-token/${token}`);
        if (response.data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError('Password reset link is invalid or has expired');
        }
      } catch (err) {
        setTokenValid(false);
        setError('Error validating reset token');
      }
    };

    if (token) {
      validateToken();
    } else {
      setTokenValid(false);
      setError('Invalid reset link');
    }
  }, [token]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post(`/auth/reset-password/${token}`, {
        password: newPassword
      });

      setSuccess(response.data.message || 'Password has been reset successfully');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <Container component="main" maxWidth="xs">
        <StyledPaper elevation={3}>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Invalid Reset Link
          </Typography>
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/forgot-password')}
            sx={{ mt: 2 }}
          >
            Request New Reset Link
          </Button>
        </StyledPaper>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <StyledPaper elevation={3}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Reset Password
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleResetPassword} sx={{ width: '100%' }}>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            required
            disabled={loading}
            error={!!error}
            helperText="Password must be at least 6 characters long"
          />
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
            disabled={loading}
            error={!!error}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || !newPassword || !confirmPassword}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default ResetPassword; 