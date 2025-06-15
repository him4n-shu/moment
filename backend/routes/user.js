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

// Get user profile by username
router.get('/profile/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // First try to find by username
    let user = await User.findOne({ 
      username: { $regex: new RegExp('^' + username + '$', 'i') }
    });

    // If not found by username, check if it's a user ID
    if (!user && username.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(username);
    }

    if (!user) {
      return res.status(404).json({ 
        message: `User not found. Please check the username and try again.`
      });
    }

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('likes', 'username profilePic')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profilePic'
        }
      });

    res.json({
      user: {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user._id.equals(req.user._id) ? user.email : undefined,
        profilePic: user.profilePic,
        bio: user.bio,
        fullName: user.fullName,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing: user.followers.includes(req.user._id),
        isCurrentUser: user._id.equals(req.user._id),
        postsCount: posts.length,
        createdAt: user.createdAt,
        posts: posts.map(post => ({
          _id: post._id,
          id: post._id,
          imageUrl: post.imageUrl,
          imageData: post.imageData,
          caption: post.caption,
          likesCount: post.likes.length,
          commentsCount: post.comments.length,
          isLiked: post.likes.some(like => like._id.equals(req.user._id)),
          createdAt: post.createdAt,
          comments: post.comments.map(comment => ({
            id: comment._id,
            text: comment.text,
            date: comment.date,
            user: {
              id: comment.user._id,
              username: comment.user.username,
              profilePic: comment.user.profilePic
            }
          }))
        }))
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
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

// Get current user's profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = await Post.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('likes', 'username profilePic')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profilePic'
        }
      });
    
    res.json({
      user: {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        fullName: user.fullName,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        postsCount: posts.length,
        createdAt: user.createdAt,
        posts: posts.map(post => ({
          _id: post._id,
          id: post._id,
          imageUrl: post.imageUrl,
          imageData: post.imageData,
          caption: post.caption,
          likesCount: post.likes.length,
          commentsCount: post.comments.length,
          isLiked: post.likes.some(like => like._id.equals(req.user._id)),
          createdAt: post.createdAt,
          comments: post.comments.map(comment => ({
            id: comment._id,
            text: comment.text,
            date: comment.date,
            user: {
              id: comment.user._id,
              username: comment.user.username,
              profilePic: comment.user.profilePic
            }
          }))
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
    
    // Find user and update
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (profilePic !== undefined) user.profilePic = profilePic;

    await user.save();

    // Return updated user data
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        fullName: user.fullName,
        followersCount: user.followers.length,
        followingCount: user.following.length
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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

module.exports = router; 