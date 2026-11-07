"use client";

import type { ReactNode } from "react";
import { useConsent, type ConsentCategory } from "@/lib/consent";

/** Renders children (an analytics widget, a marketing pixel component…) only while that category is consented to. */
export function ConsentGate({
  category,
  children,
}: {
  category: ConsentCategory;
  children: ReactNode;
}) {
  const c = useConsent();
  return c.ready && c[category] ? <>{children}</> : null;
}
