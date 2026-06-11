"use client";

import { useMemo, useState } from "react";
import type { DayFilter, LiveEvent } from "@/lib/types";
import { filterEvents, groupByDate } from "@/lib/events";
import EventCard from "@/components/EventCard";

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

  // Compute once per render against the user's local clock.
  const now = useMemo(() => new Date(), []);
  const groups = useMemo(() => {
    const filtered = filterEvents(events, { day, genre, freeOnly }, now);
    return groupByDate(filtered);
  }, [events, day, genre, freeOnly, now]);

  const total = groups.reduce((n, g) => n + g.events.length, 0);

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

      {/* Results */}
      <div className="mt-6 space-y-7">
        {total === 0 && (
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
    </div>
  );
}
