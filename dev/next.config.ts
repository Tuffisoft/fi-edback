import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Both packages must be loaded natively by Node — not bundled by Turbopack.
  // @neondatabase/serverless uses Node.js internals (net, tls).
  // fi-edback imports it; bundling fi-edback causes (void 0) errors at evaluation
  // because Turbopack cannot correctly evaluate the ESM import chain at build time.
  serverExternalPackages: ["@neondatabase/serverless", "fi-edback"],
};

export default nextConfig;
