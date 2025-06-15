"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import EditProfileModal from "../components/EditProfileModal";
import { FiEdit2, FiLogOut, FiCamera, FiHeart, FiMessageCircle, FiX } from "react-icons/fi";
import OptimizedImage from '../components/OptimizedImage';
import { getApiUrl } from '@/utils/api';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const isMounted = useRef(true);
  const profileFetched = useRef(false);

  useEffect(() => {
    // Only fetch profile if we haven't already
    if (!profileFetched.current) {
      fetchProfile();
      profileFetched.current = true;
    }
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };
  
  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };
  
  const handleProfileUpdate = (updatedProfile) => {
    setProfile(prev => ({
      ...prev,
      ...updatedProfile
    }));
  };
  
  const fetchProfile = async () => {
    if (!isMounted.current) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Not logged in");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(getApiUrl("api/users/profile"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!isMounted.current) return;
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        if (data.user.posts) {
          setPosts(data.user.posts);
        }
      } else {
        setMessage("Unauthorized or error fetching profile");
      }
    } catch (error) {
      if (!isMounted.current) return;
      console.error("Error fetching profile:", error);
      setMessage("An error occurred. Please try again.");
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center mt-20">
        <p className="text-red-600 mb-4">{message || "Loading..."}</p>
        {message && message !== "Loading..." && (
          <Link
            href="/login"
            className="transition-colors duration-300"
            style={{ color: 'var(--primary)' }}
          >
            Go to Login
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pt-4 md:pt-8 px-3 md:px-6 transition-colors duration-300">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start mb-6 md:mb-8">
        {/* Profile Picture */}
        <div className="relative w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden flex-shrink-0 mb-4 md:mb-0 md:mr-8 profile-picture-container">
          <OptimizedImage
            src={profile.profilePic || `https://ui-avatars.com/api/?name=${profile.username}&background=random`}
            alt={profile.username}
            width={144}
            height={144}
            className="w-full h-full object-cover"
          />
          <div 
            className="profile-picture-overlay cursor-pointer"
            onClick={handleEditProfile}
          >
            <div className="bg-white dark:bg-gray-800 rounded-full p-2 transform transition-transform duration-200 hover:scale-110">
              <FiCamera className="text-gray-800 dark:text-gray-200" size={20} />
            </div>
          </div>
        </div>
        
        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center mb-4">
            <h1 className="text-2xl font-bold mb-1 md:mb-0 md:mr-4">{profile.username}</h1>
            
            {/* Edit Profile Button */}
            <button 
              onClick={handleEditProfile}
              className="px-6 py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-2 mx-auto md:mx-0 mt-2 md:mt-0"
            >
              <FiEdit2 size={16} />
              <span>Edit Profile</span>
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex justify-center md:justify-start space-x-6 mb-4">
            <div className="text-center">
              <span className="font-bold">{profile.postsCount || 0}</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
            </div>
            <div className="text-center cursor-pointer" onClick={() => setShowFollowers(true)}>
              <span className="font-bold">{profile.followersCount || 0}</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">Followers</p>
            </div>
            <div className="text-center cursor-pointer" onClick={() => setShowFollowing(true)}>
              <span className="font-bold">{profile.followingCount || 0}</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">Following</p>
            </div>
          </div>
          
          {/* Bio */}
          {profile.bio && (
            <div className="mb-4 max-w-md">
              <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}
          
          {/* Full Name */}
          {profile.fullName && (
            <div className="text-sm font-semibold mb-1">{profile.fullName}</div>
          )}
          
          {/* Website */}
          {profile.website && (
            <div className="mb-4">
              <a 
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {profile.website.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </div>
          )}
        </div>
      </div>
      
      {/* Posts Grid */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h2 className="text-xl font-bold mb-4">Posts</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 md:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 md:gap-4">
            {posts.map(post => (
              <Link key={post._id} href={`/post/${post._id}`}>
                <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <OptimizedImage
                    src={post.imageData || post.imageUrl}
                    alt={post.caption || "Post"}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  />
                  
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200">
                    <div className="flex space-x-4 text-white">
                      <div className="flex items-center">
                        <FiHeart className="mr-1" />
                        <span>{post.likesCount || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <FiMessageCircle className="mr-1" />
                        <span>{post.commentsCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-xl font-medium mb-2">No Posts Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Share your first photo or video
            </p>
            <Link 
              href="/post/new"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Post
            </Link>
          </div>
        )}
      </div>
      
      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">Followers</h3>
              <button onClick={() => setShowFollowers(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 max-h-[calc(80vh-80px)]">
              {followers.length > 0 ? (
                followers.map(follower => (
                  <div key={follower._id} className="flex items-center justify-between py-2">
                    <Link 
                      href={`/profile/${follower.username}`}
                      className="flex items-center"
                      onClick={() => setShowFollowers(false)}
                    >
                      <OptimizedImage
                        src={follower.profilePic || `https://ui-avatars.com/api/?name=${follower.username}&background=random`}
                        alt={follower.username}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover mr-3"
                      />
                      <div>
                        <div className="font-medium">{follower.username}</div>
                        {follower.fullName && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{follower.fullName}</div>
                        )}
                      </div>
                    </Link>
                    <button 
                      onClick={() => handleFollowUser(follower._id, follower.isFollowing)}
                      className={`px-4 py-1 rounded-full text-sm font-medium ${
                        follower.isFollowing
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {follower.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No followers yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Following Modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">Following</h3>
              <button onClick={() => setShowFollowing(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 max-h-[calc(80vh-80px)]">
              {following.length > 0 ? (
                following.map(user => (
                  <div key={user._id} className="flex items-center justify-between py-2">
                    <Link 
                      href={`/profile/${user.username}`}
                      className="flex items-center"
                      onClick={() => setShowFollowing(false)}
                    >
                      <OptimizedImage
                        src={user.profilePic || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                        alt={user.username}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover mr-3"
                      />
                      <div>
                        <div className="font-medium">{user.username}</div>
                        {user.fullName && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.fullName}</div>
                        )}
                      </div>
                    </Link>
                    <button 
                      onClick={() => handleFollowUser(user._id, true)}
                      className="px-4 py-1 rounded-full text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Following
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Not following anyone yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Profile Modal */}
      <EditProfileModal
        profile={profile}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
}

// Add this CSS to globals.css
// .hide-scrollbar::-webkit-scrollbar {
//   display: none;
// } 