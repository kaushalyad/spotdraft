import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Share as ShareIcon,
  Comment as CommentIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

function Home() {
  const navigate = useNavigate();

  const features = [
    {
      title: 'PDF Management',
      description: 'Upload, organize, and manage your PDF documents in one place',
      icon: <PdfIcon sx={{ fontSize: 40 }} />
    },
    {
      title: 'Secure Sharing',
      description: 'Share your PDFs with specific permissions and access controls',
      icon: <ShareIcon sx={{ fontSize: 40 }} />
    },
    {
      title: 'Collaboration',
      description: 'Add comments and collaborate with others on your documents',
      icon: <CommentIcon sx={{ fontSize: 40 }} />
    },
    {
      title: 'Privacy First',
      description: 'Your documents are protected with enterprise-grade security',
      icon: <SecurityIcon sx={{ fontSize: 40 }} />
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        py: { xs: 8, md: 12 },
        textAlign: 'center'
      }}>
        <Container maxWidth="md">
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}
          >
            Your PDF Management Solution
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 4,
              opacity: 0.9,
              fontSize: { xs: '1.1rem', md: '1.5rem' }
            }}
          >
            Upload, share, and collaborate on PDF documents with ease
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="secondary"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ 
                px: 4,
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              Get Started
            </Button>
            <Button 
              variant="outlined" 
              color="inherit"
              size="large"
              onClick={() => navigate('/login')}
              sx={{ 
                px: 4,
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              Login
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography 
          variant="h3" 
          component="h2" 
          align="center" 
          gutterBottom
          sx={{ 
            mb: 6,
            fontWeight: 600,
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 3,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)'
                  }
                }}
              >
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <CardContent>
                  <Typography 
                    variant="h5" 
                    component="h3" 
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.100', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="md">
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 4, md: 6 },
              textAlign: 'center',
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 2
            }}
          >
            <Typography 
              variant="h4" 
              component="h2" 
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Ready to Get Started?
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ mb: 4, opacity: 0.9 }}
            >
              Join thousands of users who trust our platform for their PDF needs
            </Typography>
            <Button 
              variant="contained" 
              color="secondary"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ 
                px: 4,
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              Create Free Account
            </Button>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}

export default Home; 