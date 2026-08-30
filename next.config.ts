import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "4.25mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "grbbliiayrcrulqnwvxc.supabase.co",
        pathname: "/storage/v1/object/sign/forum-media/**",
      },
    ],
  },
};

export default nextConfig;
