const config = {
  API_URL: 'http://localhost:5000',
  FRONTEND_URL: 'http://localhost:3000',
  API_CONFIG: {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
};

export default config; 