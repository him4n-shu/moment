const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// Get all conversations for the current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .sort({ updatedAt: -1 })
    .populate('participants', 'username profilePic')
    .populate('lastMessage');

    // Format conversations for the client
    const formattedConversations = conversations.map(conv => ({
      id: conv._id,
      participants: conv.participants.filter(p => !p._id.equals(req.user._id)),
      lastMessage: conv.lastMessage,
      unreadCount: conv.unreadCount.get(req.user._id.toString()) || 0,
      updatedAt: conv.updatedAt
    }));

    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a specific conversation
router.get('/messages/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is part of the conversation
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({
      conversation: req.params.conversationId
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('sender', 'username profilePic');

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        recipient: req.user._id,
        read: false
      },
      { read: true }
    );

    // Update unread count
    conversation.unreadCount.set(req.user._id.toString(), 0);
    await conversation.save();

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start a new conversation or get existing one
router.post('/conversations', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if conversation already exists
    const existingConv = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] }
    });

    if (existingConv) {
      return res.json({ conversationId: existingConv._id });
    }

    // Create new conversation
    const newConv = await Conversation.create({
      participants: [req.user._id, userId]
    });

    res.json({ conversationId: newConv._id });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a message
router.post('/messages', auth, async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    
    if (!conversationId || !content) {
      return res.status(400).json({ message: 'Conversation ID and content are required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is part of the conversation
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
    }

    // Get recipient (the other participant)
    const recipient = conversation.participants.find(p => !p.equals(req.user._id));

    // Create message
    const message = await Message.create({
      sender: req.user._id,
      recipient,
      content,
      conversation: conversationId
    });

    // Update conversation
    conversation.lastMessage = message._id;
    // Increment unread count for recipient
    const currentCount = conversation.unreadCount.get(recipient.toString()) || 0;
    conversation.unreadCount.set(recipient.toString(), currentCount + 1);
    await conversation.save();

    // Populate sender info
    await message.populate('sender', 'username profilePic');

    // Emit socket event to recipient
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const recipientSocketId = connectedUsers.get(recipient.toString());
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new_message', {
        message,
        conversation: conversationId
      });
    }

    res.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 