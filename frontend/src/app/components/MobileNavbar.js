"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMenu, FiX, FiHome, FiSettings, FiLogIn, FiLogOut, FiPlusSquare, FiMessageCircle, FiUsers, FiBell, FiUser, FiSearch } from "react-icons/fi";
import OptimizedImage from './OptimizedImage';
import Image from 'next/image';
import { useSocket } from '../contexts/SocketContext';
import { getApiUrl } from '@/utils/api';
import { playNotificationSound } from '../utils/notificationSound';
import SearchUsers from './SearchUsers';

export default function MobileNavbar({ user, toggleMenu, isOpen }) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const { socket } = useSocket();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const searchModalRef = useRef(null);
  const pathname = usePathname();

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

  // Close search modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchModalRef.current && !searchModalRef.current.contains(event.target)) {
        setShowSearchModal(false);
      }
    }
    
    if (showSearchModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchModal]);

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
              priority
            />
            <Image 
              src="/logos/text-logo.svg" 
              alt="Moment" 
              width={100} 
              height={30} 
              className="h-7 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center space-x-3">
            {user && (
              <>
                <button 
                  onClick={() => setShowSearchModal(true)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-red touch-target"
                  aria-label="Search"
                >
                  <FiSearch className="h-5 w-5" />
                </button>
                <Link href="/notifications" className="relative p-2 touch-target">
                  <FiBell className="h-5 w-5 text-gray-600 dark:text-gray-300 hover:text-brand-red" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand-gradient rounded-full">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            <button 
              onClick={toggleMenu} 
              className="p-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-100 hover:text-brand-red touch-target"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-16">
          <div ref={searchModalRef} className="bg-white dark:bg-gray-800 w-full max-w-md mx-4 rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Search</h3>
              <button 
                onClick={() => setShowSearchModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FiX size={20} />
              </button>
            </div>
            <SearchUsers closeModal={() => setShowSearchModal(false)} />
          </div>
        </div>
      )}

      {/* Slide-in Menu */}
      <div 
        className={`fixed inset-0 z-50 bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} 
        style={{ top: '60px' }}
      >
        <div className="flex flex-col h-full p-4 overflow-y-auto pb-24">
          <div className="flex-1 space-y-4 touch-list">
            {user ? (
              <>
                <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-14 h-14 rounded-full overflow-hidden">
                    <OptimizedImage
                      src={user.profilePic || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                      alt={user.username} 
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-lg text-gray-900 dark:text-white">{user.username}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">View profile</div>
                  </div>
                </div>
                
                <Link href="/" className="flex items-center justify-between p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red touch-target">
                  <div className="flex items-center space-x-3">
                    <FiHome size={22} />
                    <span className="text-base">Home</span>
                  </div>
                  {newPostsCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-brand-gradient rounded-full">
                      {newPostsCount > 99 ? '99+' : newPostsCount}
                    </span>
                  )}
                </Link>
                
                <Link href="/profile" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red touch-target">
                  <FiUser size={22} />
                  <span className="text-base">Profile</span>
                </Link>
                
                <Link href="/feed" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red touch-target">
                  <FiUsers size={22} />
                  <span className="text-base">Feed</span>
                </Link>
                
                <Link href="/messages" className="flex items-center justify-between p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red touch-target">
                  <div className="flex items-center space-x-3">
                    <FiMessageCircle size={22} />
                    <span className="text-base">Messages</span>
                  </div>
                  {messageCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-brand-gradient rounded-full">
                      {messageCount > 99 ? '99+' : messageCount}
                    </span>
                  )}
                </Link>
                
                <Link href="/notifications" className="flex items-center justify-between p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red touch-target">
                  <div className="flex items-center space-x-3">
                    <FiBell size={22} />
                    <span className="text-base">Notifications</span>
                  </div>
                  {notificationCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-brand-gradient rounded-full">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </Link>
                
                <Link href="/post/new" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red touch-target">
                  <FiPlusSquare size={22} />
                  <span className="text-base">Create Post</span>
                </Link>
                
                <Link href="/settings" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red touch-target">
                  <FiSettings size={22} />
                  <span className="text-base">Settings</span>
                </Link>
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red w-full text-left touch-target"
                >
                  <FiLogOut size={22} />
                  <span className="text-base">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red touch-target">
                  <FiHome size={22} />
                  <span className="text-base">Home</span>
                </Link>
                
                <Link href="/login" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red touch-target">
                  <FiLogIn size={22} />
                  <span className="text-base">Login</span>
                </Link>
                
                <Link href="/register" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-red touch-target">
                  <FiUser size={22} />
                  <span className="text-base">Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar - Only visible on mobile */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden shadow-lg">
          <div className="grid grid-cols-5 h-16">
            <Link 
              href="/" 
              className={`flex flex-col items-center justify-center ${
                pathname === '/' 
                  ? 'text-[#FF6B6B]' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#FF6B6B]'
              }`}
            >
              <FiHome className={`h-5 w-5 ${pathname === '/' ? 'stroke-[#FF6B6B]' : ''}`} />
              <span className="text-xs mt-1">Home</span>
            </Link>
            
            <Link 
              href="/feed" 
              className={`flex flex-col items-center justify-center ${
                pathname === '/feed' 
                  ? 'text-[#FF6B6B]' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#FF6B6B]'
              }`}
            >
              <div className="relative">
                <FiUsers className={`h-5 w-5 ${pathname === '/feed' ? 'stroke-[#FF6B6B]' : ''}`} />
                {newPostsCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-brand-gradient rounded-full">
                    {newPostsCount > 9 ? '9+' : newPostsCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">Feed</span>
            </Link>
            
            <Link
              href="/post/new"
              className="flex flex-col items-center justify-center"
            >
              <div className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] rounded-full p-2 -mt-5 shadow-lg border-4 border-white dark:border-gray-900">
                <FiPlusSquare className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs mt-1 text-gray-600 dark:text-gray-300">Post</span>
            </Link>
            
            <Link 
              href="/messages" 
              className={`flex flex-col items-center justify-center ${
                pathname === '/messages' 
                  ? 'text-[#FF6B6B]' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#FF6B6B]'
              }`}
            >
              <div className="relative">
                <FiMessageCircle className={`h-5 w-5 ${pathname === '/messages' ? 'stroke-[#FF6B6B]' : ''}`} />
                {messageCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-brand-gradient rounded-full">
                    {messageCount > 9 ? '9+' : messageCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">Messages</span>
            </Link>
            
            <Link 
              href="/profile" 
              className={`flex flex-col items-center justify-center ${
                pathname === '/profile' 
                  ? 'text-[#FF6B6B]' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#FF6B6B]'
              }`}
            >
              <FiUser className={`h-5 w-5 ${pathname === '/profile' ? 'stroke-[#FF6B6B]' : ''}`} />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
} 