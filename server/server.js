const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: ['https://spotdraft-w59a.onrender.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  exposedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// ... rest of the existing code ... 