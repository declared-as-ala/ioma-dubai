"use client";

import { useEffect, useRef } from "react";
import type { PartnerListItem } from "@ioma/types";

interface PartnerLocatorMapProps {
  partners: PartnerListItem[];
  selectedPartner: PartnerListItem | null;
  onSelectPartner: (partner: PartnerListItem) => void;
  userLocation: { lat: number; lng: number } | null;
}

export function PartnerLocatorMap({
  partners,
  selectedPartner,
  onSelectPartner,
  userLocation,
}: PartnerLocatorMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Dynamic import of Leaflet (only on client side)
    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Center on Dubai by default
      const center: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [25.2048, 55.2708];

      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current!, {
          center,
          zoom: 11,
          scrollWheelZoom: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      // Clear old markers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      markersRef.current.forEach((m: any) => m.remove());
      markersRef.current = [];

      // Add markers for each partner
      partners.forEach((partner) => {
        if (!partner.coordinates) return;

        const isSelected = selectedPartner?.id === partner.id;

        const customPinIcon = L.divIcon({
          className: "custom-ioma-pin-container",
          html: `
            <div style="
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              transform: translate(-50%, -100%);
              cursor: pointer;
            ">
              <div style="
                width: 32px;
                height: 32px;
                background: ${isSelected ? "#000000" : "#1a1a1a"};
                border: 2px solid ${isSelected ? "#aa9feb" : "#ffffff"};
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s ease, background-color 0.2s ease;
              ">
                <div style="
                  width: 10px;
                  height: 10px;
                  background: ${isSelected ? "#aa9feb" : "#ffffff"};
                  border-radius: 50%;
                  transform: rotate(45deg);
                "></div>
              </div>
              <div style="
                margin-top: 4px;
                background: ${isSelected ? "#000000" : "#ffffff"};
                color: ${isSelected ? "#ffffff" : "#000000"};
                padding: 3px 10px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.04em;
                white-space: nowrap;
                box-shadow: 0 2px 10px rgba(0,0,0,0.18);
                border: 1px solid rgba(0,0,0,0.08);
              ">
                ${partner.name}
              </div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([partner.coordinates.lat, partner.coordinates.lng], {
          icon: customPinIcon,
        })
          .addTo(mapInstanceRef.current as L.Map)
          .bindPopup(
            `<div style="font-family: inherit; padding: 4px;">
              <p style="font-weight:600;font-size:14px;margin:0 0 4px;color:#000;">${partner.name}</p>
              <p style="font-size:12px;color:#666;margin:0 0 8px;">${partner.city} — ${partner.type.replace("_", " ")}</p>
              <a href="/partners/${partner.slug}" style="font-size:12px;color:#000;text-decoration:underline;font-weight:500;">View details & book &rarr;</a>
            </div>`,
          )
          .on("click", () => onSelectPartner(partner));

        markersRef.current.push(marker);
      });

      // Fit bounds if partners exist
      if (partners.length > 0) {
        const bounds = L.latLngBounds(
          partners
            .filter((p) => p.coordinates)
            .map((p) => [p.coordinates.lat, p.coordinates.lng] as [number, number]),
        );
        (mapInstanceRef.current as L.Map).fitBounds(bounds, { padding: [50, 50] });
      }
    };

    initMap();
  }, [partners, selectedPartner, onSelectPartner, userLocation]);

  // Update map center when user location changes
  useEffect(() => {
    if (userLocation && mapInstanceRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapInstanceRef.current as any).setView([userLocation.lat, userLocation.lng], 11);
    }
  }, [userLocation]);

  // Highlight selected partner
  useEffect(() => {
    if (!selectedPartner || !mapInstanceRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapInstanceRef.current as any).setView(
      [selectedPartner.coordinates.lat, selectedPartner.coordinates.lng],
      14,
    );
  }, [selectedPartner]);

  return <div ref={mapRef} className="h-full w-full" />;
}
