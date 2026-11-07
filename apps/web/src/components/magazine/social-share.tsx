"use client";

import { useState } from "react";
import { Link2, Check, Share2 } from "lucide-react";

interface SocialShareProps {
  title: string;
  url: string;
  locale: string;
}

export function SocialShare({ title, url, locale }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${url}`
      : `https://ioma-paris.ae${url}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  }

  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      label: "WhatsApp",
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      label: "X (Twitter)",
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      label: "LinkedIn",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 py-6 border-y border-neutral-200/80 dark:border-neutral-800">
      <span className="flex items-center gap-2 text-xs font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
        <Share2 className="h-3.5 w-3.5" />
        {locale === "fr" ? "Partager :" : locale === "ar" ? "مشاركة :" : "Share :"}
      </span>

      <div className="flex items-center gap-2">
        {shareLinks.map((item) => (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-full border border-neutral-200 bg-white px-3.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-200 dark:hover:text-white"
          >
            {item.name}
          </a>
        ))}

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-200 dark:hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-600">
                {locale === "fr" ? "Copié !" : locale === "ar" ? "تم النسخ !" : "Copied!"}
              </span>
            </>
          ) : (
            <>
              <Link2 className="h-3.5 w-3.5" />
              <span>
                {locale === "fr"
                  ? "Copier le lien"
                  : locale === "ar"
                    ? "نسخ الرابط"
                    : "Copy link"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
