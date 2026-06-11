"""Lightweight dataclasses shared across the crawler."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Venue:
    name: str
    lat: float
    lng: float
    amenity: str
    address: str = ""
    website: str = ""
    instagram: str = ""
    osm_id: str = ""


@dataclass
class EventHit:
    """One extracted (candidate) event."""

    title: str = ""
    performer: str = ""
    date: str = ""
    time: str = ""
    cover: str = ""
    is_free: bool | None = None
    is_ticketed: bool | None = None
    source_url: str = ""


@dataclass
class VenueResult:
    venue: Venue
    has_live_music: bool = False
    events: list[EventHit] = field(default_factory=list)
    # How the verdict was reached: "haiku", "heuristic", or "" (none).
    method: str = ""
    matched_keywords: list[str] = field(default_factory=list)
    checked_urls: list[str] = field(default_factory=list)
    status: str = ""  # e.g. "ok", "no-website", "unreachable", "blocked"
    note: str = ""
