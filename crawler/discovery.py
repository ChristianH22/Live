"""Venue discovery via the OpenStreetMap Overpass API (free, no key).

Enumerates bars/restaurants/etc. inside the EV/LES bounding box and returns
Venue records with whatever website/instagram tags OSM has.
"""

from __future__ import annotations

import requests

from . import config
from .models import Venue


def _build_query(amenities: list[str]) -> str:
    bbox = f"{config.BBOX_SOUTH},{config.BBOX_WEST},{config.BBOX_NORTH},{config.BBOX_EAST}"
    # nwr = nodes, ways and relations; out center gives a lat/lng for ways/rels.
    clauses = "\n".join(
        f'  nwr["amenity"="{a}"]["name"]({bbox});' for a in amenities
    )
    return f"[out:json][timeout:60];\n(\n{clauses}\n);\nout center tags;"


def _address(tags: dict) -> str:
    parts = [
        tags.get("addr:housenumber", ""),
        tags.get("addr:street", ""),
    ]
    line = " ".join(p for p in parts if p).strip()
    extra = tags.get("addr:city") or tags.get("addr:postcode")
    if line and extra:
        return f"{line}, {extra}"
    return line or extra or ""


def _instagram(tags: dict) -> str:
    raw = (
        tags.get("contact:instagram")
        or tags.get("instagram")
        or ""
    )
    if not raw:
        return ""
    # Normalise to a bare handle.
    raw = raw.rstrip("/")
    if "instagram.com/" in raw:
        raw = raw.split("instagram.com/")[-1]
    return raw.lstrip("@")


def discover_venues(amenities: list[str] | None = None) -> list[Venue]:
    amenities = amenities or config.DEFAULT_AMENITIES
    query = _build_query(amenities)
    resp = requests.post(
        config.OVERPASS_URL,
        data={"data": query},
        headers={"User-Agent": config.USER_AGENT},
        timeout=90,
    )
    resp.raise_for_status()
    elements = resp.json().get("elements", [])

    venues: list[Venue] = []
    seen: set[str] = set()
    for el in elements:
        tags = el.get("tags", {})
        name = tags.get("name", "").strip()
        if not name:
            continue
        lat = el.get("lat") or (el.get("center") or {}).get("lat")
        lng = el.get("lon") or (el.get("center") or {}).get("lon")
        if lat is None or lng is None:
            continue

        key = name.lower()
        if key in seen:
            continue
        seen.add(key)

        website = (
            tags.get("website")
            or tags.get("contact:website")
            or tags.get("url")
            or ""
        ).strip()

        venues.append(
            Venue(
                name=name,
                lat=float(lat),
                lng=float(lng),
                amenity=tags.get("amenity", ""),
                address=_address(tags),
                website=website,
                instagram=_instagram(tags),
                osm_id=f"{el.get('type','')}/{el.get('id','')}",
            )
        )

    venues.sort(key=lambda v: v.name.lower())
    return venues
