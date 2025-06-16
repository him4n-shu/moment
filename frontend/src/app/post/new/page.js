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
        setTimeout(() => {
          router.push("/feed");
        }, 1500);
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-4 md:pt-8 px-3 md:px-4 pb-12">
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center text-gray-900 dark:text-white">Create Post</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Image Upload Section */}
          <div>
            {!preview ? (
              <div 
                className={`border-2 border-dashed rounded-lg p-4 md:p-8 text-center ${
                  isDragging 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20" 
                    : "border-gray-300 dark:border-gray-600"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center">
                  <FiImage className="h-10 w-10 md:h-12 md:w-12 text-gray-700 dark:text-gray-300 mb-2 md:mb-3" />
                  <p className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Drag and drop your image here</p>
                  <p className="text-xs text-gray-700 dark:text-gray-400 mb-3 md:mb-4">
                    Supported formats: JPG, PNG, GIF (max 5MB)
                  </p>
                  <p className="text-sm text-center mb-3 md:mb-4 text-gray-900 dark:text-white">- OR -</p>
                  <div>
                    <button
                      type="button"
                      onClick={handleFileInputClick}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 md:py-3 px-4 md:px-6 rounded-md shadow-md inline-flex items-center text-sm md:text-base"
                    >
                      <FiUpload className="mr-2" />
                      <span>Select from computer</span>
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
              </div>
            ) : (
              <div className="relative">
                <div className="aspect-square max-h-80 md:max-h-96 overflow-hidden rounded-lg">
                  <OptimizedImage
                    src={preview}
                    alt="Post preview"
                    width={800}
                    height={600}
                    className="max-h-[400px] w-auto mx-auto"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors duration-300"
                >
                  <FiX />
                </button>
              </div>
            )}
          </div>
          
          {/* Caption Input */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Caption</label>
            <textarea
              name="caption"
              value={form.caption}
              onChange={handleTextChange}
              placeholder="Write a caption..."
              rows={4}
              className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          {/* Location Input */}
          <div>
            <label className="inline-flex items-center text-sm font-medium mb-1 text-gray-900 dark:text-white">
              <FiMapPin className="mr-1 text-gray-900 dark:text-white" />
              <span>Location (optional)</span>
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleTextChange}
              placeholder="Add location"
              className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          {/* Buttons */}
          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={() => router.push("/feed")}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={creating || !preview}
              className={`px-4 py-2 rounded-lg text-white font-medium ${
                creating || !preview ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {creating ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
        
        {message && (
          <div className={`p-3 rounded-lg text-center text-sm ${
            message.includes("success") ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
