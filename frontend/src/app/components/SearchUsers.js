"use client";
import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import OptimizedImage from './OptimizedImage';
import { getApiUrl } from '@/utils/api';
import { useRouter } from 'next/navigation';

export default function SearchUsers() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const searchTimeout = useRef(null);

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
  };

  const handleUserClick = (user) => {
    router.push(`/profile/${user.username}`);
    setShowResults(false);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          onFocus={() => query.trim() && setShowResults(true)}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-primary focus:border-primary transition-colors duration-200"
          placeholder="Search users..."
        />
        {query && (
          <button 
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
          >
            <FiX className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {showResults && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg max-h-96 overflow-y-auto transition-colors duration-200">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary mr-2"></div>
              Searching...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No users found</div>
          ) : (
            <ul>
              {results.map(user => (
                <li 
                  key={user.id} 
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                  onClick={() => handleUserClick(user)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden">
                      <OptimizedImage
                        src={user.profilePic || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                        alt={user.username}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{user.fullName || ''}</div>
                    </div>
                    {user.isFollowing && (
                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">Following</span>
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