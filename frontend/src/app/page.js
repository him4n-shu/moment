"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-lg shadow-md text-center">
      <h1 className="text-4xl font-bold mb-4 text-blue-700">Travel Story Map</h1>
      {user && (
        <p className="text-xl mb-4 text-gray-700">
          Welcome back, <span className="font-semibold">{user.username}</span>!
        </p>
      )}
      <p className="mb-8 text-gray-700 text-lg">
        Welcome to your personal travel diary! Register, log in, and share your travel stories by placing them on the map. Explore your adventures visually and relive your favorite moments.
      </p>
      <div className="flex flex-col gap-4 items-center">
        {!user ? (
          <>
            <Link href="/register" className="w-full sm:w-auto bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition">Register</Link>
            <Link href="/login" className="w-full sm:w-auto bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition">Login</Link>
          </>
        ) : (
          <>
            <Link href="/profile" className="w-full sm:w-auto bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition">Profile</Link>
            <Link href="/story/new" className="w-full sm:w-auto bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition">Add a Story</Link>
          </>
        )}
      </div>
    </div>
  );
}
