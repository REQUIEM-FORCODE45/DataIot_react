import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

interface MapControllerProps {
  targetCoords: [number, number] | null;
  selectedPlaca: string | null;
}

const STILL_THRESHOLD_M = 150;

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function MapController({ targetCoords, selectedPlaca }: MapControllerProps) {
  const map = useMap();
  const prevPlacaRef = useRef<string | null>(null);
  const lastTargetRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!targetCoords) return;

    const placaChanged = selectedPlaca !== prevPlacaRef.current;
    prevPlacaRef.current = selectedPlaca;

    if (!placaChanged && lastTargetRef.current) {
      const dist = haversineMeters(lastTargetRef.current, targetCoords);
      if (dist < STILL_THRESHOLD_M) return;
    }
    lastTargetRef.current = targetCoords;

    map.flyTo(targetCoords, Math.max(map.getZoom(), 15), { duration: 1 });
  }, [map, targetCoords, selectedPlaca]);

  return null;
}
