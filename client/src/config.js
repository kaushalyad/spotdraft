const config = {
  API_URL: process.env.NODE_ENV === 'production' 
    ? 'https://spotdraft-backend.onrender.com'
    : 'http://localhost:5000'
};

export default config; 