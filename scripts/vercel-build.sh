#!/bin/sh
set -e
npm run build
cd dev && npm run build
