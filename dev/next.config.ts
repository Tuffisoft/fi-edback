import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["fi-edback"],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
