"use client";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import MobileNavbar from "./components/MobileNavbar";
import Navbar from "./components/Navbar";
import { SocketProvider } from "./contexts/SocketContext";
import { FiWifiOff } from "react-icons/fi";
import { getApiUrl } from '@/utils/api';

export default function ClientLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      fetchUserProfile(); // Retry when back online
    };
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

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(getApiUrl("api/users/profile"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      // If we're offline, set that state
      if (!navigator.onLine || err.message === "Failed to fetch") {
        setIsOffline(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchUserProfile();
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <SocketProvider>
      <div className="flex flex-col md:flex-row transition-colors duration-300">
        {/* Offline banner */}
        {isOffline && (
          <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white p-2 text-center z-50 flex items-center justify-center">
            <FiWifiOff className="mr-2" />
            <span>You are currently offline. Some features may be unavailable.</span>
          </div>
        )}
        
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        {/* Mobile Navigation - visible only on mobile */}
        <div className="md:hidden">
          <MobileNavbar user={user} toggleMenu={toggleMobileMenu} isOpen={mobileMenuOpen} />
        </div>
        
        <div className={`flex-1 md:ml-16 min-h-screen transition-colors duration-300 ${isOffline ? 'mt-10' : 'mt-14 md:mt-0'}`} style={{ backgroundColor: 'var(--background)' }}>
          {/* Desktop Navbar */}
          <div className="hidden md:block">
            <Navbar />
          </div>
          
          <main className="container mx-auto px-2 sm:px-4 pb-16 md:pb-4">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : mounted ? (
              children
            ) : null}
          </main>
        </div>
      </div>
    </SocketProvider>
  );
} 