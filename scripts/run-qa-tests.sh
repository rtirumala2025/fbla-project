#!/bin/bash
# Comprehensive QA Test Runner
# Runs end-to-end tests with performance monitoring and generates report

set -e

echo "🧪 Starting Comprehensive QA Test Suite..."
echo ""

# Check if environment variables are set
if [ -z "$E2E_ENABLED" ]; then
    echo "⚠️  E2E_ENABLED not set. Setting to 'true' for this run."
    export E2E_ENABLED=true
fi

if [ -z "$TEST_USER_EMAIL" ]; then
    echo "⚠️  TEST_USER_EMAIL not set. Using default test@example.com"
    export TEST_USER_EMAIL=test@example.com
fi

if [ -z "$TEST_USER_PASSWORD" ]; then
    echo "⚠️  TEST_USER_PASSWORD not set. Using default password"
    export TEST_USER_PASSWORD=testpassword123
fi

# Check if Node modules are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Create report directory
mkdir -p playwright-report

echo "🚀 Running Playwright tests..."
echo "   This may take several minutes..."
echo ""

# Run tests (only desktop for initial run to save time)
# Full test run: npx playwright test e2e/qa-comprehensive.spec.ts
npx playwright test e2e/qa-comprehensive.spec.ts --project=chromium-desktop || {
    echo "⚠️  Some tests failed. Check report for details."
}

echo ""
echo "📊 Generating QA Report..."
node scripts/generate-qa-report.js

echo ""
echo "✅ QA Test Suite Complete!"
echo "📄 View detailed report: QA_TEST_REPORT.md"
echo "🌐 View HTML report: playwright-report/index.html"

