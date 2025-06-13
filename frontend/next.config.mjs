/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['moment-backend-ykqv.onrender.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'moment-backend-ykqv.onrender.com',
        port: '',
        pathname: '/uploads/**',
      },
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: 'https://moment-backend-ykqv.onrender.com',
  },
}

export default nextConfig
