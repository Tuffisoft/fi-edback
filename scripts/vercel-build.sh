#!/bin/sh
set -e

echo "=== fi-edback link type ==="
ls -la dev/node_modules/fi-edback

echo "=== dist/index.js before build ==="
head -40 dist/index.js

npm run build

echo "=== dist/index.js after build ==="
head -40 dist/index.js

echo "=== fi-edback dist used by Next.js ==="
head -40 dev/node_modules/fi-edback/dist/index.js

cd dev && npm run build
