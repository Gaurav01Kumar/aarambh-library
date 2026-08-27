import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    "aarambhlibrary.com",
    "www.aarambhlibrary.com",
    "www.library.yaadgarpal.com",
    "library.yaadgarpal.com",
    "localhost",
    "[IP_ADDRESS]",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
