"use client";

import { trackOutbound, type OutboundKind } from "@/lib/analytics";

export default function OutboundLink({
  href,
  kind,
  eventId,
  className,
  children,
}: {
  href: string;
  kind: OutboundKind;
  eventId: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackOutbound(kind, eventId, href)}
      className={className}
    >
      {children}
    </a>
  );
}
