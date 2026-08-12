// ============================================================
// src/components/PlacesAutocomplete.jsx
// Location search using Mapbox (primary) + Nominatim (fallback)
// Mapbox: 100k free requests/month, superior accuracy for Indonesia
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from "react";

// Mapbox Public Token - Get from https://account.mapbox.com/access-tokens/
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const MAPBOX_SEARCH_URL = "https://api.mapbox.com/search/searchbox/v1/suggest";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Debounce helper
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  label,
  id,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState(false);
  const containerRef = useRef(null);

  // Kurangi debounce agar lebih responsif (250ms untuk Mapbox)
  const debouncedValue = useDebounce(value, 250);

  // Primary: Mapbox Search Box API + Fallback: Nominatim (OSM)
  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 3 || selected) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        // --- SANITASI INPUT ---
        let cleanQuery = debouncedValue.trim();

        // Hapus Google Plus Codes
        cleanQuery = cleanQuery.replace(/^[A-Z0-9]{4}\+[A-Z0-9]{2,}\s*/, '');

        // Hapus nomor rumah spesifik untuk API yang sensitive
        cleanQuery = cleanQuery.replace(/no\.?\s*[a-z0-9]+/gi, '');
        cleanQuery = cleanQuery.replace(/blok\s*[a-z0-9]+/gi, '');

        // Simplify copy-pasted addresses
        if (cleanQuery.includes(",")) {
          const parts = cleanQuery.split(",");
          if (parts.length > 2) {
            cleanQuery = parts[0].trim() + ", " + parts[1].trim();
          }
        }

        // 1. Try Mapbox Search Box API first (most accurate)
        const fetchMapbox = async () => {
          if (!MAPBOX_TOKEN || MAPBOX_TOKEN.includes("undefined")) {
            throw new Error("Mapbox token not configured");
          }

          let mapboxQuery = cleanQuery;
          if (!mapboxQuery.toLowerCase().includes("malang")) {
            mapboxQuery += ", Malang, Indonesia";
          }

          const params = new URLSearchParams({
            q: mapboxQuery,
            access_token: MAPBOX_TOKEN,
            session_token: `session_${Date.now()}`,
            limit: 6,
            country: "ID",
            proximity: "112.6304,-7.9797", // Malang center
            types: "address,poi,place",
            language: "id"
          });

          const res = await fetch(`${MAPBOX_SEARCH_URL}?${params}`);
          
          if (!res.ok) {
            throw new Error(`Mapbox API error: ${res.status}`);
          }

          const data = await res.json();
          
          return (data.suggestions || []).map(item => ({
            address: item.place_formatted || item.full_address || item.name,
            shortName: item.name || item.text || item.place_formatted?.split(",")[0] || "Unknown",
            lat: item.geometry?.coordinates?.[1] || 0,
            lng: item.geometry?.coordinates?.[0] || 0,
            placeId: item.mapbox_id || `mapbox_${Date.now()}_${Math.random()}`,
            type: item.feature_type || "place",
            source: "mapbox",
            confidence: item.match_code?.confidence || "high"
          }));
        };

        // 2. Fallback to Nominatim (OSM) - Free but less accurate
        const fetchNominatim = async () => {
          const params = new URLSearchParams({
            q: cleanQuery,
            format: "json",
            addressdetails: 1,
            limit: 4,
            countrycodes: "id",
            viewbox: "112.50,-8.05,112.70,-7.85", // Malang bounds
            bounded: 1,
            "accept-language": "id",
          });
          
          const res = await fetch(`${NOMINATIM_URL}?${params}`, { 
            headers: { "Accept-Language": "id" } 
          });
          
          const data = await res.json();
          
          return data.map(item => ({
            address: item.display_name,
            shortName: item.name || item.display_name.split(",")[0],
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            placeId: item.place_id,
            type: item.type,
            source: "nominatim",
            confidence: "medium"
          }));
        };

        let results = [];

        try {
          // Try Mapbox first
          const mapboxResults = await fetchMapbox();
          results = mapboxResults;
          console.log("✅ Using Mapbox results:", results.length);
        } catch (mapboxError) {
          console.warn("⚠️ Mapbox failed, using Nominatim fallback:", mapboxError.message);
          
          // Fallback to Nominatim
          try {
            const nominatimResults = await fetchNominatim();
            results = nominatimResults;
            console.log("✅ Using Nominatim fallback:", results.length);
          } catch (nominatimError) {
            console.error("❌ Both Mapbox and Nominatim failed:", nominatimError);
            results = [];
          }
        }

        // Remove duplicates based on similar names
        const unique = results.filter((v, i, a) =>
          a.findIndex(t => 
            t.shortName.toLowerCase().trim() === v.shortName.toLowerCase().trim()
          ) === i
        );

        if (unique.length > 0) {
          // Auto-select for long pasted addresses
          if (debouncedValue.includes(",") && debouncedValue.length > 25) {
            const item = unique[0];
            onPlaceSelect({
              address: debouncedValue, // Keep original pasted text
              name: "Lokasi Otomatis",
              lat: item.lat,
              lng: item.lng,
            });
            setSelected(true);
            setSuggestions([]);
            setShowDropdown(false);
            setLoading(false);
            return;
          }

          setSuggestions(unique);
          setShowDropdown(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Search error:", err);
        setSuggestions([]);
      }
      setLoading(false);
    };

    fetchSuggestions();
  }, [debouncedValue, selected, onPlaceSelect]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = useCallback(
    (item) => {
      onChange(item.shortName + ", " + item.address.split(",").slice(1, 3).join(",").trim());
      onPlaceSelect({
        address: item.address,
        name: item.shortName,
        lat: item.lat,
        lng: item.lng,
      });
      setSelected(true);
      setSuggestions([]);
      setShowDropdown(false);
    },
    [onChange, onPlaceSelect]
  );

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setSelected(false);
    if (e.target.value.length < 3) setShowDropdown(false);
  };

  const getTypeIcon = (type) => {
    const icons = {
      university: "🎓", school: "🏫", college: "🎓",
      hospital: "🏥", clinic: "🏥", pharmacy: "💊",
      restaurant: "🍽️", cafe: "☕", fast_food: "🍔",
      mall: "🏬", supermarket: "🛒", convenience: "🏪",
      bus_station: "🚌", station: "🚉", stop_position: "🚏",
      mosque: "🕌", church: "⛪", place_of_worship: "🛕",
      hotel: "🏨", guest_house: "🏠",
      park: "🌳", stadium: "🏟️",
    };
    return icons[type] || "📍";
  };

  const inputStyle = {
    background: "#13161a",
    border: focused ? "1px solid #ffc107" : "1px solid #3a3f47",
    borderRadius: showDropdown ? "10px 10px 0 0" : "10px",
    color: "#e0e0e0",
    padding: "0.65rem 2.5rem 0.65rem 0.9rem",
    fontSize: "0.9rem",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: focused ? "0 0 0 3px rgba(255,193,7,0.15)" : "none",
    fontFamily: "'Inter', sans-serif",
    boxSizing: "border-box",
  };

  const labelStyle = {
    color: "#adb5bd",
    fontSize: "0.82rem",
    fontWeight: 600,
    marginBottom: "0.4rem",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {label && (
        <label style={labelStyle} htmlFor={id}>
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            setFocused(true);
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          onBlur={() => setFocused(false)}
          style={inputStyle}
          autoComplete="off"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
        />

        {/* Right icon */}
        <div style={{
          position: "absolute", right: "0.75rem", top: "50%",
          transform: "translateY(-50%)", pointerEvents: "none",
          display: "flex", alignItems: "center",
        }}>
          {loading
            ? <span className="spinner-border spinner-border-sm" style={{ color: "#ffc107", width: "14px", height: "14px", borderWidth: "2px" }} />
            : <i className="bi bi-search" style={{ color: "#6c757d", fontSize: "0.85rem" }} />
          }
        </div>
      </div>

      {/* Dropdown suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#1e2227",
            border: "1px solid #ffc107",
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            overflow: "hidden",
            maxHeight: "260px",
            overflowY: "auto",
          }}>
          {suggestions.map((item, idx) => (
            <div
              key={item.placeId || idx}
              onClick={() => handleSelect(item)}
              style={{
                padding: "0.65rem 0.9rem",
                cursor: "pointer",
                borderTop: idx > 0 ? "1px solid #2d3139" : "none",
                transition: "background 0.15s",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.6rem",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,193,7,0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: "1px" }}>
                {getTypeIcon(item.type)}
              </span>
              <div>
                <div style={{ 
                  color: item.source === "mapbox" ? "#4ade80" : "#ffc107", 
                  fontWeight: 600, 
                  fontSize: "0.88rem", 
                  lineHeight: 1.3,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}>
                  {item.shortName}
                  {item.source === "mapbox" && (
                    <span style={{ 
                      fontSize: "0.65rem", 
                      background: "rgba(74,222,128,0.15)", 
                      color: "#4ade80",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      fontWeight: 500
                    }}>
                      PREMIUM
                    </span>
                  )}
                </div>
                <div style={{ color: "#6c757d", fontSize: "0.75rem", lineHeight: 1.4, marginTop: "2px" }}>
                  {item.address.split(",").slice(1, 4).join(",").trim()}
                </div>
              </div>
            </div>
          ))}

          {/* Attribution */}
          <div style={{
            padding: "0.4rem 0.9rem",
            background: "#13161a",
            borderTop: "1px solid #2d3139",
            fontSize: "0.7rem",
            color: "#6c757d",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
          }}>
            <i className="bi bi-map" /> 
            Mapbox + OpenStreetMap
          </div>
        </div>
      )}

      {/* No results */}
      {showDropdown && !loading && suggestions.length === 0 && value.length >= 3 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#1e2227", border: "1px solid #3a3f47",
          borderTop: "none", borderRadius: "0 0 10px 10px",
          padding: "0.75rem 0.9rem", fontSize: "0.85rem",
          color: "#6c757d", zIndex: 1000,
        }}>
          <i className="bi bi-search me-2" />
          Tidak ditemukan. Coba kata kunci lain.
        </div>
      )}
    </div>
  );
}
