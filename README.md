<div align="center">

# ⚡ PM-Web V2

**High-Performance Technical Documentation & Engineering Portfolio Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-OAuth_&_JWT-black?style=for-the-badge&logo=auth0&logoColor=white)](https://better-auth.com)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-C5F74F?style=for-the-badge&logo=postgresql&logoColor=black)](https://orm.drizzle.team)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL_3.0-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/agpl-3.0.html)

</div>

---

## 🚀 Key Features

- **🔐 Stateless OAuth Authentication**: BetterAuth with GitHub OAuth, stateless JWT session caching, and zero database strain on free-tier plans.
- **🛡️ Role-Based Access Control**: Standard user dashboard with customization options and an executive **Admin Dashboard** (`/admin`).
- **💬 Dual-Mode Comment System**: Authenticated users can post and delete their own comments; guest users can comment via Turnstile verification and local profile cookies.
- **🎨 Apple-Inspired Responsive Design**: Built with React Bits and Animate UI components, floating navigation, dock bottom bar, and accent color pickers.
- **📚 Modern CMS Integration**: Powered by Notion API, Shiki syntax highlighting, Mermaid diagram rendering, and KaTeX math expression support.
- **♿ Inclusive Accessibility**: Native reader options, high-contrast themes, and ARIA compliant navigation structure.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
- **Authentication**: [BetterAuth](https://better-auth.com) (GitHub OAuth + Stateless JWT Cookie Cache)
- **Database & ORM**: [Supabase PostgreSQL](https://supabase.com) + [Drizzle ORM](https://orm.drizzle.team)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com), [Shadcn UI](https://ui.shadcn.com), [React Bits](https://reactbits.dev)
- **Content Engine**: Notion API (`@notionhq/client`), `notion-to-md`, `shiki`, `katex`, `mermaid`

---

## 📁 Repository Structure

```text
├── app/
│   ├── admin/          # Admin console with role guard
│   ├── api/auth/       # BetterAuth Next.js route handler
│   ├── auth/signin/    # GitHub OAuth sign-in portal with callbackUrl
│   ├── dashboard/      # User profile dashboard & settings
│   └── ...             # Site pages (blog, articles, tools, etc.)
├── components/
│   ├── comments/       # Comments panel (Auth + Guest modes)
│   ├── reactbits/      # React Bits UI animations & components
│   └── site/           # Floating navbar, sidebar, mobile dock
├── docs/               # Setup & expansion guides
│   ├── AUTH_SETUP.md
│   ├── DATABASE_SETUP.md
│   └── FUTURE_EXPANSIONS.md
├── lib/
│   ├── auth.ts         # BetterAuth server configuration
│   ├── auth-client.ts  # BetterAuth React client
│   └── db/             # Drizzle schema & PostgreSQL client
```

---

## ⚡ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/prasad-kmd/pm-web_v2.git
cd pm-web_v2
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Setup environment variables

Copy `.env.example` to `.env.local` and set your database connection string and OAuth credentials:

```bash
cp .env.example .env.local
```

### 4. Push database schema

```bash
pnpm db:push
```

### 5. Start development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Documentation Guides

- [🔐 Auth Setup Guide](docs/AUTH_SETUP.md)
- [🗄️ Database Setup Guide](docs/DATABASE_SETUP.md)
- [🚀 Future Expansions Guide (Firebase Counter & Invoice Engine)](docs/FUTURE_EXPANSIONS.md)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Please feel free to check out [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 🛡️ License

Distributed under the **AGPL-3.0 License**. See `LICENSE` for more information.
