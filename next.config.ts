import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pdf-parse",
    "bcryptjs",
    "mongoose",
    "@anthropic-ai/sdk",
  ],
};

export default nextConfig;
