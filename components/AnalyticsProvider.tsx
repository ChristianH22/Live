"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { capturePageview, initAnalytics } from "@/lib/analytics";

// Uses only usePathname (not useSearchParams) so it does NOT force the app into
// client-side rendering. The app has no query-param-driven navigation, so
// pathname-based pageviews are sufficient.
export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || typeof window === "undefined") return;
    capturePageview(window.location.origin + pathname);
  }, [pathname]);

  return <>{children}</>;
}
