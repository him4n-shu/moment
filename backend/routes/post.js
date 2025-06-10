const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
      .populate('user', 'username profilePic');
    
    res.json({
      posts: posts.map(post => ({
        id: post._id,
        imageUrl: post.imageUrl,
        imageData: post.imageData, // Include the base64 image data for direct display
        caption: post.caption,
        likesCount: post.likes ? post.likes.length : 0,
        commentsCount: post.comments ? post.comments.length : 0,
        location: post.location,
        user: {
          id: post.user._id,
          username: post.user.username,
          profilePic: post.user.profilePic
        },
        createdAt: post.createdAt
      }))
    });
  } catch (error) {
    console.error('Feed fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like/unlike a post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if the post has already been liked by this user
    const alreadyLiked = post.likes.some(like => like.toString() === req.user._id.toString());
    
    if (alreadyLiked) {
      // Unlike the post
      post.likes = post.likes.filter(like => like.toString() !== req.user._id.toString());
    } else {
      // Like the post
      post.likes.push(req.user._id);
    }
    
    await post.save();
    
    res.json({
      likes: post.likes,
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('Post like error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Comment on a post
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const newComment = {
      user: req.user._id,
      text
    };
    
    post.comments.unshift(newComment);
    await post.save();
    
    // Populate the user details for the new comment
    const populatedPost = await Post.findById(post._id)
      .populate('comments.user', 'username profilePic');
    
    res.status(201).json({
      comments: populatedPost.comments,
      commentsCount: populatedPost.comments.length
    });
  } catch (error) {
    console.error('Comment creation error:', error);
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