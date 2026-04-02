import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Fix cross-origin preview warning + turbopack stability
  allowedDevOrigins: [
    "https://*.space.z.ai",
    "http://*.space.z.ai",
  ],
  // Disable turbopack to prevent cache corruption crashes
  experimental: {},
};

export default nextConfig;
