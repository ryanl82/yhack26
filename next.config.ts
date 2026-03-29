import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.ticketmaster.com" },
      { protocol: "https", hostname: "*.amadeus.com" },
      { protocol: "https", hostname: "maps.wikimedia.org" }
    ]
  }
};

export default nextConfig;
