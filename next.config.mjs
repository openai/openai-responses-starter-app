/** @type {import('next').NextConfig} */
const cdnHost = process.env.NEXT_PUBLIC_CDN_HOST || null;
const nextConfig = {
  output: 'standalone',
  devIndicators: false,
  images: {
    // if NEXT_PUBLIC_CDN_HOST is set, allow it in remotePatterns for optimizations
    remotePatterns: cdnHost
      ? [
          {
            protocol: "https",
            hostname: cdnHost,
            pathname: "/:path*",
          },
        ]
      : [],
  },
};

export default nextConfig;
