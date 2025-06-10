"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

export default function Sidebar() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Fetch user profile if logged in
      fetch("http://localhost:5000/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => data ? setUser(data.user) : null)
        .catch(err => console.error("Error fetching user:", err));
    }
  }, []);

  return (
    <div className="h-screen fixed left-0 top-0 w-16 text-white flex flex-col items-center py-4 shadow-lg transition-colors duration-300" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
      {/* Logo - Home */}
      <Link href="/" className="p-3 rounded-lg mb-6 transition-colors duration-200" style={{ backgroundColor: 'transparent', ":hover": { backgroundColor: 'var(--sidebar-hover)' }}}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </Link>
      
      {/* Profile */}
      <Link href="/profile" className="p-3 rounded-lg my-2 transition-colors duration-200" style={{ backgroundColor: 'transparent', ":hover": { backgroundColor: 'var(--sidebar-hover)' }}}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </Link>
      
      {/* News Feed */}
      <Link href="/feed" className="p-3 rounded-lg my-2 transition-colors duration-200" style={{ backgroundColor: 'transparent', ":hover": { backgroundColor: 'var(--sidebar-hover)' }}}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      </Link>
      
      {/* Friends/Connections */}
      <Link href="/friends" className="p-3 rounded-lg my-2 transition-colors duration-200" style={{ backgroundColor: 'transparent', ":hover": { backgroundColor: 'var(--sidebar-hover)' }}}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </Link>
      
      {/* Messages */}
      <Link href="/messages" className="p-3 rounded-lg my-2 transition-colors duration-200" style={{ backgroundColor: 'transparent', ":hover": { backgroundColor: 'var(--sidebar-hover)' }}}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </Link>
      
      {/* Notifications */}
      <Link href="/notifications" className="p-3 rounded-lg my-2 transition-colors duration-200" style={{ backgroundColor: 'transparent', ":hover": { backgroundColor: 'var(--sidebar-hover)' }}}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </Link>
      
      {/* Create Post */}
      <Link href="/post/new" className="p-3 rounded-lg my-2 transition-colors duration-200" style={{ backgroundColor: 'transparent', ":hover": { backgroundColor: 'var(--sidebar-hover)' }}}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
      
      {/* Theme Toggle */}
      <div className="my-2">
        <ThemeToggle />
      </div>
      
      {/* Settings - Bottom */}
      <div className="mt-auto">
        <Link href="/settings" className="p-3 rounded-lg my-2 transition-colors duration-200" style={{ backgroundColor: 'transparent', ":hover": { backgroundColor: 'var(--sidebar-hover)' }}}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
