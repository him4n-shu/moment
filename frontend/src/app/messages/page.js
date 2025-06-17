"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSend, FiMoreVertical, FiSmile, FiChevronLeft, FiMenu, FiPlus, FiX, FiSearch } from 'react-icons/fi';
import { useSocket } from '../contexts/SocketContext';
import EmojiPicker from 'emoji-picker-react';
import OptimizedImage from '../components/OptimizedImage';
import { getApiUrl } from '@/utils/api';

export default function MessagesPage() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Define all functions before using them in useEffect
  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(getApiUrl('api/users/profile'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      setCurrentUser(data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error.message);
    }
  }, [router]);

  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(getApiUrl('api/chat/conversations'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError(error.message);
      setLoading(false);
    }
  }, [router]);

  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(getApiUrl(`api/chat/messages/${conversationId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error.message);
    }
  }, []);
  
  const handleConversationSelect = useCallback((conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
    
    // On mobile, hide the conversation list when a conversation is selected
    if (window.innerWidth < 768) {
      setShowConversations(false);
    }
  }, [fetchMessages]);
  
  const handleNewMessage = useCallback((data) => {
    if (data.conversation === selectedConversation?.id) {
      setMessages(prev => [...prev, data.message]);
    } else {
      // Only refresh the conversations list when a message arrives for a different conversation
      // This prevents the infinite loop of API calls
      fetchConversations();
    }
  }, [selectedConversation, fetchConversations]);

  // Now use the functions in useEffect hooks
  useEffect(() => {
    fetchCurrentUser();
    fetchConversations();
  }, [fetchCurrentUser, fetchConversations]);

  useEffect(() => {
    // Hide conversation list on mobile when a specific conversation is selected
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowConversations(!selectedConversation);
      } else {
        setShowConversations(true);
      }
    };

    // Initial check
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedConversation]);

  useEffect(() => {
    // Handle conversation parameter in URL
    const params = new URLSearchParams(window.location.search);
    const conversationId = params.get('conversation');
    if (conversationId && conversations.length > 0) {
      // Try to find the conversation by either id or _id
      const conversation = conversations.find(conv => 
        conv.id === conversationId || conv._id === conversationId
      );
      if (conversation) {
        handleConversationSelect(conversation);
      }
    }
  }, [conversations, handleConversationSelect]);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('new_message', handleNewMessage);
      
      return () => {
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [socket, isConnected, handleNewMessage]);

  // Add click outside handler for emoji picker
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleConversationsList = () => {
    setShowConversations(prev => !prev);
  };

  const handleBackToList = () => {
    if (window.innerWidth < 768) {
      setShowConversations(true);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      content: newMessage,
      sender: { _id: currentUser._id },
      createdAt: new Date().toISOString(),
      isTemp: true
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(getApiUrl('api/chat/messages'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id || selectedConversation._id,
          content: tempMessage.content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages(prev => prev.map(msg => 
        msg.isTemp && msg._id === tempMessage._id ? data.message : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
    }
  };

  // Handle emoji selection
  const onEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(getApiUrl(`api/users/search?query=${encodeURIComponent(searchQuery)}`), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      setSearchResults(data.users);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const startNewConversation = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(getApiUrl('api/chat/conversations'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      
      // Close modal
      setShowNewConversationModal(false);
      setSearchQuery('');
      setSearchResults([]);
      
      // Refresh conversations list and select the new one
      await fetchConversations();
      
      // Find and select the new conversation
      const newConversation = conversations.find(c => 
        c.participants.some(p => p._id === userId || p.id === userId)
      );
      
      if (newConversation) {
        handleConversationSelect(newConversation);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-60px)] md:h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Toggle Button */}
      {selectedConversation && !showConversations && (
        <button 
          onClick={toggleConversationsList}
          className="md:hidden fixed top-16 left-4 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md text-[#FF6B6B]"
          aria-label="Show conversations"
        >
          <FiChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Conversations List */}
      <div 
        className={`${
          showConversations ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 dark:border-gray-700 h-full bg-white dark:bg-gray-800`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white w-full">
          <h1 className="text-xl font-bold">Messages</h1>
          <button 
            onClick={() => setShowNewConversationModal(true)}
            className="p-2 bg-white bg-opacity-20 text-white rounded-full hover:bg-opacity-30 transition-all"
            aria-label="New conversation"
          >
            <FiPlus className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pb-16 md:pb-0">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 p-4 mt-8">
              <p>No conversations yet</p>
              <button 
                onClick={() => setShowNewConversationModal(true)}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-lg hover:shadow-md transition-all"
              >
                Start a New Conversation
              </button>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleConversationSelect(conv)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-gradient-to-r from-[#FF6B6B]/10 to-[#FF8E53]/10 border-l-4 border-[#FF6B6B]' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="relative">
                    <OptimizedImage
                      src={conv.participants[0].profilePic || '/default-avatar.png'}
                      alt={conv.participants[0].username}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {conv.participants[0].isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                    )}
                  </div>
                  <div className="ml-3 md:ml-4 flex-1 overflow-hidden">
                    <div className="font-medium text-gray-900 dark:text-white">{conv.participants[0].username}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[180px] md:max-w-full">
                      {conv.lastMessage?.content || 'No messages yet'}
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="bg-[#FF6B6B] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs ml-2">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${
        !selectedConversation || showConversations ? 'hidden md:flex' : 'flex'
      } flex-col flex-1 h-full`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <header className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white">
              <button 
                onClick={handleBackToList}
                className="md:hidden mr-2 p-1 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                aria-label="Back to conversations"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>
              <Link href={`/profile/${selectedConversation.participants[0].username}`} className="flex items-center flex-1">
                <div className="h-10 w-10 rounded-full overflow-hidden mr-3 border-2 border-white">
                  <OptimizedImage
                    src={selectedConversation.participants[0].profilePic || `/default-avatar.png`}
                    alt={selectedConversation.participants[0].username}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium">{selectedConversation.participants[0].username}</div>
                  <div className="text-xs text-white text-opacity-80">
                    {selectedConversation.participants[0].isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              </Link>
              <button className="ml-auto p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors">
                <FiMoreVertical />
              </button>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-3 md:p-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-3">💬</div>
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">Send a message to start the conversation</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message._id}
                    className={`flex mb-3 md:mb-4 ${
                      message.sender._id === selectedConversation.participants[0]._id
                        ? 'justify-start'
                        : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[70%] rounded-lg p-2 md:p-3 shadow-sm ${
                        message.sender._id === selectedConversation.participants[0]._id
                          ? 'bg-white dark:bg-gray-800'
                          : 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white'
                      } ${message.isTemp ? 'opacity-70' : ''}`}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div className={`text-xs mt-1 text-right ${
                        message.sender._id === selectedConversation.participants[0]._id
                          ? 'text-gray-500 dark:text-gray-400'
                          : 'text-white text-opacity-80'
                      }`}>
                        {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 md:p-4">
              <form onSubmit={handleSendMessage}>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={toggleEmojiPicker}
                    className="p-2 text-gray-500 hover:text-[#FF6B6B] focus:outline-none transition-colors"
                    aria-label="Add emoji"
                  >
                    <FiSmile size={22} />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg mx-2 focus:outline-none focus:ring-2 focus:ring-[#FF8E53] focus:border-[#FF6B6B] dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={`p-2 rounded-lg transition-all ${
                      !newMessage.trim() 
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400' 
                        : 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white hover:shadow-md'
                    }`}
                    aria-label="Send message"
                  >
                    <FiSend />
                  </button>
                </div>
                
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div 
                    ref={emojiPickerRef}
                    className="absolute bottom-16 left-0 md:bottom-20 z-10"
                    style={{ width: '100%', maxWidth: '320px' }}
                  >
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      lazyLoadEmojis={true}
                      theme="auto"
                      width="100%"
                      height="300px"
                    />
                  </div>
                )}
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 p-4 text-center">
            <div>
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-medium mb-2 text-[#FF6B6B]">Your Messages</h3>
              <p>Select a conversation to start chatting</p>
              <button 
                onClick={() => setShowNewConversationModal(true)}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-lg hover:shadow-md transition-all"
              >
                Start a New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white">
              <h2 className="text-lg font-semibold">New Conversation</h2>
              <button onClick={() => {
                setShowNewConversationModal(false);
                setSearchQuery('');
                setSearchResults([]);
              }} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="Search for users..."
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8E53] focus:border-[#FF6B6B] dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleSearch}
                  className="ml-2 p-2 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-lg hover:shadow-md transition-all"
                >
                  <FiSearch size={20} />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto p-2 max-h-[50vh]">
              {searchLoading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="w-8 h-8 rounded-full border-4 border-t-[#FF6B6B] border-r-[#FF8E53] border-b-[#FFD166] border-l-transparent animate-spin"></div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div key={user.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <OptimizedImage
                        src={user.profilePic || '/default-avatar.png'}
                        alt={user.username}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                        {user.fullName && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.fullName}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => startNewConversation(user.id)}
                      className="px-3 py-1 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-full hover:shadow-md transition-all text-sm"
                    >
                      Message
                    </button>
                  </div>
                ))
              ) : searchQuery ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No users found. Try a different search term.
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  Search for users to start a conversation
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 