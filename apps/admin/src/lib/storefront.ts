"use client";

import { useLocale } from "next-intl";

const WEB_URL = (process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

/** Absolute URL into the storefront app (apps/web), e.g. storefront("/shop/my-slug"). */
export function useStorefrontUrl() {
  const locale = useLocale();
  return (path: string) =>
    `${WEB_URL}/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}
