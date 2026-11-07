"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { MaskText, StaggerGrid } from "@/components/motion/cine";
import { INSTAGRAM_POSTS } from "@/content/instagram";

// Latest real posts of @ioma.paris (see content/instagram.ts); each tile opens its own post.
const PROFILE = "https://www.instagram.com/ioma.paris/";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InstagramBand() {
  const loc = useLocale() === "ar" ? "ar" : "en";
  const ar = loc === "ar";
  return (
    <section aria-label="Instagram" className="border-t border-border py-16 md:py-20">
      <div className="mx-auto max-w-[1440px] px-4 text-center md:px-8">
        <MaskText
          as="h2"
          className="font-display text-[clamp(1.5rem,2.6vw,2.2rem)] font-medium uppercase tracking-[0.06em] text-foreground rtl:tracking-normal"
          text={ar ? "تابعونا على إنستغرام" : "Follow us on Instagram"}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          {ar ? "وعلى شبكاتنا الأخرى " : "and on our other networks "}
          <a
            href={PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sf-mauve underline-offset-4 hover:underline"
            dir="ltr"
          >
            @ioma.paris
            <span className="sr-only">
              {" "}
              ({ar ? "يفتح في نافذة جديدة" : "opens in a new tab"})
            </span>
          </a>
        </p>

        <StaggerGrid
          revision="instagram"
          className="mt-9 grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-5"
        >
          {INSTAGRAM_POSTS.map((post, i) => (
            <a
              key={post.href}
              href={post.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${post.caption} — Instagram (${post.date})`}
              className={`group relative block aspect-square overflow-hidden rounded-xl bg-muted ${i === 4 ? "max-lg:hidden" : ""}`}
            >
              <Image
                src={post.image}
                alt={post.caption}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-strong)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-sf-mauve/0 opacity-0 transition-[opacity,background-color] duration-300 [@media(hover:hover)]:group-hover:bg-sf-mauve/35 [@media(hover:hover)]:group-hover:opacity-100">
                <InstagramIcon className="size-8 text-white" />
              </span>
              <span
                aria-hidden
                className="absolute end-3 top-3 text-white drop-shadow [@media(hover:hover)]:group-hover:opacity-0"
              >
                {post.kind === "video" ? (
                  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
                  </svg>
                ) : post.kind === "album" ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  >
                    <rect x="8" y="8" width="12" height="12" rx="2" />
                    <path d="M16 5H6a1 1 0 0 0-1 1v10" strokeLinecap="round" />
                  </svg>
                ) : (
                  <InstagramIcon className="size-5" />
                )}
              </span>
            </a>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
