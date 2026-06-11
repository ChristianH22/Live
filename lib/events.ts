import rawData from "@/data/events.json";
import type { DayFilter, LiveEvent } from "@/lib/types";

// Phase 1: events come from the committed seed file. Phase 2 swaps this module's
// internals for an Airtable fetch while keeping the same exported functions.

const ALL_EVENTS: LiveEvent[] = (rawData.events as LiveEvent[])
  .slice()
  .sort((a, b) => a.start.localeCompare(b.start));

export function getAllEvents(): LiveEvent[] {
  return ALL_EVENTS;
}

export function getEventById(id: string): LiveEvent | undefined {
  return ALL_EVENTS.find((e) => e.id === id);
}

export function getAllGenres(events: LiveEvent[] = ALL_EVENTS): string[] {
  const set = new Set<string>();
  for (const e of events) for (const g of e.genre) set.add(g);
  return Array.from(set).sort();
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** Whether an event falls within the given day window relative to `now`. */
export function matchesDay(event: LiveEvent, day: DayFilter, now: Date): boolean {
  const start = new Date(event.start);
  const today = startOfDay(now);

  // Always hide events that already happened (before today).
  if (start.getTime() < today.getTime()) return false;

  switch (day) {
    case "all":
      return true;
    case "tonight":
      return sameDay(start, now);
    case "week": {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return start.getTime() < weekEnd.getTime();
    }
    case "weekend": {
      // Upcoming Fri/Sat/Sun within the next 7 days.
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const dow = start.getDay(); // 0=Sun ... 5=Fri, 6=Sat
      const isWeekend = dow === 5 || dow === 6 || dow === 0;
      return isWeekend && start.getTime() < weekEnd.getTime();
    }
    default:
      return true;
  }
}

export interface EventFilters {
  day: DayFilter;
  genre: string | "all";
  freeOnly: boolean;
}

export function filterEvents(
  events: LiveEvent[],
  filters: EventFilters,
  now: Date,
): LiveEvent[] {
  return events.filter((e) => {
    if (!matchesDay(e, filters.day, now)) return false;
    if (filters.genre !== "all" && !e.genre.includes(filters.genre)) return false;
    if (filters.freeOnly && !e.isFree) return false;
    return true;
  });
}

/** Group events by calendar date (local) for sectioned display. */
export function groupByDate(events: LiveEvent[]): { label: string; events: LiveEvent[] }[] {
  const groups = new Map<string, LiveEvent[]>();
  for (const e of events) {
    const d = new Date(e.start);
    const key = startOfDay(d).toISOString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, evs]) => ({ label: formatDateLabel(new Date(key)), events: evs }));
}

export function formatDateLabel(d: Date): string {
  const now = new Date();
  if (sameDay(d, now)) return "Tonight";
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (sameDay(d, tomorrow)) return "Tomorrow";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export interface VenueGroup {
  venue: LiveEvent["venue"];
  events: LiveEvent[];
}

/**
 * Collapse events into one entry per venue (keyed by venue name), keeping each
 * venue's events sorted by start. Used for map pins — one pin per bar.
 */
export function groupByVenue(events: LiveEvent[]): VenueGroup[] {
  const groups = new Map<string, VenueGroup>();
  for (const e of events) {
    const key = e.venue.name;
    if (!groups.has(key)) groups.set(key, { venue: e.venue, events: [] });
    groups.get(key)!.events.push(e);
  }
  return Array.from(groups.values())
    .map((g) => ({
      ...g,
      events: g.events.slice().sort((a, b) => a.start.localeCompare(b.start)),
    }))
    .filter((g) => g.venue.lat != null && g.venue.lng != null);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
