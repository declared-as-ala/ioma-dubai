"use client";

import { CINE, gsap, useMotion } from "@/components/motion/cine";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { ArrowRight, Pause, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface CinematicHeroProps {
  onScrollClick?: () => void;
}

export function CinematicHero({ onScrollClick }: CinematicHeroProps) {
  const locale = useLocale();
  const ar = locale === "ar";
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Sync reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReducedMotion(mq.matches);
      if (mq.matches && videoRef.current) {
        videoRef.current.pause();
        setPlaying(false);
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Intersection observer: pause video when hero is scrolled out of viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          videoRef.current?.pause();
        } else if (playing && !reducedMotion) {
          videoRef.current?.play().catch(() => {});
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [playing, reducedMotion]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
  }, []);

  const handleScrollDown = useCallback(() => {
    if (onScrollClick) {
      onScrollClick();
      return;
    }
    const nextSection = document.getElementById("brand-story");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({
        top: window.innerHeight * 0.9,
        behavior: "smooth",
      });
    }
  }, [onScrollClick]);

  // Scroll-linked exit: the film slowly pushes in while the caption drifts up and fades (desktop, motion allowed).
  useMotion(sectionRef, ({ desktop }) => {
    if (!desktop) return;
    const root = sectionRef.current!;
    const st = {
      trigger: root,
      start: "top top",
      end: "bottom top",
      scrub: 0.6,
    } as const;
    gsap.to(root.querySelector("[data-hero=media]"), {
      scale: 1.12,
      yPercent: 6,
      ease: CINE.scrub,
      scrollTrigger: st,
    });
    gsap.to(root.querySelector("[data-hero=content]"), {
      yPercent: -22,
      autoAlpha: 0,
      ease: CINE.scrub,
      scrollTrigger: { ...st, end: "70% top" },
    });
  });

  return (
    <section
      ref={sectionRef}
      data-testid="cinematic-hero"
      aria-label="IOMA Paris Dubai"
      className="relative isolate flex h-[88svh] sm:h-[92svh] lg:h-[96svh] min-h-[580px] max-h-[1200px] w-full flex-col justify-between overflow-hidden bg-ioma-black text-white"
    >
      {/* Background Video & Fallback Poster */}
      <div data-hero="media" className="absolute inset-0 -z-10 will-change-transform">
        <Image
          src="/images/homepage/hero-video-poster.jpg"
          alt="IOMA Paris luxury skincare"
          fill
          priority
          sizes="100vw"
          className={cn(
            "object-cover transition-opacity duration-1000",
            videoLoaded ? "opacity-0 pointer-events-none" : "opacity-100",
          )}
        />
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster="/images/homepage/hero-video-poster.jpg"
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={() => setVideoLoaded(true)}
          className="absolute inset-0 size-full select-none object-cover"
        >
          <source
            src="/videos/hero/home-mobile.mp4"
            type="video/mp4"
            media="(max-width: 767px)"
          />
          <source src="/videos/hero/home-desktop.mp4" type="video/mp4" />
        </video>

        {/* Refined Luxury Vignette: subtle gradient keeping the central video luminous & unobstructed */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/35 pointer-events-none"
        />
      </div>

      {/* Top spacer (reserves breathing room under fixed header) */}
      <div className="pt-36 xl:pt-44" aria-hidden="true" />

      {/* Center: Unobstructed cinematic canvas */}
      <div className="flex-1" aria-hidden="true" />

      {/* Bottom Luxury Dock: Editorial Caption, Scroll Cue & Actions */}
      <div
        data-hero="content"
        className="hero-intro relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-8 sm:pb-10 md:px-8 lg:px-12"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          {/* Bottom-left: Minimal Editorial Caption */}
          <div className="max-w-md space-y-1.5 text-start">
            <p className="flex items-center gap-2.5 text-[0.68rem] uppercase tracking-[0.28em] font-medium text-white/80">
              <span className="h-px w-6 bg-white/50" aria-hidden="true" />
              <span>{ar ? "آيوما باريس — دبي" : "IOMA PARIS — DUBAI"}</span>
            </p>
            <h1 className="font-serif italic text-lg sm:text-xl lg:text-2xl font-normal tracking-wide text-white/95">
              {ar ? "فن العناية الشخصية بالبشرة." : "The art of personalised skincare."}
            </h1>
          </div>

          {/* Bottom-center: Discreet Scroll Indicator */}
          <div className="hidden md:flex flex-col items-center">
            <button
              type="button"
              onClick={handleScrollDown}
              aria-label={ar ? "انتقل إلى محتوى الصفحة" : "Scroll to content"}
              className="group flex flex-col items-center gap-2 text-white/60 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="text-[0.62rem] uppercase tracking-[0.26em] font-light text-white/70 group-hover:text-white transition-colors">
                {ar ? "اكتشف" : "Discover"}
              </span>
              <div className="relative h-8 w-px overflow-hidden bg-white/20">
                <span className="absolute top-0 left-0 h-3 w-full bg-white transition-transform duration-1000 ease-in-out motion-safe:animate-pulse" />
              </div>
            </button>
          </div>

          {/* Bottom-right: Refined Link & Video Control */}
          <div className="flex items-center justify-between sm:justify-end gap-5">
            <Link
              href="/about"
              data-testid="hero-discover-cta"
              className="group inline-flex items-center gap-2.5 border-b border-white/40 pb-1 text-xs uppercase tracking-[0.22em] font-medium text-white transition-all hover:border-white hover:text-white/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <span>{ar ? "اكتشف آيوما" : "Discover IOMA"}</span>
              <ArrowRight
                className="size-3.5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                aria-hidden="true"
              />
            </Link>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={
                playing
                  ? ar
                    ? "إيقاف الفيديو مؤقتاً"
                    : "Pause video"
                  : ar
                    ? "تشغيل الفيديو"
                    : "Play video"
              }
              className="grid size-9 shrink-0 place-items-center rounded-full border border-white/30 text-white/80 transition-all hover:border-white hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {playing ? (
                <Pause className="size-3.5" aria-hidden="true" />
              ) : (
                <Play className="size-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
