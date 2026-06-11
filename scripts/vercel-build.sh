#!/bin/sh
set -e

npm run build

echo "=== node_modules/fi-edback link type ==="
ls -la dev/node_modules/fi-edback

echo "=== head of actual dist used by Next.js ==="
head -35 dev/node_modules/fi-edback/dist/index.js || echo "MISSING"

cd dev && npm run build
