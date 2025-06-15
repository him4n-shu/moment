const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  googleId: { type: String, unique: true, sparse: true },
  profilePic: { type: String, default: "" },
  bio: { type: String, default: "" },
  fullName: { 
    type: String, 
    default: function() {
      return [this.firstName, this.middleName, this.lastName]
        .filter(Boolean)
        .join(' ');
    }
  },
  isVerified: { type: Boolean, default: false },
  otp: {
    code: { type: String },
    generatedAt: { type: Date },
    expiresAt: { type: Date }
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Add index for OTP fields to improve query performance
userSchema.index({ 'otp.expiresAt': 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('User', userSchema); 