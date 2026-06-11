# Live

A mobile-web app for discovering **informal live music** in the **East Village
& Lower East Side** — the jazz nights, open mics, bar bands and brunch sets that
the big ticketing apps don't aggregate.

This is the **Phase 1 MVP**: a shareable app fed by a hand-curated seed file, no
backend or crawler. The goal is to validate demand before building automation.
See `CLAUDE.md` for the full phase plan.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build && npm run start   # production build
```

## How it works (Phase 1)

- Events live in [`data/events.json`](data/events.json) and are typed by
  [`lib/types.ts`](lib/types.ts).
- The home page lists upcoming shows with day / genre / free-vs-cover filters.
- Tapping a show opens a detail page with **Get directions** and venue links.
- The heart **saves** shows to the device (`localStorage`); see the **Saved** tab.
- [PostHog](https://posthog.com) tracks visits, saves, and outbound clicks
  (it's a no-op until you add a key — see below).

> ⚠️ **The seed data is illustrative.** Venue names and addresses are real
> EV/LES spots, but performers, dates, and times are placeholders. **Replace
> them with verified real listings in `data/events.json` before sharing the
> link publicly.**

## Configuration

Copy `.env.local.example` to `.env.local` and fill in what you have:

| Variable | Purpose | Required? |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | Enables analytics | Optional (no-op if unset) |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host | Optional (defaults to US cloud) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for OG/share cards | Optional (set after deploy) |

## Deploy

Hosted on **Vercel** (free tier). Import this GitHub repo at
[vercel.com/new](https://vercel.com/new); every push to `main` redeploys. After
the first deploy, set `NEXT_PUBLIC_SITE_URL` to your `*.vercel.app` URL so
shared links render the correct preview card.

## Sharing for validation

Once live, share the URL via group chats, EV/LES communities (Reddit/FB groups),
Instagram, and QR-code flyers in venues. A QR code can be generated from the
deployed URL with any QR generator.

## Roadmap

- **Phase 2** — Airtable backend for no-code editing.
- **Phase 3** — Python crawler + Claude Haiku 4.5 extraction → Airtable review
  inbox → published events (daily, via GitHub Actions).
- **Phase 4** — Instagram / Facebook ingestion.
