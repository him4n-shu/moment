"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function GoogleCallback() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      window.location.href = "/";
    }
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
      <h2 className="text-2xl font-bold mb-4">Processing Login...</h2>
      <p className="text-gray-600">Please wait while we complete your authentication.</p>
    </div>
  );
} 