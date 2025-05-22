import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Snackbar,
  Container
} from '@mui/material';
import {
  Download as DownloadIcon,
  Comment as CommentIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';
import { useSettings } from '../contexts/SettingsContext';
import PDFViewer from './PDFViewer';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// API base URL
const API_BASE_URL = config.API_URL;

function SharedPDFViewer() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { t } = useSettings();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfData, setPdfData] = useState(null);

  useEffect(() => {
    const fetchSharedPDF = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`${config.API_URL}/api/pdfs/shared/${shareId}`);
        setPdfData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || t('sharePDF.invalidLink'));
      } finally {
        setLoading(false);
      }
    };

    fetchSharedPDF();
  }, [shareId, t]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          {t('backToHome')}
        </Button>
      </Container>
    );
  }

  if (!pdfData) {
    return null;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {pdfData.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('sharePDF.viewShared')}
        </Typography>
      </Paper>
      
      <PDFViewer
        pdfUrl={`${config.API_URL}/api/pdfs/shared/${shareId}/file`}
        allowComments={pdfData.allowComments}
        isShared={true}
      />
    </Box>
  );
}

export default SharedPDFViewer; 