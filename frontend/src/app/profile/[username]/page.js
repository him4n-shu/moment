"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiGrid, FiHeart, FiMessageCircle, FiEdit2, FiCamera } from 'react-icons/fi';
import EditProfileModal from '../../components/EditProfileModal';
import Link from 'next/link';
import OptimizedImage from '../../components/OptimizedImage';
import { getApiUrl } from '@/utils/api';

export default function UserProfile() {
  const { username } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Check if username exists
        if (!username) {
          setError('Username is required');
          setLoading(false);
          return;
        }

        console.log('Fetching profile for username:', username); // Debug log

        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(getApiUrl(`api/users/profile/${encodeURIComponent(username)}`), {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Profile response status:', response.status); // Debug log

        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        if (response.status === 404) {
          setError(`User "${username}" not found`);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch profile');
        }

        const data = await response.json();
        console.log('Profile data received:', data); // Debug log
        
        if (!data.user) {
          throw new Error('Invalid profile data received');
        }

        setProfile(data.user);
      } catch (error) {
        console.error('Profile fetch error:', error);
        if (error.message === 'Failed to fetch') {
          setError('Network error - Please check your connection');
        } else {
          setError(error.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username, router]);

  const handleFollow = async () => {
    if (!profile || followLoading) return;

    try {
      setFollowLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Use _id instead of id
      const userId = profile._id || profile.id;
      if (!userId) {
        throw new Error('Invalid user ID');
      }

      // Log the request details
      console.log('Follow request details:', {
        userId,
        username: profile.username,
        token: token ? 'Present' : 'Missing'
      });

      // Add retry logic
      const maxRetries = 3;
      let retryCount = 0;
      let lastError = null;

      while (retryCount < maxRetries) {
        try {
          const response = await fetch(getApiUrl(`api/users/follow/${userId}`), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            // Add timeout
            signal: AbortSignal.timeout(10000)
          });

          // Log the raw response
          console.log('Follow response status:', response.status);
          console.log('Follow response headers:', Object.fromEntries(response.headers.entries()));

          let data;
          const responseText = await response.text();
          console.log('Raw response text:', responseText);

          try {
            data = responseText ? JSON.parse(responseText) : {};
            console.log('Parsed response data:', data);
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            throw new Error('Invalid response from server');
          }

          if (!response.ok) {
            // Check for specific error conditions
            if (response.status === 401) {
              localStorage.removeItem('token');
              router.push('/login');
              return;
            }
            
            throw new Error(
              data.message || 
              data.error || 
              data.details || 
              `Server returned ${response.status}: ${responseText || 'No error details available'}`
            );
          }

          // Success - update UI
          setProfile(prev => ({
            ...prev,
            isFollowing: data.isFollowing,
            followersCount: data.followersCount
          }));

          // Clear any previous errors
          setError('');
          
          // Exit retry loop on success
          return;
        } catch (attemptError) {
          lastError = attemptError;
          retryCount++;
          
          // Only retry on network errors or 500s
          if (!attemptError.message.includes('fetch') && 
              !attemptError.message.includes('500')) {
            throw attemptError;
          }
          
          if (retryCount < maxRetries) {
            console.log(`Retrying follow request (attempt ${retryCount + 1} of ${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      // If we get here, all retries failed
      throw lastError || new Error('Failed to follow/unfollow after multiple attempts');
    } catch (error) {
      console.error('Follow error:', {
        message: error.message,
        stack: error.stack,
        profile: {
          id: profile.id,
          _id: profile._id,
          username: profile.username
        }
      });
      
      setError(error.message || 'Failed to follow/unfollow user. Please try again.');
      
      // If there's a network error, show a more specific message
      if (!navigator.onLine || error.message.includes('fetch')) {
        setError('Network error - Please check your internet connection');
      }
      
      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
    } finally {
      setFollowLoading(false);
    }
  };

  // Add handleEditProfile function
  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };
  
  // Add handleProfileUpdate function
  const handleProfileUpdate = (updatedProfile) => {
    setProfile(prev => ({
      ...prev,
      ...updatedProfile
    }));
  };

  // Add handleStartChat function
  const handleStartChat = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`api/chat/conversations`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: profile._id })
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      router.push(`/messages?conversation=${data.conversationId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="mt-2 text-sm text-gray-500">Loading profile for {username}...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-xl mb-4">{error || 'User not found'}</div>
          <button 
            onClick={() => router.push('/')}
            className="text-blue-500 hover:text-blue-600 text-sm bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded relative">
          <span>{error}</span>
          <button 
            onClick={() => setError('')}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Profile Picture with Edit Option */}
        <div className="relative">
          <OptimizedImage
            src={profile.profilePic || '/default-avatar.png'}
            alt={profile.username}
            width={150}
            height={150}
            className="w-32 h-32 rounded-full"
          />
          {profile.isCurrentUser && (
            <div 
              className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg cursor-pointer"
              onClick={handleEditProfile}
            >
              <FiCamera className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <h1 className="text-2xl font-bold">{profile.username}</h1>
            {profile.isCurrentUser ? (
              <button
                onClick={handleEditProfile}
                className="px-6 py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    followLoading ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    profile.isFollowing
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {followLoading ? 'Loading...' : profile.isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={handleStartChat}
                  className="px-6 py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
                >
                  <FiMessageCircle className="w-4 h-4" />
                  Message
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex space-x-4 md:space-x-6 mb-4 justify-center md:justify-start text-sm md:text-base">
            <div>
              <span className="font-semibold">{profile.postsCount || 0}</span> posts
            </div>
            <Link 
              href="/friends?tab=followers" 
              className="hover:text-blue-500 transition-colors cursor-pointer"
            >
              <span className="font-semibold">{profile.followersCount || 0}</span> followers
            </Link>
            <Link 
              href="/friends?tab=following" 
              className="hover:text-blue-500 transition-colors cursor-pointer"
            >
              <span className="font-semibold">{profile.followingCount || 0}</span> following
            </Link>
          </div>

          <div>
            <div className="font-bold">{profile.fullName}</div>
            {profile.bio && <div className="mt-2 whitespace-pre-wrap">{profile.bio}</div>}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="mt-12">
        {profile.posts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No posts yet
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {profile.posts.map(post => (
              <div key={post.id} className="aspect-square relative group">
                <OptimizedImage
                  src={post.imageUrl}
                  alt={post.caption}
                  width={300}
                  height={300}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-6 text-white">
                    <div className="flex items-center gap-1">
                      <FiHeart className="w-5 h-5" />
                      <span>{post.likesCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiMessageCircle className="w-5 h-5" />
                      <span>{post.commentsCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add EditProfileModal component */}
      {profile.isCurrentUser && (
        <EditProfileModal
          profile={profile}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
} 