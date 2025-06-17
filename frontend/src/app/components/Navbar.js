"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import SearchUsers from "./SearchUsers";
import { FiBell, FiHome, FiPlusSquare, FiMessageCircle, FiSettings, FiLogOut, FiLogIn, FiUserPlus, FiWifiOff, FiAlertCircle, FiUser } from "react-icons/fi";
import NotificationBell from './NotificationBell';
import MessageNotification from './MessageNotification';
import FeedNotification from './FeedNotification';
import Image from 'next/image';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  
  const userMenuRef = useRef(null);
  const router = useRouter();
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Retry fetching user data when back online
      fetchUserProfile();
    };
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial state
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Helper to get the correct profile picture URL
  const getProfilePictureUrl = (user) => {
    console.log('User object:', user); // Log the entire user object
    
    // If no user or no profile picture, use a generated avatar
    if (!user || (!user.profilePic && !user.profilePicture)) {
      const fallbackUrl = `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random&format=png`;
      console.log('Using fallback URL:', fallbackUrl);
      return fallbackUrl;
    }
    
    // Check both possible property names
    const profilePic = user.profilePic || user.profilePicture;
    console.log('Profile pic value:', profilePic);
    
    // If it's already an absolute URL, use it directly
    if (profilePic.startsWith('http')) {
      console.log('Using absolute URL:', profilePic);
      return profilePic;
    }
    
    // Otherwise, it's a relative path from the backend
    // Make sure it has a leading slash
    const path = profilePic.startsWith('/') ? profilePic : `/${profilePic}`;
    const fullUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`;
    console.log('Constructed URL:', fullUrl);
    return fullUrl;
  };
  
  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('Fetching user basic info...');
      // Only fetch minimal user info (username and profile pic) instead of full profile
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      console.log('User data:', data);
      setUser(data.user || data);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);
  
  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push('/login');
  };
  
  return (
    <nav className="sticky top-0 z-50 shadow-md transition-colors duration-300 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image 
                src="/logos/m-logo.svg" 
                alt="M Logo" 
                width={32} 
                height={32} 
                className="h-8 w-auto mr-2"
              />
              <Image 
                src="/logos/text-logo.svg" 
                alt="Moment" 
                width={120} 
                height={40} 
                className="h-8 w-auto hidden sm:block"
              />
            </Link>
            
            {/* Status indicators */}
            {isOffline && (
              <div className="ml-2 hidden sm:flex items-center text-amber-500 text-xs" title="You are offline">
                <FiWifiOff className="mr-1" /> Offline
              </div>
            )}
            
            {!isOffline && fetchError && (
              <div className="ml-2 hidden sm:flex items-center text-red-500 text-xs" title="Could not connect to server">
                <FiAlertCircle className="mr-1" /> Server unavailable
              </div>
            )}
          </div>
          
          {/* Search Bar - Hidden on smallest screens */}
          <div className="hidden sm:flex flex-1 max-w-[200px] md:max-w-md mx-2 md:mx-4 relative">
            <SearchUsers />
          </div>
          
          {/* Right Navigation Items */}
          <div className="hidden md:flex space-x-1">
            <FeedNotification />
            <Link href="/post/new" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 hover:text-brand-red">
              <FiPlusSquare className="h-5 w-5" />
            </Link>
            <MessageNotification />
          </div>
          
          {/* Notification Bell */}
          <div className="flex items-center">
            <NotificationBell />
          
            {/* User Menu */}
            <div className="ml-2 relative" ref={userMenuRef}>
              <div>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex text-sm rounded-full focus:outline-none"
                >
                  <img 
                    src={user?.profilePic || user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random&format=png`}
                    alt={user?.username || "Profile"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </button>
              </div>
              
              {showUserMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                  <Link
                    href="/profile"
                    className="inline-flex w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 items-center hover:text-brand-red"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <FiUser className="mr-2" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="inline-flex w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 items-center hover:text-brand-red"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <FiSettings className="mr-2" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="inline-flex w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 items-center hover:text-brand-red"
                  >
                    <FiLogOut className="mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Search Bar - Only visible on smallest screens */}
      <div className="sm:hidden px-2 pb-2">
        <SearchUsers />
      </div>
    </nav>
  );
}