"use client";
import { useState, useEffect } from "react";
import { FiCamera, FiSave, FiAlertCircle } from "react-icons/fi";
import OptimizedImage from '../OptimizedImage';
import { getApiUrl } from '@/utils/api';

export default function AccountSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    bio: "",
    profilePic: "",
  });

  // Load user data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const response = await fetch(getApiUrl("api/users/profile"), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data.user);
        setFormData({
          username: data.user.username,
          email: data.user.email,
          fullName: data.user.fullName || "",
          bio: data.user.bio || "",
          profilePic: data.user.profilePic || "",
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setMessage({
          type: "error",
          text: error.message || "Failed to load profile",
        });
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Image size should be less than 2MB",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, profilePic: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(getApiUrl("api/users/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          bio: formData.bio,
          website: formData.website,
          firstName: formData.firstName,
          lastName: formData.lastName,
          profilePic: formData.profilePic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setProfile(data.user);
      setMessage({
        type: "success",
        text: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${
            message.type === "error"
              ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
              : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
          }`}
        >
          <FiAlertCircle className="flex-shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Profile Picture */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profile Picture
          </label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <OptimizedImage
                src={formData.profilePic || "/default-avatar.png"}
                alt={formData.username}
                width={150}
                height={150}
                className="w-32 h-32 rounded-full object-cover"
              />
              <label
                htmlFor="profilePic"
                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors"
              >
                <FiCamera size={16} />
              </label>
              <input
                type="file"
                id="profilePic"
                name="profilePic"
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Click the camera icon to upload a new profile picture.
              <br />
              Max size: 2MB. Recommended size: 400x400 pixels.
            </div>
          </div>
        </div>

        {/* Username (read-only) */}
        <div className="mb-4">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            readOnly
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Username cannot be changed.
          </p>
        </div>

        {/* Email (read-only) */}
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            readOnly
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Email cannot be changed.
          </p>
        </div>

        {/* Full Name */}
        <div className="mb-4">
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-800"
          />
        </div>

        {/* Bio */}
        <div className="mb-6">
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-800"
            placeholder="Tell us about yourself..."
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FiSave />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
} 