"use client";
import { useState, useEffect, useRef } from 'react';
import { FiHome } from 'react-icons/fi';
import Link from 'next/link';
import { getApiUrl } from '@/utils/api';
import { playNotificationSound } from '../utils/notificationSound';
import OptimizedImage from './OptimizedImage';
import { useSocket } from '../contexts/SocketContext';

export default function FeedNotification() {
  const [newPosts, setNewPosts] = useState([]);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef(null);
  const { socket } = useSocket();

  useEffect(() => {
    // Fetch new posts count on component mount
    fetchNewPostsCount();

    // Listen for new post events from socket
    if (socket) {
      socket.on('new_post', (post) => {
        // Add the new post to the list
        setNewPosts(prev => [post, ...prev]);
        setNewPostsCount(prev => prev + 1);
        playNotificationSound();
        // Trigger animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      });

      return () => {
        socket.off('new_post');
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

  const fetchNewPostsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(getApiUrl('api/post/new'), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch new posts');
      }

      const data = await response.json();
      setNewPosts(data.posts || []);
      setNewPostsCount(data.posts?.length || 0);
    } catch (error) {
      console.error('Error fetching new posts:', error);
    }
  };

  const clearNewPosts = () => {
    setNewPosts([]);
    setNewPostsCount(0);
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
        <FiHome className="w-6 h-6" />
        {newPostsCount > 0 && (
          <span 
            className={`absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand-gradient rounded-full transition-transform duration-200 ${
              isAnimating ? 'animate-bounce' : ''
            }`}
          >
            {newPostsCount > 99 ? '99+' : newPostsCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Posts</h3>
            <Link 
              href="/" 
              className="text-sm text-[#FF6B6B] hover:text-[#FF8E53] dark:text-[#FF8E53] dark:hover:text-[#FFD166]"
              onClick={() => {
                setShowDropdown(false);
                clearNewPosts();
              }}
            >
              View all
            </Link>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {newPosts.length > 0 ? (
              newPosts.map((post) => (
                <Link
                  key={post._id}
                  href={`/post/${post._id}`}
                  className="block p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200"
                  onClick={() => setShowDropdown(false)}
                >
                  <div className="flex items-start space-x-3">
                    <OptimizedImage
                      src={post.author?.profilePicture || '/default-avatar.png'}
                      alt={post.author?.username || 'User'}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {post.author?.username || 'Unknown user'}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(post.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {post.content}
                      </p>
                    </div>
                    {post.imageUrl && (
                      <div className="flex-shrink-0">
                        <OptimizedImage
                          src={post.imageUrl}
                          alt="Post"
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded object-cover"
                        />
                      </div>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No new posts
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
