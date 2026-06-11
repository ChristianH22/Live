import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllEvents, getEventById, formatTime } from "@/lib/events";
import SaveButton from "@/components/SaveButton";
import OutboundLink from "@/components/OutboundLink";

export function generateStaticParams() {
  return getAllEvents().map((e) => ({ id: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) return { title: "Event not found — Live" };
  const title = `${event.title} at ${event.venue.name}`;
  const description = `${event.performer ? event.performer + " · " : ""}${
    event.venue.neighborhood
  } · ${event.cover}`;
  return {
    title: `${title} — Live`,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

function directionsUrl(venue: { name: string; address: string }): string {
  const q = encodeURIComponent(`${venue.name}, ${venue.address}, New York, NY`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) notFound();

  const { venue } = event;
  const igUrl = venue.instagram
    ? `https://www.instagram.com/${venue.instagram}`
    : undefined;

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-white/55 hover:text-white"
      >
        <span aria-hidden>←</span> Back
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-white/55">
            {longDate(event.start)} · {formatTime(event.start)}
            {event.end ? `–${formatTime(event.end)}` : ""}
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight">{event.title}</h1>
          {event.performer && (
            <p className="mt-0.5 text-base text-white/75">{event.performer}</p>
          )}
        </div>
        <SaveButton eventId={event.id} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-sm font-medium ${
            event.isFree
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-white/10 text-white/75"
          }`}
        >
          {event.cover}
        </span>
        {event.genre.map((g) => (
          <span
            key={g}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-sm text-white/65"
          >
            {g}
          </span>
        ))}
      </div>

      {/* Venue */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-base font-semibold">{venue.name}</h2>
        <p className="text-sm text-white/55">
          {venue.address} · {venue.neighborhood}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <OutboundLink
            href={directionsUrl(venue)}
            kind="directions"
            eventId={event.id}
            className="grid place-items-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Get directions
          </OutboundLink>

          <div className="grid grid-cols-2 gap-2">
            {venue.website && (
              <OutboundLink
                href={venue.website}
                kind="venue_site"
                eventId={event.id}
                className="grid place-items-center rounded-xl border border-white/15 px-4 py-3 text-sm text-white/80 hover:border-white/30"
              >
                Venue site
              </OutboundLink>
            )}
            {igUrl && (
              <OutboundLink
                href={igUrl}
                kind="instagram"
                eventId={event.id}
                className="grid place-items-center rounded-xl border border-white/15 px-4 py-3 text-sm text-white/80 hover:border-white/30"
              >
                Instagram
              </OutboundLink>
            )}
          </div>

          {event.ticketUrl && (
            <OutboundLink
              href={event.ticketUrl}
              kind="tickets"
              eventId={event.id}
              className="grid place-items-center rounded-xl border border-white/15 px-4 py-3 text-sm text-white/80 hover:border-white/30"
            >
              Tickets / RSVP
            </OutboundLink>
          )}
        </div>
      </div>

      {event.sourceUrl && (
        <p className="mt-4 text-center text-xs text-white/35">
          Listing details may change — confirm with the venue before heading out.
        </p>
      )}
    </div>
  );
}
