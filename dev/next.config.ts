import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Required when consuming a local file: dependency so Next.js transpiles
  // the TypeScript source directly from the linked package.
  // When installed via a git URL (npm i github:studiofi/fi-edback), the
  // package ships compiled dist/ so transpilePackages is not needed in host apps.
  transpilePackages: ['fi-edback'],
  experimental: {
    turbo: {
      // Explicitly set the workspace root to this dev/ directory so Next.js
      // does not get confused by the root package-lock.json one level up.
      root: path.resolve(__dirname),
    },
  },
}

export default nextConfig
