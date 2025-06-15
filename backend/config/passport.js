const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// Debug
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');

// Get the base URL for the backend
const backendUrl = process.env.NODE_ENV === 'production'
  ? process.env.BACKEND_URL || 'https://moment-deuw.onrender.com'
  : 'http://localhost:5000';

// Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          return done(null, user);
        }

        // Extract name parts from profile
        const displayName = profile.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Account';

        // If not, create new user
        user = await User.create({
          username: profile.displayName || `user_${profile.id}`,
          email: profile.emails[0].value,
          password: 'google-oauth-' + Math.random().toString(36).slice(-8), 
          firstName: firstName,
          lastName: lastName,
          isVerified: true 
        });

        return done(null, user);
      } catch (error) {
        console.error('Google authentication error:', error);
        return done(error, null);
      }
    }
  )
);

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.userId).select('-password');
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

module.exports = passport; 