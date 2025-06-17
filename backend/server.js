require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require('./config/passport');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const socketAuth = require('./middleware/socketAuth');

// Debug: Check environment variables
console.log('Environment Variables Check:', {
  port: process.env.PORT,
  mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not Set',
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASSWORD ? `Length: ${process.env.EMAIL_PASSWORD.length}` : 'Not Set',
  nodeEnv: process.env.NODE_ENV
});

const app = express();
const httpServer = createServer(app);

// Configure CORS for both Express and Socket.IO
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

// Initialize Socket.IO with improved configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'], // Prefer websocket first for better performance
  connectTimeout: 45000,
  allowEIO3: true,
  maxHttpBufferSize: 1e8, 
  path: '/socket.io/',
  cookie: {
    name: 'io',
    httpOnly: true,
    sameSite: 'lax' // Changed from 'strict' for better cross-domain support
  }
});

// Store connected users with timestamp for monitoring
const connectedUsers = new Map();

// Socket.IO middleware
io.use(socketAuth);

// Socket.IO error handling
io.engine.on("connection_error", (err) => {
  console.error('Socket.IO connection error:', err);
});

// Monitor socket connections
setInterval(() => {
  const activeConnections = io.engine.clientsCount;
  console.log(`Active socket connections: ${activeConnections}`);
  
  // Check for stale connections
  const now = Date.now();
  connectedUsers.forEach((data, userId) => {
    const timeSinceLastActivity = now - data.lastActivity;
    if (timeSinceLastActivity > 3600000) { // 1 hour
      console.log(`Potential stale connection for user ${data.username}, inactive for ${timeSinceLastActivity/1000}s`);
    }
  });
}, 300000); // Every 5 minutes

io.on('connection', (socket) => {
  console.log('A user connected:', socket.user.username);

  // Store user's socket connection with timestamp
  connectedUsers.set(socket.user._id.toString(), {
    socketId: socket.id,
    username: socket.user.username,
    connectedAt: Date.now(),
    lastActivity: Date.now()
  });

  // Update last activity on any event
  socket.onAny(() => {
    if (connectedUsers.has(socket.user._id.toString())) {
      const userData = connectedUsers.get(socket.user._id.toString());
      userData.lastActivity = Date.now();
      connectedUsers.set(socket.user._id.toString(), userData);
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error for user', socket.user.username, ':', error);
  });

  // Handle ping from client
  socket.on('client_ping', () => {
    socket.emit('server_pong', { timestamp: Date.now() });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.user.username, 'Reason:', reason);
    
    // Keep the record for a short time in case they reconnect
    setTimeout(() => {
      // Only remove if this specific socket ID is still the one in the map
      const userData = connectedUsers.get(socket.user._id.toString());
      if (userData && userData.socketId === socket.id) {
        connectedUsers.delete(socket.user._id.toString());
        console.log('User connection record removed:', socket.user.username);
      }
    }, 10000); // Wait 10 seconds before removing
  });
});

// Make io accessible to routes
app.set('io', io);
app.set('connectedUsers', connectedUsers);

app.use(express.json({ limit: '50mb' }));  
app.use(express.urlencoded({ extended: true, limit: '50mb' })); 
app.use(passport.initialize());

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Log request completion
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} completed in ${duration}ms with status ${res.statusCode}`);
  });

  next();
});

// Add health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Moment API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount
  });
});

// Root endpoint for basic health check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Moment API is running',
    version: '1.0.0'
  });
});

// Root endpoint for basic health check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Moment API is running',
    version: '1.0.0'
  });
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    headers: req.headers
  });

  res.status(500).json({
    message: 'Server error',
    error: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("✅ MongoDB connected");
  httpServer.listen(process.env.PORT, () =>
    console.log(`🚀 Server running on port ${process.env.PORT}`)
  );
})
.catch((err) => console.error("❌ MongoDB connection error:", err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/posts', require('./routes/post'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));
