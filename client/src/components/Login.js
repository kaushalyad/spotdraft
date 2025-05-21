import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
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
  useTheme,
  alpha
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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

function Login() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate inputs
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending login request with:', { email, password });
      const response = await axios.post('http://localhost:5000/auth/login', 
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      console.log('Login response:', response.data);
      
      if (!response.data.token || !response.data.user) {
        setError('Invalid server response');
        return;
      }

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      if (error.response?.status === 400) {
        setError(error.response.data.message || 'Invalid email or password');
      } else {
        setError('Error logging in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Fade in={true} timeout={1000}>
        <StyledPaper elevation={3}>
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              align="center" 
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
              Welcome Back
            </Typography>
          </Zoom>
          
          <Typography 
            variant="h6" 
            color="text.secondary" 
            align="center" 
            sx={{ mb: 5 }}
          >
            Sign in to continue to SpotDraft
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

          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ width: '100%' }}
          >
            <StyledTextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <StyledTextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
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
            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              size="large"
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
                'Sign In'
              )}
            </StyledButton>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
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
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Box>
        </StyledPaper>
      </Fade>
    </Container>
  );
}

export default Login; 