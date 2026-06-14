# ⚡ Ultimate Gig Hub

A Nigerian social media engagement platform where **earners** complete tasks (follow, like, subscribe, etc.) on social platforms to earn money, and **advertisers** create campaigns to grow their social media presence.

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS — dark navy & gold theme
- **Backend:** Supabase (Auth, Database, Storage)
- **Animations:** Framer Motion
- **Notifications:** react-hot-toast
- **Deployment:** Vercel

## Features

### Earner
- Browse and complete social media tasks
- Submit proof (screenshot/link) for review
- Wallet with earnings, transaction history, withdrawals
- Link social media accounts
- Referral program (earn ₦100 per referral)
- Real-time notifications

### Advertiser
- Create campaigns with platform-specific pricing (18+ platforms)
- Live budget calculator
- Pause/resume/edit campaigns
- Track spend and reach

### Admin
- Password-protected admin panel
- User management (ban/unban, fund wallets, promote to admin)
- Review and approve/reject task submissions
- Review and approve/reject advertiser campaigns (auto-creates earner tasks)
- Process withdrawal payouts

## Getting Started

### 1. Clone and install
```bash
git clone https://github.com/yourusername/ultimate-gig-hub.git
cd ultimate-gig-hub
npm install
```

### 2. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migration.sql` in the SQL Editor
3. Copy your API keys

### 3. Configure environment variables
```bash
cp .env.example .env.local
```
Fill in your Supabase URL, keys, and admin password.

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy
See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions to Vercel.

## Project Structure

```
src/
├── app/            # Next.js App Router pages
│   ├── auth/       # Login, Register, Onboarding
│   ├── dashboard/  # Earner home
│   ├── tasks/      # Task browsing & submission
│   ├── wallet/     # Wallet & transactions
│   ├── social/     # Social accounts & bank details
│   ├── alerts/     # Notifications
│   ├── profile/    # User profile & referrals
│   ├── advertiser/ # Campaign management
│   └── admin/      # Admin panel (password protected)
├── components/     # Reusable UI components
├── lib/            # Supabase clients & utilities
└── types/          # TypeScript types
```

## License

This project is private and proprietary. See [LICENSE](./LICENSE) for details.
