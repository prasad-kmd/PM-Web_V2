# Documentation

Every guide in this directory, and which one you actually want.

The short version: **you do not need most of these.** Copy
`.env.local.example` to `.env.local`, fill in `NOTION_API_KEY` if you have one,
and run `pnpm dev`. Sign-in is the only thing that needs a database, and the
database is the only thing that needs a guide.

---

## Which one do I need?

| I want to… | Read |
| ---------- | ---- |
| Just run the site | The [README](../README.md). Nothing here. |
| Add a database, for sign-in | [database-setup.md](database-setup.md) |
| Turn on GitHub sign-in | [auth-setup.md](auth-setup.md) |
| Understand or change the account limit | [admin-guide.md](admin-guide.md) |
| Know what a variable does, or why it is missing | [env-variables.md](env-variables.md) |
| Connect my Notion content | [notion-cms-setup.md](notion-cms-setup.md) |
| Understand the comments feature | [comments-system.md](comments-system.md) |
| Deploy this somewhere | [deployment.md](deployment.md) |
| Know why v2.9.0 is shaped the way it is | [planning/](planning/) |

---

## Setup guides

### [database-setup.md](database-setup.md)

Supabase project → the pooled connection string → `pnpm db:migrate` → what the
five tables are → the free-tier inactivity pause and how to keep the project
awake. Also covers running Postgres locally instead, which is what this project
is developed against.

**Who it is for:** someone who has never created a Supabase project.

### [auth-setup.md](auth-setup.md)

Creating the GitHub OAuth app, the callback URLs for local and deployed, how
sessions work (database sessions with a five-minute signed cookie cache, and why
not JWT), the redirect-back algorithm, the seat gate and its SQL, the error
catalogue, and the local-only constraints.

**Who it is for:** someone turning on sign-in for the first time.

### [admin-guide.md](admin-guide.md)

How to become an administrator, what each of the three admin screens does, what
"seats" mean and when they open and close, the SQL equivalents for when a
terminal is already open, and the recovery procedures.

**Who it is for:** the site owner, or anyone tempted to reach for SQL first.

### [env-variables.md](env-variables.md)

Every variable this project reads: what it is, whether it is required, where the
value comes from, and what breaks without it. Includes `AUTH_TRUSTED_ORIGINS` and
the reason the account limit is a database row rather than an environment
variable.

**Who it is for:** anyone whose `.env.local` is not working.

### [notion-cms-setup.md](notion-cms-setup.md)

The Notion integration, the six databases, their properties and statuses, and how
the content mapping works.

**Who it is for:** anyone pointing the site at their own Notion workspace.

---

## Reference

### [comments-system.md](comments-system.md)

The guest comment flow, the `PMc2` wire format that stores attribution inside the
comment text, the server-set role segment behind the **Owner** badge, the
protection layers (Turnstile, rate limiting, profanity, disposable-email), and an
honest account of what the Owner badge does and does not prove.

### [comments.env.example](comments.env.example)

The comment-specific environment variables, in isolation.

### [deployment.md](deployment.md)

**Nothing in it has been executed.** v2.9.0 runs locally only. It exists because
deployment knowledge decays fast: the production environment variables, the
second OAuth callback, `trustedOrigins`, `metadataBase`, the Supabase keep-alive,
the CSP tightening that only makes sense behind a real host, and the GitHub
repository settings that go with the governance documents.

Read it when you deploy, not before.

---

## [planning/](planning/)

The audit this version came from, the phased roadmap, the auth architecture
document that the implementation was written against, and the docs plan.

It is the **roadmap of record** — the reasoning behind each phase, including
what was deliberately not built and why. Expect it to describe intentions as well
as outcomes, and to be more candid than a changelog.

Start at [planning/README.md](planning/README.md) if you want the summary.

---

## How these documents are written

Four conventions, so they stay useful:

1. **Who it is for, and what you need**, at the top of every guide.
2. **Commands in fenced blocks**, copy-pasteable, with no placeholder that looks
   like a value.
3. **One canonical place per fact.** A variable is documented in
   `env-variables.md` and linked from everywhere else, never re-explained.
4. **No screenshots of dashboards.** They rot within a release. Link instead, and
   describe what to look for.

If a guide disagrees with the code, the code is right and the guide is a bug.
