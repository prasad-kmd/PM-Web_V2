# 🗄️ Supabase PostgreSQL & Drizzle ORM Setup Guide

PM-Web V2 uses **Supabase PostgreSQL** together with **Drizzle ORM** for lightweight, high-performance database operations optimized for free-tier hosting plans.

---

## Step 1: Create Supabase PostgreSQL Instance

1. Sign up/log in at [Supabase](https://supabase.com).
2. Create a **New Project**.
3. Under **Project Settings** → **Database**, copy your **Connection String** (URI format):
   ```text
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

---

## Step 2: Configure Environment Variables

Add your connection string to `.env.local`:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

---

## Step 3: Drizzle Schema Migration & Studio

Push the schema directly to your Supabase instance:

```bash
pnpm db:push
```

To visually inspect and edit records (such as granting Admin roles):

```bash
pnpm db:studio
```

---

## Step 4: Promoting a User to Admin Role

To grant administrative access to a user:

1. Open **Supabase SQL Editor** (or run via Drizzle Studio).
2. Execute the update query:
   ```sql
   UPDATE "user" SET role = 'admin' WHERE email = 'your.email@example.com';
   ```
3. Once updated, navigate to `/admin` on the website to access the **Admin Console**.
