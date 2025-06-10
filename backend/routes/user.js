const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');

// Search users by username
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Search for users whose username contains the query string (case insensitive)
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    }).select('username profilePic fullName').limit(10);
    
    res.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Protected route - Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const user = await User.findById(req.user._id);
    const posts = await Post.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        fullName: user.fullName,
        followersCount: user.followers ? user.followers.length : 0,
        followingCount: user.following ? user.following.length : 0,
        postsCount: posts.length,
        createdAt: user.createdAt,
        posts: posts.map(post => ({
          id: post._id,
          imageUrl: post.imageUrl,
          imageData: post.imageData,
          caption: post.caption,
          likesCount: post.likes ? post.likes.length : 0,
          commentsCount: post.comments ? post.comments.length : 0,
          createdAt: post.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, bio, profilePic } = req.body;
    const updateFields = {};
    
    if (fullName) updateFields.fullName = fullName;
    if (bio) updateFields.bio = bio;
    
    // Store the profile picture directly in the database as a base64 string
    if (profilePic) {
      // If it's already a full base64 data URL, store it as is
      // If it's not, you might need to do some conversion depending on your frontend implementation
      updateFields.profilePic = profilePic;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true }
    );
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        fullName: user.fullName,
        followersCount: user.followers ? user.followers.length : 0,
        followingCount: user.following ? user.following.length : 0,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 