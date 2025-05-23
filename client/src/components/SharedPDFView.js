import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import config from '../config';
import {
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const SharedPDFView = () => {
  const { token } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const fetchSharedPDF = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${config.API_URL}/pdf/shared/${token}`);
      setPdfData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading shared PDF');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSharedPDF();
  }, [fetchSharedPDF]);

  const handleLogin = useCallback(() => {
    navigate('/login', { state: { from: `/shared/${token}` } });
  }, [navigate, token]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.min(Math.max(1, newPageNumber), numPages);
    });
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 2.0));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Authentication Required
          </Typography>
          <Typography variant="body1" paragraph>
            You need to be logged in to view this shared PDF.
          </Typography>
          <Button variant="contained" color="primary" onClick={handleLogin}>
            Login to View
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!pdfData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">PDF not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {pdfData.name}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Shared by: {pdfData.owner.name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Your permissions:
          {pdfData.permissions.view && ' View'}
          {pdfData.permissions.comment && ' Comment'}
          {pdfData.permissions.download && ' Download'}
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
          >
            Previous
          </Button>
          <Typography>
            Page {pageNumber} of {numPages || '--'}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
          >
            Next
          </Button>
          <Button variant="outlined" onClick={zoomIn}>
            Zoom In
          </Button>
          <Button variant="outlined" onClick={zoomOut}>
            Zoom Out
          </Button>
        </Box>

        <Document
          file={`${config.API_URL}/pdf/shared/${token}/file`}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<CircularProgress />}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </Box>
    </Container>
  );
};

export default React.memo(SharedPDFView); 