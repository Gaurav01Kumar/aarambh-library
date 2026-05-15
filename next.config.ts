import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
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
