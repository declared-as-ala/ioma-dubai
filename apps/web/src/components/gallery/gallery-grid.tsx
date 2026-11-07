"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  src: string;
  w: number;
  h: number;
  alt: string;
  alpha?: boolean;
}

/**
 * Responsive masonry of images with a keyboard-friendly viewer (native <dialog>: Esc closes, focus is
 * trapped, arrow keys browse). Images are lazy-loaded with their real size reserved to avoid layout shift.
 */
export function GalleryGrid({
  images,
  columns = "columns-2 md:columns-3 lg:columns-4",
  tone = "bg-muted",
  fit = "cover",
  labels = {
    close: "Close",
    prev: "Previous image",
    next: "Next image",
    open: "Open image",
  },
}: {
  images: GalleryImage[];
  columns?: string;
  tone?: string;
  fit?: "cover" | "contain";
  labels?: { close: string; prev: string; next: string; open: string };
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const count = images.length;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (index !== null && !d.open) d.showModal();
    if (index === null && d.open) d.close();
  }, [index]);

  const go = (d: number) => setIndex((i) => (i === null ? i : (i + d + count) % count));
  const current = index !== null ? images[index] : null;

  return (
    <>
      <ul className={cn("gap-3 [column-fill:_balance] md:gap-4", columns)}>
        {images.map((img, i) => (
          <li key={img.src} className="mb-3 break-inside-avoid md:mb-4">
            <button
              type="button"
              aria-label={`${labels.open}: ${img.alt}`}
              onClick={(e) => {
                opener.current = e.currentTarget;
                setIndex(i);
              }}
              className={cn(
                "group block w-full overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                tone,
              )}
            >
              <img
                src={img.src}
                alt={img.alt}
                width={img.w}
                height={img.h}
                loading="lazy"
                decoding="async"
                className={cn(
                  "h-auto w-full transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none",
                  fit === "contain" && "object-contain p-3",
                )}
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => {
          setIndex(null);
          opener.current?.focus();
        }}
        onClick={(e) => e.target === e.currentTarget && setIndex(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/92 p-0 text-white backdrop:bg-black/80"
        aria-label={current?.alt}
      >
        {current && (
          <div
            className="relative grid h-full place-items-center p-4 md:p-10"
            onClick={(e) => e.target === e.currentTarget && setIndex(null)}
          >
            <img
              src={current.src}
              alt={current.alt}
              className={cn(
                "max-h-full max-w-full rounded-md object-contain",
                current.alpha && "bg-white p-6",
              )}
            />
            <button
              type="button"
              onClick={() => setIndex(null)}
              aria-label={labels.close}
              className="absolute end-4 top-4 grid size-11 place-items-center rounded-full bg-white/15 hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-white"
            >
              <X className="size-5" aria-hidden />
            </button>
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label={labels.prev}
                  className="absolute start-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-white"
                >
                  <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label={labels.next}
                  className="absolute end-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-white"
                >
                  <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
                </button>
                <p
                  className="absolute bottom-4 start-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs tabular-nums"
                  dir="ltr"
                >
                  {(index ?? 0) + 1} / {count}
                </p>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
