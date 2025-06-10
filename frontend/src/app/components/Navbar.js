"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { FiSearch, FiBell, FiHome, FiPlusSquare, FiMessageCircle, FiUser, FiLogOut, FiLogIn, FiUserPlus } from "react-icons/fi";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  
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
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/users/search?query=${searchQuery}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
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
          <div className="flex-1 max-w-md mx-4 relative" ref={searchRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
              />
              {loading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                </div>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden z-10 max-h-60 overflow-y-auto">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((user) => (
                    <li key={user._id}>
                      <Link href={`/profile/${user.username}`} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150" onClick={() => setShowResults(false)}>
                        <div className="flex items-center">
                          <img 
                            src={user.profilePic || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                            alt={user.username}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                            {user.fullName && <p className="text-xs text-gray-500 dark:text-gray-400">{user.fullName}</p>}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                <Link href="/notifications" className="relative p-1">
                  <FiBell className="h-6 w-6 text-gray-600 dark:text-gray-300 transition-colors duration-200" style={{ ':hover': { color: 'var(--primary)' } }} />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold inline-flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </Link>
                
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
                        <Link href="/profile" className="inline-block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">
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
                <Link href="/login" className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white transition-colors duration-150" style={{ backgroundColor: 'var(--primary)', ':hover': { backgroundColor: 'var(--primary-hover)' } }}>
                  <FiLogIn className="mr-1 h-4 w-4" />
                  Login
                </Link>
                <Link href="/register" className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                  <FiUserPlus className="mr-1 h-4 w-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}