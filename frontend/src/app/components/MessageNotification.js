"use client";
import { useState, useEffect, useRef } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/utils/api';
import { playNotificationSound } from '../utils/notificationSound';
import OptimizedImage from './OptimizedImage';
import { useSocket } from '../contexts/SocketContext';

export default function MessageNotification() {
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const { socket } = useSocket();

  useEffect(() => {
    // Fetch unread messages on component mount
    fetchUnreadMessages();

    // Listen for new message events from socket
    if (socket) {
      socket.on('new_message', (message) => {
        // Add the new message to unread messages
        setUnreadMessages(prev => [message, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        // Trigger animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      });

      return () => {
        socket.off('new_message');
      };
    }
  }, [socket]);

  useEffect(() => {
    // Handle clicks outside the dropdown to close it
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(getApiUrl('api/chat/unread'), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread messages');
      }

      const data = await response.json();
      setUnreadMessages(data.messages || []);
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  const handleOpenConversation = (conversationId) => {
    setShowDropdown(false);
    router.push(`/messages?conversation=${conversationId}`);
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm';
    
    return Math.floor(seconds) + 's';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200"
      >
        <FiMessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span 
            className={`absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand-gradient rounded-full transition-transform duration-200 ${
              isAnimating ? 'animate-bounce' : ''
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Messages</h3>
            <Link 
              href="/messages" 
              className="text-sm text-[#FF6B6B] hover:text-[#FF8E53] dark:text-[#FF8E53] dark:hover:text-[#FFD166]"
              onClick={() => setShowDropdown(false)}
            >
              See all
            </Link>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {unreadMessages.length > 0 ? (
              unreadMessages.map((message) => (
                <div
                  key={message._id}
                  onClick={() => handleOpenConversation(message.conversation)}
                  className="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200"
                >
                  <div className="flex items-start space-x-3">
                    <OptimizedImage
                      src={message.sender?.profilePicture || '/default-avatar.png'}
                      alt={message.sender?.username || 'User'}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {message.sender?.username || 'Unknown user'}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No new messages
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}