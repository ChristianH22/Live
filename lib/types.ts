// Core domain types for the Live Music NYC app.
// In Phase 1 these are populated from data/events.json; in Phase 2 the same
// shapes are produced by lib/airtable.ts.

export type Neighborhood = "East Village" | "Lower East Side";

export interface Venue {
  name: string;
  address: string;
  neighborhood: Neighborhood;
  website?: string;
  /** Instagram handle without the @ (e.g. "arlenesgrocery") */
  instagram?: string;
  lat?: number;
  lng?: number;
}

export interface LiveEvent {
  id: string;
  /** Short headline, e.g. "Live Jazz Trio" or the night's theme. */
  title: string;
  /** The act, when known. */
  performer?: string;
  venue: Venue;
  /** ISO 8601 start datetime, with timezone offset. */
  start: string;
  /** ISO 8601 end datetime, optional. */
  end?: string;
  /** Free-text genre/style tags, e.g. ["Jazz", "Open Mic"]. */
  genre: string[];
  /** Human-readable cover, e.g. "Free", "$10", "No cover, 1 drink min". */
  cover: string;
  /** True when there is no cover charge. */
  isFree: boolean;
  /** Ticket / RSVP link, when applicable. */
  ticketUrl?: string;
  /** Where this listing came from (venue page, etc.). */
  sourceUrl?: string;
}

export type DayFilter = "all" | "tonight" | "weekend" | "week";
