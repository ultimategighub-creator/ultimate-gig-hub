# ⚡ Ultimate Gig Hub — Deployment Guide

## Overview
This guide takes you from zero to live website step by step.
You will use: **GitHub → Supabase → Vercel**

---

## STEP 1 — Set Up Supabase

### 1.1 Create Project
1. Go to https://supabase.com and sign up (free)
2. Click **New Project**
3. Name it: `ultimate-gig-hub`
4. Set a strong database password (save it!)
5. Choose region: **West EU** or closest to Nigeria
6. Click **Create new project** and wait ~2 minutes

### 1.2 Run the SQL Migration
1. In your Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the file: `supabase/migration.sql` from your project
4. Copy ALL the contents and paste into the SQL editor
5. Click **Run** (green button)
6. You should see: *Success. No rows returned*

### 1.3 Get Your API Keys
1. Go to **Project Settings** → **API**
2. Copy these 3 values (you'll need them later):
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → this is your `SUPABASE_SERVICE_ROLE_KEY`

---

## STEP 2 — Upload Code to GitHub

### 2.1 Create GitHub Repository
1. Go to https://github.com and sign in
2. Click the **+** icon → **New repository**
3. Name it: `ultimate-gig-hub`
4. Set to **Private**
5. Do NOT check "Add README"
6. Click **Create repository**

### 2.2 Prepare Your Files
You have 7 ZIP files from the build process. Extract them all and merge into one folder called `ultimate-gig-hub`. The final folder structure should look like this:

```
ultimate-gig-hub/
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── supabase/
│   └── migration.sql
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── globals.css
    │   ├── auth/
    │   │   ├── login/
    │   │   ├── register/
    │   │   └── onboarding/
    │   ├── dashboard/
    │   ├── tasks/
    │   ├── wallet/
    │   ├── social/
    │   ├── alerts/
    │   ├── profile/
    │   ├── advertiser/
    │   └── admin/
    ├── components/
    │   ├── layout/
    │   ├── earner/
    │   └── admin/
    ├── lib/
    │   ├── supabase/
    │   └── utils.ts
    ├── types/
    │   └── index.ts
    ├── hooks/
    └── middleware.ts
```

### 2.3 Upload to GitHub (from phone)

**Option A — GitHub Website (easiest on phone):**
1. Open your new GitHub repo
2. Click **uploading an existing file**
3. Drag and drop OR select all your files
4. Scroll down, write commit message: `Initial commit`
5. Click **Commit changes**

> **Note:** GitHub web uploader works better with individual files.
> If you have trouble, upload folder by folder starting with `src/`.

**Option B — GitHub Desktop App:**
1. Download GitHub Desktop on a computer
2. Clone your repo
3. Copy all files into the cloned folder
4. Commit and Push

---

## STEP 3 — Deploy to Vercel

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with your **GitHub account** (important!)
3. This links Vercel to your GitHub automatically

### 3.2 Import Your Project
1. On Vercel dashboard, click **Add New → Project**
2. Find `ultimate-gig-hub` in your GitHub repos
3. Click **Import**
4. Framework will auto-detect as **Next.js** ✅
5. Do NOT deploy yet — set env variables first

### 3.3 Set Environment Variables
In the Vercel import screen, click **Environment Variables** and add these one by one:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | https://your-app.vercel.app (set after deploy) |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Your chosen admin password |
| `ADMIN_EMAILS` | your@email.com |

### 3.4 Deploy
1. Click **Deploy**
2. Wait 2-3 minutes for build to complete
3. You'll get a live URL like: `https://ultimate-gig-hub.vercel.app`
4. Copy this URL and update `NEXT_PUBLIC_APP_URL` in Vercel env vars

---

## STEP 4 — Post-Deployment Setup

### 4.1 Sign Up on Your Live Site
1. Open your live Vercel URL
2. Click **Sign Up**
3. Register with YOUR email (e.g. `mackchizzy210@gmail.com`)
4. Complete onboarding

### 4.2 Promote Yourself to Admin
1. Go back to your **Supabase dashboard**
2. Click **SQL Editor** → **New query**
3. Run this (replace with your actual email):
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'mackchizzy210@gmail.com';
```
4. Click **Run**

### 4.3 Access Admin Panel
1. On your live site, go to your **Profile** tab
2. Tap the **crown icon** (top right) **5 times quickly**
3. OR navigate directly to: `yoursite.vercel.app/admin/users`
4. Enter your admin password (default: `UGH@Admin2024`)
5. You're in! 🎉

### 4.4 Create Your First Task
1. In the Admin panel, you can manually insert tasks via Supabase:
2. Go to **Supabase → Table Editor → tasks**
3. Click **Insert row** and fill in:
   - `title`: Follow our Instagram page
   - `platform`: instagram
   - `action_type`: follow
   - `reward_amount`: 80
   - `total_spots`: 100
   - `proof_required`: screenshot
   - `instructions`: Follow @yourusername on Instagram then screenshot your follow
   - `is_active`: true
   - `created_by`: (your user ID from profiles table)

---

## STEP 5 — Connect Supabase Auth to Your Domain

### 5.1 Update Auth Settings
1. In Supabase, go to **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel URL: `https://ultimate-gig-hub.vercel.app`
3. Add to **Redirect URLs**: `https://ultimate-gig-hub.vercel.app/**`
4. Click **Save**

---

## STEP 6 — Custom Domain (Optional)

If you want `ultimateGighub.com` instead of the Vercel URL:
1. Buy a domain on Namecheap or GoDaddy
2. In Vercel: **Project → Settings → Domains**
3. Add your domain and follow the DNS instructions

---

## Troubleshooting

### Build fails on Vercel
- Check all environment variables are set correctly
- Make sure there are no typos in variable names

### Can't sign up / login
- Check Supabase Auth → URL Configuration has your Vercel URL
- Make sure migration.sql ran successfully

### Admin panel says "not authorized"
- Run the SQL to promote yourself to admin (Step 4.2)
- Make sure you're logged in with the right email

### Wallet not created after signup
- The trigger `handle_new_user` should auto-create it
- If missing, run in Supabase SQL: `INSERT INTO wallets (user_id) VALUES ('your-user-id');`

---

## Your ZIP Files Summary

| ZIP File | Contents |
|----------|---------|
| `ultimate-gig-hub-steps-1-2.zip` | Project config, SQL migration, Auth pages |
| `ultimate-gig-hub-step3.zip` | Dashboard, Tasks, Task detail |
| `ultimate-gig-hub-step4.zip` | Wallet, Social/Bank |
| `ultimate-gig-hub-step5.zip` | Alerts, Profile |
| `ultimate-gig-hub-step6.zip` | Advertiser home, Campaign creator |
| `ultimate-gig-hub-step7.zip` | Admin panel (all 4 sections) |
| `ultimate-gig-hub-step8.zip` | This guide + final wiring files |

---

## Important Notes

- **Admin password** is set via `NEXT_PUBLIC_ADMIN_PASSWORD` env variable
- **Default password** is `UGH@Admin2024` — change it before going live!
- **Withdrawals** are manual — you process bank transfers yourself then mark as paid in admin
- **Auto-deploy** — every time you push code to GitHub, Vercel rebuilds automatically

---

*Built with Next.js 14 · Supabase · Tailwind CSS · Deployed on Vercel*
*Ultimate Gig Hub v1.0.0*
