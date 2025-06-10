// server/server.js
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require('./config/passport');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));  // Increased payload size limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));  // Also for URL-encoded data
app.use(passport.initialize());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("✅ MongoDB connected");
  app.listen(process.env.PORT, () =>
    console.log(`🚀 Server running on port ${process.env.PORT}`)
  );
})
.catch((err) => console.error("❌ MongoDB connection error:", err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/posts', require('./routes/post'));
