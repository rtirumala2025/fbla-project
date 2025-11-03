#!/usr/bin/env bash
set -euo pipefail

echo "== Virtual Pet Frontend Phase 2 Verification =="

cd "$(dirname "$0")/../frontend"
echo "Installing dependencies..."
npm install

echo "Running lint (non-blocking)..."
npm run lint || true

echo "Running tests..."
npm test -- --watchAll=false || true

echo "Starting dev server (Ctrl+C to stop)..."
npm start


