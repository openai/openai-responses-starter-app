/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    turbo: true,
    appDir: true, // Włączony routing oparty na katalogu /app
  },
};

export default nextConfig;
