import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  Fade,
  Zoom,
  Tooltip,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import config from '../config';

const API_URL = config.API_URL;

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(8),
  padding: theme.spacing(6),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
  backdropFilter: 'blur(10px)',
  borderRadius: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease-in-out',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    transition: 'all 0.3s ease',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: '2px'
      }
    },
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: '2px'
      }
    }
  },
  '& .MuiInputLabel-root': {
    '&.Mui-focused': {
      color: theme.palette.primary.main
    }
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '16px',
  padding: '12px',
  textTransform: 'none',
  fontSize: '1.1rem',
  fontWeight: 600,
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
  }
}));

const Register = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: location.state?.email || '',
    password: location.state?.password || '',
    confirmPassword: location.state?.password || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      // Simple password strength calculation
      let strength = 0;
      if (value.length >= 8) strength += 1;
      if (/[A-Z]/.test(value)) strength += 1;
      if (/[0-9]/.test(value)) strength += 1;
      if (/[^A-Za-z0-9]/.test(value)) strength += 1;
      setPasswordStrength(strength);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return theme.palette.error.main;
      case 1: return theme.palette.error.light;
      case 2: return theme.palette.warning.main;
      case 3: return theme.palette.info.main;
      case 4: return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending registration request with:', { 
        name: formData.name, 
        email: formData.email 
      });
      
      const response = await axios.post(`${API_URL}/auth/signup`, {
        name: formData.name,
        email: formData.email,
        password: formData.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (response.data) {
        // After successful registration, automatically log in
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: formData.email,
          password: formData.password
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        if (loginResponse.data.token && loginResponse.data.user) {
          localStorage.setItem('token', loginResponse.data.token);
          localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
          navigate('/');
        } else {
          setError('Registration successful but login failed');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Fade in={true} timeout={1000}>
        <StyledPaper elevation={3}>
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Typography 
              component="h1" 
              variant="h3" 
              gutterBottom 
              sx={{ 
                color: 'primary.main', 
                fontWeight: 700,
                mb: 4,
                textAlign: 'center',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Create Account
            </Typography>
          </Zoom>
          
          <Typography 
            variant="h6" 
            color="text.secondary" 
            align="center" 
            sx={{ mb: 5 }}
          >
            Join SpotDraft and start collaborating
          </Typography>
          
          {error && (
            <Zoom in={true}>
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  width: '100%',
                  borderRadius: '12px',
                  fontSize: '1.1rem'
                }}
              >
                {error}
              </Alert>
            </Zoom>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <StyledTextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <StyledTextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <Box sx={{ position: 'relative' }}>
              <StyledTextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={showPassword ? "Hide password" : "Show password"}>
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              {formData.password && (
                <Box sx={{ 
                  height: '4px', 
                  width: '100%', 
                  backgroundColor: alpha(theme.palette.divider, 0.1),
                  borderRadius: '2px',
                  mt: -1,
                  mb: 2
                }}>
                  <Box sx={{ 
                    height: '100%', 
                    width: `${(passwordStrength / 4) * 100}%`, 
                    backgroundColor: getPasswordStrengthColor(),
                    borderRadius: '2px',
                    transition: 'all 0.3s ease'
                  }} />
                </Box>
              )}
            </Box>
            <StyledTextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={showConfirmPassword ? "Hide password" : "Show password"}>
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 4, 
                mb: 3,
                py: 1.5,
                fontSize: '1.2rem'
              }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={28} color="inherit" />
              ) : (
                'Create Account'
              )}
            </StyledButton>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  style={{ 
                    color: theme.palette.primary.main, 
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </StyledPaper>
      </Fade>
    </Container>
  );
};

export default Register; 