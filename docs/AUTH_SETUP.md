# 🔐 BetterAuth & OAuth Setup Guide

This guide walks you through setting up **BetterAuth** with **GitHub OAuth** in PM-Web V2.

## Why GitHub OAuth?

Google OAuth requires strict domain verification, consent screen configuration, and privacy policies even for small projects. GitHub OAuth offers:

- Instant setup in under 2 minutes.
- Free-tier friendly with zero domain verification friction.
- Direct developer user base alignment.

---

## Step 1: Register GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**.
2. Fill in the application details:
   - **Application name**: `PM-Web Local` (or your domain name)
   - **Homepage URL**: `http://localhost:3000` (or `https://your-domain.vercel.app`)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
3. Click **Register application**.
4. Generate a **Client Secret** and copy both:
   - `Client ID`
   - `Client Secret`

---

## Step 2: Configure Environment Variables

In your `.env.local`:

```env
BETTER_AUTH_SECRET="generate-with-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
```

To generate a secure secret:

```bash
openssl rand -base64 32
```

---

## Step 3: Automatic Return Navigation (`callbackUrl`)

When a user clicks "Sign In" from any page (e.g., `/about`), the navigation appends `?callbackUrl=/about`.
After completing GitHub OAuth, BetterAuth automatically redirects the user back to the exact page they originated from.
