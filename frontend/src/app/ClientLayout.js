"use client";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import MobileNavbar from "./components/MobileNavbar";
import Navbar from "./components/Navbar";

export default function ClientLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5000/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => data ? setUser(data.user) : null)
        .catch(err => console.error("Error fetching user:", err));
    }
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex flex-col md:flex-row transition-colors duration-300">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile Navigation - visible only on mobile */}
      <div className="md:hidden">
        <MobileNavbar user={user} toggleMenu={toggleMobileMenu} isOpen={mobileMenuOpen} />
      </div>
      
      <div className="flex-1 md:ml-16 min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
        {/* Desktop Navbar */}
        <div className="hidden md:block">
          <Navbar />
        </div>
        
        <main className="container mx-auto p-4">
          {mounted ? children : null}
        </main>
      </div>
    </div>
  );
} 