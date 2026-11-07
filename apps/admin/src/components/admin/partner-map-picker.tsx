"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin, Search } from "lucide-react";
import type { Map as LMap, Marker } from "leaflet";

export interface Pin {
  lat: number;
  lng: number;
}
export interface PlaceInfo {
  address?: string;
  city?: string;
  emirate?: string;
}

const DUBAI: Pin = { lat: 25.2048, lng: 55.2708 };
const EMIRATES: Record<string, string> = {
  dubai: "Dubai",
  "abu dhabi": "Abu Dhabi",
  sharjah: "Sharjah",
  ajman: "Ajman",
  "umm al quwain": "Umm Al Quwain",
  "umm al-quwain": "Umm Al Quwain",
  "ras al khaimah": "Ras Al Khaimah",
  "ras al-khaimah": "Ras Al Khaimah",
  fujairah: "Fujairah",
};

interface Hit {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

function placeFrom(hit: {
  display_name: string;
  address?: Record<string, string>;
}): PlaceInfo {
  const a = hit.address ?? {};
  const state = (a.state ?? a.region ?? "").replace(/ Emirate$/i, "").toLowerCase();
  return {
    address: hit.display_name,
    city: a.city ?? a.town ?? a.suburb ?? a.city_district ?? a.village ?? "",
    emirate: EMIRATES[state] ?? "",
  };
}

/**
 * Pick a location: search a place, click the map, or drag the pin. Tiles and search are
 * OpenStreetMap (no API key); the coordinates stay editable in the form fields.
 */
export function PartnerMapPicker({
  value,
  onChange,
  onPlace,
  disabled,
  height = 340,
}: {
  value: Pin | null;
  onChange: (pin: Pin) => void;
  /** Called with address details when a search result is chosen or "Fill address from pin" is used. */
  onPlace?: (place: PlaceInfo) => void;
  disabled?: boolean;
  height?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const latest = useRef({ onChange, disabled });
  latest.current = { onChange, disabled };
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState<"search" | "reverse" | "locate" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const place = (pin: Pin, flyTo = true) => {
    const L = leaflet.current;
    const m = map.current;
    if (!L || !m) return;
    if (!marker.current) {
      const icon = L.divIcon({
        className: "ioma-picker-pin",
        html: `<span style="display:block;width:30px;height:30px;transform:translate(-50%,-100%);">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="#1a1a1a" stroke="#aa9feb" stroke-width="1.6"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6" fill="#fff" stroke="none"/></svg></span>`,
        iconSize: [0, 0],
      });
      marker.current = L.marker([pin.lat, pin.lng], {
        icon,
        draggable: !latest.current.disabled,
      }).addTo(m);
      marker.current.on("dragend", () => {
        const p = marker.current!.getLatLng();
        latest.current.onChange({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) });
      });
    } else marker.current.setLatLng([pin.lat, pin.lng]);
    if (flyTo) m.flyTo([pin.lat, pin.lng], Math.max(m.getZoom(), 15), { duration: 0.6 });
  };

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !host.current || map.current) return;
      leaflet.current = L as unknown as typeof import("leaflet");
      const start = value ?? DUBAI;
      const m = L.map(host.current, {
        center: [start.lat, start.lng],
        zoom: value ? 15 : 10,
        scrollWheelZoom: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(m);
      m.on("click", (e) => {
        if (latest.current.disabled) return;
        latest.current.onChange({
          lat: +e.latlng.lat.toFixed(6),
          lng: +e.latlng.lng.toFixed(6),
        });
      });
      map.current = m;
      if (value) place(value, false);
      setTimeout(() => m.invalidateSize(), 150);
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  // Keep the pin in sync with the lat/lng fields.
  useEffect(() => {
    if (value && Number.isFinite(value.lat) && Number.isFinite(value.lng)) {
      const cur = marker.current?.getLatLng();
      if (
        !cur ||
        Math.abs(cur.lat - value.lat) > 1e-6 ||
        Math.abs(cur.lng - value.lng) > 1e-6
      )
        place(value);
    }
  }, [value?.lat, value?.lng]);

  const search = async () => {
    const q = query.trim();
    if (q.length < 3) return;
    setBusy("search");
    setNote(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=ae&q=${encodeURIComponent(q)}`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = (await res.json()) as Hit[];
      setHits(data);
      if (!data.length)
        setNote("No place found. Try a landmark, street or area name, or click the map.");
    } catch {
      setNote("Search is unavailable right now. Click the map to place the pin instead.");
    } finally {
      setBusy(null);
    }
  };

  const choose = (hit: Hit) => {
    const pin = { lat: +Number(hit.lat).toFixed(6), lng: +Number(hit.lon).toFixed(6) };
    onChange(pin);
    onPlace?.(placeFrom(hit));
    setHits([]);
    setQuery(hit.display_name.split(",").slice(0, 2).join(","));
  };

  const fillFromPin = async () => {
    if (!value) return;
    setBusy("reverse");
    setNote(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${value.lat}&lon=${value.lng}`,
        { headers: { "Accept-Language": "en" } },
      );
      const hit = (await res.json()) as Hit;
      if (hit?.display_name) {
        onPlace?.(placeFrom(hit));
        setNote(
          "Address, city and emirate filled from the pin. Review them before saving.",
        );
      } else setNote("No address found for this point.");
    } catch {
      setNote("Could not look up the address. Fill it in manually.");
    } finally {
      setBusy(null);
    }
  };

  const locate = () => {
    if (!navigator.geolocation) return setNote("Your browser cannot share its location.");
    setBusy("locate");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        onChange({
          lat: +p.coords.latitude.toFixed(6),
          lng: +p.coords.longitude.toFixed(6),
        });
        setBusy(null);
      },
      () => {
        setNote("Location permission was denied.");
        setBusy(null);
      },
      { timeout: 8000 },
    );
  };

  return (
    <div className="space-y-2">
      {!disabled && (
        <div className="relative">
          <div className="flex flex-wrap gap-2">
            <form
              className="pl-search min-w-[220px] flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                void search();
              }}
            >
              <Search aria-hidden />
              <input
                className="pl-input"
                aria-label="Search a place"
                placeholder="Search a place, mall, street or area in the UAE"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>
            <button
              type="button"
              className="pl-btn"
              disabled={busy === "search" || query.trim().length < 3}
              onClick={() => void search()}
            >
              {busy === "search" ? "Searching…" : "Search"}
            </button>
            <button
              type="button"
              className="pl-btn"
              disabled={busy === "locate"}
              onClick={locate}
              title="Use my current location"
            >
              <Crosshair /> My location
            </button>
            <button
              type="button"
              className="pl-btn"
              disabled={!value || busy === "reverse"}
              onClick={() => void fillFromPin()}
            >
              <MapPin /> {busy === "reverse" ? "Looking up…" : "Fill address from pin"}
            </button>
          </div>
          {hits.length > 0 && (
            <ul
              role="listbox"
              aria-label="Search results"
              className="absolute inset-x-0 top-full z-[1000] mt-1 max-h-60 overflow-auto rounded-lg border border-[var(--pl-border)] bg-white shadow-lg"
            >
              {hits.map((hit) => (
                <li key={hit.place_id} role="option" aria-selected="false">
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-start text-[13px] hover:bg-[var(--pl-bg)]"
                    onClick={() => choose(hit)}
                  >
                    {hit.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="relative overflow-hidden rounded-lg border border-[var(--pl-border)]">
        <div
          ref={host}
          style={{ height }}
          className="w-full bg-[var(--pl-bg)]"
          role="application"
          aria-label="Map: click to place the pin"
        />
        {!value && !disabled && (
          <p className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-fit rounded-md bg-white/95 px-3 py-1.5 text-xs shadow">
            Click the map or search to drop the pin
          </p>
        )}
      </div>
      {note && (
        <p className="pl-help" role="status">
          {note}
        </p>
      )}
    </div>
  );
}
