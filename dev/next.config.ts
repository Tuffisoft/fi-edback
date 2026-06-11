import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required when consuming a local file: dependency so Next.js transpiles
  // the TypeScript source directly from the linked package.
  // When installed via a git URL (npm i github:studiofi/fi-edback), the
  // package ships compiled dist/ so transpilePackages is not needed in host apps.
  transpilePackages: ['fi-edback'],
}

export default nextConfig
