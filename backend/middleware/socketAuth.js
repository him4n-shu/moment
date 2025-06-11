const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketAuth = async (socket, next) => {
  try {
    // Get token from handshake auth or query (fallback)
    const token = socket.handshake.auth.token?.replace('Bearer ', '') || 
                 socket.handshake.query.token?.replace('Bearer ', '');
    
    if (!token) {
      console.error('Socket auth error: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle both token formats
    const userId = decoded.userId || decoded.user?.id;
    
    if (!userId) {
      console.error('Socket auth error: Invalid token format');
      return next(new Error('Authentication error: Invalid token format'));
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.error('Socket auth error: User not found');
      return next(new Error('Authentication error: User not found'));
    }

    // Add user to socket instance
    socket.user = user;

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