#!/bin/sh
set -e

npm run build

echo "=== Clearing Next.js cache ==="
rm -rf dev/.next/cache
echo "=== Cache cleared, starting Next.js build ==="

cd dev && npm run build
