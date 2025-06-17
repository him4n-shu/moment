"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiUpload, FiMapPin, FiX, FiImage } from "react-icons/fi";
import OptimizedImage from '../../components/OptimizedImage';
import { getApiUrl } from '@/utils/api';

export default function CreatePost() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    caption: "",
    location: ""
  });
  const [message, setMessage] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(getApiUrl("api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem("token");
          router.push("/login");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage("Only image files are allowed");
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("File size should be less than 5MB");
      return;
    }
    
    setUploadedImage(file);
    
    // Convert to base64 and resize if needed
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Determine if the image needs resizing
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }
        
        // Create canvas and resize image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get the resized image as base64
        const resizedImageBase64 = canvas.toDataURL(file.type, 0.9); // 0.9 quality to reduce size
        
        // Update state with resized image
        setPreview(resizedImageBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    
    setMessage("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that we have an image
    if (!uploadedImage) {
      setMessage("Please select an image to upload");
      return;
    }
    
    setCreating(true);
    setMessage("");
    
    try {
      const token = localStorage.getItem("token");
      
      // Option 1: Send base64 data directly
      // Get base64 string from the preview
      const imageData = preview;
      
      const response = await fetch(getApiUrl("api/posts"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          imageData,
          caption: form.caption,
          location: form.location
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage("Post created successfully!");
        setPostSuccess(true);
        setTimeout(() => {
          router.push("/feed");
        }, 2000);
      } else {
        setMessage(data.message || "Error creating post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setMessage("An error occurred. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-t-[#FF6B6B] border-r-[#FF8E53] border-b-[#FFD166] border-l-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-4 md:pt-8 px-3 md:px-4 pb-12">
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-transparent bg-clip-text">Create New Post</h1>
          <div className="w-16 h-1 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] mx-auto mt-2 rounded-full"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          {/* Image Upload Section */}
          <div>
            {!preview ? (
              <div 
                className={`border-2 border-dashed rounded-lg p-5 md:p-8 text-center transition-all duration-300 ${
                  isDragging 
                    ? "border-[#FF6B6B] bg-[#FF6B6B]/5 dark:bg-[#FF6B6B]/10" 
                    : "border-gray-300 dark:border-gray-600 hover:border-[#FF8E53] hover:bg-[#FF8E53]/5 dark:hover:bg-[#FF8E53]/10"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-[#FF6B6B]/20 to-[#FF8E53]/20 flex items-center justify-center mb-4 animate-pulse">
                    <FiImage className="h-8 w-8 md:h-10 md:w-10 text-[#FF6B6B]" />
                  </div>
                  <p className="text-lg md:text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Drag & Drop your image here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    or click to browse (max 5MB)
                  </p>
                  <button
                    type="button"
                    onClick={handleFileInputClick}
                    className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-lg hover:shadow-md transition-all duration-300 text-sm md:text-base touch-target"
                  >
                    Choose Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-auto max-h-[400px] object-contain bg-gray-100 dark:bg-gray-700 rounded-lg"
                />
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-target"
                    aria-label="Remove image"
                  >
                    <FiX className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            )}
            
            {message && (
              <div className={`mt-3 text-center ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
                {message}
              </div>
            )}
          </div>
          
          {/* Caption Input */}
          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Caption
            </label>
            <textarea
              id="caption"
              name="caption"
              value={form.caption}
              onChange={handleTextChange}
              placeholder="Write a caption..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8E53] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base"
            ></textarea>
          </div>
          
          {/* Location Input */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location (optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="location"
                name="location"
                value={form.location}
                onChange={handleTextChange}
                placeholder="Add location"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8E53] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base"
              />
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={creating || !uploadedImage}
              className={`w-full py-3 rounded-lg text-white text-base md:text-lg font-medium transition-all duration-300 ${
                creating || !uploadedImage
                  ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
            >
              {creating ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                  Creating Post...
                </div>
              ) : (
                "Share Post"
              )}
            </button>
          </div>
          
          {postSuccess && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 dark:text-green-200" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-green-700 dark:text-green-200">Post created successfully! Redirecting...</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
