import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Tell Turbopack not to bundle these — they must be required at runtime
  // by Node.js directly. @neondatabase/serverless uses node internals that
  // break when bundled by Turbopack.
  serverExternalPackages: ["@neondatabase/serverless"],
  turbopack: {
    // Point to repo root so Turbopack resolves node_modules/fi-edback
    // from root/node_modules rather than dev/node_modules.
    root: path.resolve(__dirname, '..'),
  },
};

export default nextConfig;
