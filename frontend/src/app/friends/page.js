"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OptimizedImage from '../components/OptimizedImage';
import { getApiUrl } from '@/utils/api';

export default function FriendsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('followers');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFriends = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Get current user's profile to get their ID
      const profileRes = await fetch(getApiUrl('api/users/profile'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!profileRes.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await profileRes.json();
      const userId = profileData.user._id;

      // Fetch followers and following in parallel
      const [followersRes, followingRes] = await Promise.all([
        fetch(getApiUrl(`api/users/followers/${userId}`), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(getApiUrl(`api/users/following/${userId}`), {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!followersRes.ok || !followingRes.ok) {
        throw new Error('Failed to fetch friends data');
      }

      const followersData = await followersRes.json();
      const followingData = await followingRes.json();

      setFollowers(followersData.followers);
      setFollowing(followingData.following);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError(error.message || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Get tab from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'followers' || tab === 'following') {
      setActiveTab(tab);
    }

    fetchFriends();
  }, [fetchFriends]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Update URL without reloading the page
    const url = new URL(window.location);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url);
  };

  const handleFollow = async (userId, isFollowing) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(getApiUrl(`api/users/follow/${userId}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to follow/unfollow user');
      }

      // Refresh the friends lists
      fetchFriends();
    } catch (error) {
      console.error('Follow error:', error);
      setError(error.message || 'Failed to follow/unfollow user');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Friends</h1>

      {/* Tabs */}
      <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleTabChange('followers')}
          className={`px-4 py-2 -mb-px ${
            activeTab === 'followers'
              ? 'text-blue-500 border-b-2 border-blue-500 font-medium'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Followers ({followers.length})
        </button>
        <button
          onClick={() => handleTabChange('following')}
          className={`px-4 py-2 -mb-px ${
            activeTab === 'following'
              ? 'text-blue-500 border-b-2 border-blue-500 font-medium'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Following ({following.length})
        </button>
      </div>

      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {(activeTab === 'followers' ? followers : following).map(user => (
          <div key={user.id} className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full overflow-hidden">
                <OptimizedImage
                  src={user.profilePic || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                  alt={user.username}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="ml-4">
                <div className="font-medium">{user.username}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{user.fullName}</div>
              </div>
            </div>
            <button
              onClick={() => handleFollow(user.id, user.isFollowing)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                user.isFollowing
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {user.isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}

        {(activeTab === 'followers' ? followers : following).length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            {activeTab === 'followers'
              ? 'No followers yet'
              : 'Not following anyone yet'}
          </div>
        )}
      </div>
    </div>
  );
} 