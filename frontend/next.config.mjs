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
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    });
    return config;
  },
}

export default nextConfig
