"use client";
import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiLoader } from 'react-icons/fi';
import OptimizedImage from './OptimizedImage';
import { getApiUrl } from '@/utils/api';
import { useRouter } from 'next/navigation';

export default function SearchUsers({ closeModal }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const searchTimeout = useRef(null);
  const inputRef = useRef(null);

  // Focus input when component mounts (especially in modal)
  useEffect(() => {
    if (inputRef.current && closeModal) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [closeModal]);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (value.trim().length > 0) {
      setIsLoading(true);
      setError('');
      
      // Debounce search requests
      searchTimeout.current = setTimeout(async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setError('You must be logged in to search');
            setIsLoading(false);
            return;
          }
          
          const response = await fetch(getApiUrl(`api/users/search?query=${encodeURIComponent(value.trim())}`), {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!response.ok) {
            throw new Error('Failed to search users');
          }
          
          const data = await response.json();
          setResults(data.users || []);
          setShowResults(true);
        } catch (err) {
          console.error('Search error:', err);
          setError(err.message || 'An error occurred during search');
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleUserClick = (user) => {
    router.push(`/profile/${user.username}`);
    setShowResults(false);
    if (closeModal) {
      closeModal();
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <FiLoader className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <FiSearch className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleSearch}
          onFocus={() => query.trim() && setShowResults(true)}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-primary focus:border-primary transition-colors duration-200 text-base"
          placeholder="Search users..."
          aria-label="Search users"
          autoComplete="off"
        />
        {query && (
          <button 
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 touch-target"
            aria-label="Clear search"
          >
            <FiX className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {showResults && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg max-h-[70vh] overflow-y-auto transition-colors duration-200 border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 flex items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#FF6B6B] mr-2"></div>
              Searching...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No users found</div>
          ) : (
            <ul className="touch-list">
              {results.map(user => (
                <li 
                  key={user.id} 
                  className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  onClick={() => handleUserClick(user)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden">
                      <OptimizedImage
                        src={user.profilePic || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                        alt={user.username}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">{user.username}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.fullName || ''}</div>
                    </div>
                    {user.isFollowing && (
                      <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">Following</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
} 