"""CLI entry point: discover EV/LES venues and report live-music findings.

Run from the repo root:
    python -m crawler.crawl --limit 20
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from datetime import datetime

# Windows consoles default to cp1252; force UTF-8 so progress glyphs don't crash.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")
    except Exception:
        pass

from . import config
from .discovery import discover_venues
from .extract import analyze_venue
from .fetch import Fetcher
from .report import write_report


def main() -> None:
    parser = argparse.ArgumentParser(description="EV/LES live-music discovery crawler")
    parser.add_argument("--limit", type=int, default=0, help="max venues to analyze (0 = all)")
    parser.add_argument("--amenities", type=str, default="", help="comma list, overrides default")
    parser.add_argument("--no-llm", action="store_true", help="skip Claude Haiku extraction")
    parser.add_argument("--no-browser", action="store_true", help="skip Playwright fallback")
    parser.add_argument("--throttle", type=float, default=None, help="seconds between requests/host")
    parser.add_argument("--out", type=str, default="", help="output .txt path")
    args = parser.parse_args()

    amenities = (
        [a.strip() for a in args.amenities.split(",") if a.strip()]
        if args.amenities
        else config.DEFAULT_AMENITIES
    )
    use_llm = not args.no_llm and bool(os.environ.get("ANTHROPIC_API_KEY"))

    print(f"[1/3] Discovering venues in EV/LES via OSM Overpass ({', '.join(amenities)})…")
    venues = discover_venues(amenities)
    total_discovered = len(venues)
    print(f"      found {total_discovered} venues")

    if args.limit and args.limit > 0:
        venues = venues[: args.limit]
        print(f"      analyzing first {len(venues)} (--limit {args.limit})")

    fetcher = Fetcher(use_browser=not args.no_browser, throttle=args.throttle)
    print(f"[2/3] Analyzing {len(venues)} venues "
          f"({'Haiku+heuristics' if use_llm else 'heuristics only'})…")

    start = time.monotonic()
    results = []
    for i, v in enumerate(venues, 1):
        r = analyze_venue(v, fetcher, use_llm=use_llm)
        flag = "♪ live music" if r.has_live_music else f"  {r.status or 'none'}"
        print(f"   [{i:>3}/{len(venues)}] {v.name[:38]:<38} {flag}")
        results.append(r)
    elapsed = time.monotonic() - start

    out = args.out
    if not out:
        os.makedirs("crawler/output", exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        out = os.path.join("crawler", "output", f"crawl-{ts}.txt")

    write_report(
        results,
        out,
        total_discovered=total_discovered,
        elapsed_s=elapsed,
        llm_used=use_llm,
        amenities=amenities,
    )
    hits = sum(1 for r in results if r.has_live_music)
    print(f"[3/3] Done. {hits} venues with live music. Report → {out}")


if __name__ == "__main__":
    main()
