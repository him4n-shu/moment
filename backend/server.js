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

// Initialize Socket.IO with extended configuration
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
  transports: ['polling', 'websocket'], 
  allowEIO3: true,
  maxHttpBufferSize: 1e8, 
  path: '/socket.io/',
  cookie: {
    name: 'io',
    httpOnly: true,
    sameSite: 'strict'
  }
});

// Store connected users
const connectedUsers = new Map();

// Socket.IO middleware
io.use(socketAuth);

// Socket.IO error handling
io.engine.on("connection_error", (err) => {
  console.error('Socket.IO connection error:', err);
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.user.username);

  // Store user's socket connection
  connectedUsers.set(socket.user._id.toString(), socket.id);

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error for user', socket.user.username, ':', error);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    connectedUsers.delete(socket.user._id.toString());
    console.log('User disconnected:', socket.user.username, 'Reason:', reason);
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
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Moment API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
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
