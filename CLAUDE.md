# Live — project guide for Claude

A mobile-web app for discovering **informal, non-ticketed live music** in the
**East Village & Lower East Side** of NYC (jazz, open mics, bar bands, brunch
sets). Fan-facing discovery; the gap it fills is the long-tail scene that
Bandsintown / DICE / Songkick don't aggregate.

The full scope, phasing, and rationale live in the plan:
`~/.claude/plans/i-m-thinking-of-creating-serene-lecun.md`.

## Guiding principle
Validate demand before building automation. Ship the simplest shareable thing,
get it in front of users, then automate.

## Phases
- **Phase 1 (current)** — Next.js mobile-web app reading hand-seeded shows from
  `data/events.json`. No backend, no crawler. Deployed to Vercel; shared by link/QR.
- **Phase 2** — move data to Airtable so non-technical edits are possible
  (`lib/airtable.ts`, read via ISR); same `LiveEvent` shape.
- **Phase 3** — Python crawler over a venue seed list → Claude Haiku 4.5
  (`claude-haiku-4-5`, structured outputs, prompt-cached system prompt) →
  Airtable Inbox → one-click human approve → published Events. GitHub Actions cron.
- **Phase 4** — Instagram / Facebook ingestion via a paid scraper, same inbox flow.

## Tech stack
- Next.js 16 (App Router) + TypeScript + Tailwind v4, mobile-first, PWA.
- Vercel hosting (free tier). Repo: https://github.com/ChristianH22/Live.git
- PostHog for analytics (visits, saves, outbound clicks) — no-op without a key.
- Anonymous saves via `localStorage` (no accounts in MVP).

## Layout
- `app/` — App Router. `page.tsx` (list), `event/[id]/page.tsx` (detail, SSG),
  `saved/page.tsx` (client). `manifest.ts`, `opengraph-image.tsx`, `apple-icon.tsx`.
- `components/` — `EventBrowser` (filters), `EventCard`, `SaveButton`,
  `OutboundLink`, `AnalyticsProvider`.
- `lib/` — `types.ts` (`LiveEvent`), `events.ts` (load + filter helpers),
  `saves.ts` (localStorage), `analytics.ts` (PostHog wrapper).
- `data/events.json` — Phase 1 seed data.

## Conventions
- Keep the `LiveEvent` shape (`lib/types.ts`) stable — Phases 2/3 produce it too.
- Filtering is pure and `now`-parameterized (`lib/events.ts`) so client time drives it.
- Analytics calls are safe no-ops when `NEXT_PUBLIC_POSTHOG_KEY` is unset.
- Dark-first design; mobile width capped at `max-w-md`.

## ⚠️ Seed data is illustrative
`data/events.json` uses real EV/LES venue names/addresses but **placeholder
performers, dates, and times**. Replace with verified real listings before any
public share — do not publish unverified showtimes.

## Commands
- `npm run dev` — local dev (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve the production build
