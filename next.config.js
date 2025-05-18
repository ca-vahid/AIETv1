/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Disable eslint during production build for now
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 