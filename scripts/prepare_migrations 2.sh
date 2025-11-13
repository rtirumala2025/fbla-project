#!/bin/bash
# Script to prepare migration SQL files for easy copy-paste to Supabase

set -e

echo "📋 FBLA App - Database Migration Preparation"
echo "=============================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$PROJECT_ROOT/supabase/migrations"

echo "📁 Migration files directory: $MIGRATIONS_DIR"
echo ""

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "❌ Error: Migrations directory not found: $MIGRATIONS_DIR"
  exit 1
fi

# Migration 1: Profiles
echo "🔵 Migration 1: Profiles Table"
echo "────────────────────────────────"
if [ -f "$MIGRATIONS_DIR/000_profiles_table.sql" ]; then
  echo "✅ File found: 000_profiles_table.sql"
  echo "📏 Lines: $(wc -l < "$MIGRATIONS_DIR/000_profiles_table.sql")"
  echo ""
  echo "📋 To copy to clipboard (Mac):"
  echo "   cat $MIGRATIONS_DIR/000_profiles_table.sql | pbcopy"
  echo ""
  echo "📋 To view contents:"
  echo "   cat $MIGRATIONS_DIR/000_profiles_table.sql"
  echo ""
else
  echo "❌ File not found: 000_profiles_table.sql"
fi

echo ""

# Migration 2: User Preferences
echo "🔵 Migration 2: User Preferences Table"
echo "───────────────────────────────────────"
if [ -f "$MIGRATIONS_DIR/001_user_preferences.sql" ]; then
  echo "✅ File found: 001_user_preferences.sql"
  echo "📏 Lines: $(wc -l < "$MIGRATIONS_DIR/001_user_preferences.sql")"
  echo ""
  echo "📋 To copy to clipboard (Mac):"
  echo "   cat $MIGRATIONS_DIR/001_user_preferences.sql | pbcopy"
  echo ""
else
  echo "❌ File not found: 001_user_preferences.sql"
fi

echo ""

# Migration 3: Pets
echo "🔵 Migration 3: Pets Table"
echo "──────────────────────────"
if [ -f "$MIGRATIONS_DIR/002_pets_table_complete.sql" ]; then
  echo "✅ File found: 002_pets_table_complete.sql"
  echo "📏 Lines: $(wc -l < "$MIGRATIONS_DIR/002_pets_table_complete.sql")"
  echo ""
  echo "📋 To copy to clipboard (Mac):"
  echo "   cat $MIGRATIONS_DIR/002_pets_table_complete.sql | pbcopy"
  echo ""
else
  echo "❌ File not found: 002_pets_table_complete.sql"
fi

echo ""
echo "=============================================="
echo "✅ All migration files verified!"
echo ""
echo "📝 Next Steps:"
echo "   1. Go to: https://supabase.com/dashboard/project/xhhtkjtcdeewesijxbts/sql"
echo "   2. Run each migration in order (1 → 2 → 3)"
echo "   3. Verify tables exist using verification queries"
echo "   4. See MIGRATION_EXECUTION_REPORT.md for detailed instructions"
echo ""

