"use client";
import { useState, useEffect } from "react";
import { FiHeart, FiMessageCircle, FiBookmark, FiClock, FiRefreshCw, FiMoreHorizontal } from "react-icons/fi";
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
        // Log the first post to help with debugging
        if (data.posts.length > 0) {
          console.log("Sample post data:", {
            id: data.posts[0]._id,
            hasImageUrl: !!data.posts[0].imageUrl,
            hasImageData: !!data.posts[0].imageData,
            imageUrlSample: data.posts[0].imageUrl ? data.posts[0].imageUrl.substring(0, 50) + '...' : 'none',
            imageDataSample: data.posts[0].imageData ? data.posts[0].imageData.substring(0, 50) + '...' : 'none'
          });
        }
        
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
        // Map the comments to ensure consistent structure
        const formattedComments = data.post.comments.map(comment => ({
          _id: comment._id,
          text: comment.text,
          createdAt: comment.createdAt,
          user: {
            _id: comment.user._id,
            username: comment.user.username,
            profilePic: comment.user.profilePic
          }
        }));
        
        setPostComments(prev => ({ 
          ...prev, 
          [postId]: formattedComments 
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto pt-8 px-4">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <p>{error}</p>
          {!localStorage.getItem("token") && (
            <Link href="/login" className="mt-2 inline-block text-brand-orange hover:text-brand-red hover:underline">
              Login to view the feed
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-6 px-4 sm:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand-red" data-aos="fade-right">Your Feed</h1>
        <button 
          onClick={handleManualRefresh} 
          className="flex items-center text-sm text-gray-600 hover:text-brand-orange dark:text-gray-400 dark:hover:text-brand-yellow"
          disabled={refreshing}
          data-aos="fade-left"
        >
          <FiRefreshCw className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="text-sm text-gray-500 mb-6" data-aos="fade-up">
        Last updated: {formatLastRefresh()}
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-md mb-6" data-aos="fade-in">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-12" data-aos="fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-red"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md" data-aos="fade-up">
          <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your feed is empty. Follow some users to see their posts here.
          </p>
          <Link 
            href="/friends" 
            className="inline-block px-4 py-2 bg-brand-gradient text-white rounded-md hover:bg-brand-gradient-hover transition-colors"
          >
            Find Friends
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div 
              key={post._id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300"
              data-aos="fade-up"
              data-aos-delay={index * 100}
              data-aos-anchor-placement="top-bottom"
            >
              <div className="p-3">
                <div className="flex items-center mb-2">
                  <Link href={`/profile/${post.user.username}`} className="flex items-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                      <OptimizedImage
                        src={post.user.profilePic || `/default-avatar.png`}
                        alt={post.user.username}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium">{post.user.username}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </Link>
                  <button className="ml-auto text-gray-500 hover:text-brand-orange dark:text-gray-400 dark:hover:text-brand-yellow">
                    <FiMoreHorizontal />
                  </button>
                </div>
                
                <p className="mb-3 text-sm">{post.caption}</p>
                
                {(post.imageUrl || post.imageData || post.image) && (
                  <div className="mb-4 post-image-container" data-aos="zoom-in" data-aos-delay={(index * 100) + 100}>
                    <OptimizedImage
                      src={post.imageData || post.imageUrl || post.image}
                      alt={`${post.user.username}'s post`}
                      width={400}
                      height={400}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => handleLike(post._id)} 
                      className={`flex items-center ${post.isLiked ? 'text-brand-red' : 'text-gray-500 hover:text-brand-red'}`}
                      data-aos="fade-right"
                      data-aos-delay={(index * 100) + 150}
                    >
                      {post.isLiked ? <FaHeart className="mr-1" /> : <FiHeart className="mr-1" />}
                      <span>{post.likesCount}</span>
                    </button>
                    <button 
                      onClick={() => toggleComments(post._id)} 
                      className="flex items-center text-gray-500 hover:text-brand-orange"
                      data-aos="fade-right"
                      data-aos-delay={(index * 100) + 200}
                    >
                      <FiMessageCircle className="mr-1" />
                      <span>{post.commentsCount}</span>
                    </button>
                  </div>
                  <button className="text-gray-500 hover:text-brand-yellow">
                    <FiBookmark />
                  </button>
                </div>
                
                {likeErrors[post._id] && (
                  <div className="mt-2 text-sm text-red-500">{likeErrors[post._id]}</div>
                )}
                
                {activeCommentPostId === post._id && (
                  <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3" data-aos="fade-up">
                    <div className="mb-4">
                      <div className="flex">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={commentInputs[post._id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                        />
                        <button
                          onClick={() => handleComment(post._id)}
                          className="px-4 py-2 bg-brand-gradient text-white rounded-r-md hover:bg-brand-gradient-hover transition-colors"
                        >
                          Post
                        </button>
                      </div>
                      {commentErrors[post._id] && (
                        <div className="mt-2 text-sm text-red-500">{commentErrors[post._id]}</div>
                      )}
                    </div>
                    
                    {loadingComments[post._id] ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-brand-red"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {hasComments(post._id) ? (
                          postComments[post._id].map((comment, commentIndex) => (
                            <div 
                              key={comment._id} 
                              className="flex items-start"
                              data-aos="fade-up"
                              data-aos-delay={commentIndex * 50}
                            >
                              <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                                <OptimizedImage
                                  src={comment.user.profilePic || `/default-avatar.png`}
                                  alt={comment.user.username}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                                  <Link href={`/profile/${comment.user.username}`} className="font-medium mr-2 text-brand-orange hover:text-brand-red">
                                    {comment.user.username}
                                  </Link>
                                  <span>{comment.text}</span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {formatDate(comment.createdAt)}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 py-4">No comments yet</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}