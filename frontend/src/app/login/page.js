"use client";
import { useState } from "react";
import Link from "next/link";
import OptimizedImage from '../components/OptimizedImage';
import { getApiUrl } from '@/utils/api';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [focused, setFocused] = useState({ email: false, password: false });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFocus = (field) => {
    setFocused({ ...focused, [field]: true });
  };

  const handleBlur = (field) => {
    setFocused({ ...focused, [field]: false });
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      {/* Background SVG */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/backgrounds/auth-background.svg"
          alt="Background"
          fill
          className="object-cover opacity-50"
          priority
        />
      </div>
      
      <motion.div 
        className="max-w-md w-full mx-auto mb-8 text-center z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="flex justify-center mb-2"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.2 
          }}
        >
          <Image
            src="/logos/animated-logo.svg"
            alt="Moment Logo"
            width={120}
            height={120}
            className="w-24 h-24"
          />
        </motion.div>
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Image 
            src="/logos/text-logo.svg"
            alt="Moment"
            width={150}
            height={40}
            className="h-10 w-auto"
          />
        </motion.div>
        <motion.p 
          className="text-gray-600 dark:text-gray-400 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          Share your moments with the world
        </motion.p>
      </motion.div>
      
      <motion.div 
        className="max-w-md w-full mx-auto rounded-2xl shadow-xl transition-colors duration-300 z-10 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FFD166] p-6 text-white">
          <motion.h2 
            className="text-2xl font-bold text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Welcome Back
          </motion.h2>
          <motion.p
            className="text-center text-blue-100 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Sign in to continue to your account
          </motion.p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="relative"
            >
              <div className={`flex items-center border-2 rounded-lg px-3 py-2 ${focused.email ? 'border-[#FF8E53] dark:border-[#FF8E53]' : 'border-gray-300 dark:border-gray-600'} transition-colors duration-200`}>
                <FiMail className={`mr-2 ${focused.email ? 'text-[#FF8E53] dark:text-[#FF8E53]' : 'text-gray-500 dark:text-gray-400'} transition-colors duration-200`} />
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email')}
                  required
                  className="w-full bg-transparent focus:outline-none text-gray-800 dark:text-white"
                />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="relative"
            >
              <div className={`flex items-center border-2 rounded-lg px-3 py-2 ${focused.password ? 'border-[#FF8E53] dark:border-[#FF8E53]' : 'border-gray-300 dark:border-gray-600'} transition-colors duration-200`}>
                <FiLock className={`mr-2 ${focused.password ? 'text-[#FF8E53] dark:text-[#FF8E53]' : 'text-gray-500 dark:text-gray-400'} transition-colors duration-200`} />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => handleFocus('password')}
                  onBlur={() => handleBlur('password')}
                  required
                  className="w-full bg-transparent focus:outline-none text-gray-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end mt-1">
                <Link href="#" className="text-sm text-[#FF6B6B] hover:text-[#FF8E53] dark:text-[#FF8E53] dark:hover:text-[#FFD166]">
                  Forgot password?
                </Link>
              </div>
            </motion.div>
            
            <motion.button
              type="submit"
              className="w-full py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FFD166] text-white font-medium hover:shadow-lg hover:from-[#FF5B5B] hover:via-[#FF7E43] hover:to-[#FFC156] group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <span>Sign In</span>
              <FiArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform duration-200" />
            </motion.button>
          </form>
          
          <motion.div 
            className="my-6 flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
            <span className="mx-4 text-sm text-gray-500 dark:text-gray-400 font-medium">OR</span>
            <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <motion.button
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FcGoogle className="text-xl mr-2" />
              <span>Continue with Google</span>
            </motion.button>
          </motion.div>
          
          {message && (
            <motion.div 
              className={`mt-6 p-3 rounded-lg text-center ${message.includes("successful") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {message}
            </motion.div>
          )}
          
          <motion.div 
            className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
          >
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#FF6B6B] hover:text-[#FF8E53] dark:text-[#FF8E53] dark:hover:text-[#FFD166] font-medium">
              Sign up
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 