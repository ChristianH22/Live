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
- **Phase 3 (in design)** — Python **discovery crawler**: find the bars/restaurants
  in EV/LES that host **unticketed live music** and what they have on. Starts as a
  standalone, run-on-command script that writes a `.txt` report (decoupled from the
  app). Later feeds Airtable Inbox → one-click human approve → published Events.
  See "Backend — discovery crawler" below.
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

## Backend — discovery crawler (Phase 3, in design)

A standalone Python script, run **on command** (no scheduler yet), that discovers
the bars/restaurants in EV/LES hosting **unticketed live music** and the events
they have on, and writes a human-readable `.txt` report. It is intentionally
**decoupled from the frontend** — it does not write `LiveEvent`/Airtable yet. The
goal is to validate that automated discovery + event detection actually works
before wiring it into the app's pipeline.

### Goal & shape
- **Bottom-up**: enumerate the universe of venues, then visit each and detect
  events. (Not a hand-curated seed list.)
- **Target**: *unticketed / informal* live music — the stuff bars/restaurants post
  on their own website (and later Instagram), not ticketed concerts.
- **Output**: a timestamped `.txt` per run with (1) a run summary (counts, runtime),
  (2) **Venues with events** — name, address, website, and each event (title /
  performer / date / time / cover / source URL), (3) **No events found /
  unreachable** — venues checked but skipped, for debugging recall.

### Pipeline
1. **Venue discovery — OpenStreetMap Overpass API** (free, no key). Query
   `amenity` in {bar, pub, restaurant, nightclub, cafe} within the EV/LES bounding
   box (reuse the map bounds: SW `[40.709, -73.996]`, NE `[40.733, -73.972]`).
   Capture name, lat/lng, address, and `website`/`contact:website`/`contact:instagram`
   tags where present.
2. **Per-venue event detection (primary = the venue's own website):**
   - **Shallow crawl**: fetch the homepage, follow links whose URL/anchor matches
     event-ish patterns (`/events`, `/calendar`, `/shows`, `/music`, `/live`,
     `/whats-on`, `/gigs`), fetch those pages only.
   - **Fetch strategy**: `requests` first; if the page comes back JS-empty, re-render
     with **Playwright** (headless) as a fallback (handles Squarespace/Wix/widgets).
   - **Hybrid parse**: heuristics (keywords, URL patterns, date regex) locate the
     candidate events page; **Claude Haiku 4.5** (`claude-haiku-4-5`, structured
     outputs, prompt-cached system prompt) then reads the cleaned page text, confirms
     it's **live music**, flags **ticketed vs free**, and extracts structured events.
     ~1 Haiku call per candidate venue → low cost.
3. **Secondary — event aggregators as a venue-discovery cross-check** (DoNYC /
   Bandsintown / Resident Advisor / Eventbrite, filtered to EV/LES). These skew
   **ticketed**, so they are used to *find additional venues worth crawling*, not as
   the unticketed-event source. The unticketed events still come from step 2.
4. **Instagram** — designed-for but **deferred** (ToS-gray, hardest). A later signal.

### Tech & conventions (crawler)
- Python in `crawler/` with its own **`.venv`** (all deps installed inside it).
  `requirements.txt`: `requests`, `beautifulsoup4`, `playwright`, `anthropic`.
- **Politeness/legality**: respect `robots.txt`, throttle + bounded concurrency,
  descriptive `User-Agent`, per-run page cache, prefer public calendar pages.
- **Run on command** via CLI (e.g. `python crawler/crawl.py [--limit N] [--bbox ...]`).
- Cost: Haiku-only, prompt-cached system prompt, ~1 call/venue → well under budget.

### Out of scope (this spike) / open for next iteration
- Mapping results into `LiveEvent` / Airtable Inbox / the review flow — later.
- Geocoding, dedupe/normalization, scheduling (GitHub Actions cron) — later.
- Higher-fidelity venue discovery via **Google Places API** (needs billing) — a
  possible upgrade over OSM if coverage proves thin.

## ⚠️ Seed data is illustrative
`data/events.json` uses real EV/LES venue names/addresses but **placeholder
performers, dates, and times**. Replace with verified real listings before any
public share — do not publish unverified showtimes.

## Commands
- `npm run dev` — local dev (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve the production build
