"""Render a human-readable .txt report of a crawl run."""

from __future__ import annotations

from datetime import datetime

from .models import VenueResult


def _fmt_event(e) -> str:
    bits = []
    when = " ".join(x for x in [e.date, e.time] if x).strip()
    if when:
        bits.append(when)
    if e.title:
        bits.append(e.title)
    if e.performer and e.performer != e.title:
        bits.append(f"— {e.performer}")
    tag = ""
    if e.is_ticketed:
        tag = " [ticketed]"
    elif e.is_free:
        tag = " [free]"
    line = " · ".join(bits) if bits else "(event detail not parsed)"
    return f"{line}{tag}"


def write_report(
    results: list[VenueResult],
    path: str,
    *,
    total_discovered: int,
    elapsed_s: float,
    llm_used: bool,
    amenities: list[str],
) -> None:
    hits = [r for r in results if r.has_live_music]
    misses = [r for r in results if not r.has_live_music]
    hits.sort(key=lambda r: r.venue.name.lower())
    misses.sort(key=lambda r: r.venue.name.lower())

    lines: list[str] = []
    lines.append("LIVE MUSIC NYC — EV/LES discovery crawl")
    lines.append(f"Generated: {datetime.now().isoformat(timespec='seconds')}")
    lines.append("")
    lines.append("RUN SUMMARY")
    lines.append(f"  Venues discovered (OSM):   {total_discovered}")
    lines.append(f"  Venues analyzed:           {len(results)}")
    lines.append(f"  With live music:           {len(hits)}")
    lines.append(f"  Without / unverified:      {len(misses)}")
    lines.append(f"  Extraction method:         {'Claude Haiku + heuristics' if llm_used else 'heuristics only (no API key)'}")
    lines.append(f"  Amenities queried:         {', '.join(amenities)}")
    lines.append(f"  Elapsed:                   {elapsed_s:.1f}s")
    lines.append("")
    lines.append("=" * 70)
    lines.append(f"VENUES WITH LIVE MUSIC ({len(hits)})")
    lines.append("=" * 70)
    if not hits:
        lines.append("  (none detected this run)")
    for r in hits:
        v = r.venue
        lines.append("")
        lines.append(f"• {v.name}  [{v.amenity}]")
        if v.address:
            lines.append(f"    {v.address}")
        if v.website:
            lines.append(f"    site: {v.website}")
        if v.instagram:
            lines.append(f"    ig:   @{v.instagram}")
        lines.append(f"    verdict via: {r.method}")
        if r.matched_keywords:
            lines.append(f"    matched: {', '.join(r.matched_keywords)}")
        if r.events:
            lines.append("    events:")
            for e in r.events:
                lines.append(f"      - {_fmt_event(e)}")
                if e.source_url:
                    lines.append(f"        {e.source_url}")
        elif r.note:
            lines.append(f"    evidence: {r.note}")
        if r.checked_urls:
            lines.append(f"    checked: {', '.join(r.checked_urls[:4])}")

    lines.append("")
    lines.append("=" * 70)
    lines.append(f"NO EVENTS FOUND / UNREACHABLE ({len(misses)})")
    lines.append("=" * 70)
    for r in misses:
        v = r.venue
        reason = r.status or "no-live-music"
        site = v.website or "(no website)"
        lines.append(f"  - {v.name} [{v.amenity}] — {reason} — {site}")

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
