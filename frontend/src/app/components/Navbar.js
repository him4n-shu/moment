"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import SearchUsers from "./SearchUsers";
import { FiBell, FiHome, FiPlusSquare, FiMessageCircle, FiUser, FiLogOut, FiLogIn, FiUserPlus, FiWifiOff, FiAlertCircle } from "react-icons/fi";
import NotificationBell from './NotificationBell';

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
  
  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    setFetchError(false);
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Token invalid, redirect to login
            localStorage.removeItem("token");
            router.push('/login');
            return;
          }
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.user) {
          setUser(data.user);
          // For demo purposes - set a random notification count
          setNotificationCount(Math.floor(Math.random() * 5));
          return; // Success, exit retry loop
        }
      } catch (err) {
        console.error(`Error fetching user (attempt ${retries + 1}/${maxRetries}):`, err);
        retries++;
        
        if (retries >= maxRetries) {
          // Max retries reached, show error state
          setFetchError(true);
          // Check if network issue
          if (!navigator.onLine || err.message === "Failed to fetch") {
            setIsOffline(true);
          }
          return;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
  };
  
  useEffect(() => {
    fetchUserProfile();
    
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
    <nav className="sticky top-0 z-50 shadow-md transition-colors duration-300" style={{ backgroundColor: 'var(--navbar-bg)', color: 'var(--navbar-text)', borderBottom: '1px solid var(--navbar-border)' }}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--primary)' }}>Moment</h1>
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
            <Link href="/" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200" style={{ ':hover': { color: 'var(--primary)' } }}>
              <FiHome className="h-5 w-5" />
            </Link>
            <Link href="/post/new" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200" style={{ ':hover': { color: 'var(--primary)' } }}>
              <FiPlusSquare className="h-5 w-5" />
            </Link>
            <Link href="/messages" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200" style={{ ':hover': { color: 'var(--primary)' } }}>
              <FiMessageCircle className="h-5 w-5" />
            </Link>
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
                    className="h-8 w-8 rounded-full object-cover"
                    src={user?.profilePic || "/default-avatar.png"}
                    alt="User profile"
                  />
                </button>
              </div>
              
              {showUserMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Your Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
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