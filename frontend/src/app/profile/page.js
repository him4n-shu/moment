"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import EditProfileModal from "../components/EditProfileModal";
import { FiEdit2, FiLogOut, FiCamera } from "react-icons/fi";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
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
    
    // Refresh the profile data to get the latest changes
    fetchProfile();
  };
  
  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Not logged in");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
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
      console.error("Error fetching profile:", error);
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
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
          <img 
            src={profile.profilePic || `https://ui-avatars.com/api/?name=${profile.username}&background=random`} 
            alt={profile.username} 
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
            <h1 className="text-xl font-semibold mr-4">{profile.username}</h1>
            <div className="flex mt-2 md:mt-0 justify-center md:justify-start">
              <button 
                onClick={handleEditProfile}
                className="px-3 md:px-4 py-1.5 rounded transition-colors duration-300 mr-2 text-sm font-medium flex items-center"
                style={{ 
                  backgroundColor: 'transparent', 
                  color: 'var(--foreground)',
                  borderColor: 'var(--border-color)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                <FiEdit2 className="mr-1.5" size={14} />
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="px-3 md:px-4 py-1.5 rounded transition-colors duration-300 text-sm font-medium flex items-center"
                style={{ 
                  backgroundColor: 'transparent', 
                  color: 'var(--foreground)',
                  borderColor: 'var(--border-color)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                <FiLogOut size={14} />
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex space-x-4 md:space-x-6 mb-4 justify-center md:justify-start text-sm md:text-base">
            <div>
              <span className="font-semibold">{profile.postsCount || 0}</span> posts
            </div>
            <div>
              <span className="font-semibold">{profile.followersCount || 0}</span> followers
            </div>
            <div>
              <span className="font-semibold">{profile.followingCount || 0}</span> following
            </div>
          </div>
          
          {/* Bio */}
          <div className="mb-2">
            <div className="font-semibold">{profile.fullName || profile.username}</div>
            <p className="text-sm">
              {profile.bio || "Welcome to my Moment profile! 📸 ✨"}
            </p>
            <p className="text-sm">
              Joined: {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-t flex mb-2" style={{ borderColor: 'var(--border-color)' }}>
        <button 
          className={`flex-1 py-2 md:py-3 text-xs md:text-sm font-medium flex items-center justify-center ${activeTab === 'posts' ? 'border-t-2' : ''}`}
          style={{ borderColor: activeTab === 'posts' ? 'var(--foreground)' : 'transparent' }}
          onClick={() => setActiveTab('posts')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          POSTS
        </button>
        <button 
          className={`flex-1 py-2 md:py-3 text-xs md:text-sm font-medium flex items-center justify-center ${activeTab === 'saved' ? 'border-t-2' : ''}`}
          style={{ borderColor: activeTab === 'saved' ? 'var(--foreground)' : 'transparent' }}
          onClick={() => setActiveTab('saved')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          SAVED
        </button>
        <button 
          className={`flex-1 py-2 md:py-3 text-xs md:text-sm font-medium flex items-center justify-center ${activeTab === 'tagged' ? 'border-t-2' : ''}`}
          style={{ borderColor: activeTab === 'tagged' ? 'var(--foreground)' : 'transparent' }}
          onClick={() => setActiveTab('tagged')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          TAGGED
        </button>
      </div>
      
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4">
        {activeTab === 'posts' && posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden relative group">
              <img 
                src={post.imageData || post.imageUrl} 
                alt={`Post ${post.id}`}
                className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center space-x-4 opacity-0 group-hover:opacity-100">
                <div className="flex items-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{post.likesCount || 0}</span>
                </div>
                <div className="flex items-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{post.commentsCount || 0}</span>
                </div>
              </div>
            </div>
          ))
        ) : activeTab === 'posts' ? (
          <div className="col-span-3 py-8 text-center text-gray-500 dark:text-gray-400">
            <p className="mb-4">No posts yet.</p>
            <Link
              href="/post/new"
              className="inline-block py-2 px-4 rounded transition-colors duration-300 text-white font-medium"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="col-span-3 py-8 text-center text-gray-500 dark:text-gray-400">
            {activeTab === 'saved' ? 'No saved posts.' : 'No tagged photos.'}
          </div>
        )}
      </div>
      
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