"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiGrid, FiUserCheck, FiUserPlus, FiMessageSquare } from "react-icons/fi";
import OptimizedImage from '../../components/OptimizedImage';
import { getApiUrl } from '@/utils/api';

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const { username } = params;
  
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch user data by username
      const userRes = await fetch(getApiUrl(`api/users/profile/${username}`), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!userRes.ok) {
        if (userRes.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        } else if (userRes.status === 404) {
          throw new Error("User not found");
        }
        throw new Error("Failed to fetch profile");
      }

      const userData = await userRes.json();
      setUser(userData.user);
      setIsFollowing(userData.isFollowing);
      setIsCurrentUser(userData.isCurrentUser);

      // Fetch user posts
      const postsRes = await fetch(getApiUrl(`api/posts/user/${userData.user._id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!postsRes.ok) {
        throw new Error("Failed to fetch posts");
      }

      const postsData = await postsRes.json();
      setPosts(postsData.posts || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      setFollowLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const response = await fetch(getApiUrl(`api/users/${endpoint}/${user._id}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user`);
      }

      const data = await response.json();
      setIsFollowing(!isFollowing);
      
      // Update followers count
      setUser(prev => ({
        ...prev,
        followersCount: isFollowing 
          ? (prev.followersCount > 0 ? prev.followersCount - 1 : 0) 
          : prev.followersCount + 1
      }));
    } catch (error) {
      console.error("Follow/unfollow error:", error);
      // Show error message
    } finally {
      setFollowLoading(false);
    }
  };

  const fetchFollowers = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(getApiUrl(`api/users/followers/${user._id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch followers");
      }
      
      const data = await response.json();
      setFollowers(data.followers || []);
      setShowFollowers(true);
    } catch (error) {
      console.error("Error fetching followers:", error);
    }
  };

  const fetchFollowing = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(getApiUrl(`api/users/following/${user._id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch following");
      }
      
      const data = await response.json();
      setFollowing(data.following || []);
      setShowFollowing(true);
    } catch (error) {
      console.error("Error fetching following:", error);
    }
  };

  const startConversation = async () => {
    try {
      if (!user) return;
      
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Create or get existing conversation
      const response = await fetch(getApiUrl("api/chat/conversations"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId: user._id })
      });

      if (!response.ok) {
        throw new Error("Failed to start conversation");
      }

      const data = await response.json();
      
      // Navigate to messages page with the conversation ID
      router.push(`/messages?conversation=${data.conversationId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      setError(error.message || "An error occurred");
    }
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
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg">
          <p>User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pt-6 px-4 bg-white dark:bg-gray-900">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start mb-8">
        {/* Profile Picture */}
        <div className="w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden flex-shrink-0 mb-4 md:mb-0 md:mr-8">
          <OptimizedImage
            src={user.profilePic || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
            alt={user.username}
            width={144}
            height={144}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center mb-4">
            <h1 className="text-2xl font-bold mb-1 md:mb-0 md:mr-4 text-gray-900 dark:text-white">{user.username}</h1>
            
            {/* Action Buttons (only if not current user) */}
            {!isCurrentUser && (
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <button 
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-4 py-1 rounded-md font-medium flex items-center gap-2
                    ${isFollowing 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600' 
                      : 'bg-brand-gradient text-white hover:bg-brand-gradient-hover'
                    } transition-all duration-200`}
                >
                  {isFollowing ? (
                    <>
                      <FiUserCheck size={16} />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <FiUserPlus size={16} />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                <button 
                  onClick={startConversation}
                  className="px-4 py-1 rounded-md font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
                >
                  <FiMessageSquare size={16} />
                  <span>Message</span>
                </button>
              </div>
            )}
            
            {/* Edit Profile Button (only if current user) */}
            {isCurrentUser && (
              <button 
                onClick={() => router.push('/profile')}
                className="px-4 py-1 rounded-md font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-2 mx-auto md:mx-0 mt-2 md:mt-0"
              >
                <span>Edit Profile</span>
              </button>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex justify-center md:justify-start space-x-6 mb-4">
            <div className="text-center">
              <span className="font-bold">{posts.length}</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
            </div>
            <button 
              className="text-center cursor-pointer" 
              onClick={fetchFollowers}
            >
              <span className="font-bold">{user.followersCount || 0}</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">Followers</p>
            </button>
            <button 
              className="text-center cursor-pointer" 
              onClick={fetchFollowing}
            >
              <span className="font-bold">{user.followingCount || 0}</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">Following</p>
            </button>
          </div>
          
          {/* Bio */}
          {user.bio && (
            <div className="mb-4 max-w-md">
              <p className="text-sm whitespace-pre-wrap">{user.bio}</p>
            </div>
          )}
          
          {/* Full Name */}
          {user.fullName && (
            <div className="text-sm font-semibold mb-1">{user.fullName}</div>
          )}
        </div>
      </div>
      
      {/* Posts Grid */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiGrid className="mr-2" />
          <span>Posts</span>
        </h2>
        
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {posts.length > 0 ? (
            posts.map(post => (
              <div 
                key={post._id} 
                className="aspect-square relative cursor-pointer"
                onClick={() => router.push(`/post/${post._id}`)}
              >
                <OptimizedImage
                  src={post.imageData || post.imageUrl || `https://ui-avatars.com/api/?name=${post.caption || 'Post'}&background=random`}
                  alt={post.caption || "Post"}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="col-span-3 py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No posts yet</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold">Followers</h2>
              <button onClick={() => setShowFollowers(false)}>×</button>
            </div>
            <div className="p-4">
              {followers.length > 0 ? (
                followers.map(follower => (
                  <div 
                    key={follower._id} 
                    className="flex items-center justify-between py-2 cursor-pointer"
                    onClick={() => {
                      router.push(`/profile/${follower.username}`);
                      setShowFollowers(false);
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                        <OptimizedImage
                          src={follower.profilePic || `https://ui-avatars.com/api/?name=${follower.username}&background=random`}
                          alt={follower.username}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{follower.username}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{follower.fullName}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-gray-500 dark:text-gray-400">No followers yet</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Following Modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold">Following</h2>
              <button onClick={() => setShowFollowing(false)}>×</button>
            </div>
            <div className="p-4">
              {following.length > 0 ? (
                following.map(follow => (
                  <div 
                    key={follow._id} 
                    className="flex items-center justify-between py-2 cursor-pointer"
                    onClick={() => {
                      router.push(`/profile/${follow.username}`);
                      setShowFollowing(false);
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                        <OptimizedImage
                          src={follow.profilePic || `https://ui-avatars.com/api/?name=${follow.username}&background=random`}
                          alt={follow.username}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{follow.username}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{follow.fullName}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-gray-500 dark:text-gray-400">Not following anyone yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 