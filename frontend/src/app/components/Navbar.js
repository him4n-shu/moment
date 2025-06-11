"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import ThemeToggle from "./ThemeToggle";
import SearchUsers from "./SearchUsers";
import { FiBell, FiHome, FiPlusSquare, FiMessageCircle, FiUser, FiLogOut, FiLogIn, FiUserPlus } from "react-icons/fi";
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const userMenuRef = useRef(null);
  const router = useRouter();
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5000/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => data ? setUser(data.user) : null)
        .catch(err => console.error("Error fetching user:", err));
        
      // For demo purposes - set a random notification count
      setNotificationCount(Math.floor(Math.random() * 5));
    }
    
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>Moment</h1>
            </Link>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4 relative">
            <SearchUsers />
          </div>
          
          {/* Right Navigation Items */}
          <div className="flex items-center space-x-4">
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
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {user ? (
              <>
                {/* Notifications */}
                <NotificationBell />
                
                {/* User Menu */}
                <div className="relative ml-3" ref={userMenuRef}>
                  <div>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-gray-300 transition duration-150 ease-in-out"
                    >
                      <img
                        className="h-8 w-8 rounded-full object-cover"
                        src={user.profilePic || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                        alt={user.username}
                      />
                    </button>
                  </div>
                  
                  {showUserMenu && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg">
                      <div className="py-1 rounded-md bg-white dark:bg-gray-800 shadow-xs">
                        <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                          <p className="font-medium">{user.username}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        </div>
                        <Link href={`/profile/${user.username}`} className="inline-block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">
                          <div className="flex items-center">
                            <FiUser className="mr-2 h-4 w-4" />
                            Your Profile
                          </div>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                        >
                          <div className="flex items-center">
                            <FiLogOut className="mr-2 h-4 w-4" />
                            Sign out
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  <FiLogIn className="h-5 w-5" />
                </Link>
                <Link href="/register" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  <FiUserPlus className="h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}