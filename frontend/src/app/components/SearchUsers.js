"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FiSearch, FiX } from 'react-icons/fi';
import OptimizedImage from './OptimizedImage';
import { getApiUrl } from '@/utils/api';

export default function SearchUsers() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    // Handle clicks outside of search results
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(getApiUrl(`api/users/search?query=${encodeURIComponent(query)}`), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to search users');
        }

        const data = await response.json();
        setResults(data.users);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setError('Failed to search users');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimeout);
  }, [query]);

  const handleFollow = async (userId, isFollowing) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(getApiUrl(`api/users/follow/${userId}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to follow/unfollow user');
      }

      const data = await response.json();
      
      // Update the results state to reflect the new follow status
      setResults(prevResults =>
        prevResults.map(user =>
          user.id === userId
            ? {
                ...user,
                isFollowing: data.isFollowing,
                followersCount: data.followersCount
              }
            : user
        )
      );
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  return (
    <div className="relative w-full max-w-[250px] md:max-w-md" ref={searchRef}>
      <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex-1 flex items-center">
          <FiSearch className="ml-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-2 pl-2 text-sm border-none focus:ring-0 bg-transparent"
            style={{ 
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)'
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="p-2"
            >
              <FiX className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {showResults && (results.length > 0 || loading || error) && (
        <div className="absolute w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto min-w-[280px]">
          {loading && (
            <div className="p-4 text-center text-gray-500">
              Searching...
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-red-500">
              {error}
            </div>
          )}

          {!loading && !error && results.map(user => (
            <div
              key={user.id}
              className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between flex-wrap sm:flex-nowrap"
            >
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center flex-1"
                onClick={() => setShowResults(false)}
              >
                <OptimizedImage
                  src={user.profilePicture || '/default-avatar.png'}
                  alt={user.username}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full"
                />
                <div className="ml-3">
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {user.fullName}
                  </div>
                </div>
              </Link>
              
              <button
                onClick={() => handleFollow(user.id, user.isFollowing)}
                className={`px-4 py-1 rounded-full text-sm font-medium mt-2 sm:mt-0 ${
                  user.isFollowing
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {user.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 