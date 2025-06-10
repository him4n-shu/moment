"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiHeart, FiMessageCircle, FiBookmark, FiClock } from "react-icons/fi";

export default function Home() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      // Check if user is logged in
      const token = localStorage.getItem("token");
      
      try {
        // Fetch user profile if logged in
        if (token) {
          const profileRes = await fetch("http://localhost:5000/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setUser(profileData.user);
          }
        }
        
        // Fetch posts regardless of login status
        const postsRes = await fetch("http://localhost:5000/api/posts/feed", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData.posts);
        } else {
          throw new Error("Failed to fetch posts");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-4 md:pt-8 px-3 md:px-6 pb-12">
      {/* Header */}
      <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
        Explore Latest Posts
      </h2>
      
      {/* Posts Feed */}
      <div className="space-y-6">
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
          posts.map((post) => (
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
          ))
        )}
      </div>
    </div>
  );
} 