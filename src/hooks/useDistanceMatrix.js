// ============================================================
// src/hooks/useDistanceMatrix.js
// Distance & duration calculation using OSRM (OpenStreetMap)
// FREE - no API key, no billing required
// ============================================================

import { useState, useCallback } from "react";

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

export default function useDistanceMatrix() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateDistance = useCallback(async (origin, destination) => {
    if (!origin?.lat || !destination?.lat) return null;

    setLoading(true);
    setError(null);

    try {
      // OSRM expects: lng,lat;lng,lat
      const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
      const url = `${OSRM_URL}/${coords}?overview=false&annotations=false`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`OSRM error: ${res.status}`);

      const data = await res.json();

      if (data.code !== "Ok" || !data.routes?.length) {
        throw new Error("No route found");
      }

      const route = data.routes[0];
      const distanceKm = (route.distance / 1000).toFixed(1);  // meters → km
      const durationMin = Math.ceil(route.duration / 60);       // seconds → minutes

      setLoading(false);
      return {
        jarakJemput: 0,
        jarakTujuan: parseFloat(distanceKm),
        durasiTujuan: durationMin,
        totalDurasi: durationMin,
      };
    } catch (err) {
      console.error("OSRM distance error:", err);
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  // Calculate pickup distance separately (rider → pickup point)
  const calculatePickupDistance = useCallback(async (riderLocation, pickupLocation) => {
    if (!riderLocation?.lat || !pickupLocation?.lat) return null;

    try {
      const coords = `${riderLocation.lng},${riderLocation.lat};${pickupLocation.lng},${pickupLocation.lat}`;
      const url = `${OSRM_URL}/${coords}?overview=false`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code !== "Ok" || !data.routes?.length) return null;

      const route = data.routes[0];
      return {
        jarakJemput: parseFloat((route.distance / 1000).toFixed(1)),
        durasiJemput: Math.ceil(route.duration / 60),
      };
    } catch {
      return null;
    }
  }, []);

  return { calculateDistance, calculatePickupDistance, loading, error };
}
