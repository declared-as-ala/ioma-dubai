"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { FOUNDER_IMAGES, FOUNDER_VIDEO } from "@/content/founder";

/**
 * The official founder film, self-hosted. It is in the server HTML with a poster so it is on screen from the first
 * paint, plays muted on a loop, and has a visible pause/play control (WCAG 2.2.2). Reduced-motion visitors get the
 * poster and can still press play.
 */
export function FounderHeroVideo({
  pauseLabel,
  playLabel,
  soundOnLabel,
  soundOffLabel,
}: {
  pauseLabel: string;
  playLabel: string;
  soundOnLabel: string;
  soundOffLabel: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      setPlaying(false);
      return;
    }
    void v.play().catch(() => setPlaying(false));
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  // Browsers only allow sound after a user gesture, so the film starts muted and this button turns the sound on and off.
  const toggleSound = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && v.paused) {
      void v.play();
      setPlaying(true);
    }
  };

  return (
    <>
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={FOUNDER_IMAGES.poster}
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0 size-full select-none object-cover"
      >
        <source src={FOUNDER_VIDEO.mobile} type="video/mp4" media="(max-width: 767px)" />
        <source src={FOUNDER_VIDEO.desktop} type="video/mp4" />
      </video>
      <div className="absolute bottom-6 end-4 z-20 flex items-center gap-3 md:end-8">
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? soundOnLabel : soundOffLabel}
          aria-pressed={!muted}
          className="grid size-11 place-items-center rounded-full border border-white/40 bg-black/35 text-white backdrop-blur-sm transition-[background-color,color,transform] duration-200 ease-[var(--ease-out-strong)] hover:bg-white hover:text-sf-charcoal active:scale-95"
        >
          {muted ? (
            <VolumeX className="size-4" aria-hidden />
          ) : (
            <Volume2 className="size-4" aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? pauseLabel : playLabel}
          className="grid size-11 place-items-center rounded-full border border-white/40 bg-black/35 text-white backdrop-blur-sm transition-[background-color,color,transform] duration-200 ease-[var(--ease-out-strong)] hover:bg-white hover:text-sf-charcoal active:scale-95"
        >
          {playing ? (
            <Pause className="size-4" aria-hidden />
          ) : (
            <Play
              className="size-4 translate-x-px rtl:-translate-x-px rtl:-scale-x-100"
              aria-hidden
            />
          )}
        </button>
      </div>
    </>
  );
}
