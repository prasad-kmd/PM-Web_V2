# Accessibility

What this project commits to, what it already does, and what it knows it does not
do yet. Written for anyone who needs to use the site with assistive technology,
and for anyone who wants to report a barrier.

The live, reader-facing version of this statement is the
[`/accessibility`](app/accessibility/page.tsx) page. This file is the engineering
companion to it: the same commitment, plus the gaps.

---

## The commitment

**WCAG 2.2 Level AA** is the target for every reader-facing page, including the
auth pages (`/sign-in`, `/sign-up`, `/dashboard`, `/admin`), which are the newest
and least-tested part of the site.

`RULES.md` §7 encodes this as rules rather than intentions:

- every interactive element is keyboard reachable and visible when focused
- every image carries an `alt`; decorative images carry an empty one and are
  `aria-hidden`
- no affordance is conveyed by colour or motion alone
- form errors are announced, not merely coloured
- `prefers-reduced-motion` is respected everywhere motion is used

---

## What already exists

**Reader controls.** The accessibility panel, opened from the floating button on
content pages, adjusts **text size**, **typeface**, **line spacing**, **word
spacing**, **letter spacing** and **high contrast**. Choices persist on the
device. It is built on the site's own CSS custom properties, so it affects the
real reading surface rather than an overlay.

**Reduced motion.** Honoured in every animated surface — the sign-in card gates
its entrance animation on `useReducedMotion()`, and the decorative backgrounds
stop moving rather than merely slowing down. Twenty-four files in `app/`,
`components/` and `lib/` consult the preference.

**Semantic structure.** Pages render a `<main>` landmark, breadcrumbs are marked
up as navigation, headings are ordered, and the comment feed uses list semantics.

**Live regions.** Sign-in failures, admin notices and comment identity errors are
announced with `role="alert"` and `aria-live`, and the slots are reserved so the
card does not jump when an error appears.

**Contrast.** Every colour pair is defined as a token in `app/globals.css`
(`--pm-ink`, `--pm-ink-soft`, `card`, `border`, `muted`, `primary`, `ring`) and
checked against both themes rather than chosen by eye.

**No analytics, no trackers, no third-party overlays.** Nothing runs on the page
that a screen reader has to navigate around. This is a deliberate consequence of
dropping analytics in v2.9.0.

---

## Known limitations

Stated specifically, because a vague list is worse than none.

**There is no skip link.** A keyboard user tabs through the navigation on every
page before reaching the content. Adding one properly means giving every page's
`<main>` landmark an `id="main"` — six files render a `<main>` today and none of
them has an id — so it is a coordinated change rather than a one-line one. It is
the next accessibility item on the list.

**The auth pages have not been audited by a screen reader.** They have been
checked for structure (keyboard order, focus rings, live regions, reduced motion)
by the automated suite and by reading the markup, but nobody has yet driven
`/sign-in`, `/sign-up` and `/admin` with VoiceOver or NVDA. Until that happens,
treat their accessibility as *designed for* rather than *verified*.

**3D and canvas backgrounds degrade rather than disappear.** The WebGL and
Lottie elements respect reduced motion and are `aria-hidden`, but they are
decorative only — nothing on the site depends on them, and none of them carries
meaning.

**Notion-embedded media is only as accessible as the author made it.** Images,
toggles and embeds inside article bodies are rendered faithfully from Notion,
including an image with a missing description. The renderer cannot invent one.

**No formal audit against WCAG 2.2 has been carried out.** The claim above is a
target and a practice, not a certification, and the difference matters. If you
need a conformance statement for procurement, this is not one.

---

## Reporting a barrier

Email **hello@prasadk.xyz** with:

- the page URL
- the browser and assistive technology you used, and the versions
- what you expected and what happened instead

If you would rather not email, open an issue at
<https://github.com/prasad-kmd/PM-Web_V2/issues> — accessibility reports are
welcome there. **Please do not use a public issue for a security problem**; see
[SECURITY.md](SECURITY.md) instead.

**What happens next.** You get an acknowledgement within **72 hours**. After that,
one of two things, stated plainly either way:

- it is a barrier and it gets fixed, with a note in `CHANGELOG.md`; or
- it is a barrier that cannot be fixed — a third-party Notion embed, for instance
  — in which case it is documented here as a known limitation rather than left
  unmentioned.

"I could not reproduce it" is a real answer, and if that is the answer you will
get it with what was tried, so you can decide whether to send more detail.

---

## How this is verified

Checked on every phase, and encoded in the verification suites where it can be:

| Check | How |
| ----- | --- |
| Keyboard reachability | Tab pass over every new page, in both themes |
| Visible focus | `focus-visible` rings on all interactive elements, never removed |
| Reduced motion | Grep the suite for ungated animation; `motion-reduce`/`motion-safe` used otherwise |
| `autoFocus` | Every use must carry a stated reason — the suite fails otherwise |
| Live regions | `role="alert"` on error paths, `role="status"` on success |
| Contrast | Token pairs checked against both themes |
| Landmarks and headings | Read per page; breadcrumbs as navigation |

The automated suite is a floor, not a substitute for the audit listed as missing
above.
