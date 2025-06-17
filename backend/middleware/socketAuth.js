const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Socket.IO authentication middleware
 * Authenticates socket connections using JWT tokens
 */
const socketAuth = async (socket, next) => {
  try {
    // Get token from multiple possible sources
    const authHeader = socket.handshake.headers.authorization || '';
    const tokenFromAuth = socket.handshake.auth.token || '';
    const tokenFromQuery = socket.handshake.query.token || '';
    
    // Try to extract token from various sources
    let token = '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (tokenFromAuth) {
      token = tokenFromAuth.replace('Bearer ', '');
    } else if (tokenFromQuery) {
      token = tokenFromQuery.replace('Bearer ', '');
    }
    
    if (!token) {
      console.error('Socket auth error: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token with timeout to prevent hanging
    const verifyWithTimeout = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Token verification timeout'));
      }, 5000); // 5 second timeout
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        clearTimeout(timeoutId);
        resolve(decoded);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
    
    const decoded = await verifyWithTimeout;
    
    // Handle both token formats
    const userId = decoded.userId || decoded.user?.id || decoded.id;
    
    if (!userId) {
      console.error('Socket auth error: Invalid token format - missing user ID');
      return next(new Error('Authentication error: Invalid token format'));
    }

    // Find user with timeout to prevent hanging
    const findUserWithTimeout = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Database query timeout'));
      }, 5000); // 5 second timeout
      
      User.findById(userId).select('-password')
        .then(user => {
          clearTimeout(timeoutId);
          resolve(user);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
    
    const user = await findUserWithTimeout;
    
    if (!user) {
      console.error('Socket auth error: User not found for ID', userId);
      return next(new Error('Authentication error: User not found'));
    }

    // Add user to socket instance
    socket.user = user;
    socket.userId = userId;
    socket.authTime = Date.now();

    // Log successful connection
    console.log('Socket authenticated for user:', user.username);
    
    next();
  } catch (error) {
    console.error('Socket auth error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    next(new Error('Authentication error: ' + error.message));
  }
};

module.exports = socketAuth; 