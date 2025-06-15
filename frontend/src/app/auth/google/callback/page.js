"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function GoogleCallback() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("processing"); // processing, success, error

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      console.error("Google authentication error:", error);
      setStatus("error");
      return;
    }

    if (token) {
      try {
        localStorage.setItem("token", token);
        setStatus("success");
        // Short delay to show success message before redirecting
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } catch (error) {
        console.error("Error storing token:", error);
        setStatus("error");
      }
    } else {
      setStatus("error");
    }
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center dark:bg-gray-800">
      {status === "processing" && (
        <>
          <h2 className="text-2xl font-bold mb-4">Processing Login...</h2>
          <p className="text-gray-600 dark:text-gray-300">Please wait while we complete your authentication.</p>
        </>
      )}
      
      {status === "success" && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-green-600">Login Successful!</h2>
          <p className="text-gray-600 dark:text-gray-300">You will be redirected to the homepage shortly.</p>
        </>
      )}
      
      {status === "error" && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-red-600">Authentication Failed</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We couldn't complete your Google authentication. Please try again.
          </p>
          <Link href="/login" className="text-blue-500 hover:text-blue-600">
            Return to Login
          </Link>
        </>
      )}
    </div>
  );
} 