const config = {
  API_URL: process.env.NODE_ENV === 'production' 
    ? 'https://spotdraft-backend.onrender.com'
    : 'http://localhost:5000',
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 'https://spotdraft-w59a.onrender.com',
  API_CONFIG: {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
};

export default config; 