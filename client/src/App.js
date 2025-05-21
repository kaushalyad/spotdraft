import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import PDFViewer from './components/PDFViewer';

const App = () => {
  // Get theme from localStorage or default to light
  const [mode, setMode] = React.useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  // Create theme based on mode
  const theme = createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // Light mode colors
            primary: {
              main: '#1976d2',
            },
            background: {
              default: '#f5f5f5',
              paper: '#ffffff',
            },
          }
        : {
            // Dark mode colors
            primary: {
              main: '#90caf9',
            },
            background: {
              default: '#121212',
              paper: '#1e1e1e',
            },
          }),
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            transition: 'all 0.3s ease-in-out',
          },
          switchBase: {
            transition: 'all 0.3s ease-in-out',
            '&.Mui-checked': {
              transform: 'translateX(20px)',
              '& + .MuiSwitch-track': {
                opacity: 1,
                backgroundColor: mode === 'dark' ? '#90caf9' : '#1976d2',
              },
            },
          },
          thumb: {
            transition: 'all 0.3s ease-in-out',
            boxShadow: '0 2px 4px 0 rgba(0,0,0,0.2)',
          },
          track: {
            transition: 'all 0.3s ease-in-out',
            backgroundColor: mode === 'dark' ? 'rgba(144, 202, 249, 0.5)' : 'rgba(25, 118, 210, 0.5)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            transition: 'color 0.3s ease-in-out',
          },
        },
      },
    },
  });

  // Theme toggle function
  const toggleTheme = (newMode) => {
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/pdf/:id" element={<PDFViewer />} />
          <Route path="/" element={<Dashboard onThemeToggle={toggleTheme} />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App; 