# 🚀 Future Expansions: Real-Time Post View Counter & Invoice Generator

This document details the architectural blueprints for two upcoming feature expansions in PM-Web V2.

---

## 1. 🔥 Real-Time Post View Counter (Firebase Realtime DB)

### Architecture

To avoid consuming Supabase PostgreSQL write quotas on every page impression, page view counters are offloaded to **Firebase Realtime Database**.

### Implementation Steps

1. Create a free Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Realtime Database** with read/write security rules restricted to post paths.
3. Install Firebase SDK:
   ```bash
   pnpm add firebase
   ```
4. Initialize Firebase client in `lib/firebase.ts`:
   ```typescript
   import { initializeApp } from "firebase/app";
   import { getDatabase, ref, increment, update } from "firebase/database";

   const firebaseConfig = {
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
     databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
   };

   export const app = initializeApp(firebaseConfig);
   export const db = getDatabase(app);

   export function incrementPostView(slug: string) {
     const postRef = ref(db, `posts/${slug}`);
     return update(postRef, { views: increment(1) });
   }
   ```

---

## 2. 🧾 Professional Invoice Generator (Admin Feature)

### Architecture

Restricted to users with `role = 'admin'` under `/admin`. Leverages the invoice engine from `PMEngineerLK-NextJS`.

### Key Features

- Dynamic client & line-item manager.
- PDF generation using `@react-pdf/renderer` or `html2pdf.js`.
- Tax calculation and mechatronics engineering consultancy rate templates.
