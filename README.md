# SpotDraft - PDF Management and Sharing Platform

SpotDraft is a web application that allows users to upload, manage, and share PDF documents with advanced features like commenting, real-time collaboration, and secure sharing.

## Features

- PDF Upload and Management
- Secure PDF Sharing with Access Controls
- Real-time Comments and Collaboration
- User Authentication and Authorization
- Responsive Design for Mobile and Desktop
- PDF Viewer with Zoom, Rotate, and Page Navigation
- Analytics and Usage Tracking

## Tech Stack

### Frontend
- React.js
- Material-UI (MUI)
- React Router
- Axios
- React-PDF

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Multer (File Upload)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd spotdraft
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file
touch .env
```

Add the following to your `.env` file:
```env
# Development
MONGODB_URI=mongodb://localhost:27017/spotdraft
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:5000

# Production
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:5000
```

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Create .env file
touch .env
```

Add the following to your `.env` file:
```env
# Development
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FRONTEND_URL=http://localhost:3000

# Production
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FRONTEND_URL=http://localhost:3000
```

## Running the Application

### 1. Start MongoDB
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo service mongod start
# or
mongod --dbpath /path/to/data/db
```

### 2. Start the Backend Server
```bash
cd server
npm start
```

The backend server will be available at http://localhost:5000

### 3. Start the Frontend Development Server
```bash
cd client
npm start
```

The frontend application will be available at http://localhost:3000

## API Configuration

### Authentication Headers
All API requests (except login/register) require the following headers:
```javascript
{
  'Content-Type': 'application/json',
  'x-auth-token': 'your_jwt_token'
}
```

### JWT Token
- Token is received after successful login
- Token expires after 1 hour
- Token must be included in all authenticated requests
- Token format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### API Endpoints

#### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password

#### PDF Management
- GET `/api/pdf` - Get all PDFs
- POST `/api/pdf` - Upload new PDF
- GET `/api/pdf/:id` - Get PDF by ID
- DELETE `/api/pdf/:id` - Delete PDF
- POST `/api/pdf/:id/share` - Share PDF
- GET `/api/pdf/shared/:token` - Get shared PDF

### PDF Access
To access PDFs, use the following URLs:

1. **View PDF in Application**
   - Frontend URL: `http://localhost:3000/pdf/:id`
   - Example: `http://localhost:3000/pdf/682ffd09773cd6e40d773d20`

2. **Access Shared PDF**
   - Frontend URL: `http://localhost:3000/shared/:token`
   - Example: `http://localhost:3000/shared/abc123`

3. **Direct PDF File Access**
   - Backend URL: `http://localhost:5000/api/pdf/:id/file`
   - Example: `http://localhost:5000/api/pdf/682ffd09773cd6e40d773d20/file`

## Troubleshooting

### Common Issues and Solutions

1. **404 Not Found Errors**
   - Ensure you're using the correct API endpoint with `/api` prefix
   - Check if the resource exists in the database
   - Verify the URL structure matches the API documentation

2. **403 Forbidden Errors**
   - Check if your JWT token is valid and not expired
   - Ensure you have the correct permissions
   - Include the `x-auth-token` header in your request
   - Log out and log back in to get a new token

3. **CORS Errors**
   - Verify the `FRONTEND_URL` in backend `.env` matches your frontend URL
   - Check if the request includes the correct headers
   - Ensure the backend CORS configuration is correct

4. **Authentication Issues**
   - Clear browser cache and cookies
   - Check if the JWT token is properly stored
   - Verify the token format and expiration
   - Ensure the `JWT_SECRET` is properly set in the backend

5. **PDF Upload Issues**
   - Check if the uploads directory exists
   - Verify file size limits
   - Ensure proper file type validation
   - Check server storage permissions

6. **Database Connection Issues**
   - Verify MongoDB is running
   - Check the MongoDB connection string
   - Ensure proper database permissions
   - Check network connectivity

### Error Codes
- 401: Unauthorized - Missing or invalid token
- 403: Forbidden - Token expired or insufficient permissions
- 404: Not Found - Resource doesn't exist
- 500: Server Error - Internal server error

### Development Tools
1. **Browser Developer Tools**
   - Check Network tab for API requests
   - Monitor Console for errors
   - Verify request/response headers

2. **Server Logs**
   - Check backend console output
   - Monitor MongoDB logs
   - Review error messages

3. **API Testing**
   - Use Postman or similar tools
   - Test endpoints with proper headers
   - Verify response formats

## Production Deployment

### Backend Deployment
1. Set the following environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `FRONTEND_URL=http://localhost:3000`
   - `API_URL=http://localhost:5000`

### Frontend Deployment
1. Set the following environment variables:
   - `REACT_APP_API_URL=http://localhost:5000`
   - `REACT_APP_FRONTEND_URL=http://localhost:3000`

## Support

For support:
1. Check the troubleshooting guide above
2. Review the error logs
3. Contact support@spotdraft.com
4. Create an issue in the repository

## License

This project is licensed under the MIT License - see the LICENSE file for details. 