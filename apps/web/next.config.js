/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/conjuntos',
        destination: '/?cat=sets',
      },
      {
        source: '/sets',
        destination: '/?cat=sets',
      },
    ];
  },
}

module.exports = nextConfig
