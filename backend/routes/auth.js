const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/emailService');
const crypto = require('crypto');

const router = express.Router();

// Google OAuth Routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/google/callback?token=${token}`);
  }
);

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Initialize registration
router.post('/register/init', async (req, res) => {
  try {
    const {
      username,
      firstName,
      middleName,
      lastName,
      email,
      password
    } = req.body;

    // Validate required fields
    if (!username || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      if (user.email === email) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (user.username === username) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60000); // 10 minutes expiry

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with unverified status
    user = new User({
      username,
      firstName,
      middleName,
      lastName,
      email,
      password: hashedPassword,
      isVerified: false,
      otp: {
        code: otp,
        generatedAt: now,
        expiresAt
      }
    });

    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      await User.deleteOne({ _id: user._id });
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.status(201).json({
      message: 'Registration initiated. Please verify your email with the OTP sent.',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP and complete registration
router.post('/register/verify', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'Please provide userId and OTP' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return res.status(400).json({ message: 'No OTP found for this user' });
    }

    if (new Date() > new Date(user.otp.expiresAt)) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // Generate JWT token
    const payload = {
      userId: user.id
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resend OTP
router.post('/register/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Please provide userId' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60000); // 10 minutes expiry

    user.otp = {
      code: otp,
      generatedAt: now,
      expiresAt
    };

    await user.save();

    // Send new OTP email
    const emailSent = await sendOTPEmail(user.email, otp);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.json({ message: 'New OTP has been sent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ 
        message: 'Please verify your email first',
        userId: user._id,
        requiresVerification: true
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      userId: user.id
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 