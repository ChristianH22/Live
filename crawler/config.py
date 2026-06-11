"""Shared configuration for the EV/LES discovery crawler.

See CLAUDE.md -> "Backend - discovery crawler" for the full scope. This is a
standalone, run-on-command spike: discover bars/restaurants in the East Village
& Lower East Side that host UNTICKETED live music, and report findings to a .txt.
"""

from __future__ import annotations

# --- Geography -------------------------------------------------------------
# EV/LES bounding box (reuses the frontend map bounds).
# Overpass wants (south, west, north, east).
BBOX_SOUTH = 40.709
BBOX_WEST = -73.996
BBOX_NORTH = 40.733
BBOX_EAST = -73.972

# OSM amenities to enumerate. bar/pub/nightclub are highest-signal for live
# music; restaurant is medium; cafe is noisiest (opt out with --amenities).
DEFAULT_AMENITIES = ["bar", "pub", "nightclub", "restaurant", "cafe"]

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# --- HTTP behaviour --------------------------------------------------------
USER_AGENT = (
    "LiveMusicNYC-DiscoveryBot/0.1 "
    "(+https://github.com/ChristianH22/Live; non-commercial venue research)"
)
REQUEST_TIMEOUT = 15  # seconds
THROTTLE_SECONDS = 1.0  # polite delay between requests to the same host
MAX_EVENT_PAGES_PER_VENUE = 4  # homepage + up to N matched event pages

# --- Event-page discovery --------------------------------------------------
# URL/anchor fragments that suggest a page lists events.
EVENT_PATH_HINTS = [
    "event",
    "events",
    "calendar",
    "shows",
    "show",
    "music",
    "live",
    "livemusic",
    "live-music",
    "whats-on",
    "whatson",
    "whats-happening",
    "gigs",
    "lineup",
    "line-up",
    "schedule",
    "entertainment",
    "nightlife",
    "booking",
    "performances",
]

# --- Live-music heuristics -------------------------------------------------
# Presence of these terms is a (weak) signal the page is about live music.
LIVE_MUSIC_KEYWORDS = [
    "live music",
    "live band",
    "open mic",
    "open-mic",
    "jam session",
    "dj set",
    "dj night",
    "jazz",
    "blues",
    "funk",
    "soul",
    "acoustic",
    "singer-songwriter",
    "songwriter",
    "residency",
    "trio",
    "quartet",
    "quintet",
    "band",
    "performance",
    "performing",
    "concert",
    "gig",
    "set times",
    "doors at",
    "lineup",
    "headliner",
    "karaoke",
]

# Terms that suggest a show is TICKETED (we want to flag/deprioritise these).
TICKETED_KEYWORDS = [
    "tickets",
    "buy tickets",
    "ticketed",
    "rsvp required",
    "advance tickets",
    "dice.fm",
    "eventbrite",
    "ticketweb",
    "seetickets",
    "axs.com",
]

# Terms that suggest FREE / no-cover (the wedge we care about).
FREE_KEYWORDS = ["free", "no cover", "free entry", "free admission", "no charge"]

# --- LLM -------------------------------------------------------------------
HAIKU_MODEL = "claude-haiku-4-5"
