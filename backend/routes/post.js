const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Notification = require('../models/Notification');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'post-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});

// Create a post with image URL or base64 image data
router.post('/', auth, async (req, res) => {
  try {
    const { imageUrl, imageData, caption, location } = req.body;
    
    if (!imageUrl && !imageData) {
      return res.status(400).json({ message: 'Either Image URL or Image Data is required' });
    }
    
    // Generate a placeholder URL if only image data is provided
    const finalImageUrl = imageUrl || `data:image/placeholder;base64,${Date.now()}`;
    
    const newPost = new Post({
      user: req.user._id,
      imageUrl: finalImageUrl,
      imageData: imageData || '', // Store base64 image data directly in the database
      caption: caption || '',
      location: location || ''
    });
    
    const post = await newPost.save();
    
    res.status(201).json({
      post: {
        id: post._id,
        imageUrl: post.imageUrl,
        hasImageData: !!post.imageData, // Just send a boolean indicating if image data exists
        caption: post.caption,
        likesCount: 0,
        commentsCount: 0,
        location: post.location,
        createdAt: post.createdAt
      }
    });
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a post with file upload
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    
    // Get the file path relative to uploads directory
    const filePath = req.file.path;
    
    // Read the file as binary data
    const imageBuffer = fs.readFileSync(filePath);
    
    // Convert the binary data to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Get the file type
    const fileType = req.file.mimetype;
    
    // Create a data URL from the base64 string
    const imageDataUrl = `data:${fileType};base64,${base64Image}`;
    
    // Create a URL for the file (as a reference, but we'll actually use the base64 data)
    const serverUrl = `http://localhost:${process.env.PORT || 5000}`;
    const relativePath = path.relative(path.join(__dirname, '../uploads'), filePath);
    const imageUrl = `${serverUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;
    
    // Create and save the post with the base64 image data
    const newPost = new Post({
      user: req.user._id,
      imageUrl: imageUrl, // Keep this for backward compatibility or as a fallback
      imageData: imageDataUrl, // Store the image data directly in the database
      caption: req.body.caption || '',
      location: req.body.location || ''
    });
    
    const post = await newPost.save();
    
    // Delete the file from disk since we're storing it in the database
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file after upload:', err);
    });
    
    res.status(201).json({
      post: {
        id: post._id,
        imageUrl: post.imageUrl,
        hasImageData: !!post.imageData, // Just indicate if there's image data
        caption: post.caption,
        likesCount: 0,
        commentsCount: 0,
        location: post.location,
        createdAt: post.createdAt
      }
    });
  } catch (error) {
    console.error('Post upload error:', error);
    
    // If there's an error, delete the uploaded file if it exists
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all posts (feed)
router.get('/feed', auth, async (req, res) => {
  try {
    // Get all posts from all users, sorted by most recent first
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user', 'username profilePic')
      .populate('likes', 'username profilePic')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profilePic'
        }
      });
    
    res.json({
      success: true,
      posts: posts.map(post => ({
        _id: post._id,
        imageUrl: post.imageUrl,
        imageData: post.imageData,
        caption: post.caption,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        location: post.location,
        isLiked: post.likes.some(like => like._id.toString() === req.user._id.toString()),
        user: {
          id: post.user._id,
          username: post.user.username,
          profilePic: post.user.profilePic || null
        },
        comments: post.comments.map(comment => ({
          id: comment._id,
          text: comment.text,
          date: comment.date,
          user: {
            id: comment.user._id,
            username: comment.user.username,
            profilePic: comment.user.profilePic || null
          }
        })),
        createdAt: post.createdAt
      }))
    });
  } catch (error) {
    console.error('Feed fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch feed',
      error: error.message 
    });
  }
});

// Like a post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user._id);
    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
      
      // Create notification for post like
      if (post.user.toString() !== req.user._id.toString()) {
        const notification = new Notification({
          recipient: post.user,
          sender: req.user._id,
          type: 'like',
          post: post._id
        });
        await notification.save();

        // Get Socket.IO instance and connected users
        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');
        
        // If recipient is connected, send real-time notification
        const recipientSocketId = connectedUsers.get(post.user.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('notification', {
            type: 'like',
            sender: req.user,
            post: post
          });
        }
      }
    }

    await post.save();
    res.json({ 
      isLiked: !isLiked,
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment to a post
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get the full user data
    const user = await User.findById(req.user._id).select('username profilePic');

    const comment = {
      user: user._id,
      text: text.trim(),
      date: new Date()
    };

    post.comments.unshift(comment);
    await post.save();

    // Create notification for comment
    if (post.user.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        recipient: post.user,
        sender: req.user._id,
        type: 'comment',
        post: post._id
      });
      await notification.save();

      // Get Socket.IO instance and connected users
      const io = req.app.get('io');
      const connectedUsers = req.app.get('connectedUsers');
      
      // If recipient is connected, send real-time notification
      const recipientSocketId = connectedUsers.get(post.user.toString());
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('notification', {
          type: 'comment',
          sender: req.user,
          post: post
        });
      }
    }

    // Format the new comment to match the frontend's expected structure
    const newComment = {
      id: comment._id,
      text: comment.text,
      date: comment.date,
      user: {
        id: user._id,
        username: user.username,
        profilePic: user.profilePic || null
      }
    };

    res.json({ 
      newComment,
      commentsCount: post.comments.length 
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if the user owns the post
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized to delete this post' });
    }
    
    await post.remove();
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Post deletion error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 