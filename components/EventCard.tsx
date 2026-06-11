import Link from "next/link";
import type { LiveEvent } from "@/lib/types";
import { formatTime } from "@/lib/events";
import SaveButton from "@/components/SaveButton";

export default function EventCard({ event }: { event: LiveEvent }) {
  return (
    <Link
      href={`/event/${event.id}`}
      className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/25 hover:bg-white/[0.06]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span className="tabular-nums">{formatTime(event.start)}</span>
          <span aria-hidden>·</span>
          <span
            className={
              event.isFree
                ? "font-medium text-emerald-400"
                : "text-white/60"
            }
          >
            {event.cover}
          </span>
        </div>

        <h3 className="mt-0.5 truncate text-base font-semibold text-white">
          {event.title}
        </h3>
        {event.performer && (
          <p className="truncate text-sm text-white/70">{event.performer}</p>
        )}

        <p className="mt-1 truncate text-sm text-white/55">
          {event.venue.name} · {event.venue.neighborhood}
        </p>

        {event.genre.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {event.genre.map((g) => (
              <span
                key={g}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/60"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>

      <SaveButton eventId={event.id} size="sm" />
    </Link>
  );
}
