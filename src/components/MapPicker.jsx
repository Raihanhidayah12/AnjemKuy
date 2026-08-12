// ============================================================
// src/components/MapPicker.jsx
// Interactive map with:
// - Click to place pickup/destination markers
// - Route polyline between two points (OSRM)
// - Reverse geocoding via Nominatim
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (webpack issue with leaflet)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom colored markers
const createMarker = (color) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:36px;
      background:${color};
      border:3px solid #fff;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });

const MARKER_JEMPUT = createMarker("#ffc107");   // gold
const MARKER_TUJUAN = createMarker("#4ade80");   // green
const MALANG_CENTER = [-7.9797, 112.6304];

// Reverse geocode: coords → address string
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// Fetch driving route from OSRM
async function fetchRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;
    const route = data.routes[0];
    return {
      coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: (route.distance / 1000).toFixed(1),
      duration: Math.ceil(route.duration / 60),
    };
  } catch {
    return null;
  }
}

export default function MapPicker({ jemputCoord, tujuanCoord, onJemputChange, onTujuanChange, onRouteCalculated }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerJemputRef = useRef(null);
  const markerTujuanRef = useRef(null);
  const routeLayerRef = useRef(null);

  const [mode, setMode] = useState("jemput");
  const [localJemput, setLocalJemput] = useState(null);
  const [localTujuan, setLocalTujuan] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Init map
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: MALANG_CENTER,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync jemputCoord prop → place marker on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !jemputCoord?.lat) return;

    if (markerJemputRef.current) map.removeLayer(markerJemputRef.current);

    const marker = L.marker([jemputCoord.lat, jemputCoord.lng], { icon: MARKER_JEMPUT, draggable: true })
      .addTo(map)
      .bindPopup("<b style='font-family:Inter,sans-serif'>Titik Jemput</b>");

    marker.on("dragend", async (ev) => {
      const pos = ev.target.getLatLng();
      const addr = await reverseGeocode(pos.lat, pos.lng);
      const loc = { lat: pos.lat, lng: pos.lng, address: addr };
      setLocalJemput(loc);
      onJemputChange?.(loc);
    });

    markerJemputRef.current = marker;
    setLocalJemput(jemputCoord);

    // Pan map to jemput location
    map.flyTo([jemputCoord.lat, jemputCoord.lng], 15, { duration: 1 });
  }, [jemputCoord]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync tujuanCoord prop → place marker on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tujuanCoord?.lat) return;

    if (markerTujuanRef.current) map.removeLayer(markerTujuanRef.current);

    const marker = L.marker([tujuanCoord.lat, tujuanCoord.lng], { icon: MARKER_TUJUAN, draggable: true })
      .addTo(map)
      .bindPopup("<b style='font-family:Inter,sans-serif'>Titik Tujuan</b>");

    marker.on("dragend", async (ev) => {
      const pos = ev.target.getLatLng();
      const addr = await reverseGeocode(pos.lat, pos.lng);
      const loc = { lat: pos.lat, lng: pos.lng, address: addr };
      setLocalTujuan(loc);
      onTujuanChange?.(loc);
    });

    markerTujuanRef.current = marker;
    setLocalTujuan(tujuanCoord);

    // Pan map to tujuan location for visual feedback
    map.flyTo([tujuanCoord.lat, tujuanCoord.lng], 15, { duration: 1 });
  }, [tujuanCoord]); // eslint-disable-line react-hooks/exhaustive-deps

  // Draw route callback
  const drawRoute = useCallback(async (from, to) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setLoading(true);

    // Remove old route
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    const route = await fetchRoute(from, to);
    
    // In React 18 StrictMode, the component might unmount while fetching,
    // destroying the map. If the map instance has changed or was destroyed, abort.
    if (mapInstanceRef.current !== map) return;

    if (route) {
      // Pastikan hapus rute lama lagi (jika ada rute lain yang tergambar selama kita menunggu fetchRoute)
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
      }

      const polyline = L.polyline(route.coords, {
        color: "#ffc107",
        weight: 4,
        opacity: 0.85,
        dashArray: null,
      }).addTo(map);

      routeLayerRef.current = polyline;

      // Fit map to route bounds
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

      setRouteInfo(route);
      onRouteCalculated?.({
        jarakTujuan: parseFloat(route.distance),
        totalDurasi: route.duration,
      });
    }

    setLoading(false);
  }, [onRouteCalculated]);

  // Draw route when both coords available (from props or local click)
  useEffect(() => {
    const from = jemputCoord || localJemput;
    const to = tujuanCoord || localTujuan;
    if (from?.lat && to?.lat) {
      drawRoute(from, to);
    }
  }, [jemputCoord, tujuanCoord, localJemput, localTujuan, drawRoute]);

  // Handle map click
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = async (e) => {
      const { lat, lng } = e.latlng;

      if (mode === "jemput") {
        if (markerJemputRef.current) map.removeLayer(markerJemputRef.current);

        const marker = L.marker([lat, lng], { icon: MARKER_JEMPUT, draggable: true })
          .addTo(map)
          .bindPopup("<b style='font-family:Inter,sans-serif'>Titik Jemput</b>")
          .openPopup();

        marker.on("dragend", async (ev) => {
          const pos = ev.target.getLatLng();
          const addr = await reverseGeocode(pos.lat, pos.lng);
          const loc = { lat: pos.lat, lng: pos.lng, address: addr };
          setLocalJemput(loc);
          onJemputChange?.(loc);
        });

        markerJemputRef.current = marker;

        const addr = await reverseGeocode(lat, lng);
        const loc = { lat, lng, address: addr };
        setLocalJemput(loc);
        onJemputChange?.(loc);

        setMode("tujuan");

      } else {
        if (markerTujuanRef.current) map.removeLayer(markerTujuanRef.current);

        const marker = L.marker([lat, lng], { icon: MARKER_TUJUAN, draggable: true })
          .addTo(map)
          .bindPopup("<b style='font-family:Inter,sans-serif'>Titik Tujuan</b>")
          .openPopup();

        marker.on("dragend", async (ev) => {
          const pos = ev.target.getLatLng();
          const addr = await reverseGeocode(pos.lat, pos.lng);
          const loc = { lat: pos.lat, lng: pos.lng, address: addr };
          setLocalTujuan(loc);
          onTujuanChange?.(loc);
        });

        markerTujuanRef.current = marker;

        const addr = await reverseGeocode(lat, lng);
        const loc = { lat, lng, address: addr };
        setLocalTujuan(loc);
        onTujuanChange?.(loc);
      }
    };

    map.on("click", handleClick);
    return () => map.off("click", handleClick);
  }, [mode, onJemputChange, onTujuanChange]);

  const btnBase = {
    flex: 1,
    padding: "0.6rem",
    borderRadius: "8px",
    border: "2px solid transparent",
    fontWeight: 600,
    fontSize: "0.82rem",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <button
          style={{
            ...btnBase,
            background: mode === "jemput" ? "rgba(255,193,7,0.15)" : "#13161a",
            borderColor: mode === "jemput" ? "#ffc107" : "#3a3f47",
            color: mode === "jemput" ? "#ffc107" : "#adb5bd",
          }}
          onClick={() => setMode("jemput")}
        >
          <span style={{ display: "inline-block", width: 10, height: 10, background: "#ffc107", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", marginRight: 6 }} />
          Tandai Titik Jemput
        </button>
        <button
          style={{
            ...btnBase,
            background: mode === "tujuan" ? "rgba(74,222,128,0.12)" : "#13161a",
            borderColor: mode === "tujuan" ? "#4ade80" : "#3a3f47",
            color: mode === "tujuan" ? "#4ade80" : "#adb5bd",
          }}
          onClick={() => setMode("tujuan")}
        >
          <span style={{ display: "inline-block", width: 10, height: 10, background: "#4ade80", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", marginRight: 6 }} />
          Tandai Titik Tujuan
        </button>
      </div>

      {/* Instruction */}
      <div style={{ fontSize: "0.78rem", color: "#6c757d", marginBottom: "0.6rem" }}>
        {mode === "jemput"
          ? "Klik pada peta untuk menandai lokasi jemput. Bisa digeser setelah ditandai."
          : "Klik pada peta untuk menandai lokasi tujuan. Bisa digeser setelah ditandai."}
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        style={{
          height: "320px",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #3a3f47",
          cursor: "crosshair",
        }}
      />

      {/* Route info */}
      {loading && (
        <div style={{ marginTop: "0.75rem", color: "#ffc107", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} />
          Menghitung rute...
        </div>
      )}

      {routeInfo && !loading && (
        <div style={{
          marginTop: "0.75rem",
          background: "linear-gradient(135deg,#1a2a0a,#1e2a10)",
          border: "1px solid #2d5016",
          borderRadius: "10px",
          padding: "0.75rem 1rem",
          display: "flex",
          gap: "1.5rem",
          flexWrap: "wrap",
        }}>
          <div>
            <div style={{ color: "#6c757d", fontSize: "0.72rem", textTransform: "uppercase" }}>Jarak Rute</div>
            <div style={{ color: "#4ade80", fontWeight: 700, fontSize: "1.05rem" }}>{routeInfo.distance} km</div>
          </div>
          <div>
            <div style={{ color: "#6c757d", fontSize: "0.72rem", textTransform: "uppercase" }}>Estimasi</div>
            <div style={{ color: "#ffc107", fontWeight: 700, fontSize: "1.05rem" }}>±{routeInfo.duration} menit</div>
          </div>
        </div>
      )}

      {/* Selected addresses */}
      {(jemputCoord || tujuanCoord) && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.78rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {jemputCoord && (
            <div style={{ color: "#adb5bd", display: "flex", gap: "0.4rem" }}>
              <span style={{ color: "#ffc107", fontWeight: 600, flexShrink: 0 }}>Jemput:</span>
              <span style={{ wordBreak: "break-word" }}>{jemputCoord.address}</span>
            </div>
          )}
          {tujuanCoord && (
            <div style={{ color: "#adb5bd", display: "flex", gap: "0.4rem" }}>
              <span style={{ color: "#4ade80", fontWeight: 600, flexShrink: 0 }}>Tujuan:</span>
              <span style={{ wordBreak: "break-word" }}>{tujuanCoord.address}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
