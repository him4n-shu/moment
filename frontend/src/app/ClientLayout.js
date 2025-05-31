"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ClientLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            Travel Story Map
          </Link>
          <div className="space-x-4">
            <Link href="/register" className="hover:text-blue-200">
              Register
            </Link>
            <Link href="/login" className="hover:text-blue-200">
              Login
            </Link>
            <Link href="/profile" className="hover:text-blue-200">
              Profile
            </Link>
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4">
        {mounted ? children : null}
      </main>
    </>
  );
} 