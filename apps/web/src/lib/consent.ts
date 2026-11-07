"use client";

import { useSyncExternalStore } from "react";

/**
 * Cookie-consent store. Necessary cookies are always on; analytics and marketing are off until the visitor opts in.
 * The record lives in the `ioma_consent` cookie (so the server and other tabs can read it) and is mirrored in
 * localStorage as a fallback. Anything optional (analytics tags, pixels) must go through `hasConsent` /
 * `<ConsentGate>` / `loadScriptWithConsent` so it never runs before, or against, the visitor's choice.
 */
export type ConsentCategory = "analytics" | "marketing";
export type ConsentRecord = {
  v: 1;
  decided: boolean;
  analytics: boolean;
  marketing: boolean;
  at?: string;
};

const KEY = "ioma_consent";
const EVENT = "ioma:consent-change";
const OPEN_EVENT = "ioma:consent-open";
const DEFAULT: ConsentRecord = {
  v: 1,
  decided: false,
  analytics: false,
  marketing: false,
};
const MAX_AGE_DAYS = 180;

let cache: ConsentRecord = DEFAULT;
let loaded = false;

function parse(raw: string | null | undefined): ConsentRecord | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(decodeURIComponent(raw)) as Partial<ConsentRecord>;
    if (
      o &&
      o.v === 1 &&
      typeof o.analytics === "boolean" &&
      typeof o.marketing === "boolean"
    ) {
      return {
        v: 1,
        decided: !!o.decided,
        analytics: o.analytics,
        marketing: o.marketing,
        at: o.at,
      };
    }
  } catch {
    /* corrupt record: treated as undecided */
  }
  return null;
}

function read(): ConsentRecord {
  if (typeof document === "undefined") return DEFAULT;
  const fromCookie = document.cookie.split("; ").find((c) => c.startsWith(`${KEY}=`));
  let rec = parse(fromCookie?.slice(KEY.length + 1));
  if (!rec) {
    try {
      rec = parse(window.localStorage.getItem(KEY));
    } catch {
      /* storage blocked */
    }
  }
  return rec ?? DEFAULT;
}

function load() {
  if (!loaded && typeof document !== "undefined") {
    cache = read();
    loaded = true;
  }
  return cache;
}

export function saveConsent(next: { analytics: boolean; marketing: boolean }) {
  const rec: ConsentRecord = {
    v: 1,
    decided: true,
    analytics: next.analytics,
    marketing: next.marketing,
    at: new Date().toISOString(),
  };
  const value = encodeURIComponent(JSON.stringify(rec));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${KEY}=${value}; Max-Age=${MAX_AGE_DAYS * 86400}; Path=/; SameSite=Lax${secure}`;
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    /* storage blocked */
  }
  // Withdrawing consent also stops optional scripts that were already loaded on a later page view.
  cache = rec;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: rec }));
}

export const acceptAll = () => saveConsent({ analytics: true, marketing: true });
export const rejectOptional = () => saveConsent({ analytics: false, marketing: false });

export function hasConsent(category: ConsentCategory): boolean {
  return load()[category] === true;
}

/** Subscribes to consent changes (returns an unsubscribe function). */
export function onConsentChange(cb: (rec: ConsentRecord) => void) {
  const handler = () => cb(load());
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

/** Opens the preferences dialog from anywhere (footer link, cookie page). */
export const openConsentSettings = () => window.dispatchEvent(new Event(OPEN_EVENT));
export const onOpenConsentSettings = (cb: () => void) => {
  window.addEventListener(OPEN_EVENT, cb);
  return () => window.removeEventListener(OPEN_EVENT, cb);
};

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/** Current record; `ready` is false during server render and hydration so nothing flashes. */
export function useConsent() {
  const rec = useSyncExternalStore(subscribe, load, () => DEFAULT);
  const ready = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  return { ...rec, ready };
}

/**
 * Loads an optional third-party script only while the category is consented to. Returns a cleanup that removes it
 * again when consent is withdrawn (the script tag is removed; already-run code cannot be undone, so the next page
 * load is clean).
 */
export function loadScriptWithConsent(
  category: ConsentCategory,
  src: string,
  attrs: Record<string, string> = {},
) {
  let el: HTMLScriptElement | null = null;
  const sync = () => {
    if (hasConsent(category) && !el) {
      el = document.createElement("script");
      el.src = src;
      el.async = true;
      Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
      document.head.appendChild(el);
    } else if (!hasConsent(category) && el) {
      el.remove();
      el = null;
    }
  };
  sync();
  const off = onConsentChange(sync);
  return () => {
    off();
    el?.remove();
  };
}
