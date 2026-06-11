"use client";

import posthog from "posthog-js";

// Thin PostHog wrapper. Analytics is the whole point of the MVP — we measure
// engagement (visits, saves) and outbound clicks (directions / venue links).
// If no key is configured, every call is a safe no-op so local dev stays quiet.

let initialized = false;

export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return; // no-op without a key (local dev / not yet configured)
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: false, // we capture manually on route change
    capture_pageleave: true,
    person_profiles: "always",
  });
  initialized = true;
}

export function capturePageview(url: string): void {
  if (!initialized) return;
  posthog.capture("pageview", { $current_url: url });
}

export function trackSave(eventId: string, saved: boolean): void {
  if (!initialized) return;
  posthog.capture("event_save", { event_id: eventId, saved });
}

export type OutboundKind = "directions" | "venue_site" | "instagram" | "tickets";

export function trackOutbound(kind: OutboundKind, eventId: string, href: string): void {
  if (!initialized) return;
  posthog.capture("outbound_click", { kind, event_id: eventId, href });
}
