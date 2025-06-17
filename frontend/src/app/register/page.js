"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiEye, FiEyeOff, FiUser, FiMail, FiLock, FiArrowRight, FiCheck } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
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
  const [focused, setFocused] = useState({
    username: false,
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
    otp: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFocus = (field) => {
    setFocused({ ...focused, [field]: true });
  };

  const handleBlur = (field) => {
    setFocused({ ...focused, [field]: false });
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
            {step === 1 ? 'Create your account' : 'Verify your email'}
          </motion.h2>
          <motion.p
            className="text-center text-blue-100 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {step === 1 ? 'Join our community today' : 'Enter the verification code sent to your email'}
          </motion.p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <motion.button
                onClick={handleGoogleSignup}
                className="w-full py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 mb-6"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FcGoogle className="text-xl mr-2" />
                <span>Sign up with Google</span>
              </motion.button>
              
              <div className="flex items-center my-6">
                <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
                <span className="mx-4 text-sm text-gray-500 dark:text-gray-400 font-medium">OR</span>
                <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
              </div>
            </motion.div>
          )}

          <motion.form 
            className="space-y-5" 
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
                  className="relative"
                >
                  <div className={`flex items-center border-2 rounded-lg px-3 py-2 ${focused.username ? 'border-[#FF8E53] dark:border-[#FF8E53]' : 'border-gray-300 dark:border-gray-600'} transition-colors duration-200`}>
                    <FiUser className={`mr-2 ${focused.username ? 'text-[#FF8E53] dark:text-[#FF8E53]' : 'text-gray-500 dark:text-gray-400'} transition-colors duration-200`} />
                    <input
                      name="username"
                      type="text"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleChange}
                      onFocus={() => handleFocus('username')}
                      onBlur={() => handleBlur('username')}
                      className="w-full bg-transparent focus:outline-none text-gray-800 dark:text-white"
                    />
                  </div>
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.0 }}
                    className="relative"
                  >
                    <div className={`flex items-center border-2 rounded-lg px-3 py-2 ${focused.firstName ? 'border-[#FF8E53] dark:border-[#FF8E53]' : 'border-gray-300 dark:border-gray-600'} transition-colors duration-200`}>
                      <input
                        name="firstName"
                        type="text"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleChange}
                        onFocus={() => handleFocus('firstName')}
                        onBlur={() => handleBlur('firstName')}
                        className="w-full bg-transparent focus:outline-none text-gray-800 dark:text-white"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.1 }}
                    className="relative"
                  >
                    <div className={`flex items-center border-2 rounded-lg px-3 py-2 ${focused.lastName ? 'border-[#FF8E53] dark:border-[#FF8E53]' : 'border-gray-300 dark:border-gray-600'} transition-colors duration-200`}>
                      <input
                        name="lastName"
                        type="text"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        onFocus={() => handleFocus('lastName')}
                        onBlur={() => handleBlur('lastName')}
                        className="w-full bg-transparent focus:outline-none text-gray-800 dark:text-white"
                      />
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                  className="relative"
                >
                  <div className={`flex items-center border-2 rounded-lg px-3 py-2 ${focused.email ? 'border-[#FF8E53] dark:border-[#FF8E53]' : 'border-gray-300 dark:border-gray-600'} transition-colors duration-200`}>
                    <FiMail className={`mr-2 ${focused.email ? 'text-[#FF8E53] dark:text-[#FF8E53]' : 'text-gray-500 dark:text-gray-400'} transition-colors duration-200`} />
                    <input
                      name="email"
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => handleFocus('email')}
                      onBlur={() => handleBlur('email')}
                      className="w-full bg-transparent focus:outline-none text-gray-800 dark:text-white"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.3 }}
                  className="relative"
                >
                  <div className={`flex items-center border-2 rounded-lg px-3 py-2 ${focused.password ? 'border-[#FF8E53] dark:border-[#FF8E53]' : 'border-gray-300 dark:border-gray-600'} transition-colors duration-200`}>
                    <FiLock className={`mr-2 ${focused.password ? 'text-[#FF8E53] dark:text-[#FF8E53]' : 'text-gray-500 dark:text-gray-400'} transition-colors duration-200`} />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => handleFocus('password')}
                      onBlur={() => handleBlur('password')}
                      className="w-full bg-transparent focus:outline-none text-gray-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                  <div className={`flex items-center border-2 rounded-lg px-3 py-2 ${focused.confirmPassword ? 'border-[#FF8E53] dark:border-[#FF8E53]' : 'border-gray-300 dark:border-gray-600'} transition-colors duration-200`}>
                    <FiLock className={`mr-2 ${focused.confirmPassword ? 'text-[#FF8E53] dark:text-[#FF8E53]' : 'text-gray-500 dark:text-gray-400'} transition-colors duration-200`} />
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => handleFocus('confirmPassword')}
                      onBlur={() => handleBlur('confirmPassword')}
                      className="w-full bg-transparent focus:outline-none text-gray-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                className="relative"
              >
                <div className={`flex items-center border-2 rounded-lg px-3 py-2 ${focused.otp ? 'border-[#FF8E53] dark:border-[#FF8E53]' : 'border-gray-300 dark:border-gray-600'} transition-colors duration-200`}>
                  <FiCheck className={`mr-2 ${focused.otp ? 'text-[#FF8E53] dark:text-[#FF8E53]' : 'text-gray-500 dark:text-gray-400'} transition-colors duration-200`} />
                  <input
                    name="otp"
                    type="text"
                    placeholder="Enter verification code"
                    value={formData.otp}
                    onChange={handleChange}
                    onFocus={() => handleFocus('otp')}
                    onBlur={() => handleBlur('otp')}
                    className="w-full bg-transparent focus:outline-none text-gray-800 dark:text-white"
                  />
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div 
                className="p-3 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="w-full py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FFD166] text-white font-medium hover:shadow-lg hover:from-[#FF5B5B] hover:via-[#FF7E43] hover:to-[#FFC156] group"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.5 }}
            >
              <span>{loading ? 'Processing...' : (step === 1 ? 'Create Account' : 'Verify Email')}</span>
              <FiArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform duration-200" />
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
                  className="text-[#FF6B6B] hover:text-[#FF8E53] dark:text-[#FF8E53] dark:hover:text-[#FFD166] text-sm"
                  disabled={loading}
                >
                  Didn't receive the code? Resend OTP
                </button>
              </motion.div>
            )}
          </motion.form>
          
          <motion.div 
            className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.6 }}
          >
            {step === 1 ? (
              <>
                Already have an account?{" "}
                <Link href="/login" className="text-[#FF6B6B] hover:text-[#FF8E53] dark:text-[#FF8E53] dark:hover:text-[#FFD166] font-medium">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-[#FF6B6B] hover:text-[#FF8E53] dark:text-[#FF8E53] dark:hover:text-[#FFD166] font-medium">
                  Back to login
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 