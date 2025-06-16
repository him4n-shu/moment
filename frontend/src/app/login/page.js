"use client";
import { useState } from "react";
import Link from "next/link";
import OptimizedImage from '../components/OptimizedImage';
import { getApiUrl } from '@/utils/api';
import Image from 'next/image';

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(getApiUrl("api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        setMessage("Login successful!");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    }
  };

  const handleGoogleLogin = () => {
    try {
      const googleAuthUrl = getApiUrl("api/auth/google");
      console.log("Redirecting to Google auth URL:", googleAuthUrl);
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error("Error during Google login redirect:", error);
      setMessage("Error connecting to Google authentication. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full mx-auto mb-8 text-center">
        <div className="flex justify-center mb-2">
          <OptimizedImage
            src="/logo.png"
            alt="Moment Logo"
            width={120}
            height={120}
            className="w-24 h-24"
          />
        </div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Moment</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Share your moments with the world</p>
      </div>
      
      <div className="max-w-md w-full mx-auto p-6 rounded-lg shadow-md transition-colors duration-300 card">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md shadow-sm transition-colors duration-300 p-2"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                color: 'var(--foreground)',
                borderColor: 'var(--border-color)',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md shadow-sm transition-colors duration-300 p-2"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                color: 'var(--foreground)',
                borderColor: 'var(--border-color)',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 rounded-md transition-colors duration-300"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
          >
            Login
          </button>
        </form>
        
        <div className="my-4 flex items-center">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
          <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
        </div>
        
        <div>
          <button
            onClick={handleGoogleLogin}
            className="w-full py-2 px-4 rounded-md transition-colors duration-300 flex items-center justify-center"
            style={{ 
              backgroundColor: 'white', 
              color: '#333',
              borderColor: '#ddd',
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            <Image 
              src="/icons/google-icon.svg" 
              alt="Google" 
              width={18} 
              height={18} 
              className="mr-2" 
            />
            Login with Google
          </button>
        </div>
        
        {message && (
          <p className={`mt-4 text-center ${message.includes("successful") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
        
        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t have an account? <Link href="/register" className="text-blue-500 hover:text-blue-600">Sign up</Link>
        </div>
      </div>
    </div>
  );
} 