"use client";

import { Crosshair } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const INITIAL: [number, number] = [-6.2088, 106.8456];

export function LocationPicker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").CircleMarker | null>(null);
  const [point, setPoint] = useState(INITIAL);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      const map = L.map(containerRef.current).setView(INITIAL, 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      const marker = L.circleMarker(INITIAL, {
        radius: 9,
        color: "#ffffff",
        weight: 3,
        fillColor: "#2563eb",
        fillOpacity: 1,
      }).addTo(map);
      map.on("click", ({ latlng }) => {
        const next: [number, number] = [latlng.lat, latlng.lng];
        marker.setLatLng(next);
        setPoint(next);
      });
      mapRef.current = map;
      markerRef.current = marker;
    }
    initialize();
    return () => {
      cancelled = true;
      const map = mapRef.current;
      map?.stop();
      map?.off();
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      const next: [number, number] = [coords.latitude, coords.longitude];
      setPoint(next);
      markerRef.current?.setLatLng(next);
      mapRef.current?.setView(next, 16, { animate: false });
    });
  }

  return (
    <div>
      <div ref={containerRef} className="h-72 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Klik peta untuk memindahkan pin.</p>
        <Button type="button" variant="secondary" size="sm" onClick={useMyLocation}>
          <Crosshair size={17} /> Gunakan lokasi saya
        </Button>
      </div>
      <input type="hidden" name="latitude" value={point[0]} />
      <input type="hidden" name="longitude" value={point[1]} />
    </div>
  );
}
