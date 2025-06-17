"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { getApiUrl } from '@/utils/api';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Initial form, 2: OTP verification
  const [userId, setUserId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.username || !formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('api/auth/register/init'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setUserId(data.userId);
      setStep(2);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (!formData.otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('api/auth/register/verify'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          otp: formData.otp
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      // Store the token and redirect
      localStorage.setItem('token', data.token);
      router.push('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!userId) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('api/auth/register/resend-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      alert('New OTP has been sent to your email');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    try {
      const googleAuthUrl = getApiUrl("api/auth/google");
      console.log("Redirecting to Google auth URL:", googleAuthUrl);
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error("Error during Google authentication redirect:", error);
      setError("Error connecting to Google authentication. Please try again.");
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
        className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md transition-colors duration-300 card z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.h2 
          className="text-2xl font-bold text-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {step === 1 ? 'Create your account' : 'Verify your email'}
        </motion.h2>
        
        {step === 1 && (
          <motion.p 
            className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Already have an account? <Link href="/login" className="text-blue-500 hover:text-blue-600">Sign in</Link>
          </motion.p>
        )}
        
        {step === 2 && (
          <motion.p 
            className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Enter the OTP sent to your email
          </motion.p>
        )}

        {error && (
          <motion.div 
            className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <motion.button
              onClick={handleGoogleSignup}
              className="w-full py-2 px-4 rounded-md transition-colors duration-300 flex items-center justify-center mb-4"
              style={{ 
                backgroundColor: 'white', 
                color: '#333',
                borderColor: '#ddd',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Image 
                src="/icons/google-icon.svg" 
                alt="Google" 
                width={18} 
                height={18} 
                className="mr-2" 
              />
              Sign up with Google
            </motion.button>
            
            <div className="my-4 flex items-center">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
              <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">OR</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
            </div>
          </motion.div>
        )}

        <motion.form 
          className="space-y-4" 
          onSubmit={step === 1 ? handleInitialSubmit : handleOTPSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {step === 1 ? (
            <>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  name="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full rounded-md p-2 transition-colors duration-300"
                  style={{ 
                    backgroundColor: 'var(--card-bg)', 
                    color: 'var(--foreground)',
                    borderColor: 'var(--border-color)',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                />
              </motion.div>

              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                >
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    name="firstName"
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full rounded-md p-2 transition-colors duration-300"
                    style={{ 
                      backgroundColor: 'var(--card-bg)', 
                      color: 'var(--foreground)',
                      borderColor: 'var(--border-color)',
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.1 }}
                >
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    name="lastName"
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full rounded-md p-2 transition-colors duration-300"
                    style={{ 
                      backgroundColor: 'var(--card-bg)', 
                      color: 'var(--foreground)',
                      borderColor: 'var(--border-color)',
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                  />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="Your email address"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-md p-2 transition-colors duration-300"
                  style={{ 
                    backgroundColor: 'var(--card-bg)', 
                    color: 'var(--foreground)',
                    borderColor: 'var(--border-color)',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.3 }}
                className="relative"
              >
                <label className="block text-sm font-medium mb-1">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-md p-2 pr-10 transition-colors duration-300"
                    style={{ 
                      backgroundColor: 'var(--card-bg)', 
                      color: 'var(--foreground)',
                      borderColor: 'var(--border-color)',
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.4 }}
                className="relative"
              >
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full rounded-md p-2 pr-10 transition-colors duration-300"
                    style={{ 
                      backgroundColor: 'var(--card-bg)', 
                      color: 'var(--foreground)',
                      borderColor: 'var(--border-color)',
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <label className="block text-sm font-medium mb-1">Enter OTP</label>
              <input
                name="otp"
                type="text"
                placeholder="Enter the OTP sent to your email"
                value={formData.otp}
                onChange={handleChange}
                className="w-full rounded-md p-2 transition-colors duration-300"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  color: 'var(--foreground)',
                  borderColor: 'var(--border-color)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              />
            </motion.div>
          )}

          <motion.button
            type="submit"
            className="w-full py-2 px-4 rounded-md transition-colors duration-300 mt-6"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.5 }}
          >
            {loading ? 'Processing...' : (step === 1 ? 'Create Account' : 'Verify OTP')}
          </motion.button>
          
          {step === 2 && (
            <motion.div 
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 1 }}
            >
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-blue-500 hover:text-blue-600 text-sm"
                disabled={loading}
              >
                Didn't receive the code? Resend OTP
              </button>
            </motion.div>
          )}
        </motion.form>
      </motion.div>
    </div>
  );
} 