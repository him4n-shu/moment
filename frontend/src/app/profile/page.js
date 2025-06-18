"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiGrid, FiSettings, FiBookmark } from "react-icons/fi";
import OptimizedImage from '../components/OptimizedImage';
import { getApiUrl } from '@/utils/api';
import EditProfileModal from '../components/EditProfileModal';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch user data
      const userRes = await fetch(getApiUrl("api/users/profile"), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!userRes.ok) {
        if (userRes.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch profile");
      }

      const userData = await userRes.json();
      setUser(userData.user);

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

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleProfileUpdate = (updatedProfile) => {
    setUser(prev => ({
      ...prev,
      ...updatedProfile
    }));
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
          <p>User profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pt-6 px-4 bg-white dark:bg-gray-900">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start mb-8">
        {/* Profile Picture */}
        <div className="relative w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden flex-shrink-0 mb-4 md:mb-0 md:mr-8">
          <OptimizedImage
            src={user.profilePic || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
            alt={user.username}
            width={144}
            height={144}
            className="w-full h-full object-cover"
          />
          <button 
            onClick={handleEditProfile}
            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-opacity"
          >
            <FiEdit2 className="text-white opacity-0 hover:opacity-100" size={24} />
          </button>
        </div>
        
        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center mb-4">
            <h1 className="text-2xl font-bold mb-1 md:mb-0 md:mr-4 text-gray-900 dark:text-white">{user.username}</h1>
            
            {/* Edit Profile Button */}
            <button 
              onClick={handleEditProfile}
              className="px-4 py-1 rounded-md font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-2 mx-auto md:mx-0 mt-2 md:mt-0"
            >
              <FiEdit2 size={16} />
              <span>Edit Profile</span>
            </button>
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
      
      {/* Tabs */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-center">
          <button
            className={`py-3 px-4 flex items-center ${activeTab === "posts" ? "border-t-2 border-black dark:border-white" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            <FiGrid className="mr-1" />
            <span>Posts</span>
          </button>
          <button
            className={`py-3 px-4 flex items-center ${activeTab === "saved" ? "border-t-2 border-black dark:border-white" : ""}`}
            onClick={() => setActiveTab("saved")}
          >
            <FiBookmark className="mr-1" />
            <span>Saved</span>
          </button>
        </div>
      </div>
      
      {/* Posts Grid */}
      {activeTab === "posts" && (
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
              <p className="mb-4">No posts yet</p>
              <button
                onClick={() => router.push('/post/new')}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Create your first post
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Saved Posts */}
      {activeTab === "saved" && (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <p>Saved posts will appear here</p>
        </div>
      )}
      
      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          profile={user}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
      
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
                  <div key={follower.id} className="flex items-center justify-between py-2">
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
                  <div key={follow.id} className="flex items-center justify-between py-2">
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