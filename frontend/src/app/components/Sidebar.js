"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { FiHome, FiUsers, FiMessageCircle, FiBell, FiPlusSquare, FiSettings, FiWifiOff } from "react-icons/fi";
import { getApiUrl } from '@/utils/api';
import { useRouter, usePathname } from 'next/navigation';

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial state
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Fetch user data if logged in with retry logic
      const fetchUserData = async () => {
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            const response = await fetch(getApiUrl("api/auth/me"), {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (!response.ok) {
              if (response.status === 401) {
                // Token invalid, redirect to login
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
              }
              throw new Error(`Server responded with ${response.status}`);
            }
            
            const data = await response.json();
            if (data && data.user) {
              setUser(data.user);
              return; // Success, exit retry loop
            }
          } catch (err) {
            console.error(`Error fetching user (attempt ${retries + 1}/${maxRetries}):`, err);
            retries++;
            
            if (retries >= maxRetries) {
              // Max retries reached, check if network issue
              if (!navigator.onLine || err.message === "Failed to fetch") {
                setIsOffline(true);
              }
              return;
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          }
        }
      };
      
      fetchUserData();
    }
  }, []);

  // Check if a route is active
  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <div className="h-screen fixed left-0 top-0 w-16 flex flex-col items-center py-4 shadow-lg transition-colors duration-300 bg-gradient-to-b from-[#FF6B6B] via-[#FF8E53] to-[#FFD166]">
      {/* Offline indicator */}
      {isOffline && (
        <div className="absolute top-2 right-2 text-white" title="You are offline">
          <FiWifiOff />
        </div>
      )}
      
      {/* Logo - Home */}
      <Link href="/" className={`p-3 rounded-lg mb-6 transition-all duration-200 ${isActive('/') ? 'bg-white bg-opacity-30 shadow-md' : 'hover:bg-white hover:bg-opacity-20'}`}>
        <FiHome className="h-6 w-6 text-white" />
      </Link>
      
      {/* News Feed */}
      <Link href="/feed" className={`p-3 rounded-lg my-2 transition-all duration-200 ${isActive('/feed') ? 'bg-white bg-opacity-30 shadow-md' : 'hover:bg-white hover:bg-opacity-20'}`}>
        <FiUsers className="h-6 w-6 text-white" />
      </Link>
      
      {/* Friends/Connections */}
      <Link href="/friends" className={`p-3 rounded-lg my-2 transition-all duration-200 ${isActive('/friends') ? 'bg-white bg-opacity-30 shadow-md' : 'hover:bg-white hover:bg-opacity-20'}`}>
        <FiUsers className="h-6 w-6 text-white" />
      </Link>
      
      {/* Messages */}
      <Link href="/messages" className={`p-3 rounded-lg my-2 transition-all duration-200 ${isActive('/messages') ? 'bg-white bg-opacity-30 shadow-md' : 'hover:bg-white hover:bg-opacity-20'}`}>
        <FiMessageCircle className="h-6 w-6 text-white" />
      </Link>
      
      {/* Notifications */}
      <Link href="/notifications" className={`p-3 rounded-lg my-2 transition-all duration-200 ${isActive('/notifications') ? 'bg-white bg-opacity-30 shadow-md' : 'hover:bg-white hover:bg-opacity-20'}`}>
        <FiBell className="h-6 w-6 text-white" />
      </Link>
      
      {/* Create Post */}
      <Link href="/post/new" className={`p-3 rounded-lg my-2 transition-all duration-200 ${isActive('/post/new') ? 'bg-white bg-opacity-30 shadow-md' : 'hover:bg-white hover:bg-opacity-20'}`}>
        <FiPlusSquare className="h-6 w-6 text-white" />
      </Link>
      
      {/* Settings - Bottom */}
      <div className="mt-auto">
        <Link href="/settings" className={`p-3 rounded-lg my-2 transition-all duration-200 ${isActive('/settings') ? 'bg-white bg-opacity-30 shadow-md' : 'hover:bg-white hover:bg-opacity-20'}`}>
          <FiSettings className="h-6 w-6 text-white" />
        </Link>
      </div>
    </div>
  );
}
