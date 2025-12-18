# Backend Server Setup - Quick Start

## Issue
The backend server needs a database connection and environment variables to start properly.

## Quick Fix Options

### Option 1: Use Supabase (Recommended for Testing)

1. **Create a `.env` file in the `backend/` directory:**

```bash
cd backend
cat > .env << EOF
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
EOF
```

2. **Replace the placeholders with your actual Supabase credentials**

3. **Start the server:**
```bash
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```

### Option 2: Mock/Dummy Database (For Quick Testing)

If you just want to test the frontend without a full database setup, you can temporarily modify the health endpoint to not require a database connection.

## Current Status

✅ **Dependencies Installed:**
- `pydantic-settings` ✅
- `asyncpg` ✅
- All requirements from `requirements.txt` ✅

❌ **Missing:**
- Database connection (DATABASE_URL)
- Supabase credentials
- Environment variables

## Verify Backend is Running

Once configured, test with:
```bash
curl http://localhost:8000/health
```

Should return: `{"status": "ok"}`

## Frontend Configuration

The frontend is configured to connect to `http://localhost:8000` by default (see `frontend/src/api/httpClient.ts`).

If your backend is on a different port, set:
```bash
export REACT_APP_API_URL=http://localhost:8000
```

Or create a `.env` file in `frontend/`:
```
REACT_APP_API_URL=http://localhost:8000
```

