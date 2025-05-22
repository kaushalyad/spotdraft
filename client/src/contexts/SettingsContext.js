import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      darkMode: false,
      language: 'en',
      theme: 'light'
    };
  });

  // Create theme based on dark mode setting
  const theme = createTheme({
    palette: {
      mode: settings.darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: settings.darkMode ? '#121212' : '#f5f5f5',
        paper: settings.darkMode ? '#1e1e1e' : '#ffffff',
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
    updateSettings({
      darkMode: !settings.darkMode,
      theme: !settings.darkMode ? 'dark' : 'light'
    });
  };

  // Change language
  const changeLanguage = (language) => {
    updateSettings({ language });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, toggleDarkMode, changeLanguage }}>
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