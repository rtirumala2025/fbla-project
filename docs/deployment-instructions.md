# Deployment-Ready Instructions - FBLA Demo

> **Purpose:** Complete guide for deploying the Virtual Pet application for FBLA competition  
> **Target:** Production-ready deployment on cloud platforms

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Frontend Deployment](#frontend-deployment)
3. [Backend Deployment](#backend-deployment)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Required Accounts & Services

- [ ] **Supabase Account**
  - [ ] Project created
  - [ ] Database URL obtained
  - [ ] Service role key obtained
  - [ ] Anon key obtained
  - [ ] JWT secret obtained

- [ ] **Deployment Platforms**
  - [ ] Frontend hosting (Vercel/Netlify/Railway)
  - [ ] Backend hosting (Render/Railway/Fly.io)
  - [ ] Domain name (optional)

- [ ] **API Keys** (Optional but recommended)
  - [ ] OpenRouter API key (for AI features)
  - [ ] OpenAI API key (backup)
  - [ ] Weather API key (if using weather features)

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

#### Step 1: Prepare Repository
```bash
# Ensure frontend is in a deployable state
cd frontend
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
Add these in Vercel dashboard → Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_STORAGE_BUCKET=avatars
VITE_API_BASE_URL=https://your-backend-url.com
VITE_OPENROUTER_API_KEY=your-openrouter-key (optional)
VITE_WEATHER_API_KEY=your-weather-key (optional)
```

#### Step 4: Deploy
- Click "Deploy"
- Wait for build to complete
- Note the deployment URL

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

### Option 3: Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select repository
4. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run preview` (or use nginx)

---

## Backend Deployment

### Option 1: Render (Recommended)

#### Step 1: Prepare Application
```bash
# Ensure requirements.txt is up to date
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
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openrouter/llama-4-11b-instruct-scout
OPENAI_API_KEY=your-openai-key (optional)
```

#### Step 4: Deploy
- Click "Create Web Service"
- Wait for deployment
- Note the service URL

### Option 2: Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select repository
4. Configure:
   - **Root Directory:** `.` (root)
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as Render)

### Option 3: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Initialize (in project root)
fly launch

# Set secrets
fly secrets set DATABASE_URL="..."
fly secrets set SUPABASE_URL="..."
# ... (all environment variables)

# Deploy
fly deploy
```

---

## Database Setup

### Supabase Configuration

#### Step 1: Run Migrations
1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in order:
   ```
   supabase/migrations/000_core_schema.sql
   supabase/migrations/001_profiles_and_preferences.sql
   supabase/migrations/002_pets.sql
   supabase/migrations/003_social_layer.sql
   supabase/migrations/004_accessories_and_art_cache.sql
   supabase/migrations/005_finance_system.sql
   supabase/migrations/006_quests.sql
   supabase/migrations/007_games.sql
   supabase/migrations/008_analytics_and_sync.sql
   supabase/migrations/009_realtime_and_replication.sql
   ```

#### Step 2: Seed Demo Data
```sql
-- Run in Supabase SQL Editor
-- Update email addresses in script first
\i scripts/seed_competition_data.sql
```

#### Step 3: Verify RLS Policies
1. Go to Authentication → Policies
2. Verify Row Level Security is enabled
3. Check policies for:
   - `profiles` table
   - `pets` table
   - `user_preferences` table
   - `finance_transactions` table

#### Step 4: Configure Storage
1. Go to Storage → Create bucket
2. Name: `avatars`
3. Set to public (or configure policies)
4. Enable CORS if needed

---

## Environment Configuration

### Frontend Environment Variables

Create `frontend/.env.production`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_STORAGE_BUCKET=avatars
VITE_API_BASE_URL=https://your-backend-url.onrender.com
VITE_OPENROUTER_API_KEY=your-openrouter-key
VITE_WEATHER_API_KEY=your-weather-key
```

### Backend Environment Variables

Create `.env.production` (or set in deployment platform):

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# JWT
JWT_SECRET=your-secure-random-secret

# CORS
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app,http://localhost:5173

# AI Services
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openrouter/llama-4-11b-instruct-scout
OPENAI_API_KEY=your-openai-key
OPENAI_IMAGE_MODEL=gpt-image-1

# Optional
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

---

## Post-Deployment Verification

### Step 1: Health Checks

#### Frontend
```bash
# Check if frontend loads
curl https://your-frontend-url.vercel.app

# Check environment variables are loaded
# (Inspect page source or check network requests)
```

#### Backend
```bash
# Health check
curl https://your-backend-url.onrender.com/health

# API docs
curl https://your-backend-url.onrender.com/docs
```

### Step 2: Functional Tests

1. **Authentication**
   - [ ] Can register new user
   - [ ] Can login
   - [ ] Session persists
   - [ ] Can logout

2. **Pet Care**
   - [ ] Can create pet
   - [ ] Stats display correctly
   - [ ] Actions work (feed, play, etc.)
   - [ ] Stats update in real-time

3. **AI Features**
   - [ ] AI chat responds
   - [ ] Pet commands work
   - [ ] Budget advisor analyzes data

4. **Financial System**
   - [ ] Wallet displays balance
   - [ ] Can purchase items
   - [ ] Transactions recorded
   - [ ] Analytics dashboard works

### Step 3: Performance Check

```bash
# Test response times
time curl https://your-backend-url.onrender.com/health

# Check frontend load time
# Use browser DevTools → Network tab
```

### Step 4: Error Monitoring

- [ ] Check deployment platform logs
- [ ] Check browser console (no errors)
- [ ] Check network requests (no 404s/500s)
- [ ] Test error scenarios (invalid input, etc.)

---

## Troubleshooting

### Common Issues

#### Issue: Frontend can't connect to backend
**Solution:**
- Check `VITE_API_BASE_URL` is correct
- Verify CORS settings in backend
- Check backend is running and accessible
- Verify `ALLOWED_ORIGINS` includes frontend URL

#### Issue: Authentication not working
**Solution:**
- Verify Supabase URLs and keys are correct
- Check RLS policies are enabled
- Verify JWT secret matches
- Check browser console for errors

#### Issue: Database connection fails
**Solution:**
- Verify `DATABASE_URL` is correct
- Check database is accessible from deployment platform
- Verify connection string format (postgresql+asyncpg://)
- Check firewall/network settings

#### Issue: AI features not working
**Solution:**
- Verify API keys are set correctly
- Check fallback responses work
- Verify OpenRouter/OpenAI keys are valid
- Check backend logs for errors

#### Issue: Build fails
**Solution:**
- Check Node.js/Python versions match requirements
- Verify all dependencies in package.json/requirements.txt
- Check build logs for specific errors
- Test build locally first

#### Issue: Environment variables not loading
**Solution:**
- Verify variables are set in deployment platform
- Check variable names match exactly (case-sensitive)
- Restart deployment after adding variables
- Verify frontend variables start with `VITE_`

### Debug Commands

```bash
# Check backend logs (Render)
# Go to Render dashboard → Logs

# Check frontend build (Vercel)
# Go to Vercel dashboard → Deployments → View build logs

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Test API endpoint
curl -X POST https://your-backend-url.onrender.com/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

---

## Production Best Practices

### Security

- [ ] Use HTTPS for all connections
- [ ] Enable CORS only for trusted origins
- [ ] Rotate API keys regularly
- [ ] Use environment variables for secrets
- [ ] Enable RLS on all database tables
- [ ] Validate all user input
- [ ] Rate limit API endpoints
- [ ] Monitor for suspicious activity

### Performance

- [ ] Enable caching where appropriate
- [ ] Optimize database queries
- [ ] Use CDN for static assets
- [ ] Compress responses (gzip)
- [ ] Minimize bundle size
- [ ] Lazy load components
- [ ] Use connection pooling

### Monitoring

- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor API response times
- [ ] Track user analytics
- [ ] Set up uptime monitoring
- [ ] Configure alerts for critical errors
- [ ] Regular backup of database

### Maintenance

- [ ] Keep dependencies updated
- [ ] Regular security audits
- [ ] Monitor resource usage
- [ ] Plan for scaling
- [ ] Document deployment process
- [ ] Create runbooks for common issues

---

## Quick Deployment Checklist

### Pre-Deployment
- [ ] Code tested locally
- [ ] Environment variables documented
- [ ] Dependencies up to date
- [ ] Database migrations ready
- [ ] Seed data prepared

### Deployment
- [ ] Frontend deployed
- [ ] Backend deployed
- [ ] Database configured
- [ ] Environment variables set
- [ ] CORS configured

### Post-Deployment
- [ ] Health checks pass
- [ ] Functional tests pass
- [ ] Performance acceptable
- [ ] No errors in logs
- [ ] Documentation updated

---

## Support & Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [React Docs](https://react.dev)

### Community
- [Supabase Discord](https://discord.supabase.com)
- [FastAPI GitHub](https://github.com/tiangolo/fastapi)
- [React GitHub](https://github.com/facebook/react)

---

## Deployment URLs Template

After deployment, fill in your URLs:

```
Frontend: https://____________________
Backend: https://____________________
API Docs: https://____________________/docs
Supabase: https://____________________.supabase.co
```

---

**Last Updated:** Generated for FBLA competition  
**Status:** Ready for deployment

Good luck with your deployment! 🚀

