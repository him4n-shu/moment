/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['moment-backend-ykqv.onrender.com'],
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: 'https://moment-backend-ykqv.onrender.com',
  },
}

module.exports = nextConfig 