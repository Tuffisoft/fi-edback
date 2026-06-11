import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @neondatabase/serverless uses Node.js internals (net, tls) and cannot be
  // bundled by Turbopack — it must be loaded natively by Node at runtime.
  serverExternalPackages: ["@neondatabase/serverless", "fi-edback"],
};

export default nextConfig;
