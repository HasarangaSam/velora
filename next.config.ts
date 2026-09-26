import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel uses its own Next.js output adapter. Keep standalone output for
  // Docker/self-hosted builds, where the generated server.js is used.
  output: process.env.VERCEL ? undefined : "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
