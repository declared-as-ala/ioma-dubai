"use client";

import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

// Route content reveal. This is deliberately a CSS animation (see `.ioma-page-enter`
// in globals.css) rather than a JS-driven one: the server-rendered page is visible as
// soon as the stylesheet loads, so a slow or failed hydration can never leave the page
// body invisible under the header. Reduced motion disables the animation entirely.
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="ioma-page-enter w-full flex-1">
      {children}
    </div>
  );
}
