"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllEvents } from "@/lib/events";
import { getSavedIds, subscribeSaves } from "@/lib/saves";
import EventCard from "@/components/EventCard";

export default function SavedPage() {
  const [ids, setIds] = useState<string[] | null>(null);

  useEffect(() => {
    setIds(getSavedIds());
    return subscribeSaves(() => setIds(getSavedIds()));
  }, []);

  const all = getAllEvents();
  const saved = ids ? all.filter((e) => ids.includes(e.id)) : [];

  return (
    <div>
      <h1 className="text-2xl font-bold leading-tight">Saved</h1>
      <p className="mt-1 text-sm text-white/55">
        Shows you&apos;ve hearted, kept on this device.
      </p>

      <div className="mt-6 space-y-2.5">
        {ids === null ? null : saved.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/55">
            <p>No saved shows yet.</p>
            <Link
              href="/"
              className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Browse shows
            </Link>
          </div>
        ) : (
          saved.map((e) => <EventCard key={e.id} event={e} />)
        )}
      </div>
    </div>
  );
}
