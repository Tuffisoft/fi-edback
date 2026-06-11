import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // @neondatabase/serverless uses Node.js internals (net, tls) that cannot
  // be bundled by Turbopack — it must be loaded natively by Node at runtime.
  serverExternalPackages: ["@neondatabase/serverless"],
  turbopack: {
    // Point to repo root so Turbopack resolves node_modules/fi-edback
    // from root/node_modules rather than dev/node_modules.
    root: path.resolve(__dirname, '..'),
  },
};

export default nextConfig;
