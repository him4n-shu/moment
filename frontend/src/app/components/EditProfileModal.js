"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { FiX, FiImage, FiUser, FiInfo } from "react-icons/fi";
import OptimizedImage from './OptimizedImage';
import { getApiUrl } from '@/utils/api';

export default function EditProfileModal({ profile, isOpen, onClose, onUpdate }) {
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const isMounted = useRef(true);

  // Cleanup function
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize form with profile data when modal opens
  useEffect(() => {
    if (profile && isOpen) {
      setFullName(profile.fullName || "");
      setBio(profile.bio || "");
      setProfilePic(profile.profilePic || "");
      setPreviewImage(profile.profilePic || "");
      setError("");
    }
  }, [profile, isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Resize the image before saving it
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image (JPEG, PNG, or GIF)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Determine if the image needs resizing
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
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
        const resizedImageBase64 = canvas.toDataURL(file.type, 0.8); 
        
        // Update state with resized image
        setPreviewImage(resizedImageBase64);
        setProfilePic(resizedImageBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    setError("");
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMounted.current) return;
    
    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted.current) {
          setError("You must be logged in");
          setIsSubmitting(false);
        }
        return;
      }

      // Check if the profile picture is too large
      if (profilePic && profilePic.length > 10 * 1024 * 1024) {
        if (isMounted.current) {
          setError("Profile picture is too large. Please use an image smaller than 5MB");
          setIsSubmitting(false);
        }
        return;
      }

      // Create FormData object for multipart/form-data submission
      const formData = new FormData();
      formData.append("username", profile.username);
      formData.append("bio", bio || "");
      formData.append("website", profile.website || "");
      formData.append("firstName", profile.firstName || "");
      formData.append("lastName", profile.lastName || "");
      
      // Only append profilePicture if a new one was selected
      if (profilePic && profilePic !== profile.profilePic) {
        formData.append("profilePicture", profilePic);
      }
      
      const response = await fetch(getApiUrl("api/users/profile"), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!isMounted.current) return;

      if (!response.ok) {
        // Handle non-JSON responses
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          throw new Error(data.message || "Failed to update profile");
        } else {
          throw new Error(`Failed to update profile: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      if (isMounted.current) {
        onUpdate(data.user);
        onClose();
      }
    } catch (error) {
      if (!isMounted.current) return;
      console.error("Profile update error:", error);
      setError(error.message || "An error occurred while updating your profile");
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto transition-colors duration-300"
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-sm">
              {error}
            </div>
          )}

          {/* Profile Picture */}
          <div className="mb-6 flex flex-col items-center">
            <div 
              className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-gray-200 dark:border-gray-700 relative cursor-pointer group"
              onClick={triggerFileInput}
            >
              {previewImage ? (
                <OptimizedImage 
                  src={previewImage} 
                  alt="Profile preview" 
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <FiUser size={40} className="text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all">
                <FiImage size={24} className="text-white opacity-0 group-hover:opacity-100" />
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
            />
            
            <button 
              type="button" 
              onClick={triggerFileInput}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Change Profile Photo
            </button>
          </div>

          {/* Full Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="Your name"
            />
          </div>

          {/* Bio */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="Write something about yourself..."
            ></textarea>
          </div>

          {previewImage && (
            <div className="mt-4">
              <OptimizedImage
                src={previewImage}
                alt="Profile preview"
                width={150}
                height={150}
                className="rounded-full mx-auto"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--primary)', ':hover': { backgroundColor: 'var(--primary-hover)' } }}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}