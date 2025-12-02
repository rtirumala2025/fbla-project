# Deployment Guide - FBLA Virtual Pet Companion

**Version:** 1.0.0  
**Last Updated:** January 2025

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Frontend Deployment](#frontend-deployment)
3. [Backend Deployment](#backend-deployment)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)
8. [Scaling Considerations](#scaling-considerations)

---

## Pre-Deployment Checklist

### Required Accounts & Services

- [ ] **Supabase Account**
  - [ ] Project created at [supabase.com](https://supabase.com)
  - [ ] Database URL obtained (Settings → Database)
  - [ ] Service role key obtained (Settings → API)
  - [ ] Anon key obtained (Settings → API)
  - [ ] JWT secret obtained (Settings → API)

- [ ] **Deployment Platforms**
  - [ ] Frontend hosting (Vercel/Netlify/Railway)
  - [ ] Backend hosting (Render/Railway/Fly.io)
  - [ ] Domain name (optional, for custom URLs)

- [ ] **API Keys** (Optional but recommended)
  - [ ] OpenRouter API key (for AI features)
  - [ ] OpenAI API key (backup for AI)
  - [ ] Weather API key (for weather features)

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

#### Step 1: Prepare Repository

```bash
cd frontend
npm install
npm run build  # Test build locally first
```

#### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your repository
5. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

#### Step 3: Environment Variables

Add in Vercel dashboard → Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_STORAGE_BUCKET=avatars
VITE_API_BASE_URL=https://your-backend-url.com
VITE_OPENROUTER_API_KEY=your-openrouter-key
VITE_WEATHER_API_KEY=your-weather-key
```

#### Step 4: Deploy

- Click "Deploy"
- Wait for build to complete (2-3 minutes)
- Note the deployment URL (e.g., `your-app.vercel.app`)

---

### Option 2: Netlify

#### Step 1: Prepare Build

```bash
cd frontend
npm run build
```

#### Step 2: Deploy

1. Go to [netlify.com](https://netlify.com)
2. Sign up/Login
3. Click "Add new site" → "Import an existing project"
4. Connect GitHub repository
5. Configure:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`

#### Step 3: Environment Variables

Add in Netlify → Site settings → Environment variables (same as Vercel)

---

### Option 3: Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select repository
4. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run preview` (or configure nginx)

---

## Backend Deployment

### Option 1: Render (Recommended)

#### Step 1: Prepare Application

```bash
# Ensure requirements.txt is up to date
cd backend
pip freeze > requirements.txt

# Test locally
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Step 2: Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign up/Login
3. Click "New" → "Web Service"
4. Connect GitHub repository
5. Configure:
   - **Name:** `virtual-pet-backend`
   - **Environment:** `Python 3`
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free tier works for demo

#### Step 3: Environment Variables

Add in Render dashboard → Environment:

```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app,http://localhost:5173
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openrouter/llama-4-11b-instruct-scout
OPENAI_API_KEY=your-openai-key
WEATHER_API_KEY=your-weather-key
```

#### Step 4: Deploy

- Click "Create Web Service"
- Wait for deployment (5-10 minutes first time)
- Note the service URL (e.g., `your-app.onrender.com`)

---

### Option 2: Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select repository
4. Configure:
   - **Root Directory:** `backend`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as Render)

---

### Option 3: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Initialize (in backend directory)
cd backend
fly launch

# Set secrets
fly secrets set DATABASE_URL="..."
fly secrets set SUPABASE_URL="..."
fly secrets set SUPABASE_SERVICE_ROLE_KEY="..."
# ... (all environment variables)

# Deploy
fly deploy
```

---

## Database Setup

### Supabase Configuration

#### Step 1: Run Migrations

1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in order (copy-paste each file):

```sql
-- Migration 000: Core schema
-- (Copy contents of supabase/migrations/000_core_schema.sql)

-- Migration 001: Profiles and preferences
-- (Copy contents of supabase/migrations/001_profiles_and_preferences.sql)

-- Migration 002: Pets
-- (Copy contents of supabase/migrations/002_pets.sql)

-- Migration 003: Social layer
-- (Copy contents of supabase/migrations/003_social_layer.sql)

-- Migration 004: Accessories and art cache
-- (Copy contents of supabase/migrations/004_accessories_and_art_cache.sql)

-- Migration 005: Finance system
-- (Copy contents of supabase/migrations/005_finance_system.sql)

-- Migration 006: Quests
-- (Copy contents of supabase/migrations/006_quests.sql)

-- Migration 007: Games
-- (Copy contents of supabase/migrations/007_games.sql)

-- Migration 008: Analytics and sync
-- (Copy contents of supabase/migrations/008_analytics_and_sync.sql)

-- Migration 009: Realtime and replication
-- (Copy contents of supabase/migrations/009_realtime_and_replication.sql)

-- Additional migrations as needed
```

**Migration Order:**
1. `000_core_schema.sql` - Foundation
2. `001_profiles_and_preferences.sql` - User data
3. `002_pets.sql` - Pet entities
4. `003_social_layer.sql` - Social features
5. `004_accessories_and_art_cache.sql` - Accessories
6. `005_finance_system.sql` - Finance tables
7. `006_quests.sql` - Quest system
8. `007_games.sql` - Game scores
9. `008_analytics_and_sync.sql` - Analytics
10. `009_realtime_and_replication.sql` - Realtime

#### Step 2: Seed Demo Data (Optional)

```sql
-- Run in Supabase SQL Editor
-- Update email addresses in script first
-- See scripts/seed_competition_data.sql
```

#### Step 3: Verify RLS Policies

1. Go to Authentication → Policies
2. Verify Row Level Security is enabled for:
   - `profiles` table
   - `pets` table
   - `user_preferences` table
   - `finance_wallets` table
   - `finance_transactions` table
   - `user_quests` table
   - All other user-specific tables

#### Step 4: Configure Storage

1. Go to Storage → Create bucket
2. Name: `avatars`
3. Set to public (or configure RLS policies)
4. Enable CORS if needed

---

## Environment Configuration

### Frontend Environment Variables

**For Production:**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_STORAGE_BUCKET=avatars
VITE_API_BASE_URL=https://your-backend-url.onrender.com
VITE_OPENROUTER_API_KEY=your-openrouter-key
VITE_WEATHER_API_KEY=your-weather-key
```

**For Development:**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_STORAGE_BUCKET=avatars
VITE_API_BASE_URL=http://localhost:8000
```

### Backend Environment Variables

**Required Variables:**

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# JWT
JWT_SECRET=your-secure-random-secret-32-chars-min

# CORS
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app,http://localhost:5173
```

**Optional Variables:**

```env
# AI Services
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openrouter/llama-4-11b-instruct-scout
OPENAI_API_KEY=your-openai-key
OPENAI_IMAGE_MODEL=gpt-image-1

# Optional Features
WEATHER_API_KEY=your-weather-key
ART_CACHE_TTL_HOURS=12
```

### Security Notes

⚠️ **Important:**
- Never commit `.env` files to git
- Use deployment platform's secret management
- Rotate keys regularly
- Use different keys for production vs development
- Service role key should ONLY be in backend, never frontend
- JWT secret should be 32+ characters, randomly generated

---

## Post-Deployment Verification

### Step 1: Health Checks

#### Frontend

```bash
# Check if frontend loads
curl https://your-frontend-url.vercel.app

# Should return HTML
```

#### Backend

```bash
# Health check
curl https://your-backend-url.onrender.com/health

# Should return: {"status":"ok"}

# API docs
curl https://your-backend-url.onrender.com/docs

# Should return HTML for Swagger UI
```

### Step 2: Functional Tests

1. **Authentication**
   - [ ] Can register new user
   - [ ] Can login
   - [ ] Session persists
   - [ ] Can logout

2. **Pet Care**
   - [ ] Can create pet
   - [ ] Can view pet stats
   - [ ] Can feed pet
   - [ ] Can play with pet
   - [ ] Stats update correctly

3. **Quests**
   - [ ] Quests load correctly
   - [ ] Can complete quests
   - [ ] Rewards are awarded
   - [ ] Progress tracks correctly

4. **Shop**
   - [ ] Shop items load
   - [ ] Can purchase items
   - [ ] Coins deducted correctly
   - [ ] Inventory updates

5. **API Integration**
   - [ ] All API calls succeed
   - [ ] Error handling works
   - [ ] Real-time updates function

---

## Troubleshooting

### Common Issues

#### Frontend Build Fails

**Problem:** Build errors during deployment

**Solutions:**
- Check Node.js version (requires 18+)
- Verify all dependencies in `package.json`
- Check for TypeScript errors: `npm run type-check`
- Review build logs for specific errors

#### Backend Won't Start

**Problem:** Backend service fails to start

**Solutions:**
- Verify Python version (requires 3.11+)
- Check environment variables are set
- Review application logs
- Test database connection

#### Database Connection Errors

**Problem:** Cannot connect to Supabase database

**Solutions:**
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Verify database is not paused
- Check firewall/network settings

#### CORS Errors

**Problem:** Frontend cannot call backend API

**Solutions:**
- Verify `ALLOWED_ORIGINS` includes frontend URL
- Check backend CORS middleware configuration
- Ensure frontend `VITE_API_BASE_URL` is correct
- Clear browser cache

#### Authentication Issues

**Problem:** Users cannot login

**Solutions:**
- Verify Supabase keys are correct
- Check JWT secret matches
- Review Supabase Auth settings
- Check RLS policies

---

## Scaling Considerations

### Database Scaling

- **Connection Pooling:** Already configured in backend
- **Indexes:** Ensure all foreign keys are indexed
- **Query Optimization:** Use EXPLAIN to analyze slow queries
- **Supabase Limits:** Monitor usage against free tier limits

### Backend Scaling

- **Horizontal Scaling:** Deploy multiple instances behind load balancer
- **Caching:** Implement Redis for frequently accessed data
- **Rate Limiting:** Prevent API abuse
- **Monitoring:** Set up logging and error tracking

### Frontend Scaling

- **CDN:** Vercel/Netlify provide global CDN automatically
- **Code Splitting:** Already implemented via lazy loading
- **Caching:** Browser caching for static assets
- **Image Optimization:** Use WebP format, lazy loading

### Performance Monitoring

- **Frontend:**
  - Use browser DevTools Performance tab
  - Monitor Core Web Vitals
  - Track bundle size

- **Backend:**
  - Monitor response times
  - Track database query performance
  - Set up error alerting

---

## Maintenance

### Regular Tasks

1. **Weekly:**
   - Review error logs
   - Check database performance
   - Monitor API usage

2. **Monthly:**
   - Update dependencies
   - Review security patches
   - Backup database

3. **Quarterly:**
   - Rotate API keys
   - Review and optimize queries
   - Update documentation

---

**Document Status:** ✅ Complete  
**Review Date:** January 2025
