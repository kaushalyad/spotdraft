import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { alpha } from '@mui/material/styles';
import { translations } from '../translations';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      language: 'en',
      theme: 'system'
    };
  });

  // Get translation for a key
  const t = (key) => {
    const keys = key.split('.');
    let translation = translations[settings.language] || translations.en;
    
    // First try to get the translation in the current language
    for (const k of keys) {
      if (typeof translation !== 'object' || translation === null) {
        break;
      }
      translation = translation[k];
    }

    // If translation not found or not a string, try English
    if (typeof translation !== 'string') {
      translation = translations.en;
      for (const k of keys) {
        if (typeof translation !== 'object' || translation === null) {
          return key;
        }
        translation = translation[k];
        if (translation === undefined) return key;
      }
    }
    
    return typeof translation === 'string' ? translation : key;
  };

  // Create theme based on dark mode setting
  const theme = createTheme({
    palette: {
      mode: settings.darkMode ? 'dark' : 'light',
      primary: {
        main: settings.darkMode ? '#2196f3' : '#1976d2',
        light: settings.darkMode ? '#64b5f6' : '#42a5f5',
        dark: settings.darkMode ? '#1976d2' : '#1565c0',
        contrastText: '#ffffff',
      },
      secondary: {
        main: settings.darkMode ? '#f50057' : '#dc004e',
        light: settings.darkMode ? '#ff4081' : '#ff4081',
        dark: settings.darkMode ? '#c51162' : '#c51162',
        contrastText: '#ffffff',
      },
      background: {
        default: settings.darkMode ? '#000000' : '#f5f5f5',
        paper: settings.darkMode ? '#1a1a1a' : '#ffffff',
      },
      text: {
        primary: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
        secondary: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.6)',
      },
      divider: settings.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
      action: {
        active: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.54)',
        hover: settings.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        selected: settings.darkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
            backgroundColor: settings.darkMode ? '#000000' : '#f5f5f5',
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
            '& .welcome-message': {
              backgroundColor: settings.darkMode ? '#1a1a1a' : 'transparent',
              color: settings.darkMode ? '#000000' : 'inherit',
              '& .MuiTypography-root': {
                color: settings.darkMode ? '#000000' : 'inherit',
              },
              '& .MuiTypography-h4': {
                color: settings.darkMode ? '#000000' : 'rgba(0, 0, 0, 0.87)',
                fontWeight: 600,
              },
              '& .MuiTypography-body1': {
                color: settings.darkMode ? '#000000' : 'rgba(0, 0, 0, 0.87)',
              },
            },
            '& .recent-pdfs': {
              color: settings.darkMode ? '#ffffff' : 'inherit',
              '& .MuiTypography-root': {
                color: settings.darkMode ? '#ffffff' : 'inherit',
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
            backgroundImage: 'none',
            backgroundColor: settings.darkMode ? '#1a1a1a' : '#ffffff',
            boxShadow: settings.darkMode ? '0 4px 20px 0 rgba(0,0,0,0.8)' : '0 4px 20px 0 rgba(0,0,0,0.1)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
            backgroundImage: 'none',
            backgroundColor: settings.darkMode ? '#1a1a1a' : '#ffffff',
            boxShadow: settings.darkMode ? '0 4px 20px 0 rgba(0,0,0,0.8)' : '0 4px 20px 0 rgba(0,0,0,0.1)',
          },
        },
      },
      MuiBox: {
        styleOverrides: {
          root: {
            backgroundColor: settings.darkMode ? '#1a1a1a' : 'transparent',
            color: settings.darkMode ? '#ffffff' : 'inherit',
            '& .MuiTypography-root': {
              color: settings.darkMode ? '#ffffff' : 'inherit',
            },
            '& .MuiTypography-h4': {
              color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
              fontWeight: 600,
            },
            '& .MuiTypography-body1': {
              color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
            },
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            backgroundColor: settings.darkMode ? '#1a1a1a' : 'transparent',
            color: settings.darkMode ? '#ffffff' : 'inherit',
            '& .MuiBox-root': {
              backgroundColor: settings.darkMode ? '#1a1a1a' : 'transparent',
              color: settings.darkMode ? '#ffffff' : 'inherit',
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            transition: 'color 0.3s ease-in-out',
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
          },
          h1: {
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
          },
          h2: {
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
          },
          h3: {
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
          },
          h4: {
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
            fontWeight: 600,
          },
          h5: {
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
          },
          h6: {
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
          },
          body1: {
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
          },
          body2: {
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.6)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
            textTransform: 'none',
            fontWeight: 600,
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
          },
          contained: {
            boxShadow: settings.darkMode ? '0 4px 14px 0 rgba(0,0,0,0.8)' : '0 4px 14px 0 rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: settings.darkMode ? '0 6px 20px 0 rgba(0,0,0,0.9)' : '0 6px 20px 0 rgba(0,0,0,0.2)',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
            '&:hover': {
              backgroundColor: settings.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: settings.darkMode ? '#2196f3' : '#1976d2',
              '&:hover': {
                backgroundColor: settings.darkMode ? 'rgba(33, 150, 243, 0.08)' : 'rgba(25, 118, 210, 0.08)',
              },
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: settings.darkMode ? '#2196f3' : '#1976d2',
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: settings.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
            '& .MuiSelect-icon': {
              color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.54)',
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor: settings.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
            '& .MuiInputLabel-root': {
              color: settings.darkMode ? '#e0e0e0' : 'rgba(0, 0, 0, 0.6)',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: settings.darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: settings.darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: settings.darkMode ? '#2196f3' : '#1976d2',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: settings.darkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)',
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: settings.darkMode ? '#1a1a1a' : '#1976d2',
            color: settings.darkMode ? '#ffffff' : '#ffffff',
            boxShadow: settings.darkMode ? '0 4px 20px 0 rgba(0,0,0,0.8)' : '0 4px 20px 0 rgba(0,0,0,0.1)',
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            backgroundColor: settings.darkMode ? '#1a1a1a' : '#1976d2',
            color: settings.darkMode ? '#ffffff' : '#ffffff',
            '& .MuiTypography-root': {
              color: settings.darkMode ? '#ffffff' : '#ffffff',
            },
            '& .MuiIconButton-root': {
              color: settings.darkMode ? '#ffffff' : '#ffffff',
              '&:hover': {
                backgroundColor: settings.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.1)',
              },
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: settings.darkMode ? '#1a1a1a' : '#ffffff',
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
            '& .MuiListItem-root': {
              color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
              '&:hover': {
                backgroundColor: settings.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              },
            },
            '& .MuiListItemIcon-root': {
              color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.54)',
            },
            '& .MuiDivider-root': {
              borderColor: settings.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: settings.darkMode ? '#424242' : 'rgba(97, 97, 97, 0.92)',
            color: settings.darkMode ? '#ffffff' : '#ffffff',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: settings.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            backgroundColor: settings.darkMode ? '#1a1a1a' : '#ffffff',
            color: settings.darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
            '& .MuiTypography-root': {
              color: settings.darkMode ? '#ffffff' : 'inherit',
            },
          },
        },
      },
    },
  });

  // Update settings and persist to localStorage
  const updateSettings = (newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('appSettings', JSON.stringify(updated));
      return updated;
    });
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !settings.darkMode;
    updateSettings({
      darkMode: newDarkMode,
      theme: newDarkMode ? 'dark' : 'light'
    });
  };

  // Change language
  const changeLanguage = (language) => {
    updateSettings({ language });
    // Force a re-render of components using translations
    window.dispatchEvent(new Event('languageChanged'));
  };

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (settings.theme === 'system') {
        updateSettings({
          darkMode: e.matches,
          theme: 'system'
        });
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  // Apply theme class to body
  useEffect(() => {
    document.body.classList.toggle('dark-mode', settings.darkMode);
  }, [settings.darkMode]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, toggleDarkMode, changeLanguage, t }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 