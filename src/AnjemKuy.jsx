// ============================================================
// src/AnjemKuy.jsx
// Anjem Kuy — Antar Jemput Malang (Full Application)
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import { db } from "./firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import PlacesAutocomplete from "./components/PlacesAutocomplete";
import MapPicker from "./components/MapPicker";
import useDistanceMatrix from "./hooks/useDistanceMatrix";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const WA_NUMBER = "6282310699436";
const SLOT_START_HOUR = 0;   // 00:00 (24 jam)
const SLOT_END_HOUR = 23;    // 23:59 (24 jam)
const SLOT_INTERVAL = 10;    // minutes
const OP_BUFFER = 20;        // operational buffer in minutes

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Returns today's date string as YYYY-MM-DD */
const getTodayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** Convert "HH:mm" to total minutes since midnight */
const timeToMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** Convert minutes since midnight to "HH:mm" */
const minToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** Generate all time slots between SLOT_START_HOUR and SLOT_END_HOUR */
const generateSlots = () => {
  const slots = [];
  const start = SLOT_START_HOUR * 60;
  const end = (SLOT_END_HOUR * 60) + 50; // Include 23:50
  for (let m = start; m <= end; m += SLOT_INTERVAL) {
    slots.push(minToTime(m));
  }
  return slots;
};

/** ── Pricing Engine ── */
const calcPickupFee = (km) => {
  const k = parseFloat(km) || 0;
  if (k <= 0) return 0;
  if (k <= 1.5) return 0;
  if (k <= 4) return 3000;
  if (k <= 6) return 5000;
  if (k <= 8) return 7000;
  if (k <= 10) return 9000;
  return 10000 + Math.ceil(k - 10) * 1000;
};

const calcDestFee = (km) => {
  const k = parseFloat(km) || 0;
  if (k <= 0) return 0;
  if (k <= 2) return 8000;
  if (k <= 4) return 10000;
  if (k <= 6) return 12000;
  if (k <= 8) return 15000;
  if (k <= 10) return 18000;
  if (k <= 11) return 22000;
  if (k <= 15) return 28000;
  return 28000 + Math.ceil(k - 15) * 2000;
};

const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

// ─────────────────────────────────────────────
// STYLES (inline — keeps everything self-contained)
// ─────────────────────────────────────────────
const S = {
  root: {
    background: "#090b0e",
    minHeight: "100vh",
    fontFamily: "'Outfit', sans-serif",
    color: "#e0e0e0",
  },
  hero: {
    background: "#090a0c",
    borderBottom: "1px solid #1a1e24",
    padding: "3.5rem 1rem 2.5rem",
    textAlign: "center",
  },
  heroTitle: {
    fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #fbbd05, #ff8a00)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-1.5px",
    marginBottom: "0.5rem",
  },
  heroSub: {
    color: "#9ca3af",
    fontSize: "1rem",
    fontWeight: 400,
    marginBottom: "1.25rem",
    letterSpacing: "0.02em",
  },
  badge: {
    background: "rgba(251, 189, 5, 0.1)",
    border: "1px solid rgba(251, 189, 5, 0.3)",
    color: "#fbbd05",
    borderRadius: "50px",
    padding: "0.4rem 1.25rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    backdropFilter: "blur(4px)",
    boxShadow: "0 4px 15px rgba(251, 189, 5, 0.05)",
  },
  card: {
    background: "#111418",
    border: "1px solid #1f242b",
    borderRadius: "16px",
    padding: "2rem",
    marginBottom: "1.75rem",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
    transition: "border-color 0.3s ease",
  },
  cardTitle: {
    color: "#fbbd05",
    fontWeight: 700,
    fontSize: "1.1rem",
    marginBottom: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    paddingBottom: "1rem",
  },
  label: {
    color: "#9ca3af",
    fontSize: "0.82rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  input: {
    background: "#161a1f",
    border: "1px solid #2a2f36",
    borderRadius: "10px",
    color: "#ffffff",
    padding: "0.85rem 1rem",
    fontSize: "0.95rem",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s ease",
    fontFamily: "'Outfit', sans-serif",
    colorScheme: "dark",
  },
  inputFocus: {
    borderColor: "#fbbd05",
  },
  select: {
    background: "#161a1f",
    border: "1px solid #2a2f36",
    borderRadius: "10px",
    color: "#ffffff",
    padding: "0.85rem 1rem",
    fontSize: "0.95rem",
    width: "100%",
    cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
    transition: "border-color 0.2s ease",
    colorScheme: "dark",
  },
  priceBox: {
    background: "#151b15",
    border: "1px solid #203520",
    borderRadius: "12px",
    padding: "1.5rem",
    marginTop: "1.25rem",
  },
  priceLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.4rem 0",
    fontSize: "0.95rem",
    color: "#d1d5db",
  },
  priceDivider: {
    borderTop: "1px dashed rgba(74, 222, 128, 0.3)",
    margin: "0.75rem 0",
  },
  priceTotal: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "1.3rem",
    fontWeight: 800,
    color: "#4ade80",
    textShadow: "0 2px 10px rgba(74, 222, 128, 0.2)",
  },
  qrisBox: {
    background: "rgba(9, 11, 14, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    padding: "1.5rem",
    textAlign: "center",
    marginTop: "1.25rem",
  },
  qrisImg: {
    width: "220px",
    maxWidth: "100%",
    borderRadius: "12px",
    background: "#fff",
    padding: "12px",
    marginBottom: "1rem",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
  },
  btnWa: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "1rem 2rem",
    fontWeight: 700,
    fontSize: "1.1rem",
    width: "100%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    transition: "background 0.2s ease, transform 0.1s ease",
    letterSpacing: "0.02em",
    fontFamily: "'Outfit', sans-serif",
  },
  radioCard: {
    background: "#161a1f",
    border: "1px solid #2a2f36",
    borderRadius: "10px",
    padding: "1rem",
    cursor: "pointer",
    transition: "border-color 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flex: 1,
    userSelect: "none",
  },
  radioCardActive: {
    borderColor: "#fbbd05",
    background: "rgba(251, 189, 5, 0.05)",
  },
  footer: {
    background: "#090b0e",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "2rem 1rem",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "0.85rem",
  },
  adminLink: {
    color: "#6b7280",
    cursor: "pointer",
    textDecoration: "none",
    fontSize: "0.8rem",
    opacity: 0.5,
    transition: "opacity 0.2s",
  },
};

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

/** Controlled input with gold focus ring */
function StyledInput({ as = "input", style = {}, ...props }) {
  const [focused, setFocused] = useState(false);
  const base = as === "textarea" ? { ...S.input, resize: "vertical", minHeight: "75px" } : S.input;
  const Tag = as;
  return (
    <Tag
      {...props}
      style={{ ...base, ...(focused ? S.inputFocus : {}), ...style }}
      onFocus={(e) => { setFocused(true); props.onFocus && props.onFocus(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur && props.onBlur(e); }}
    />
  );
}

/** Payment method radio button */
function PaymentRadio({ label, icon, value, selected, onSelect }) {
  return (
    <div
      style={{ ...S.radioCard, ...(selected === value ? S.radioCardActive : {}) }}
      onClick={() => onSelect(value)}
      role="radio"
      aria-checked={selected === value}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(value)}
    >
      <i className={`bi ${icon}`} style={{ fontSize: "1.3rem", color: selected === value ? "#ffc107" : "#6c757d" }} />
      <span style={{ fontWeight: 600, fontSize: "0.88rem", color: selected === value ? "#ffc107" : "#adb5bd" }}>
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function AnjemKuy() {
  // ── Form state ──
  const [nama, setNama] = useState("");
  const [lokasiJemput, setLokasiJemput] = useState("");
  const [lokasiJemputData, setLokasiJemputData] = useState(null);
  const [jarakJemput, setJarakJemput] = useState("");
  const [lokasiTujuan, setLokasiTujuan] = useState("");
  const [lokasiTujuanData, setLokasiTujuanData] = useState(null);
  const [jarakTujuan, setJarakTujuan] = useState("");
  const [tanggalBerangkat, setTanggalBerangkat] = useState(getTodayStr());
  const [jamBerangkat, setJamBerangkat] = useState("");
  const [pembayaran, setPembayaran] = useState("cash");
  const [estimasiDurasi, setEstimasiDurasi] = useState(0);
  const [showMap, setShowMap] = useState(false);

  const { calculateDistance, calculatePickupDistance, loading: calculatingDistance } = useDistanceMatrix();

  // ── Firestore slots ──
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);

  const ALL_SLOTS = generateSlots();

  // ── Load driver (admin) location from localStorage ──
  useEffect(() => {
    const stored = localStorage.getItem("admin_driver_location");
    if (stored) {
      try {
        setDriverLocation(JSON.parse(stored));
      } catch (e) {
        console.error("Invalid driver location data");
      }
    }
  }, []);

  // ── Auto-calculate distance when both locations selected ──
  useEffect(() => {
    const autoCalculate = async () => {
      if (lokasiJemputData && lokasiTujuanData && driverLocation) {
        // Calculate pickup distance: driver → pickup location
        const pickupResult = await calculatePickupDistance(driverLocation, lokasiJemputData);
        
        // Calculate destination distance: pickup → destination
        const destResult = await calculateDistance(lokasiJemputData, lokasiTujuanData);
        
        if (pickupResult && destResult) {
          setJarakJemput(pickupResult.jarakJemput);
          setJarakTujuan(destResult.jarakTujuan);
          setEstimasiDurasi(pickupResult.durasiJemput + destResult.totalDurasi);
        } else if (destResult) {
          // Fallback: if no driver location, set pickup to 0
          setJarakJemput("0");
          setJarakTujuan(destResult.jarakTujuan);
          setEstimasiDurasi(destResult.totalDurasi);
        }
      } else if (lokasiJemputData && lokasiTujuanData) {
        // No driver location set, calculate only destination distance
        const destResult = await calculateDistance(lokasiJemputData, lokasiTujuanData);
        if (destResult) {
          setJarakJemput("0");
          setJarakTujuan(destResult.jarakTujuan);
          setEstimasiDurasi(destResult.totalDurasi);
        }
      }
    };
    autoCalculate();
  }, [lokasiJemputData, lokasiTujuanData, driverLocation, calculateDistance, calculatePickupDistance]);

  // ── Real-time Firestore listener ──
  useEffect(() => {
    setLoadingSlots(true);
    const q = query(
      collection(db, "booked_slots"),
      where("tanggal", "==", tanggalBerangkat)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBookedSlots(data);
        setLoadingSlots(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoadingSlots(false);
      }
    );
    return () => unsub();
  }, [tanggalBerangkat]);

  // ── Slot disable logic ──
  const isSlotDisabled = useCallback(
    (slot) => {
      const slotMin = timeToMin(slot);
      return bookedSlots.some(({ jamMulai, durasiMenit, status }) => {
        if (status === "batal" || status === "selesai") return false;
        const startMin = timeToMin(jamMulai);
        const endMin = startMin + Number(durasiMenit) + OP_BUFFER;
        return slotMin >= startMin && slotMin < endMin;
      });
    },
    [bookedSlots]
  );

  // ── Price calculation ──
  const pickupFee = calcPickupFee(jarakJemput);
  const destFee = calcDestFee(jarakTujuan);
  const total = pickupFee + destFee;
  const jJemput = parseFloat(jarakJemput) || 0;
  const jTujuan = parseFloat(jarakTujuan) || 0;
  const durasiEstimasi = estimasiDurasi || (jJemput + jTujuan > 0 ? Math.ceil((jJemput + jTujuan) * 2.5) : 0);

  // ── WhatsApp checkout ──
  const handleOrder = async () => {
    if (!nama.trim()) return alert("Masukkan nama penumpang!");
    if (!lokasiJemput.trim()) return alert("Masukkan lokasi penjemputan!");
    if (!lokasiTujuan.trim()) return alert("Masukkan lokasi tujuan!");
    if (jJemput === 0 && jTujuan === 0) return alert("Masukkan jarak atau pilih lokasi dari Google Maps!");
    if (!jamBerangkat) return alert("Pilih jam berangkat!");

    try {
      // Auto-lock the selected time slot
      await addDoc(collection(db, "booked_slots"), {
        tanggal: tanggalBerangkat,
        jamMulai: jamBerangkat,
        durasiMenit: Number(durasiEstimasi),
        nama,
        lokasiJemput,
        lokasiTujuan,
        totalHarga: total,
        status: "pending",
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Gagal mengunci jadwal:", e);
      alert("Terjadi kesalahan sistem saat memproses jadwal. Silakan coba lagi.");
      return;
    }

    const mapsLinks = lokasiJemputData?.lat && lokasiTujuanData?.lat
      ? [
          ``,
          `*Link Maps:*`,
          `Jemput: https://maps.google.com/?q=${lokasiJemputData.lat},${lokasiJemputData.lng}`,
          `Tujuan: https://maps.google.com/?q=${lokasiTujuanData.lat},${lokasiTujuanData.lng}`,
        ]
      : [];

    const lines = [
      `[ ANJEM KUY - ORDER MASUK ]`,
      ``,
      `Nama        : ${nama}`,
      `Tanggal     : ${tanggalBerangkat}`,
      `Jam         : ${jamBerangkat} WIB`,
      `Pembayaran  : ${pembayaran === "qris" ? "QRIS DANA" : "Cash / Tunai"}`,
      ``,
      `Lokasi Jemput`,
      `${lokasiJemput}`,
      `Jarak jemput  : ${jJemput} km`,
      ``,
      `Lokasi Tujuan`,
      `${lokasiTujuan}`,
      `Jarak tujuan  : ${jTujuan} km`,
      `Estimasi      : ±${durasiEstimasi} menit`,
      ``,
      `Rincian Harga`,
      `Biaya jemput  : ${formatRupiah(pickupFee)}`,
      `Biaya tujuan  : ${formatRupiah(destFee)}`,
      `Total         : ${formatRupiah(total)}`,
      ...mapsLinks,
      ``,
      `Mohon konfirmasi ketersediaan slot. Terima kasih.`,
    ];

    const activeWaNumber = localStorage.getItem("admin_wa_number") || WA_NUMBER;
    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${activeWaNumber}?text=${text}`, "_blank");
  };



  const [gettingLocation, setGettingLocation] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung fitur lokasi GPS.");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`);
          const data = await res.json();
          const addressName = data.name || data.address?.road || "Lokasi Anda Saat Ini";
          const suburb = data.address?.suburb || data.address?.village || "";
          const city = data.address?.city || data.address?.town || data.address?.county || "";
          
          let fullAddr = addressName;
          if (suburb) fullAddr += `, ${suburb}`;
          if (city) fullAddr += `, ${city}`;
          
          setLokasiJemput(fullAddr);
          setLokasiJemputData({
            lat,
            lng,
            name: addressName,
            address: data.display_name
          });
        } catch (e) {
          alert("Gagal menerjemahkan koordinat ke alamat.");
        }
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        if (error.code === 1) alert("Mohon izinkan akses lokasi GPS di browser Anda.");
        else alert("Gagal mendapatkan titik koordinat. Pastikan GPS aktif.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ── Render ──
  return (
    <div style={S.root}>
      {/* ─── HERO ─── */}
      <header style={S.hero}>
        <div style={S.heroTitle}>
          <i className="bi bi-motorcycle" /> Anjem Kuy
        </div>
        <p style={S.heroSub}>Antar Jemput Area Malang — Yamaha Aerox 155cc</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={S.badge}>
            <i className="bi bi-lightning-charge-fill" /> Cepat & Aman
          </span>
          <span style={S.badge}>
            <i className="bi bi-geo-alt-fill" /> Area Malang
          </span>
          <span style={S.badge}>
            <i className="bi bi-clock-fill" /> 24 Jam Non-Stop
          </span>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main style={{ maxWidth: "640px", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>

        {/* ── Section: Identitas ── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <i className="bi bi-person-fill" /> Data Penumpang
          </div>
          <label style={S.label} htmlFor="nama">Nama Lengkap</label>
          <StyledInput
            id="nama"
            type="text"
            placeholder="Contoh: Budi Santoso"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
        </div>

        {/* ── Section: Lokasi ── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <i className="bi bi-geo-alt-fill" /> Lokasi Penjemputan & Tujuan
          </div>

          {/* Pickup */}
          <div style={{ marginBottom: "1.25rem" }}>
            <PlacesAutocomplete
              id="lokasiJemput"
              label={<><i className="bi bi-pin-map" /> Lokasi Jemput</>}
              placeholder="Ketik nama tempat, kost, kampus..."
              value={lokasiJemput}
              onChange={setLokasiJemput}
              onPlaceSelect={(place) => {
                setLokasiJemput(place.address);
                setLokasiJemputData(place);
              }}
            />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.7rem" }}>
              <button 
                onClick={handleGetLocation} 
                disabled={gettingLocation}
                style={{ 
                  background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)",
                  color: "#4ade80", padding: "0.4rem 0.8rem", borderRadius: "8px", fontSize: "0.78rem",
                  cursor: gettingLocation ? "wait" : "pointer", display: "flex", alignItems: "center", gap: "0.4rem",
                  fontFamily: "'Outfit', sans-serif", transition: "all 0.2s"
                }}
              >
                {gettingLocation ? (
                  <span className="spinner-border spinner-border-sm" style={{ width: "12px", height: "12px", borderWidth: "2px" }} />
                ) : (
                  <i className="bi bi-crosshair" />
                )}
                {gettingLocation ? "Mencari titik..." : "Lokasi Saya Saat Ini"}
              </button>

              {lokasiJemputData && (
                <div style={{ fontSize: "0.75rem", color: "#4ade80", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <i className="bi bi-check-circle-fill" /> Titik dikunci
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px dashed #2d3139", margin: "0.5rem 0 1.25rem" }} />

          {/* Destination */}
          <div style={{ marginBottom: "1.25rem" }}>
            <PlacesAutocomplete
              id="lokasiTujuan"
              label={<><i className="bi bi-flag-fill" /> Lokasi Tujuan</>}
              placeholder="Ketik nama tempat, kampus, sekolah..."
              value={lokasiTujuan}
              onChange={setLokasiTujuan}
              onPlaceSelect={(place) => {
                setLokasiTujuan(place.address);
                setLokasiTujuanData(place);
              }}
            />
            {lokasiTujuanData && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#4ade80", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <i className="bi bi-check-circle-fill" /> Lokasi terpilih — jarak dihitung otomatis
              </div>
            )}
          </div>

          {/* Toggle peta */}
          <button
            onClick={() => setShowMap(!showMap)}
            style={{
              background: showMap ? "rgba(255,193,7,0.12)" : "#13161a",
              border: `1px solid ${showMap ? "#ffc107" : "#3a3f47"}`,
              borderRadius: "10px",
              color: showMap ? "#ffc107" : "#adb5bd",
              padding: "0.6rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontFamily: "'Inter', sans-serif",
              marginBottom: showMap ? "1rem" : 0,
              transition: "all 0.2s",
            }}
          >
            <i className={`bi bi-map${showMap ? "-fill" : ""}`} />
            {showMap ? "Sembunyikan Peta" : "Tandai Lokasi di Peta"}
          </button>

          {/* Map picker */}
          {showMap && (
            <MapPicker
              jemputCoord={lokasiJemputData}
              tujuanCoord={lokasiTujuanData}
              onJemputChange={(loc) => {
                setLokasiJemput(loc.address);
                setLokasiJemputData(loc);
              }}
              onTujuanChange={(loc) => {
                setLokasiTujuan(loc.address);
                setLokasiTujuanData(loc);
              }}
              onRouteCalculated={({ jarakTujuan, totalDurasi }) => {
                setJarakTujuan(String(jarakTujuan));
                setEstimasiDurasi(totalDurasi);
                setJarakJemput("0");
              }}
            />
          )}

          {/* Auto-calculated result from search */}
          {!showMap && calculatingDistance && (
            <div style={{ marginTop: "0.75rem", background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.3)", borderRadius: "10px", padding: "0.75rem", fontSize: "0.85rem", color: "#ffc107", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} />
              Menghitung jarak...
            </div>
          )}

          {!showMap && jJemput === 0 && jTujuan > 0 && !calculatingDistance && (
            <div style={{ marginTop: "0.75rem", background: "linear-gradient(135deg,#1a2a0a,#1e2a10)", border: "1px solid #2d5016", borderRadius: "12px", padding: "0.85rem 1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: "0.75rem" }}>
              <div>
                <div style={{ color: "#6c757d", fontSize: "0.72rem", textTransform: "uppercase" }}>Jarak Tujuan</div>
                <div style={{ color: "#4ade80", fontWeight: 700, fontSize: "1.05rem" }}>{jTujuan} km</div>
              </div>
              <div>
                <div style={{ color: "#6c757d", fontSize: "0.72rem", textTransform: "uppercase" }}>Estimasi</div>
                <div style={{ color: "#ffc107", fontWeight: 700, fontSize: "1.05rem" }}>±{durasiEstimasi} mnt</div>
              </div>
              {!driverLocation && (
                <div style={{ gridColumn: "1/-1", fontSize: "0.75rem", color: "#ffc107", display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                  <i className="bi bi-info-circle-fill" />
                  Jarak jemput belum dihitung (lokasi driver belum diatur)
                </div>
              )}
            </div>
          )}

          {!showMap && jJemput > 0 && jTujuan > 0 && !calculatingDistance && (
            <div style={{ marginTop: "0.75rem", background: "linear-gradient(135deg,#1a2a0a,#1e2a10)", border: "1px solid #2d5016", borderRadius: "12px", padding: "0.85rem 1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ color: "#6c757d", fontSize: "0.72rem", textTransform: "uppercase" }}>Jarak Jemput</div>
                  <div style={{ color: "#4ade80", fontWeight: 700, fontSize: "1.05rem" }}>{jJemput} km</div>
                  <div style={{ color: "#6c757d", fontSize: "0.68rem", marginTop: "0.15rem" }}>
                    <i className="bi bi-geo-fill" /> Dari driver ke Anda
                  </div>
                </div>
                <div>
                  <div style={{ color: "#6c757d", fontSize: "0.72rem", textTransform: "uppercase" }}>Jarak Tujuan</div>
                  <div style={{ color: "#4ade80", fontWeight: 700, fontSize: "1.05rem" }}>{jTujuan} km</div>
                  <div style={{ color: "#6c757d", fontSize: "0.68rem", marginTop: "0.15rem" }}>
                    <i className="bi bi-pin-map-fill" /> Ke lokasi tujuan
                  </div>
                </div>
                <div>
                  <div style={{ color: "#6c757d", fontSize: "0.72rem", textTransform: "uppercase" }}>Estimasi Total</div>
                  <div style={{ color: "#ffc107", fontWeight: 700, fontSize: "1.05rem" }}>±{durasiEstimasi} mnt</div>
                </div>
              </div>
              <div style={{ 
                background: "rgba(74,222,128,0.08)", 
                border: "1px solid rgba(74,222,128,0.25)", 
                borderRadius: "8px", 
                padding: "0.6rem 0.75rem",
                fontSize: "0.75rem",
                color: "#4ade80",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <i className="bi bi-check-circle-fill" />
                Jarak dihitung otomatis dari GPS driver
              </div>
            </div>
          )}
        </div>

        {/* ── Section: Waktu ── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <i className="bi bi-clock-fill" /> Tanggal & Jam Keberangkatan
          </div>
          
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={S.label} htmlFor="tanggalBerangkat">Tanggal Berangkat</label>
            <StyledInput
              id="tanggalBerangkat"
              type="date"
              value={tanggalBerangkat}
              onChange={(e) => {
                setTanggalBerangkat(e.target.value);
                setJamBerangkat(""); // Reset jam ketika tanggal berubah
              }}
              min={getTodayStr()}
            />
          </div>

          {loadingSlots ? (
            <div style={{ color: "#adb5bd", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="spinner-border spinner-border-sm text-warning" role="status" />
              Memuat slot waktu...
            </div>
          ) : (
            <>
              <label style={S.label} htmlFor="jamBerangkat">Pilih Jam (WIB)</label>
              <select
                id="jamBerangkat"
                style={S.select}
                value={jamBerangkat}
                onChange={(e) => setJamBerangkat(e.target.value)}
              >
                <option value="">— Pilih jam berangkat —</option>
                {ALL_SLOTS.map((slot) => {
                  const disabled = isSlotDisabled(slot);
                  return (
                    <option key={slot} value={slot} disabled={disabled} style={{ color: disabled ? "#dc3545" : "#e0e0e0" }}>
                      {disabled ? `${slot} WIB ❌ (Penuh/Jeda Operasional)` : `${slot} WIB`}
                    </option>
                  );
                })}
              </select>
              <p style={{ color: "#6c757d", fontSize: "0.78rem", marginTop: "0.5rem", marginBottom: 0 }}>
                <i className="bi bi-info-circle" /> Slot bertanda ❌ sedang terisi atau dalam jeda operasional.
              </p>
            </>
          )}
        </div>

        {/* ── Section: Pembayaran ── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <i className="bi bi-wallet2" /> Metode Pembayaran
          </div>

          {/* Radio buttons */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <PaymentRadio
              label="QRIS DANA"
              icon="bi-qr-code-scan"
              value="qris"
              selected={pembayaran}
              onSelect={setPembayaran}
            />
            <PaymentRadio
              label="Cash / Tunai"
              icon="bi-cash-stack"
              value="cash"
              selected={pembayaran}
              onSelect={setPembayaran}
            />
          </div>

          {/* Price summary */}
          {(jJemput > 0 || jTujuan > 0) && (
            <div style={S.priceBox}>
              <div style={{ color: "#adb5bd", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Rincian Harga
              </div>
              <div style={S.priceLine}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span>Biaya Jemput ({jJemput} km)</span>
                  {driverLocation && jJemput > 0 && (
                    <span style={{ fontSize: "0.7rem", color: "#6c757d", marginTop: "0.15rem" }}>
                      <i className="bi bi-geo-fill" /> Dari lokasi driver
                    </span>
                  )}
                  {!driverLocation && jJemput === 0 && (
                    <span style={{ fontSize: "0.7rem", color: "#ffc107", marginTop: "0.15rem" }}>
                      <i className="bi bi-exclamation-triangle-fill" /> Lokasi driver belum diatur
                    </span>
                  )}
                </div>
                <span style={{ color: "#e0e0e0", fontWeight: 600 }}>{formatRupiah(pickupFee)}</span>
              </div>
              <div style={S.priceLine}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span>Biaya Tujuan ({jTujuan} km)</span>
                  <span style={{ fontSize: "0.7rem", color: "#6c757d", marginTop: "0.15rem" }}>
                    <i className="bi bi-pin-map-fill" /> Dari lokasi jemput ke tujuan
                  </span>
                </div>
                <span style={{ color: "#e0e0e0", fontWeight: 600 }}>{formatRupiah(destFee)}</span>
              </div>
              {durasiEstimasi > 0 && (
                <div style={S.priceLine}>
                  <span>Estimasi Perjalanan</span>
                  <span style={{ color: "#ffc107", fontWeight: 600 }}>±{durasiEstimasi} menit</span>
                </div>
              )}
              <div style={S.priceDivider} />
              <div style={S.priceTotal}>
                <span>TOTAL</span>
                <span>{formatRupiah(total)}</span>
              </div>
            </div>
          )}

          {/* QRIS display */}
          {pembayaran === "qris" && total > 0 && (
            <div style={S.qrisBox}>
              <img
                src="/Qris.jpeg"
                alt="QRIS DANA"
                style={S.qrisImg}
              />
              <p style={{ color: "#adb5bd", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                Scan kode QRIS di atas via aplikasi <strong style={{ color: "#ffc107" }}>DANA</strong> atau dompet digital lainnya.
              </p>
              <div style={{ background: "rgba(255,193,7,0.12)", border: "1px solid rgba(255,193,7,0.3)", borderRadius: "8px", padding: "0.6rem 1rem" }}>
                <span style={{ color: "#ffc107", fontWeight: 700, fontSize: "1.05rem" }}>
                  Transfer tepat: {formatRupiah(total)}
                </span>
              </div>
              <p style={{ color: "#6c757d", fontSize: "0.75rem", marginTop: "0.5rem", marginBottom: 0 }}>
                Jangan lebih / kurang. Kirim bukti transfer via WhatsApp setelah klik tombol pesan.
              </p>
            </div>
          )}
        </div>

        {/* ── WhatsApp Button ── */}
        <button
          style={S.btnWa}
          onClick={handleOrder}
          onMouseOver={(e) => (e.currentTarget.style.background = "#059669")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#10b981")}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          aria-label="Pesan via WhatsApp"
        >
          <i className="bi bi-whatsapp" style={{ fontSize: "1.3rem" }} />
          Pesan via WhatsApp
        </button>

        <p style={{ textAlign: "center", color: "#6c757d", fontSize: "0.78rem", marginTop: "0.75rem" }}>
          Kamu akan diarahkan ke WhatsApp untuk konfirmasi order.
        </p>
      </main>

      {/* ─── FOOTER ─── */}
      <footer style={S.footer}>
        <p style={{ marginBottom: "0.25rem" }}>
          🏍️ <strong style={{ color: "#ffc107" }}>Anjem Kuy</strong> — Malang, Jawa Timur
        </p>
        <p style={{ marginBottom: "0.5rem", fontSize: "0.75rem" }}>Yamaha Aerox 155cc | Cepat, Aman, & Nyaman</p>
        {/* Admin link */}
        <a
          href="/admin"
          style={{ ...S.adminLink, textDecoration: "none" }}
          title="Admin Dashboard"
        >
          ⚙ admin
        </a>
      </footer>
    </div>
  );
}
