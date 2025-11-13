# Supabase OAuth Setup Guide

## Overview
This guide explains how to configure Google OAuth for the Companion app.

## Prerequisites
- A Supabase account and project
- A Google Cloud Console account (for production)

## Steps

### 1. Configure Redirect URLs in Supabase
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Add the following **Site URL**:
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
5. Add the following **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:3000/**` (catch-all for development)

### 2. Enable Google OAuth Provider
1. In the Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list
3. Toggle it **ON**
4. You'll need to add:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

### 3. Configure Google Cloud Console (For Production)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the consent screen
6. Add **Authorized JavaScript origins**:
   - `https://xhhtkjtcdeewesijxbts.supabase.co`
7. Add **Authorized redirect URIs**:
   - `https://xhhtkjtcdeewesijxbts.supabase.co/auth/v1/callback`
8. Copy the **Client ID** and **Client Secret**
9. Paste them into Supabase Dashboard → Authentication → Providers → Google

### 4. Test the Flow
1. Start your development server: `npm start`
2. Navigate to `http://localhost:3000/login`
3. Click **Sign in with Google**
4. You should be redirected to Google's OAuth consent screen
5. After granting permission, you'll be redirected back to `/auth/callback`
6. The app should automatically redirect you to `/dashboard`

## Troubleshooting

### "redirect_uri_mismatch" Error
- Ensure all redirect URIs are added in both Google Cloud Console and Supabase
- The redirect URI must be exactly: `https://your-project.supabase.co/auth/v1/callback`

### "Session Not Found" Error
- Check that `detectSessionInUrl: true` is set in Supabase client configuration
- Verify the callback route exists at `/auth/callback`
- Check browser console for detailed error messages

### Google Sign-In Button Doesn't Work
- Verify `VITE_SUPABASE_USE_MOCK=false` in `.env` file
- Check browser console for errors
- Ensure Supabase project URL and anon key are correct in `.env`

## Environment Variables
Make sure your `.env` file contains:
```env
VITE_SUPABASE_USE_MOCK=false
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## For Demo/Development
If you want to skip OAuth configuration for demo purposes, set:
```env
VITE_SUPABASE_USE_MOCK=true
```
This will use mock authentication instead of real OAuth.
