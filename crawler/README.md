# EV/LES live-music discovery crawler

A standalone, run-on-command spike. It discovers bars/restaurants in the **East
Village & Lower East Side** and reports which host **unticketed live music** to a
`.txt` file. It does **not** touch the frontend or Airtable yet — this exists to
validate that automated discovery + event detection works.

See the project `CLAUDE.md` → "Backend — discovery crawler" for the full scope.

## How it works
1. **Discovery** — OpenStreetMap Overpass API enumerates bars/pubs/restaurants/etc.
   inside the EV/LES bounding box (free, no API key).
2. **Per-venue detection** — fetch the venue website (static `requests`, with a
   Playwright headless fallback for JS-rendered sites), follow likely event pages
   (`/events`, `/calendar`, `/shows`, `/music`, `/live`, …).
3. **Extraction**
   - **Heuristics** (always on, $0): live-music keywords + free/ticketed signals.
   - **Claude Haiku** (optional): if `ANTHROPIC_API_KEY` is set, Haiku reads the
     page text and extracts structured events (with a prompt-cached system prompt).
4. **Report** — `crawler/output/crawl-<timestamp>.txt` with a run summary, a
   "venues with live music" section, and a "no events / unreachable" section.

## Setup (virtual environment)
From the repo root (`Live/`):

```bash
python -m venv crawler/.venv
# Windows:
crawler/.venv/Scripts/python -m pip install -r crawler/requirements.txt
# macOS/Linux:
crawler/.venv/bin/python -m pip install -r crawler/requirements.txt

# Optional: enable the JS-rendering fallback (downloads a headless browser)
crawler/.venv/Scripts/python -m playwright install chromium
```

## Run
```bash
# heuristics-only (no key needed)
crawler/.venv/Scripts/python -m crawler.crawl --limit 20

# with Claude Haiku extraction
ANTHROPIC_API_KEY=sk-ant-... crawler/.venv/Scripts/python -m crawler.crawl --limit 20
```

### Flags
- `--limit N` — analyze at most N venues (0 = all).
- `--amenities bar,pub,nightclub` — override which OSM amenities to enumerate.
- `--no-llm` — force heuristics-only even if a key is set.
- `--no-browser` — skip the Playwright fallback (static fetch only).
- `--throttle S` — seconds between requests to the same host (default 1.0).
- `--out PATH` — custom report path.

## Notes
- Respects `robots.txt`, throttles per host, sends a descriptive User-Agent.
- `.venv/`, `output/`, and `__pycache__/` are gitignored.
