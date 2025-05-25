# SpotDraft - PDF Management System

A full-stack web application for managing and sharing PDF documents securely. Built with React, Node.js, and MongoDB.

## Features

- 🔐 User Authentication (Signup, Login, Password Reset)
- 📄 PDF Upload and Management
- 🔗 Secure PDF Sharing
- 📱 Responsive Design
- 🔍 PDF Preview and Navigation
- 🔒 Secure Access Control

## Tech Stack

### Frontend
- React.js
- Material-UI
- React Router
- Axios
- PDF.js

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Nodemailer

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Gmail Account (for email functionality)
- npm or yarn

## Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/spotdraft.git
   cd spotdraft
   ```

2. **Install Dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Configure Environment Variables**
   - Create `.env` files in both `server` and `client` directories
   - Add the required environment variables as shown above

4. **Set up Gmail for Email Functionality**
   1. Go to your Google Account settings
   2. Enable 2-Step Verification
   3. Generate an App Password:
      - Go to Security > App passwords
      - Select "Mail" and your device
      - Use the generated password in your `EMAIL_PASSWORD` environment variable

5. **Start the Development Servers**
   ```bash
   # Start backend server (from server directory)
   npm run dev

   # Start frontend server (from client directory)
   npm start
   ```

## Production Deployment

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `EMAIL_USER`
   - `EMAIL_PASSWORD`
   - `FRONTEND_URL` (your frontend URL)
   - `NODE_ENV=production`

### Frontend (Render)
1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Set the following:
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/build`
4. Add environment variable:
   - `REACT_APP_API_URL` (your backend URL)

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - User login
- `POST /auth/reset-password-request` - Request password reset
- `POST /auth/reset-password/:token` - Reset password
- `GET /auth/validate-reset-token/:token` - Validate reset token

### PDF Management
- `POST /api/pdfs/upload` - Upload PDF
- `GET /api/pdfs` - Get user's PDFs
- `GET /api/pdfs/:id` - Get PDF details
- `DELETE /api/pdfs/:id` - Delete PDF
- `POST /api/pdfs/:id/share` - Share PDF
- `GET /shared/:token` - Access shared PDF

## Project Structure

```
spotdraft/
├── client/                 # Frontend React application
│   ├── public/
│   └── src/
│       ├── components/     # React components
│       ├── context/        # Context providers
│       ├── utils/          # Utility functions
│       └── App.js          # Main application component
├── server/                 # Backend Node.js application
│   ├── config/            # Configuration files
│   ├── middleware/        # Custom middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   └── index.js           # Server entry point
└── README.md
```

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