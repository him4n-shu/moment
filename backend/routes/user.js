const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// Search users by username or full name
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Search for users whose username or fullName contains the query string (case insensitive)
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username profilePic fullName followers')
    .limit(10);
    
    // Add isFollowing field to each user
    const usersWithFollowStatus = users.map(user => ({
      id: user._id,
      username: user.username,
      profilePic: user.profilePic,
      fullName: user.fullName,
      isFollowing: user.followers.includes(req.user._id),
      followersCount: user.followers.length
    }));
    
    res.json({ users: usersWithFollowStatus });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Follow/Unfollow a user
router.post('/follow/:userId', auth, async (req, res) => {
  try {
    console.log('Follow request received:', {
      targetUserId: req.params.userId,
      currentUserId: req.user._id.toString()
    });

    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // Find users with lean() to get plain objects
    const userToFollow = await User.findById(req.params.userId);
    console.log('User to follow found:', userToFollow ? 'Yes' : 'No');
    
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);
    console.log('Current user found:', currentUser ? 'Yes' : 'No');
    
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }

    const isFollowing = userToFollow.followers.includes(req.user._id);
    console.log('Current follow status:', { isFollowing });
    
    try {
      if (isFollowing) {
        // Unfollow - Use updateOne to modify only the necessary fields
        await User.updateOne(
          { _id: userToFollow._id },
          { $pull: { followers: req.user._id } }
        );
        await User.updateOne(
          { _id: currentUser._id },
          { $pull: { following: userToFollow._id } }
        );
        console.log('Unfollowed successfully');
      } else {
        // Follow - Use updateOne to modify only the necessary fields
        await User.updateOne(
          { _id: userToFollow._id },
          { $addToSet: { followers: req.user._id } }
        );
        await User.updateOne(
          { _id: currentUser._id },
          { $addToSet: { following: userToFollow._id } }
        );
        console.log('Followed successfully');

        try {
          // Create notification for new follow
          const notification = new Notification({
            recipient: userToFollow._id,
            sender: req.user._id,
            type: 'follow'
          });
          await notification.save();
          console.log('Notification created successfully');

          // Send real-time notification if user is connected
          const io = req.app.get('io');
          const connectedUsers = req.app.get('connectedUsers');
          const recipientSocketId = connectedUsers.get(userToFollow._id.toString());
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('notification', {
              type: 'follow',
              sender: {
                id: req.user._id,
                username: req.user.username,
                profilePic: req.user.profilePic
              }
            });
            console.log('Real-time notification sent');
          }
        } catch (notifError) {
          console.error('Notification error:', notifError);
          // Don't fail the follow operation if notification fails
        }
      }

      // Get updated followers count
      const updatedUser = await User.findById(userToFollow._id);
      
      return res.json({
        isFollowing: !isFollowing,
        followersCount: updatedUser.followers.length
      });
    } catch (updateError) {
      console.error('Error updating follow status:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('Follow/unfollow error:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.userId
    });
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: 'Error occurred while processing follow/unfollow request'
    });
  }
});

// Get user's followers
router.get('/followers/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'username profilePic fullName');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followers = user.followers.map(follower => ({
      id: follower._id,
      username: follower.username,
      profilePic: follower.profilePic,
      fullName: follower.fullName,
      isFollowing: follower.followers.includes(req.user._id)
    }));

    res.json({ followers });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's following
router.get('/following/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', 'username profilePic fullName');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const following = user.following.map(followed => ({
      id: followed._id,
      username: followed.username,
      profilePic: followed.profilePic,
      fullName: followed.fullName,
      isFollowing: true // Since these are users we're following
    }));

    res.json({ following });
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user's profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -__v');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add follower and following counts
    const userObj = user.toObject();
    userObj.followersCount = user.followers.length;
    userObj.followingCount = user.following.length;

    res.json({ user: userObj });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile by username
router.get('/profile/:username', auth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -__v');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user is following this user
    const isFollowing = user.followers.includes(req.user._id);
    
    // Check if this is the current user's profile
    const isCurrentUser = user._id.toString() === req.user._id.toString();

    // Add follower and following counts
    const userObj = user.toObject();
    userObj.followersCount = user.followers.length;
    userObj.followingCount = user.following.length;

    res.json({ 
      user: userObj,
      isFollowing,
      isCurrentUser
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, bio, profilePic } = req.body;
    
    // Fields to update
    const updateFields = {};
    if (fullName !== undefined) updateFields.fullName = fullName;
    if (bio !== undefined) updateFields.bio = bio;
    if (profilePic !== undefined) updateFields.profilePic = profilePic;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true }
    ).select('-password -__v');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add follower and following counts
    const userObj = user.toObject();
    userObj.followersCount = user.followers.length;
    userObj.followingCount = user.following.length;

    res.json({ 
      message: 'Profile updated successfully',
      user: userObj
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 