#!/bin/bash

# 🚀 Quick Start Script for Supabase Phase 1 Setup
# This script helps you complete the manual setup steps

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Supabase Phase 1 Setup Helper"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
  echo "❌ Error: Please run this script from the project root directory"
  echo "   Current directory: $(pwd)"
  exit 1
fi

echo "📁 Working directory: $(pwd)"
echo ""

# Step 1: Check if .env exists
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Checking .env file..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f "frontend/.env" ]; then
  echo "⚠️  .env file not found. Creating from template..."
  cp frontend/.env.example frontend/.env
  echo "✅ Created frontend/.env"
else
  echo "✅ frontend/.env exists"
fi

# Check if .env has content
if [ ! -s "frontend/.env" ]; then
  echo ""
  echo "⚠️  WARNING: .env file is EMPTY!"
  echo ""
  echo "📝 You need to add your Supabase credentials:"
  echo ""
  echo "   1. Go to https://app.supabase.com"
  echo "   2. Open your project"
  echo "   3. Go to Settings → API"
  echo "   4. Copy 'Project URL' and 'anon public' key"
  echo "   5. Open frontend/.env in your editor"
  echo "   6. Add these lines:"
  echo ""
  echo "      VITE_SUPABASE_URL=https://your-project-id.supabase.co"
  echo "      VITE_SUPABASE_ANON_KEY=eyJhbGc..."
  echo "      VITE_API_URL=http://localhost:8000"
  echo ""
  read -p "Press Enter after you've added credentials to .env..."
else
  echo "✅ .env file has content"
  
  # Check if it has the required variables
  if grep -q "VITE_SUPABASE_URL=" "frontend/.env" && \
     grep -q "VITE_SUPABASE_ANON_KEY=" "frontend/.env"; then
    echo "✅ Found required Supabase variables"
  else
    echo "⚠️  Missing required variables in .env"
    echo "   Make sure you have:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    read -p "Press Enter to continue anyway..."
  fi
fi

echo ""

# Step 2: Install dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Installing npm dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd frontend

# Check if @supabase/supabase-js is installed
if npm list @supabase/supabase-js 2>/dev/null | grep -q "@supabase/supabase-js"; then
  echo "✅ @supabase/supabase-js already installed"
else
  echo "📦 Installing @supabase/supabase-js..."
  npm install @supabase/supabase-js
fi

# Check if axios is installed
if npm list axios 2>/dev/null | grep -q "axios"; then
  echo "✅ axios already installed"
else
  echo "📦 Installing axios..."
  npm install axios
fi

echo ""
echo "✅ All dependencies installed"
echo ""

cd ..

# Step 3: Database setup reminder
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Database Setup Checklist"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Have you completed these steps in Supabase?"
echo ""
echo "  1. [ ] Created Supabase project"
echo "  2. [ ] Ran SQL to create tables (Step 2.1 in PHASE_2_SETUP_GUIDE.md)"
echo "  3. [ ] Ran SQL to insert shop items (Step 2.2)"
echo "  4. [ ] Ran SQL to enable RLS (Step 2.3)"
echo "  5. [ ] Verified tables exist in Table Editor"
echo ""
read -p "Have you completed all these steps? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "⚠️  Please complete the database setup first:"
  echo ""
  echo "   1. Open PHASE_2_SETUP_GUIDE.md"
  echo "   2. Copy SQL from Step 2.1, 2.2, and 2.3"
  echo "   3. Go to Supabase Dashboard → SQL Editor"
  echo "   4. Run each SQL script"
  echo "   5. Verify tables in Table Editor"
  echo ""
  echo "Then run this script again."
  exit 0
fi

# Step 4: Start dev server
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Ready to start dev server!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Setup complete! Now you can:"
echo ""
echo "   1. Start the dev server:"
echo "      cd frontend && npm start"
echo ""
echo "   2. Open browser to http://localhost:3000"
echo ""
echo "   3. Open browser console (F12)"
echo ""
echo "   4. Run verification test by pasting:"
echo "      import('/src/test-supabase').then(m => m.testSupabaseConnection())"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Start dev server now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "🚀 Starting dev server..."
  echo ""
  cd frontend
  npm start
else
  echo ""
  echo "👍 Okay! Start it manually when ready:"
  echo "   cd frontend && npm start"
  echo ""
fi

