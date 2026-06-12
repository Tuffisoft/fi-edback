import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @neondatabase/serverless uses Node.js internals (net, tls) and cannot be
  // bundled — it must be loaded natively by Node at runtime.
  serverExternalPackages: ["@neondatabase/serverless"],
  
  // Transpile the local fi-edback package
  transpilePackages: ["fi-edback"],
};

export default nextConfig;
