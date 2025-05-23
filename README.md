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
MONGODB_URI=mongodb://localhost:27017/spotdraft
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
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
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FRONTEND_URL=http://localhost:3000
```

## Local Deployment

### 1. Start MongoDB
First, ensure MongoDB is running on your local machine:

```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo service mongod start
# or
mongod --dbpath /path/to/data/db
```

### 2. Start the Backend Server
Open a new terminal window and run:

```bash
cd server
npm start
```

The backend server will be available at http://localhost:5000

### 3. Start the Frontend Development Server
Open another terminal window and run:

```bash
cd client
npm start
```

The frontend application will be available at http://localhost:3000

### 4. Verify the Deployment
1. Open your browser and navigate to http://localhost:3000
2. You should see the SpotDraft login page
3. Create a new account or log in with existing credentials
4. Test the PDF upload and sharing functionality

### Troubleshooting Local Deployment

If you encounter any issues:

1. **MongoDB Connection Issues**
   - Verify MongoDB is running: `mongosh` or `mongo`
   - Check if the MongoDB URI in `.env` is correct
   - Ensure MongoDB is listening on the default port (27017)

2. **Backend Server Issues**
   - Check if port 5000 is available
   - Verify all environment variables are set correctly
   - Check the server logs for any error messages

3. **Frontend Issues**
   - Clear browser cache
   - Check browser console for errors
   - Verify the API URL in the frontend `.env` file

4. **Common Issues**
   - If you get CORS errors, ensure the `FRONTEND_URL` in backend `.env` matches your frontend URL
   - If PDF upload fails, check if the uploads directory exists in the server
   - If authentication fails, verify the JWT_SECRET is set correctly

## Production Deployment

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://spotdraft-w59a.onrender.com`

### Frontend Deployment (Render)

1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Set the following environment variables:
   - `REACT_APP_API_URL=https://spotdraft-backend.onrender.com`
   - `REACT_APP_FRONTEND_URL=https://spotdraft-w59a.onrender.com`

## API Configuration

### Backend API Configuration
In the server's `.env` file:
```env
# Development
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Production
API_URL=https://spotdraft-backend.onrender.com
FRONTEND_URL=https://spotdraft-w59a.onrender.com
```

### Frontend API Configuration
In the client's `.env` file:
```env
# Development
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FRONTEND_URL=http://localhost:3000

# Production
REACT_APP_API_URL=https://spotdraft-backend.onrender.com
REACT_APP_FRONTEND_URL=https://spotdraft-w59a.onrender.com
```

### API Call Examples

1. **Authentication API Calls**
```javascript
// Login
axios.post(`${API_URL}/auth/login`, {
  email: 'user@example.com',
  password: 'password'
});

// Register
axios.post(`${API_URL}/auth/register`, {
  name: 'John Doe',
  email: 'user@example.com',
  password: 'password'
});
```

2. **PDF Management API Calls**
```javascript
// Upload PDF
const formData = new FormData();
formData.append('pdf', pdfFile);
axios.post(`${API_URL}/pdf`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Get PDF List
axios.get(`${API_URL}/pdf`);

// Share PDF
axios.post(`${API_URL}/pdf/${pdfId}/share`, {
  email: 'recipient@example.com',
  permissions: ['view', 'comment']
});
```

3. **Shared PDF Access**
```javascript
// Access Shared PDF
axios.get(`${API_URL}/pdf/shared/${token}`);

// Add Comment to Shared PDF
axios.post(`${API_URL}/pdf/shared/${token}/comments`, {
  content: 'Your comment here',
  page: 1
});
```

### API Response Format
All API responses follow this format:
```javascript
{
  success: true/false,
  data: {}, // Response data
  message: "Success/Error message",
  error: {} // Error details if any
}
```

### Error Handling
```javascript
try {
  const response = await axios.get(`${API_URL}/pdf`);
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Error:', error.response.data.message);
  } else if (error.request) {
    // Request made but no response
    console.error('No response received');
  } else {
    // Request setup error
    console.error('Error:', error.message);
  }
}
```

### CORS Configuration
The backend is configured to accept requests from:
- Development: `http://localhost:3000`
- Production: `https://spotdraft-w59a.onrender.com`

### API Security
- All API endpoints (except login/register) require JWT authentication
- Include the JWT token in the Authorization header:
```javascript
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

## API Endpoints

### Authentication
- POST `/auth/register` - Register a new user
- POST `/auth/login` - Login user
- POST `/auth/forgot-password` - Request password reset
- POST `/auth/reset-password` - Reset password

### PDF Management
- GET `/pdf` - Get all PDFs
- POST `/pdf` - Upload new PDF
- GET `/pdf/:id` - Get PDF by ID
- DELETE `/pdf/:id` - Delete PDF
- POST `/pdf/:id/share` - Share PDF
- GET `/pdf/shared/:token` - Get shared PDF

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@spotdraft.com or create an issue in the repository. 