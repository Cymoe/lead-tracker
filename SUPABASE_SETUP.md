# Supabase Setup Guide

This guide will help you set up Supabase for multi-tenant authentication with Google Sheets storage.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New project"
3. Fill in:
   - Project name: `lead-tracker-pro`
   - Database password: (save this securely)
   - Region: Choose closest to your users
4. Click "Create new project"

## 2. Set Up Database Tables

1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click "Run" to create all tables and policies

## 3. Configure Authentication

1. Go to Authentication > Providers
2. Enable Email provider (should be on by default)
3. Optional: Enable Google OAuth:
   - Get credentials from Google Cloud Console
   - Add authorized redirect URL: `https://your-project.supabase.co/auth/v1/callback`
   - Enter Client ID and Secret in Supabase

## 4. Get Your API Keys

1. Go to Settings > API
2. Copy:
   - Project URL: `https://your-project.supabase.co`
   - Anon/Public key: `eyJ...`

## 5. Configure Environment Variables

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 6. Test Your Setup

1. Run `npm run dev`
2. Go to http://localhost:3000
3. You should see the login page
4. Create an account and verify email

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js   │────▶│   Supabase   │────▶│Google Sheets │
│   Frontend  │     │Auth + Mapping │     │  User Data   │
└─────────────┘     └──────────────┘     └──────────────┘
```

- **Supabase**: Handles authentication and stores user→sheet mappings
- **Google Sheets**: Stores actual lead data (one sheet per user)
- **Next.js**: Frontend that connects to both services

## How It Works

1. User signs up → Profile created in Supabase
2. User sets up Google Sheet → URL stored in `user_sheets` table
3. App loads → Fetches user's sheet URL → Connects to their Google Sheet
4. All lead data operations → Direct to Google Sheets via Apps Script

## Security Features

- Row Level Security (RLS) ensures users only see their own data
- Google Sheets remain private to each user
- No cross-tenant data access possible
- Supabase handles all auth tokens securely

## Next Steps

After setup:
1. Each new user will go through onboarding
2. They'll connect their Google Sheet
3. The app remembers their configuration
4. True multi-tenant with data isolation!