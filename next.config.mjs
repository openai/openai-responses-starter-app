import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const cdnHost = process.env.NEXT_PUBLIC_CDN_HOST || null;
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
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
