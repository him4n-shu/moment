"use client";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import MobileNavbar from "./components/MobileNavbar";
import Navbar from "./components/Navbar";
import { SocketProvider, useSocket } from "./contexts/SocketContext";
import { FiWifiOff, FiWifi, FiRefreshCw } from "react-icons/fi";
import { getApiUrl } from '@/utils/api';
import { usePathname } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Socket status banner component
function SocketStatusBanner() {
  const { isConnected, reconnectAttempts, reconnect } = useSocket();
  const [isOffline, setIsOffline] = useState(false);
  
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

  if (!isOffline && isConnected) return null;
  
  return (
    <div className={`fixed top-0 left-0 right-0 p-2 text-center z-50 flex items-center justify-center ${
      isOffline ? 'bg-amber-500 text-white' : 
      !isConnected ? 'bg-orange-500 text-white' : 'hidden'
    }`}>
      {isOffline ? (
        <>
          <FiWifiOff className="mr-2" />
          <span>You are currently offline. Some features may be unavailable.</span>
        </>
      ) : !isConnected ? (
        <>
          <FiWifi className="mr-2" />
          <span>Connection to server lost. {reconnectAttempts > 0 ? `Retrying (${reconnectAttempts})...` : 'Reconnecting...'}</span>
          <button 
            onClick={reconnect}
            className="ml-2 bg-white text-orange-500 rounded-full p-1 hover:bg-orange-100 transition-colors"
            aria-label="Reconnect manually"
          >
            <FiRefreshCw />
          </button>
        </>
      ) : null}
    </div>
  );
}

// Main layout wrapper that provides socket context
function LayoutWithSocket({ children, isAuthPage }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchUserInfo = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(getApiUrl("api/auth/me"), {
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // If it's an auth page, render without navbar and sidebar
  if (isAuthPage) {
    return (
      <div className="flex flex-col transition-colors duration-300">
        <SocketStatusBanner />
        
        <div className="flex-1 min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
          <main>
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : children}
          </main>
        </div>
      </div>
    );
  }

  // Regular layout with navbar and sidebar for non-auth pages
  return (
    <div className="flex flex-col md:flex-row transition-colors duration-300">
      <SocketStatusBanner />
      
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile Navigation - visible only on mobile */}
      <div className="md:hidden">
        <MobileNavbar user={user} toggleMenu={toggleMobileMenu} isOpen={mobileMenuOpen} />
      </div>
      
      <div className="flex-1 md:ml-16 min-h-screen transition-colors duration-300 mt-14 md:mt-0" style={{ backgroundColor: 'var(--background)' }}>
        {/* Desktop Navbar */}
        <div className="hidden md:block">
          <Navbar />
        </div>
        
        <main className="container mx-auto px-2 sm:px-4 pb-16 md:pb-4">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : children}
        </main>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      mirror: true,
      offset: 50,
      easing: 'ease-in-out',
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <SocketProvider>
      <LayoutWithSocket isAuthPage={isAuthPage}>
        {children}
      </LayoutWithSocket>
    </SocketProvider>
  );
} 