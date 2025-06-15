"use client";
import { useState, useEffect } from "react";
import { FiHeart, FiMessageCircle, FiBookmark, FiClock, FiRefreshCw } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import Link from "next/link";
import OptimizedImage from '../components/OptimizedImage';
import { getApiUrl } from '@/utils/api';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [commentInputs, setCommentInputs] = useState({});
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [postComments, setPostComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [commentErrors, setCommentErrors] = useState({});
  const [likeErrors, setLikeErrors] = useState({});

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
      const response = await fetch(getApiUrl("api/posts/feed"), {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feed");
      }

      const data = await response.json();
      
      if (data.posts) {
        // Ensure each post has the required fields
        const processedPosts = data.posts.map(post => ({
          ...post,
          likesCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
          isLiked: post.isLiked || false
        }));
        
        setPosts(processedPosts);
        setLastRefresh(new Date());
      }
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

  const fetchComments = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view comments");
      return;
    }

    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    setCommentErrors(prev => ({ ...prev, [postId]: null }));

    try {
      const response = await fetch(getApiUrl(`api/posts/${postId}`), {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const data = await response.json();
      
      if (data.post && data.post.comments) {
        setPostComments(prev => ({ 
          ...prev, 
          [postId]: data.post.comments 
        }));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setCommentErrors(prev => ({ 
        ...prev, 
        [postId]: "Failed to load comments. Please try again." 
      }));
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleLike = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to like posts");
      return;
    }

    // Clear any previous errors
    setLikeErrors(prev => ({ ...prev, [postId]: null }));

    try {
      // Make the API call first without optimistic update
      const response = await fetch(getApiUrl(`api/posts/${postId}/like`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to like post");
      }

      // Update the posts state after successful API call
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              isLiked: data.isLiked,
              likesCount: data.likesCount
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Error liking post:", error);
      setLikeErrors(prev => ({ 
        ...prev, 
        [postId]: error.message || "Failed to like post" 
      }));
    }
  };

  const handleComment = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to comment");
      return;
    }

    const commentText = commentInputs[postId] || "";
    if (!commentText.trim()) {
      return;
    }

    // Clear any previous errors
    setCommentErrors(prev => ({ ...prev, [postId]: null }));

    try {
      const response = await fetch(getApiUrl(`api/posts/${postId}/comment`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: commentText.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add comment");
      }

      // Update comments for this post
      setPostComments(prev => {
        const existingComments = prev[postId] || [];
        return {
          ...prev,
          [postId]: [data.newComment, ...existingComments]
        };
      });

      // Update post comment count
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              commentsCount: data.commentsCount
            };
          }
          return post;
        })
      );

      // Clear comment input for this post
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("Error commenting on post:", error);
      setCommentErrors(prev => ({ 
        ...prev, 
        [postId]: error.message || "Failed to add comment" 
      }));
    }
  };

  const toggleComments = async (postId) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    } else {
      setActiveCommentPostId(postId);
      
      // Only fetch comments if we don't already have them
      if (!postComments[postId] || postComments[postId].length === 0) {
        fetchComments(postId);
      }
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

  // Function to check if a post has comments
  const hasComments = (postId) => {
    return postComments[postId] && postComments[postId].length > 0;
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Global Feed</h1>
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
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
            Follow some users to see their posts in your feed, or check back later for new content.
          </p>
          <Link href="/friends" className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Find People to Follow
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
              {/* Post Header */}
              <div className="flex items-center p-3 border-b border-gray-200 dark:border-gray-700">
                <Link href={`/profile/${post.user.username}`} className="flex items-center">
                  <OptimizedImage
                    src={post.user.profilePic || '/default-avatar.png'}
                    alt={post.user.username}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="ml-3">
                    <div className="font-medium">{post.user.username}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      {formatDate(post.createdAt)}
                      {post.location && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{post.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
              
              {/* Post Image */}
              <div className="relative">
                <OptimizedImage
                  src={post.imageData || post.imageUrl}
                  alt={post.caption || "Post image"}
                  width={800}
                  height={600}
                  className="w-full h-auto max-h-[600px] object-contain bg-black rounded-lg"
                />
              </div>
              
              {/* Post Actions */}
              <div className="flex justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-4">
                  <button 
                    onClick={() => handleLike(post._id)}
                    className="flex items-center text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
                  >
                    {post.isLiked ? (
                      <FaHeart className="h-6 w-6 fill-red-500 text-red-500" />
                    ) : (
                      <FiHeart className="h-6 w-6" />
                    )}
                    <span className="ml-1 text-sm">{post.likesCount || 0}</span>
                  </button>
                  <button 
                    onClick={() => toggleComments(post._id)}
                    className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
                  >
                    <FiMessageCircle className="h-6 w-6" />
                    <span className="ml-1 text-sm">{post.commentsCount || 0}</span>
                  </button>
                  <button className="text-gray-700 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors duration-200">
                    <FiBookmark className="h-6 w-6" />
                  </button>
                </div>
                <button className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">
                  <FiBookmark className="h-6 w-6" />
                </button>
              </div>
              
              {/* Post Caption */}
              <div className="p-3 text-sm text-gray-800 dark:text-gray-200">
                <p>
                  <Link href={`/profile/${post.user.username}`} className="font-bold mr-2">
                    {post.user.username}
                  </Link>
                  {post.caption}
                </p>
              </div>
              
              {/* Post Date */}
              <div className="px-3 pb-3 text-xs text-gray-500 dark:text-gray-400">
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
              
              {/* Comments Section - Conditionally shown */}
              {activeCommentPostId === post._id && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="mb-4">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleComment(post._id);
                    }} className="flex">
                      <input
                        type="text"
                        value={commentInputs[post._id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                        placeholder="Add a comment..."
                        className="flex-grow p-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!commentInputs[post._id]?.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Post
                      </button>
                    </form>
                  </div>
                  
                  {/* Comments List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {loadingComments[post._id] ? (
                      <div className="flex justify-center py-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : commentErrors[post._id] ? (
                      <div className="text-center text-red-500 dark:text-red-400 text-sm py-2">
                        {commentErrors[post._id]}
                        <button 
                          onClick={() => fetchComments(post._id)} 
                          className="ml-2 text-blue-500 hover:underline"
                        >
                          Retry
                        </button>
                      </div>
                    ) : hasComments(post._id) ? (
                      postComments[post._id].map((comment) => (
                        <div key={comment._id} className="flex items-start mb-3">
                          <Link href={`/profile/${comment.user.username}`} className="flex-shrink-0">
                            <OptimizedImage
                              src={comment.user.profilePic || '/default-avatar.png'}
                              alt={comment.user.username}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full"
                            />
                          </Link>
                          <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                            <div className="flex justify-between items-start">
                              <Link href={`/profile/${comment.user.username}`} className="font-medium text-sm">
                                {comment.user.username}
                              </Link>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{comment.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-2">
                        No comments yet. Be the first to comment!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}