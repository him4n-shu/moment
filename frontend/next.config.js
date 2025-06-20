/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'moment-deuw.onrender.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NODE_ENV === 'production' 
      ? process.env.BACKEND_URL || 'https://moment-deuw.onrender.com' 
      : 'http://localhost:5000',
  },
}

module.exports = nextConfig 