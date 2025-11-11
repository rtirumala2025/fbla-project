# FBLA Virtual Pet Companion – End-to-End Setup Guide

This guide walks FBLA teams through configuring local development, provisioning Supabase, seeding demo data, and exporting presentation assets. Pair it with `README.md` for deeper architecture context.

## 1. Prerequisites

- Node.js 18+ and npm (verify with `node --version` and `npm --version`)
- Python 3.11+ with `pip`
- Supabase account (free tier works) with SQL Editor access
- Optional: OpenRouter API key for live AI responses, Weather API key for Next-Gen Lab demos
- macOS users: ensure Xcode command line tools are installed (`xcode-select --install`)

## 2. Clone the Repository & Install Dependencies

```bash
git clone https://github.com/your-org/virtual-pet-fbla.git
cd "/Users/<you>/Desktop/FBLA Intro to Programming - Code FIles"
npm install
pip install -r requirements.txt
cd frontend
npm install
cd ..
```

## 3. Configure Environment Variables

1. Copy the template file:
   ```bash
   cp env.example .env            # backend
   cp env.example frontend/.env   # optional starter for frontend
   ```
2. Update the following keys:

| Scope | Variable | Description |
|-------|----------|-------------|
| Backend | `DATABASE_URL` | Postgres connection string from Supabase (`postgresql+asyncpg://...`) |
| Backend | `SUPABASE_SERVICE_ROLE_KEY` | Service role key (keep backend-only) |
| Backend | `JWT_SECRET` | Random 32+ char string |
| Frontend | `VITE_SUPABASE_URL` | Project URL from Supabase Settings → API |
| Frontend | `VITE_SUPABASE_ANON_KEY` | anon/public key |
| Frontend | `VITE_API_URL` | `http://localhost:8000` for local dev |

Refer to `env.example` for optional analytics, AI, and feature flag variables.

> **Security tip:** `.env` is git ignored. Never commit real secrets.

## 4. Provision Supabase

1. Create a project at https://app.supabase.com.
2. In **SQL Editor**, run migrations in this order:
   ```
   supabase/migrations/000_profiles_table.sql
   supabase/migrations/001_user_preferences.sql
   supabase/migrations/002_pets_table_complete.sql
   supabase/migrations/003_pet_inventory_table.sql
   supabase/migrations/005_finance_system.sql
   ```
   Optional enhancements:
   ```
   supabase/migrations/004_*   -- quests and user quest progress
   supabase/migrations/006_*   -- mini-games, leaderboards, analytics extras
   ```
3. Verify **Table Editor** shows RLS enabled for all tables and that triggers were created successfully (`handle_new_user`, `update_*_updated_at`).

## 5. Seed Demo Data

- **Comprehensive judging dataset:** run `scripts/seed_demo_data.sql` in the SQL Editor. Replace placeholder emails with Supabase test accounts before executing.
- **Lightweight reset between live demos:** run `scripts/seed_competition_data.sql` for a single featured user.

After running either script, confirm:
- `profiles` reflects updated coin balances
- `pets` contains pet stats
- `finance_wallets` + `finance_transactions` include sample entries
- `pet_inventory` lists at least one item

## 6. Start the Local Stack

Backend API:
```bash
uvicorn app.main:app --reload --port 8000
```

Frontend client:
```bash
cd frontend
npm run dev -- --host
```

Helpful scripts:
- `scripts/verify_frontend_phase2.sh` – quick Supabase connectivity check
- `scripts/test_e2e_flow.js` – creates a throwaway account and exercises core flows (requires service role key)

## 7. Generate Documentation & Media Assets

Bundle PDFs (user manual, deck, storyboard) and ensure the demo video placeholder exists:
```bash
python3 scripts/generate_assets.py --ensure-video
```
Outputs land in `docs/`:
- `user-manual.pdf`
- `presentation-deck.pdf`
- `demo-storyboard.pdf`
- `demo-video.mp4` (replace with narrated recording before judging)

## 8. Verification Checklist

```
[ ] Supabase project created and migrations 000–005 applied
[ ] Demo data seeded (demo or competition script)
[ ] Backend running at http://localhost:8000 with 200 OK on /health
[ ] Frontend running at http://localhost:5173 and authenticating via Supabase
[ ] Key flows validated: onboarding, care loop, shop purchase, analytics
[ ] PDFs regenerated after documentation edits
[ ] Demo video updated or annotated for presenters
```

## Troubleshooting & Support

- **Supabase auth errors** – confirm `VITE_SUPABASE_URL/ANON_KEY` match dashboard values and that the URL has no trailing slash.
- **CORS issues** – set `VITE_API_URL` to the deployed backend origin and add the frontend URL to FastAPI CORS allow list (`app/core/config.py`).
- **Seed script fails** – ensure migrations ran successfully; re-run `supabase db reset` if needed.
- **Assets outdated** – rerun `python3 scripts/generate_assets.py` anytime Markdown content changes.

Need deeper help? Start with:
- `supabase/MIGRATION_INSTRUCTIONS.md`
- `PHASE_2_SETUP_GUIDE.md`
- `README.md` (Deployment Guide + Demo Flow)

Good luck at FBLA—once this checklist is green, you are presentation ready! 🎉

