"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import Link from "next/link";
import type { LiveEvent } from "@/lib/types";
import { groupByVenue, formatTime, formatDateLabel } from "@/lib/events";

// Map is intentionally confined to the East Village / Lower East Side footprint.
const EV_LES_CENTER: [number, number] = [40.7215, -73.984];
const EV_LES_BOUNDS: [[number, number], [number, number]] = [
  [40.709, -73.996], // south-west
  [40.733, -73.972], // north-east
];

function pinIcon(count: number): L.DivIcon {
  return L.divIcon({
    className: "venue-pin",
    html: `<div class="vp">${count}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

export default function VenueMap({ events }: { events: LiveEvent[] }) {
  const venues = groupByVenue(events);

  return (
    <div className="h-[68vh] overflow-hidden rounded-2xl border border-white/10">
      <MapContainer
        center={EV_LES_CENTER}
        zoom={15}
        minZoom={14}
        maxZoom={18}
        maxBounds={EV_LES_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", background: "#0b0b0f" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {venues.map(({ venue, events: vEvents }) => (
          <Marker
            key={venue.name}
            position={[venue.lat as number, venue.lng as number]}
            icon={pinIcon(vEvents.length)}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="text-sm font-semibold text-zinc-900">{venue.name}</p>
                <p className="mb-2 text-xs text-zinc-500">{venue.neighborhood}</p>
                <ul className="space-y-1">
                  {vEvents.slice(0, 4).map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/event/${e.id}`}
                        className="block text-sm text-zinc-800 hover:text-rose-600"
                      >
                        <span className="text-zinc-500">
                          {formatDateLabel(new Date(e.start))} · {formatTime(e.start)}
                        </span>
                        <br />
                        <span className="font-medium">{e.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {vEvents.length > 4 && (
                  <p className="mt-1 text-xs text-zinc-500">
                    +{vEvents.length - 4} more
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
