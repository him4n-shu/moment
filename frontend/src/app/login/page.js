"use client";
import { useState } from "react";
import Link from "next/link";
import OptimizedImage from '../components/OptimizedImage';
import { getApiUrl } from '@/utils/api';

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
    <div className="max-w-md mx-auto mt-10 p-6 rounded-lg shadow-md transition-colors duration-300 card">
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
      <div className="mt-4">
        <button
          onClick={handleGoogleLogin}
          className="w-full py-2 px-4 rounded-md transition-colors duration-300 flex items-center justify-center"
          style={{ 
            backgroundColor: 'transparent', 
            color: 'var(--foreground)',
            borderColor: 'var(--border-color)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <OptimizedImage
            src="/logo.png"
            alt="Moment Logo"
            width={120}
            height={120}
            className="w-30 h-30"
          />
          Login with Google
        </button>
      </div>
      {message && (
        <p className={`mt-4 text-center ${message.includes("successful") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Don&apos;t have an account? <Link href="/register" className="text-blue-500 hover:text-blue-600">Sign up</Link>
      </div>
    </div>
  );
} 