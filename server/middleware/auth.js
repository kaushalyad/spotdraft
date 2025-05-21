const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  console.log('Auth middleware:', {
    path: req.path,
    method: req.method,
    headers: req.headers
  });

  // Get token from header
  let token = req.header('x-auth-token');
  
  // If no x-auth-token, check Authorization header
  if (!token && req.header('authorization')) {
    const authHeader = req.header('authorization');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  // Check if no token
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified:', {
      decoded,
      path: req.path,
      userId: decoded.id
    });
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', {
      error: err.message,
      stack: err.stack,
      token: token.substring(0, 10) + '...' // Log only first 10 chars for security
    });
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 