"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { useLocale } from "next-intl";

import type { ProductMediaImage } from "@ioma/types";
export type { ProductMediaImage } from "@ioma/types";
type Props = Omit<ImageProps, "src"> & {
  src?: ImageProps["src"] | null;
  media?: ProductMediaImage | null;
  variant?: "main" | "card" | "thumbnail";
};
export function ProductImage({
  src,
  media,
  variant = "card",
  alt,
  className = "",
  ...props
}: Props) {
  const locale = useLocale() as "en" | "fr" | "ar";
  const resolved = media
    ? (variant === "thumbnail"
        ? media.thumbnailUrl
        : variant === "card"
          ? media.cardUrl
          : media.url) || media.url
    : typeof src === "string" && src.startsWith("/api/media/products/")
      ? src.replace(/\/(main|card|thumbnail)$/, `/${variant}`)
      : src;
  const [failed, setFailed] = useState<unknown>(null);
  if (!resolved || failed === resolved)
    return (
      <span
        role="img"
        aria-label={alt}
        className={`${props.fill ? "absolute inset-0" : "inline-flex"} flex items-center justify-center bg-neutral-100 p-2 text-center text-[10px] text-neutral-500 ${className}`}
        style={props.fill ? undefined : { width: props.width, height: props.height }}
      >
        {locale === "ar" ? "لا توجد صورة" : locale === "fr" ? "Aucune image" : "No image"}
      </span>
    );
  return (
    <Image
      {...props}
      src={resolved}
      alt={media?.alt[locale] || alt}
      className={className}
      onError={() => setFailed(resolved)}
    />
  );
}
