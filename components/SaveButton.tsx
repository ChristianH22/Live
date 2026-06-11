"use client";

import { useEffect, useState } from "react";
import { isSaved, subscribeSaves, toggleSaved } from "@/lib/saves";
import { trackSave } from "@/lib/analytics";

export default function SaveButton({
  eventId,
  size = "md",
}: {
  eventId: string;
  size?: "sm" | "md";
}) {
  // Start false on server + first client render to avoid hydration mismatch,
  // then sync from localStorage after mount.
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSaved(isSaved(eventId));
    return subscribeSaves(() => setSaved(isSaved(eventId)));
  }, [eventId]);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleSaved(eventId);
    setSaved(next);
    trackSave(eventId, next);
  }

  const dim = size === "sm" ? "h-9 w-9 text-lg" : "h-11 w-11 text-xl";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={mounted ? saved : undefined}
      aria-label={saved ? "Remove from saved" : "Save event"}
      className={`${dim} shrink-0 grid place-items-center rounded-full border transition-colors ${
        saved
          ? "border-rose-400 bg-rose-500/15 text-rose-400"
          : "border-white/15 bg-white/5 text-white/60 hover:text-white hover:border-white/30"
      }`}
    >
      <span aria-hidden>{mounted && saved ? "♥" : "♡"}</span>
    </button>
  );
}
