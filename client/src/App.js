import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { PDFViewer } from './components/PDFViewer';
import { SettingsProvider } from './contexts/SettingsContext';
import SharedPDFViewer from './components/SharedPDFViewer';

const App = () => {
  return (
    <SettingsProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/pdf/:id" element={<PDFViewer />} />
          <Route path="/shared/:token" element={<SharedPDFViewer />} />
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Router>
    </SettingsProvider>
  );
};

export default App; 