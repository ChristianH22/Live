import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import AnalyticsProvider from "@/components/AnalyticsProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://live.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Live — informal live music in the East Village & LES",
  description:
    "Discover tonight's informal live music — jazz, open mics, bar bands and more — across the East Village and Lower East Side.",
  applicationName: "Live",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Live" },
  openGraph: {
    title: "Live — live music near you tonight",
    description:
      "The informal live-music scene of the East Village & Lower East Side, in one place.",
    type: "website",
    url: SITE_URL,
    siteName: "Live",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live — live music near you tonight",
    description:
      "The informal live-music scene of the East Village & Lower East Side, in one place.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AnalyticsProvider>
            <div className="mx-auto flex min-h-dvh max-w-md flex-col">
              <header className="sticky top-0 z-10 border-b border-white/10 bg-[var(--background)]/85 backdrop-blur">
                <div className="flex items-center justify-between px-4 py-3">
                  <Link href="/" className="text-lg font-bold tracking-tight">
                    Live<span className="text-rose-400">.</span>
                  </Link>
                  <nav className="flex items-center gap-1 text-sm">
                    <Link
                      href="/"
                      className="rounded-full px-3 py-1.5 text-white/70 hover:text-white"
                    >
                      Discover
                    </Link>
                    <Link
                      href="/saved"
                      className="rounded-full px-3 py-1.5 text-white/70 hover:text-white"
                    >
                      Saved
                    </Link>
                  </nav>
                </div>
              </header>

              <main className="flex-1 px-4 py-5">{children}</main>

              <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/35">
                East Village · Lower East Side — community live-music guide
              </footer>
            </div>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
