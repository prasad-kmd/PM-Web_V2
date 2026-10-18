# Security Policy

How to report a vulnerability, what is in scope, and what to expect afterwards.

## Deployment status — read this first

**This project runs on `localhost` only.** There is no deployed instance, no
public domain, and no hosted environment at v2.9.0.

That is not a disclaimer, it changes the answer to "what is the attack surface?":

- **In scope:** the **repository itself** — its dependencies, its committed
  files, its configuration — and any **local setup** you run from it. A
  vulnerability in the code is a vulnerability whether or not a server is running
  it.
- **Not in scope, because it does not exist:** anything requiring a live host —
  production headers, CDN behaviour, a running instance's rate limits.

`prasadm.vercel.app` belongs to a **previous, inactive project**. It is not this
site, it does not serve this code, and a report against it is a report about a
different piece of software.

The day-you-deploy checklist in [docs/deployment.md](docs/deployment.md) is where
the hosted threat model gets revisited. It is deliberately unexecuted.

---

## Supported versions

| Version | Supported |
| ------- | --------- |
| **2.9.x** | ✅ |
| < 2.9 | ❌ |

This is a personal project with one maintainer. Only the current revision is
patched; there are no backports to older branches.

---

## Reporting a vulnerability

**Do not open a public issue.** A public issue is visible to everyone before
there is a fix, which is the whole problem.

Use either private channel:

1. **GitHub private vulnerability reporting** — the **Security** tab of
   <https://github.com/prasad-kmd/PM-Web_V2> → *Report a vulnerability*. Preferred,
   because the thread stays attached to the repository.
2. **Email** — **hello@prasadk.xyz**.

A useful report includes:

- **What you did** — the exact steps, with URLs and inputs.
- **What happened** — and what you expected instead.
- **Impact** — what an attacker gains, and what they would need first.
- **A suggested fix**, if you have one. Optional, and never required.

A vague report is still worth sending. A precise one is worth more.

---

## What to expect

Honest, best-effort targets for a one-person project:

| Step | Target |
| ---- | ------ |
| Acknowledgement that your report arrived | ≤ **72 hours** |
| Assessment — is it exploitable, and how badly | ≤ **7 days** |
| Fix | Depends on severity. A credential leak or an auth bypass jumps the queue; a low-severity hardening note may land in the next phase. |

You will be told which of those three it is. If a fix is not going to happen, you
will be told that too, with the reasoning — rather than watching an issue go
quiet.

**Credit.** You will be credited by name in `CHANGELOG.md` and the release notes
unless you ask otherwise. There is no bug bounty.

---

## Scope

Things worth reporting:

- **Authentication and session handling.** Session forgery, session fixation,
  a session that survives sign-out, the 5-minute cookie cache being usable for
  something it should not be.
- **The OAuth flow.** Callback manipulation, `state` handling, and especially
  **open-redirect via `callbackUrl`** — the sanitiser in
  `lib/auth/callback-url.ts` exists solely to stop that class and is the most
  interesting thing here to break.
- **Authorisation.** Reaching `/admin` or `/dashboard` without the right role,
  or any way to set your own `role`.
- **The seat gate.** Creating an account after registration should have closed,
  or creating a second one when the limit is 1.
- **The comments API.** Bypassing Turnstile, the rate limits or the profanity
  filter; forging the **Owner** badge; injection through the
  `PMc2` wire format.
- **Credential or secret exposure.** Any committed secret, or any server-only
  value reaching the client bundle.
- **Dependency vulnerabilities** with a plausible exploit path in this code.

Known and accepted, so you do not need to report them:

- **The Owner badge is forgeable by anyone with write access to the Notion
  workspace.** Attribution lives in the comment text because Notion provides no
  author metadata for integration comments. It is documented in
  [docs/comments-system.md](docs/comments-system.md), including the conditions
  under which the badge should be removed rather than trusted.
- **`unsafe-inline` and `unsafe-eval` appear in the CSP `script-src`.** Required
  by the framework's dev tooling and by `wasm-unsafe-eval` for Mermaid and
  Shiki. Removing them is a deployment-time task, noted in
  [docs/deployment.md](docs/deployment.md).
- **An unrecognised `?error=` code is echoed back as a short token.** If the code
  is not in the copy table but *is* code-shaped — `/^[A-Za-z0-9_]{1,40}$/`, per
  `lib/auth/error-messages.ts` — it is appended to a generic sentence as
  `(Code: …)` so a reader can quote it to the owner. Anything with a space, a
  slash or a full stop in it is discarded entirely, which is what stops a crafted
  link from rendering a whole attacker-written sentence in this site's own
  styling.
- **Rate limiting is in-process and per-instance.** At this traffic level that is
  sufficient, and it is documented rather than pretended otherwise.

Out of scope:

- Findings that require a **compromised GitHub account** or a compromised
  machine.
- **Self-XSS** and anything requiring the victim to paste script into a console.
- Missing hardening headers on **third-party embeds** the project does not
  control.
- Reports generated solely by a scanner, with no exploit path described.
- **Volumetric denial of service.** There is no deployed instance to flood, and
  no bandwidth budget to protect.

---

## Secrets

**No secret has ever been committed to this repository.** `.gitignore` ignores
`.env*` and re-admits only `.env.local.example`, which contains names and
comments and no values.

If a secret is ever exposed:

- **`BETTER_AUTH_SECRET`** — rotate it in `.env.local`, and in the hosting
  environment once deployed. Every existing session is invalidated when it
  changes, which is the point.
- **The database password** — rotate it in the Supabase dashboard and update
  `DATABASE_URL`.
- **`GITHUB_CLIENT_SECRET`** — regenerate the client secret on the OAuth app.
- **`TURNSTILE_SECRET_KEY`** — roll it in the Cloudflare dashboard.

There is deliberately **no fallback** for `BETTER_AUTH_SECRET`: a missing value
stops the process rather than defaulting to a constant that would be identical on
every clone. See [docs/env-variables.md](docs/env-variables.md).

---

## How this project tries to avoid needing this file

- `RULES.md` §5 encodes the GitHub CodeQL rules as review rules — no
  `dangerouslySetInnerHTML`, no user input into queries, paths or redirects
  without validation.
- **Zero ESLint warnings** is the bar, not "few". A warning is either fixed or
  the rule is changed deliberately.
- Attacker-supplied text is never echoed. Error copy is looked up from a fixed
  table by code, so a crafted URL cannot render words this site appears to have
  written.
- Verification suites cover the security-relevant behaviour that is testable
  head-lessly: callback sanitisation, seat-gate concurrency, the last-admin
  guard, and the comment role never being read from a request body.
