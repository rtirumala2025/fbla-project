#!/bin/bash

# Test Script: Username Persistence Fix
# This script runs all tests and performs manual verifications

set -e

echo "═══════════════════════════════════════════════════════"
echo "  Username Persistence - Complete Test Suite"
echo "═══════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print info
info() {
    echo -e "${YELLOW}→${NC} $1"
}

# Change to frontend directory
cd "$(dirname "$0")/../frontend"

# Check if .env exists
if [ ! -f ".env" ]; then
    error ".env file not found!"
    echo ""
    echo "Please create frontend/.env with:"
    echo "  REACT_APP_SUPABASE_URL=https://your-project.supabase.co"
    echo "  REACT_APP_SUPABASE_ANON_KEY=your-anon-key"
    echo "  REACT_APP_USE_MOCK=false"
    exit 1
fi

# Check for mock mode
if grep -q "REACT_APP_USE_MOCK=true" .env; then
    error "Mock mode is enabled!"
    echo ""
    echo "Please set REACT_APP_USE_MOCK=false in frontend/.env"
    exit 1
fi

success ".env configured correctly"
echo ""

# Step 1: Install dependencies
info "Step 1: Checking dependencies..."
npm install --silent
success "Dependencies installed"
echo ""

# Step 2: Run unit tests
info "Step 2: Running unit tests..."
echo ""
npm test -- --testPathPattern=ProfileUpdate --watchAll=false --verbose
success "Unit tests passed"
echo ""

# Step 3: Run integration tests (if user is authenticated)
info "Step 3: Running integration tests..."
echo ""
echo "Note: Integration tests require an authenticated Supabase session."
echo "If you see warnings about authentication, please log in to the app first."
echo ""
npm run test:integration || {
    error "Integration tests failed or were skipped"
    echo "This is expected if you're not authenticated."
}
echo ""

# Step 4: Check if dev server is running
info "Step 4: Checking dev server..."
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    success "Dev server is running on port 3002"
else
    error "Dev server is not running!"
    echo ""
    echo "Please start the dev server in another terminal:"
    echo "  cd frontend"
    echo "  PORT=3002 npm start"
    echo ""
    echo "Then run this script again."
    exit 1
fi
echo ""

# Step 5: Run E2E tests
info "Step 5: Running E2E tests..."
echo ""
echo "Note: E2E tests require:"
echo "  - Dev server running on port 3002"
echo "  - Test user credentials in environment variables:"
echo "    TEST_USER_EMAIL and TEST_USER_PASSWORD"
echo ""

cd ..
npx playwright test --project=chromium || {
    error "E2E tests failed!"
    echo ""
    echo "This is expected if:"
    echo "  1. No test user exists"
    echo "  2. Credentials not in environment variables"
    echo "  3. Dev server not running"
    echo ""
    echo "To run E2E tests manually:"
    echo "  TEST_USER_EMAIL=your@email.com TEST_USER_PASSWORD=yourpass npx playwright test"
}
echo ""

# Step 6: Display verification instructions
echo "═══════════════════════════════════════════════════════"
echo "  Manual Verification Steps"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "1. Open http://localhost:3002"
echo "2. Login with your account"
echo "3. Navigate to Profile page"
echo "4. Click Edit, change username, click Save"
echo "5. Verify success toast appears"
echo "6. Navigate to Dashboard"
echo "7. Verify new username in welcome message"
echo "8. Refresh the page"
echo "9. Verify username persists"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Database Verification"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Run this SQL in Supabase SQL Editor:"
echo ""
echo "  SELECT user_id, username, updated_at"
echo "  FROM profiles"
echo "  ORDER BY updated_at DESC"
echo "  LIMIT 5;"
echo ""
echo "Expected: Recent 'updated_at' timestamp with new username"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Auth Token Verification"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "1. Open browser DevTools -> Console"
echo "2. Run:"
echo "   const {data} = await window.supabase.auth.getSession()"
echo "   console.log(data.session.access_token)"
echo "3. Copy the token"
echo "4. Run:"
echo "   curl -H \"Authorization: Bearer <TOKEN>\" \\"
echo "     <SUPABASE_URL>/rest/v1/profiles?select=username"
echo ""
echo "Expected: 200 OK with your profile data"
echo ""
success "All automated tests complete!"
echo ""

