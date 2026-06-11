import { getAllEvents, getAllGenres } from "@/lib/events";
import EventBrowser from "@/components/EventBrowser";

export default function Home() {
  const events = getAllEvents();
  const genres = getAllGenres(events);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold leading-tight">
          Live music near you, tonight
        </h1>
        <p className="mt-1 text-sm text-white/55">
          The informal scene of the East Village &amp; Lower East Side — jazz,
          open mics, bar bands and more.
        </p>
      </div>

      <EventBrowser events={events} genres={genres} />
    </div>
  );
}
