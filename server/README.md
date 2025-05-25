# SpotDraft Backend Setup Guide

## Required Dependencies

### Core Dependencies
- `express`: Web framework for Node.js
- `mongoose`: MongoDB object modeling tool
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT authentication
- `cors`: Cross-Origin Resource Sharing
- `dotenv`: Environment variable management
- `nodemailer`: Email functionality
- `multer`: File upload handling
- `helmet`: Security headers
- `morgan`: HTTP request logger
- `express-rate-limit`: Rate limiting
- `validator`: Input validation

### Development Dependencies
- `nodemon`: Auto-restart server during development
- `jest`: Testing framework
- `supertest`: HTTP testing

## Installation

1. **Create Project Directory**
   ```bash
   mkdir spotdraft-server
   cd spotdraft-server
   ```

2. **Initialize Project**
   ```bash
   npm init -y
   ```

3. **Install Dependencies**
   ```bash
   npm install express mongoose bcryptjs jsonwebtoken cors dotenv nodemailer multer helmet morgan express-rate-limit validator
   ```

4. **Install Development Dependencies**
   ```bash
   npm install --save-dev nodemon jest supertest
   ```

## Project Structure

```
server/
├── config/                 # Configuration files
│   ├── db.js              # Database configuration
│   └── email.js           # Email configuration
├── middleware/            # Custom middleware
│   ├── auth.js            # Authentication middleware
│   ├── upload.js          # File upload middleware
│   └── rateLimiter.js     # Rate limiting middleware
├── models/                # Database models
│   ├── User.js            # User model
│   └── PDF.js             # PDF model
├── routes/                # API routes
│   ├── auth.js            # Authentication routes
│   └── pdfs.js            # PDF management routes
├── utils/                 # Utility functions
│   ├── email.js           # Email utility functions
│   └── validation.js      # Input validation functions
├── .env                   # Environment variables
├── .gitignore            # Git ignore file
├── index.js              # Server entry point
└── package.json          # Project configuration
```

## Environment Variables (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/spotdraft

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=1h

# Email
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=your_gmail@gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH=uploads/
```

## Database Setup

1. **Install MongoDB**
   - [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
   - Or use MongoDB Atlas (cloud service)

2. **Create Database**
   ```bash
   mongosh
   use spotdraft
   ```

## Email Setup

1. **Gmail Account**
   - Enable 2-Step Verification
   - Generate App Password:
     1. Go to Google Account Settings
     2. Security > 2-Step Verification
     3. App passwords
     4. Select "Mail" and your device
     5. Copy generated password

2. **Update .env**
   ```env
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```

## Running the Server

1. **Development Mode**
   ```bash
   npm run dev
   ```

2. **Production Mode**
   ```bash
   npm start
   ```

## API Testing

1. **Run Tests**
   ```bash
   npm test
   ```

2. **Test Coverage**
   ```bash
   npm test -- --coverage
   ```

## Security Considerations

1. **Rate Limiting**
   - Implemented for all routes
   - Configurable limits in middleware

2. **File Upload**
   - Size limits
   - File type validation
   - Secure storage

3. **Authentication**
   - JWT token validation
   - Password hashing
   - Secure session management

4. **CORS**
   - Configured for specific origins
   - Secure headers with Helmet

## Error Handling

1. **Global Error Handler**
   - Centralized error handling
   - Consistent error responses

2. **Validation**
   - Input validation
   - Error messages

## Logging

1. **Morgan**
   - HTTP request logging
   - Development and production formats

2. **Custom Logging**
   - Error logging
   - Activity tracking

## Deployment Checklist

1. **Environment Variables**
   - Set all required variables
   - Use secure values

2. **Database**
   - Production MongoDB URI
   - Connection pooling

3. **Security**
   - Enable HTTPS
   - Set secure headers
   - Configure CORS

4. **Performance**
   - Enable compression
   - Set up caching
   - Configure rate limiting

## Monitoring

1. **Health Check Endpoint**
   ```javascript
   app.get('/health', (req, res) => {
     res.status(200).json({ status: 'healthy' });
   });
   ```

2. **Error Monitoring**
   - Log errors
   - Set up alerts

## Support

For backend support:
- Email: backend-support@spotdraft.com
- GitHub Issues: [Create an issue](https://github.com/yourusername/spotdraft/issues) 