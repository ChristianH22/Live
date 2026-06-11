"use client";

// Anonymous "save" persistence via localStorage. No accounts in Phase 1.
// A custom window event lets multiple components stay in sync without a store.

const KEY = "live:saved-event-ids";
const CHANGED_EVENT = "live:saves-changed";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function getSavedIds(): string[] {
  return read();
}

export function isSaved(id: string): boolean {
  return read().includes(id);
}

/** Toggle a saved event. Returns the new saved state (true = now saved). */
export function toggleSaved(id: string): boolean {
  const ids = read();
  const idx = ids.indexOf(id);
  if (idx >= 0) {
    ids.splice(idx, 1);
    write(ids);
    return false;
  }
  ids.push(id);
  write(ids);
  return true;
}

/** Subscribe to changes (same-tab via custom event, cross-tab via storage). */
export function subscribeSaves(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(CHANGED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
