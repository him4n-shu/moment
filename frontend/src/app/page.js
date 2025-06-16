"use client";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from "react";
import { FiHeart, FiMessageCircle, FiBookmark, FiClock, FiSmile, FiMoreHorizontal } from "react-icons/fi";
import { FaHeart, FaRegPaperPlane } from "react-icons/fa";
import EmojiPicker from 'emoji-picker-react';
import OptimizedImage from './components/OptimizedImage';
import { getApiUrl } from '@/utils/api';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [likeErrors, setLikeErrors] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentErrors, setCommentErrors] = useState({});
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const emojiPickerRefs = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      if (!token) {
        router.push('/login');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch user basic info
        const userRes = await fetch(getApiUrl("api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!userRes.ok) {
          const errorData = await userRes.json();
          if (errorData.message?.includes("Token is not valid")) {
            localStorage.removeItem("token");
            router.push('/login');
            return;
          }
          throw new Error(errorData.message || "Failed to fetch user info");
        }

        const userData = await userRes.json();
        setUser(userData.user);
        
        // Fetch posts
        const postsRes = await fetch(getApiUrl("api/posts/feed"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!postsRes.ok) {
          const errorData = await postsRes.json();
          throw new Error(errorData.message || "Failed to fetch posts");
        }
        
        const postsData = await postsRes.json();
        if (!postsData.success) {
          throw new Error(postsData.message || "Failed to fetch posts");
        }
        
        setPosts(postsData.posts.map(post => ({
          ...post,
          likesCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
          isLiked: post.isLiked || false,
          comments: post.comments || []
        })));
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to load content. Please try again later.");
        if (error.message?.includes("Token is not valid")) {
          localStorage.removeItem("token");
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (showEmojiPicker) {
        const pickerRef = emojiPickerRefs.current[showEmojiPicker];
        if (pickerRef && !pickerRef.contains(event.target)) {
          // Check if the click was on the emoji button
          const emojiButton = event.target.closest('.emoji-button');
          if (!emojiButton) {
            setShowEmojiPicker(null);
          }
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleLike = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to like posts");
      return;
    }

    // Clear any previous errors
    setLikeErrors(prev => ({ ...prev, [postId]: null }));

    try {
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

      // Update posts state with new comment
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              comments: [data.newComment, ...(post.comments || [])],
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

  const toggleComments = (postId) => {
    setActiveCommentPostId(activeCommentPostId === postId ? null : postId);
  };

  const handleEmojiClick = (postId, emojiData) => {
    setCommentInputs(prev => ({
      ...prev,
      [postId]: (prev[postId] || '') + emojiData.emoji
    }));
  };

  const toggleEmojiPicker = (postId) => {
    setShowEmojiPicker(showEmojiPicker === postId ? null : postId);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 text-center mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pt-4 md:pt-8 px-3 md:px-0 pb-12">
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
              key={post._id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg mb-4"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                      <Link href={`/profile/${post.user.username}`}>
                        <OptimizedImage
                          src={post.user.profilePic || `https://ui-avatars.com/api/?name=${post.user.username}&background=random`}
                          alt={post.user.username}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </Link>
                    </div>
                    <div className="font-semibold mr-2">
                      <Link 
                        href={`/profile/${post.user.username}`}
                        className="hover:text-blue-500 transition-colors"
                      >
                        {post.user.username}
                      </Link>
                    </div>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    • {formatDate(post.createdAt)}
                  </span>
                </div>
                
                <button className="text-gray-500 dark:text-gray-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiMoreHorizontal />
                </button>
              </div>
              
              {/* Post Image */}
              <div className="relative aspect-square w-full bg-black">
                <OptimizedImage
                  src={post.imageData || post.imageUrl}
                  alt={post.caption}
                  width={800}
                  height={600}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Post Actions */}
              <div className="p-3">
                <div className="flex justify-between mb-2">
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => handleLike(post._id)}
                      className="text-2xl text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
                    >
                      {post.isLiked ? (
                        <FaHeart className="text-red-500" />
                      ) : (
                        <FiHeart />
                      )}
                    </button>
                    <button 
                      onClick={() => toggleComments(post._id)}
                      className="text-2xl text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
                    >
                      <FiMessageCircle />
                    </button>
                    <button className="text-2xl text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">
                      <FaRegPaperPlane />
                    </button>
                  </div>
                  <button className="text-2xl text-gray-700 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors duration-200">
                    <FiBookmark />
                  </button>
                </div>

                {/* Likes count */}
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
                </div>

                {/* Caption */}
                {post.caption && (
                  <div className="text-sm text-gray-800 dark:text-gray-200 mb-1">
                    <Link href={`/profile/${post.user.username}`} className="font-semibold mr-2">
                      {post.user.username}
                    </Link>
                    {post.caption}
                  </div>
                )}

                {/* View all comments button */}
                {post.commentsCount > 0 && (
                  <button
                    onClick={() => toggleComments(post._id)}
                    className="text-sm text-gray-500 dark:text-gray-400 mb-1"
                  >
                    View all {post.commentsCount} comments
                  </button>
                )}

                {/* Comments section */}
                {activeCommentPostId === post._id && post.comments && post.comments.length > 0 && (
                  <div className="px-4 pb-4">
                    {post.comments.map(comment => (
                      <div key={comment._id || comment.id} className="flex items-start space-x-2 mb-2">
                        <div className="flex items-center mb-2">
                          <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
                            <Link href={`/profile/${comment.user.username}`}>
                              <OptimizedImage
                                src={comment.user.profilePic || `https://ui-avatars.com/api/?name=${comment.user.username}&background=random`}
                                alt={comment.user.username}
                                width={32}
                                height={32}
                                className="h-full w-full object-cover"
                              />
                            </Link>
                          </div>
                          <div className="flex flex-col">
                            <div className="font-medium text-sm">
                              <Link 
                                href={`/profile/${comment.user.username}`}
                                className="hover:text-blue-500 transition-colors"
                              >
                                {comment.user.username}
                              </Link>
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs">
                              {formatDate(comment.createdAt || comment.date)}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm mt-1">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-2">
                  {formatDate(post.createdAt)}
                </div>

                {/* Comment input section with emoji picker */}
                <div className="mt-3 flex items-center border-t dark:border-gray-700 pt-3 px-3 relative">
                  <button 
                    className="text-2xl text-gray-500 dark:text-gray-400 mr-3 emoji-button hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => toggleEmojiPicker(post._id)}
                  >
                    <FiSmile />
                  </button>
                  
                  {showEmojiPicker === post._id && (
                    <div 
                      ref={el => emojiPickerRefs.current[post._id] = el}
                      className="absolute bottom-full left-0 mb-2 z-50"
                      style={{ filter: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))' }}
                    >
                      <EmojiPicker
                        key={`emoji-picker-${post._id}`}
                        onEmojiClick={(emojiData) => handleEmojiClick(post._id, emojiData)}
                        width={300}
                        height={400}
                        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                        searchPlaceholder="Search emojis..."
                        previewConfig={{ showPreview: false }}
                      />
                    </div>
                  )}
                  
                  <input
                    type="text"
                    value={commentInputs[post._id] || ""}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                    placeholder="Add a comment..."
                    className="flex-grow bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleComment(post._id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleComment(post._id)}
                    disabled={!(commentInputs[post._id] || "").trim()}
                    className="ml-3 text-blue-500 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post
                  </button>
                </div>

                {/* Comment Error */}
                {commentErrors[post._id] && (
                  <div className="mt-2 text-sm text-red-500 dark:text-red-400 px-3 pb-3">
                    {commentErrors[post._id]}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 