"use client";
import { useState, useEffect } from "react";
import { FiHeart, FiMessageCircle, FiBookmark, FiClock, FiRefreshCw } from "react-icons/fi";
import Link from "next/link";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch the feed on component mount and every 30 seconds
  useEffect(() => {
    fetchFeed();
    
    // Auto-refresh the feed every 30 seconds
    const interval = setInterval(() => {
      fetchFeed(false); // Silent refresh (no loading indicator)
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchFeed = async (showLoading = true) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view the feed");
      setLoading(false);
      return;
    }

    if (showLoading) {
      setRefreshing(true);
    }

    try {
      const response = await fetch("http://localhost:5000/api/posts/feed", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feed");
      }

      const data = await response.json();
      setPosts(data.posts);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching feed:", error);
      if (showLoading) {
        setError("Failed to load feed. Please try again later.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchFeed(true);
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format last refresh time
  const formatLastRefresh = () => {
    const now = new Date();
    const diff = Math.floor((now - lastRefresh) / 1000);
    
    if (diff < 5) {
      return "just now";
    } else if (diff < 60) {
      return `${diff} seconds ago`;
    } else {
      return `${Math.floor(diff / 60)} minutes ago`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto pt-8 px-4">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <p>{error}</p>
          {!localStorage.getItem("token") && (
            <Link href="/login" className="mt-2 inline-block text-blue-600 dark:text-blue-400 hover:underline">
              Login to view the feed
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-4 md:pt-8 px-3 md:px-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Global Feed</h1>
        <div className="flex items-center">
          <button 
            onClick={handleManualRefresh} 
            disabled={refreshing}
            className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            <FiRefreshCw className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <span className="ml-3 text-xs text-gray-500 dark:text-gray-500">
            Updated {formatLastRefresh()}
          </span>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">No posts available yet.</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Be the first to share something amazing!
          </p>
          <Link 
            href="/post/new" 
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create a Post
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div 
              key={post.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              {/* Post Header */}
              <div className="flex items-center p-3 border-b border-gray-200 dark:border-gray-700">
                <Link href={`/profile/${post.user.id}`} className="w-10 h-10 rounded-full overflow-hidden mr-3">
                  <img 
                    src={post.user.profilePic || `https://ui-avatars.com/api/?name=${post.user.username}&background=random`} 
                    alt={post.user.username}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div>
                  <Link href={`/profile/${post.user.id}`} className="font-medium text-gray-900 dark:text-gray-100">
                    {post.user.username}
                  </Link>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <FiClock className="mr-1 h-3 w-3" />
                    {formatDate(post.createdAt)}
                  </div>
                </div>
              </div>
              
              {/* Post Image - Use imageData if available, otherwise fall back to imageUrl */}
              <div className="relative aspect-square w-full">
                <img 
                  src={post.imageData || post.imageUrl} 
                  alt="Post" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Post Actions */}
              <div className="flex justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-4">
                  <button className="flex items-center text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200">
                    <FiHeart className="mr-1" />
                    <span>{post.likesCount}</span>
                  </button>
                  <button className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">
                    <FiMessageCircle className="mr-1" />
                    <span>{post.commentsCount}</span>
                  </button>
                </div>
                <button className="text-gray-700 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors duration-200">
                  <FiBookmark />
                </button>
              </div>
              
              {/* Caption */}
              {post.caption && (
                <div className="p-3 text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-semibold mr-1">{post.user.username}</span>
                  {post.caption}
                </div>
              )}
              
              {/* Location */}
              {post.location && (
                <div className="px-3 pb-3 text-xs text-gray-500 dark:text-gray-400">
                  📍 {post.location}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 