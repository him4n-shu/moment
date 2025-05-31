"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Not logged in");
        return;
      }
      try {
        const res = await fetch("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
        } else {
          setMessage("Unauthorized or error fetching profile");
        }
      } catch (error) {
        setMessage("An error occurred. Please try again.");
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Profile</h2>
      {profile ? (
        <div className="space-y-4">
          <div className="border-b pb-4">
            <p className="text-sm text-gray-600">ID</p>
            <p className="font-medium">{profile.id}</p>
          </div>
          <div className="border-b pb-4">
            <p className="text-sm text-gray-600">Username</p>
            <p className="font-medium">{profile.username}</p>
          </div>
          <div className="border-b pb-4">
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{profile.email}</p>
          </div>
          <div className="border-b pb-4">
            <p className="text-sm text-gray-600">Created At</p>
            <p className="font-medium">{new Date(profile.createdAt).toLocaleString()}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-red-600 mb-4">{message || "Loading..."}</p>
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-800"
          >
            Go to Login
          </Link>
        </div>
      )}
    </div>
  );
} 