"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { DayFilter, LiveEvent } from "@/lib/types";
import { filterEvents, groupByDate } from "@/lib/events";
import EventCard from "@/components/EventCard";

const VenueMap = dynamic(() => import("@/components/VenueMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[68vh] place-items-center rounded-2xl border border-white/10 text-sm text-white/50">
      Loading map…
    </div>
  ),
});

const DAY_OPTIONS: { value: DayFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "tonight", label: "Tonight" },
  { value: "weekend", label: "This weekend" },
  { value: "week", label: "This week" },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? "border-white bg-white text-black"
          : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function EventBrowser({
  events,
  genres,
}: {
  events: LiveEvent[];
  genres: string[];
}) {
  const [day, setDay] = useState<DayFilter>("all");
  const [genre, setGenre] = useState<string | "all">("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");

  // Compute once per render against the user's local clock.
  const now = useMemo(() => new Date(), []);
  const filtered = useMemo(
    () => filterEvents(events, { day, genre, freeOnly }, now),
    [events, day, genre, freeOnly, now],
  );
  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div>
      {/* Day filter */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2">
          {DAY_OPTIONS.map((opt) => (
            <Chip key={opt.value} active={day === opt.value} onClick={() => setDay(opt.value)}>
              {opt.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Genre + free filters */}
      <div className="mt-2 -mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2">
          <Chip active={freeOnly} onClick={() => setFreeOnly((v) => !v)}>
            Free only
          </Chip>
          <span className="w-px self-stretch bg-white/10" aria-hidden />
          <Chip active={genre === "all"} onClick={() => setGenre("all")}>
            All genres
          </Chip>
          {genres.map((g) => (
            <Chip key={g} active={genre === g} onClick={() => setGenre(g)}>
              {g}
            </Chip>
          ))}
        </div>
      </div>

      {/* Count + List/Map toggle */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-white/45">
          {filtered.length} {filtered.length === 1 ? "show" : "shows"}
        </span>
        <div className="inline-flex rounded-full border border-white/15 p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            className={`rounded-full px-3 py-1 transition-colors ${
              view === "list" ? "bg-white text-black" : "text-white/70 hover:text-white"
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            aria-pressed={view === "map"}
            className={`rounded-full px-3 py-1 transition-colors ${
              view === "map" ? "bg-white text-black" : "text-white/70 hover:text-white"
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Results */}
      {view === "map" ? (
        <div className="mt-4">
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/55">
              No shows match these filters.
            </p>
          ) : (
            <VenueMap events={filtered} />
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-7">
          {filtered.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/55">
              No shows match these filters. Try widening the day or clearing genre.
            </p>
          )}
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/45">
                {group.label}
              </h2>
              <div className="space-y-2.5">
                {group.events.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
