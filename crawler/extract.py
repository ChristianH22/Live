"""Detect live music and extract events from a venue's pages.

Two paths:
  * heuristic (always on, $0): keyword + free/ticketed signals, evidence snippet.
  * Claude Haiku (optional, when ANTHROPIC_API_KEY is set): structured event
    extraction with a prompt-cached system prompt.
"""

from __future__ import annotations

import json
import os
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from . import config
from .fetch import Fetcher, html_to_text
from .models import EventHit, Venue, VenueResult

MAX_TEXT_CHARS = 6000  # cap per-venue text sent to the LLM


# --- event-page discovery --------------------------------------------------
def find_event_page_links(homepage_html: str, base_url: str) -> list[str]:
    soup = BeautifulSoup(homepage_html, "html.parser")
    base_host = urlparse(base_url).netloc
    scored: dict[str, int] = {}
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if href.startswith(("mailto:", "tel:", "#", "javascript:")):
            continue
        full = urljoin(base_url, href)
        if urlparse(full).netloc != base_host:
            continue
        haystack = (urlparse(full).path + " " + a.get_text(" ")).lower()
        score = sum(1 for hint in config.EVENT_PATH_HINTS if hint in haystack)
        if score:
            scored[full.split("#")[0]] = max(scored.get(full, 0), score)
    ranked = sorted(scored, key=lambda u: scored[u], reverse=True)
    return ranked[: config.MAX_EVENT_PAGES_PER_VENUE - 1]


# --- heuristic detection ---------------------------------------------------
def heuristic_detect(text: str) -> dict:
    low = text.lower()
    matched = [k for k in config.LIVE_MUSIC_KEYWORDS if k in low]
    is_free = any(k in low for k in config.FREE_KEYWORDS)
    is_ticketed = any(k in low for k in config.TICKETED_KEYWORDS)
    snippet = ""
    if matched:
        idx = low.find(matched[0])
        start = max(0, idx - 60)
        snippet = text[start : idx + 90].strip()
    return {
        "has_live_music": bool(matched),
        "matched": matched,
        "is_free": is_free,
        "is_ticketed": is_ticketed,
        "snippet": snippet,
    }


# --- optional Claude Haiku extraction --------------------------------------
_HAIKU_SYSTEM = (
    "You extract UNTICKETED live-music events from the text of a bar/restaurant "
    "web page in NYC's East Village / Lower East Side. Live music = bands, jazz, "
    "open mics, DJ sets, singer-songwriters, jam sessions, residencies. Ignore "
    "trivia, comedy, sports, and brunch-without-music. Prefer free / no-cover "
    "events; mark ticketed ones. Only include events you can see evidence for in "
    "the text. Return strictly the requested JSON; use empty strings for unknown "
    "fields and do not invent dates."
)

_HAIKU_SCHEMA = {
    "type": "object",
    "properties": {
        "has_live_music": {"type": "boolean"},
        "events": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "performer": {"type": "string"},
                    "date": {"type": "string"},
                    "time": {"type": "string"},
                    "cover": {"type": "string"},
                    "is_free": {"type": "boolean"},
                    "is_ticketed": {"type": "boolean"},
                },
                "required": [
                    "title",
                    "performer",
                    "date",
                    "time",
                    "cover",
                    "is_free",
                    "is_ticketed",
                ],
                "additionalProperties": False,
            },
        },
    },
    "required": ["has_live_music", "events"],
    "additionalProperties": False,
}


def haiku_extract(venue: Venue, text: str, source_url: str) -> dict | None:
    """Return {has_live_music, events:[...]} or None if LLM unavailable."""
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return None
    try:
        import anthropic
    except Exception:
        return None
    try:
        client = anthropic.Anthropic()
        resp = client.messages.create(
            model=config.HAIKU_MODEL,
            max_tokens=1500,
            system=[
                {
                    "type": "text",
                    "text": _HAIKU_SYSTEM,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Venue: {venue.name}\nSource: {source_url}\n\n"
                        f"PAGE TEXT:\n{text[:MAX_TEXT_CHARS]}"
                    ),
                }
            ],
            output_config={"format": {"type": "json_schema", "schema": _HAIKU_SCHEMA}},
        )
        payload = next(
            (b.text for b in resp.content if getattr(b, "type", "") == "text"), ""
        )
        return json.loads(payload)
    except Exception:
        return None


# --- orchestration ---------------------------------------------------------
def analyze_venue(venue: Venue, fetcher: Fetcher, use_llm: bool = True) -> VenueResult:
    result = VenueResult(venue=venue)
    if not venue.website:
        result.status = "no-website"
        result.note = "No website tag in OSM; needs Instagram/aggregator (later phase)."
        return result

    home_html, status = fetcher.get(venue.website)
    if home_html is None:
        result.status = status  # blocked / unreachable
        result.checked_urls = [venue.website]
        return result

    pages = [venue.website] + find_event_page_links(home_html, venue.website)
    seen = set()
    texts: list[str] = []
    for url in pages:
        if url in seen:
            continue
        seen.add(url)
        if url == venue.website:
            html = home_html
        else:
            html, _ = fetcher.get(url)
        if html:
            texts.append(html_to_text(html))
            result.checked_urls.append(url)

    combined = "\n\n".join(texts)
    result.status = "ok"

    # Heuristic pass (always).
    h = heuristic_detect(combined)
    result.has_live_music = h["has_live_music"]
    result.matched_keywords = h["matched"][:8]
    result.method = "heuristic"
    if h["snippet"]:
        result.note = f'"{h["snippet"]}"'

    # LLM pass (upgrades the verdict + extracts structured events).
    if use_llm:
        primary = result.checked_urls[-1] if result.checked_urls else venue.website
        llm = haiku_extract(venue, combined, primary)
        if llm is not None:
            result.method = "haiku"
            result.has_live_music = bool(llm.get("has_live_music"))
            result.events = [
                EventHit(
                    title=e.get("title", ""),
                    performer=e.get("performer", ""),
                    date=e.get("date", ""),
                    time=e.get("time", ""),
                    cover=e.get("cover", ""),
                    is_free=e.get("is_free"),
                    is_ticketed=e.get("is_ticketed"),
                    source_url=primary,
                )
                for e in llm.get("events", [])
            ]
    return result
