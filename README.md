# PDF Management & Collaboration System

## Overview
This web application allows users to sign up, upload PDFs, share them with others, and collaborate through comments. Invited users can access shared PDFs via a unique link and add comments without needing an account.

## Tech Stack
- **Frontend:** React (with Material-UI)
- **Backend:** Node.js (Express.js)
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **File Storage:** AWS S3 (or local storage for development)
- **PDF Viewing:** PDF.js
- **Email:** SendGrid (for invite emails)

## Project Structure
```
/pdf-collab-app
  /client (React frontend)
  /server (Node.js/Express backend)
  /docs (Documentation)
  README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- MongoDB
- AWS S3 account (or local storage for development)

### Backend Setup
1. Navigate to the server directory:
   ```
   cd server
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/pdf-collab
   JWT_SECRET=your_jwt_secret
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_BUCKET_NAME=your_bucket_name
   SENDGRID_API_KEY=your_sendgrid_api_key
   ```
4. Start the server:
   ```
   npm start
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```
   cd client
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```
4. Start the development server:
   ```
   npm start
   ```

## Features
- User signup and authentication
- PDF file upload and validation
- Dashboard with search functionality
- File sharing via unique links
- Invited user access and commenting
- Security and data privacy measures
- Responsive UI design

## Future Enhancements
- Real-time collaboration
- Version history for PDFs
- Advanced search and filtering
- User roles and permissions

## Deliverables
- A working, deployed application
- Demo video(s)
- GitHub repository with documentation 