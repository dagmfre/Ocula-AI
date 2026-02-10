import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow server-side packages
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
