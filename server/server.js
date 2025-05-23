const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'https://spotdraft-w59a.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  exposedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'cache-control', 'pragma', 'if-none-match', 'if-modified-since'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// ... rest of the existing code ... 