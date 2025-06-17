"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FiMenu, FiX, FiHome, FiSettings, FiLogIn, FiLogOut, FiPlusSquare, FiMessageCircle, FiUsers, FiBell, FiUser } from "react-icons/fi";
import OptimizedImage from './OptimizedImage';
import Image from 'next/image';
import { useSocket } from '../contexts/SocketContext';
import { getApiUrl } from '@/utils/api';
import { playNotificationSound } from '../utils/notificationSound';

export default function MobileNavbar({ user, toggleMenu, isOpen }) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    if (!user) return;
    
    // Fetch initial counts
    fetchNotificationCount();
    fetchMessageCount();
    fetchNewPostsCount();

    // Listen for socket events
    if (socket) {
      socket.on('notification', () => {
        setNotificationCount(prev => prev + 1);
        playNotificationSound();
      });

      socket.on('new_message', () => {
        setMessageCount(prev => prev + 1);
        playNotificationSound();
      });

      socket.on('new_post', () => {
        setNewPostsCount(prev => prev + 1);
        playNotificationSound();
      });

      return () => {
        socket.off('notification');
        socket.off('new_message');
        socket.off('new_post');
      };
    }
  }, [socket, user]);

  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(getApiUrl('api/notifications/count'), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification count');
      }

      const data = await response.json();
      setNotificationCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const fetchMessageCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(getApiUrl('api/chat/unread/count'), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread message count');
      }

      const data = await response.json();
      setMessageCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread message count:', error);
    }
  };

  const fetchNewPostsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(getApiUrl('api/post/new/count'), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch new posts count');
      }

      const data = await response.json();
      setNewPostsCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching new posts count:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-10 shadow-md bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="flex justify-between items-center px-3 py-3">
          <Link href="/" className="flex-shrink-0 flex items-center">
            <Image 
              src="/logos/m-logo.svg" 
              alt="M Logo" 
              width={28} 
              height={28} 
              className="h-7 w-auto mr-1"
            />
            <Image 
              src="/logos/text-logo.svg" 
              alt="Moment" 
              width={100} 
              height={30} 
              className="h-7 w-auto"
            />
          </Link>
          <div className="flex items-center space-x-2">
            {user && (
              <Link href="/notifications" className="relative p-1 mr-1">
                <FiBell className="h-5 w-5 text-gray-600 dark:text-gray-300 hover:text-brand-red" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-brand-gradient rounded-full">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Link>
            )}
            <button onClick={toggleMenu} className="p-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-100 hover:text-brand-red">
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-50 bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ top: '60px' }}>
        <div className="flex flex-col h-full p-4 overflow-y-auto pb-20">
          <div className="flex-1 space-y-4">
            {user ? (
              <>
                <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <OptimizedImage
                      src={user.profilePic || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                      alt={user.username} 
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                  </div>
                </div>
                
                <Link href="/" className="flex items-center justify-between p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red">
                  <div className="flex items-center space-x-3">
                    <FiHome size={20} />
                    <span>Home</span>
                  </div>
                  {newPostsCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-brand-gradient rounded-full">
                      {newPostsCount > 99 ? '99+' : newPostsCount}
                    </span>
                  )}
                </Link>
                
                <Link href="/profile" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red">
                  <FiUser size={20} />
                  <span>Profile</span>
                </Link>
                
                <Link href="/feed" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red">
                  <FiUsers size={20} />
                  <span>Feed</span>
                </Link>
                
                <Link href="/messages" className="flex items-center justify-between p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red">
                  <div className="flex items-center space-x-3">
                    <FiMessageCircle size={20} />
                    <span>Messages</span>
                  </div>
                  {messageCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-brand-gradient rounded-full">
                      {messageCount > 99 ? '99+' : messageCount}
                    </span>
                  )}
                </Link>
                
                <Link href="/notifications" className="flex items-center justify-between p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red">
                  <div className="flex items-center space-x-3">
                    <FiBell size={20} />
                    <span>Notifications</span>
                  </div>
                  {notificationCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-brand-gradient rounded-full">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </Link>
                
                <Link href="/post/new" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red">
                  <FiPlusSquare size={20} />
                  <span>Create Post</span>
                </Link>
                
                <Link href="/settings" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red">
                  <FiSettings size={20} />
                  <span>Settings</span>
                </Link>
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red w-full text-left"
                >
                  <FiLogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red">
                  <FiHome size={20} />
                  <span>Home</span>
                </Link>
                
                <Link href="/login" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red">
                  <FiLogIn size={20} />
                  <span>Login</span>
                </Link>
                
                <Link href="/register" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red">
                  <FiUser size={20} />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar - Only visible on mobile */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden">
          <div className="flex justify-around items-center py-2">
            <Link href="/" className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-300 hover:text-brand-red">
              <FiHome className="h-6 w-6" />
              <span className="text-xs mt-1">Home</span>
            </Link>
            
            <Link href="/feed" className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-300 hover:text-brand-red">
              <div className="relative">
                <FiUsers className="h-6 w-6" />
                {newPostsCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-brand-gradient rounded-full">
                    {newPostsCount > 9 ? '9+' : newPostsCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">Feed</span>
            </Link>
            
            <Link href="/post/new" className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-300 hover:text-brand-red">
              <FiPlusSquare className="h-6 w-6" />
              <span className="text-xs mt-1">Create</span>
            </Link>
            
            <Link href="/messages" className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-300 hover:text-brand-red">
              <div className="relative">
                <FiMessageCircle className="h-6 w-6" />
                {messageCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-brand-gradient rounded-full">
                    {messageCount > 9 ? '9+' : messageCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">Messages</span>
            </Link>
            
            <Link href="/profile" className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-300 hover:text-brand-red">
              <FiUser className="h-6 w-6" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
} 