// ============================================================
// src/admin/AdminDashboard.jsx
// Main admin dashboard with routing
// ============================================================

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "./AdminAuthContext";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const S = {
  root: {
    minHeight: "100vh",
    background: "#0f1114",
    fontFamily: "'Inter', sans-serif",
    color: "#e0e0e0",
  },
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "260px",
    height: "100vh",
    background: "#1a1d23",
    borderRight: "1px solid #2d3139",
    padding: "1.5rem 0",
    overflowY: "auto",
    zIndex: 1000,
    transition: "transform 0.3s ease",
  },
  sidebarMobile: {
    transform: "translateX(-100%)",
  },
  sidebarOpen: {
    transform: "translateX(0)",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 999,
    display: "none",
  },
  overlayVisible: {
    display: "block",
  },
  mobileHeader: {
    display: "none",
    padding: "1rem",
    background: "#1a1d23",
    borderBottom: "1px solid #2d3139",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  hamburger: {
    background: "none",
    border: "none",
    color: "#ffc107",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "0.5rem",
    display: "flex",
    alignItems: "center",
  },
  sidebarHeader: {
    padding: "0 1.5rem",
    marginBottom: "2rem",
  },
  logo: {
    color: "#ffc107",
    fontSize: "1.5rem",
    fontWeight: 800,
    marginBottom: "0.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  logoSub: {
    color: "#6c757d",
    fontSize: "0.78rem",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1.5rem",
    color: "#adb5bd",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.2s, color 0.2s",
    borderLeft: "3px solid transparent",
  },
  navItemActive: {
    background: "rgba(255,193,7,0.08)",
    color: "#ffc107",
    borderLeftColor: "#ffc107",
  },
  main: {
    marginLeft: "260px",
    padding: "2rem",
    minHeight: "100vh",
  },
  mainMobile: {
    marginLeft: 0,
    padding: "1rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #2d3139",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: {
    fontSize: "clamp(1.3rem, 4vw, 1.8rem)",
    fontWeight: 700,
    color: "#e0e0e0",
    margin: 0,
  },
  card: {
    background: "#1e2227",
    border: "1px solid #2d3139",
    borderRadius: "16px",
    padding: "1.75rem",
    marginBottom: "1.5rem",
  },
  cardTitle: {
    color: "#ffc107",
    fontWeight: 700,
    fontSize: "1rem",
    marginBottom: "1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.25rem",
    marginBottom: "2rem",
  },
  statCard: {
    background: "linear-gradient(135deg, #1a2a0a, #1e2a10)",
    border: "1px solid #2d5016",
    borderRadius: "14px",
    padding: "1.5rem",
  },
  statLabel: {
    color: "#6c757d",
    fontSize: "0.8rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.5rem",
  },
  statValue: {
    color: "#4ade80",
    fontSize: "2rem",
    fontWeight: 800,
    marginBottom: "0.25rem",
  },
  statDesc: {
    color: "#adb5bd",
    fontSize: "0.82rem",
  },
  btn: {
    background: "linear-gradient(135deg, #ffc107, #e6a800)",
    color: "#212529",
    border: "none",
    borderRadius: "10px",
    padding: "0.65rem 1.25rem",
    fontWeight: 700,
    fontSize: "0.88rem",
    cursor: "pointer",
    transition: "opacity 0.2s",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  btnDanger: {
    background: "linear-gradient(135deg, #dc3545, #b02a37)",
    color: "#fff",
  },
  btnSecondary: {
    background: "#3a3f47",
    color: "#e0e0e0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    overflowX: "auto",
    display: "block",
  },
  tableWrapper: {
    overflowX: "auto",
    width: "100%",
  },
  th: {
    textAlign: "left",
    padding: "0.75rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#6c757d",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #2d3139",
  },
  td: {
    padding: "0.85rem 0.75rem",
    fontSize: "0.88rem",
    borderBottom: "1px solid #2d3139",
  },
  badge: {
    display: "inline-block",
    padding: "0.3rem 0.7rem",
    borderRadius: "50px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  badgeSuccess: {
    background: "rgba(74,222,128,0.15)",
    color: "#4ade80",
    border: "1px solid rgba(74,222,128,0.3)",
  },
  badgeDanger: {
    background: "rgba(220,53,69,0.15)",
    color: "#dc3545",
    border: "1px solid rgba(220,53,69,0.3)",
  },
  input: {
    background: "#13161a",
    border: "1px solid #3a3f47",
    borderRadius: "10px",
    color: "#e0e0e0",
    padding: "0.65rem 0.9rem",
    fontSize: "0.9rem",
    width: "100%",
    outline: "none",
  },
  select: {
    background: "#13161a",
    border: "1px solid #3a3f47",
    borderRadius: "10px",
    color: "#e0e0e0",
    padding: "0.65rem 0.9rem",
    fontSize: "0.9rem",
    width: "100%",
    cursor: "pointer",
  },
};

// Inject responsive CSS
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @media (max-width: 767px) {
      .admin-mobile-header {
        display: flex !important;
      }
      .admin-sidebar {
        transform: translateX(-100%);
      }
      .admin-sidebar.open {
        transform: translateX(0);
      }
    }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const generateTimeSlots = () => {
  const slots = [];
  for (let h = 0; h <= 23; h++) {
    for (let m = 0; m < 60; m += 10) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
};

const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);

// ─────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────

function Sidebar({ currentPath, onNavigate, onLogout, isOpen, onClose }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const menuItems = [
    { path: "/admin", icon: "bi-speedometer2", label: "Dashboard" },
    { path: "/admin/slots", icon: "bi-calendar-check", label: "Kelola Slot" },
    { path: "/admin/bookings", icon: "bi-list-ul", label: "Riwayat Booking" },
    { path: "/admin/settings", icon: "bi-gear", label: "Pengaturan" },
  ];

  const handleNavigate = (path) => {
    onNavigate(path);
    if (isMobile) onClose();
  };

  const sidebarStyle = {
    ...S.sidebar,
    ...(isMobile && !isOpen ? { transform: "translateX(-100%)" } : {}),
    ...(isMobile && isOpen ? { transform: "translateX(0)" } : {}),
  };

  return (
    <div style={sidebarStyle} className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      <div style={S.sidebarHeader}>
        <div style={S.logo}>
          <i className="bi bi-motorcycle" />
          Anjem Kuy
        </div>
        <div style={S.logoSub}>Admin Dashboard</div>
      </div>

      <nav>
        {menuItems.map((item) => (
          <div
            key={item.path}
            style={{
              ...S.navItem,
              ...(currentPath === item.path ? S.navItemActive : {}),
            }}
            onClick={() => handleNavigate(item.path)}
            onMouseOver={(e) => !currentPath.startsWith(item.path) && (e.currentTarget.style.background = "rgba(255,193,7,0.03)")}
            onMouseOut={(e) => !currentPath.startsWith(item.path) && (e.currentTarget.style.background = "transparent")}
          >
            <i className={`bi ${item.icon}`} style={{ fontSize: "1.1rem" }} />
            {item.label}
          </div>
        ))}

        <div style={{ borderTop: "1px solid #2d3139", margin: "1rem 0" }} />

        <div
          style={S.navItem}
          onClick={onLogout}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(220,53,69,0.08)";
            e.currentTarget.style.color = "#dc3545";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#adb5bd";
          }}
        >
          <i className="bi bi-box-arrow-left" style={{ fontSize: "1.1rem" }} />
          Keluar
        </div>
      </nav>
    </div>
  );
}

function DashboardHome({ slots }) {
  const today = getTodayStr();
  const todaySlots = slots.filter((s) => s.tanggal === today);
  const totalDuration = todaySlots.reduce((acc, s) => acc + Number(s.durasiMenit), 0);
  
  // Enhanced statistics
  const todayPending = todaySlots.filter(s => s.status === "pending").length;
  const todayCompleted = todaySlots.filter(s => s.status === "selesai").length;
  const todayCancelled = todaySlots.filter(s => s.status === "batal").length;
  const autoCompleted = todaySlots.filter(s => s.autoCompleted).length;

  return (
    <div>
      <h1 style={S.title}>Dashboard Overview</h1>
      <p style={{ color: "#6c757d", marginBottom: "2rem" }}>Selamat datang di panel admin Anjem Kuy!</p>

      <div style={S.statGrid}>
        <div style={S.statCard}>
          <div style={S.statLabel}>Slot Hari Ini</div>
          <div style={S.statValue}>{todaySlots.length}</div>
          <div style={S.statDesc}>
            {todayPending} pending • {todayCompleted} selesai • {todayCancelled} batal
          </div>
        </div>

        <div style={S.statCard}>
          <div style={S.statLabel}>Total Durasi</div>
          <div style={S.statValue}>{totalDuration}</div>
          <div style={S.statDesc}>Menit teralokasi hari ini</div>
        </div>

        <div style={S.statCard}>
          <div style={S.statLabel}>Total Booking</div>
          <div style={S.statValue}>{slots.length}</div>
          <div style={S.statDesc}>
            Semua slot database {autoCompleted > 0 && `• ${autoCompleted} auto-unlock`}
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>
          <i className="bi bi-info-circle-fill" />
          Quick Info
        </div>
        <ul style={{ color: "#adb5bd", fontSize: "0.88rem", lineHeight: 1.8, paddingLeft: "1.25rem" }}>
          <li>Gunakan menu <strong style={{ color: "#ffc107" }}>Kelola Slot</strong> untuk mengunci/unlock slot waktu</li>
          <li>Slot yang dikunci otomatis disabled di form publik dengan buffer 20 menit</li>
          <li>Lihat <strong style={{ color: "#ffc107" }}>Riwayat Booking</strong> untuk data lengkap semua slot</li>
          <li>Atur PIN admin dan nomor WhatsApp di menu <strong style={{ color: "#ffc107" }}>Pengaturan</strong></li>
        </ul>
      </div>
    </div>
  );
}

function SlotManagement({ slots, onAddSlot, onDeleteSlot }) {
  const [tanggalManual, setTanggalManual] = useState(getTodayStr());
  const [jamMulai, setJamMulai] = useState(generateTimeSlots()[0]);
  const [durasiMenit, setDurasiMenit] = useState(60);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const today = getTodayStr();
  const todaySlots = slots.filter((s) => s.tanggal === tanggalManual).sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));

  const handleAdd = async () => {
    setLoading(true);
    setMsg(null);
    try {
      await onAddSlot(tanggalManual, jamMulai, durasiMenit);
      setMsg({ type: "success", text: `Slot ${jamMulai} berhasil dikunci!` });
    } catch (e) {
      setMsg({ type: "danger", text: `Error: ${e.message}` });
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={S.header}>
        <h1 style={S.title}>Kelola Slot Booking</h1>
      </div>

      {/* Add form */}
      <div style={S.card}>
        <div style={S.cardTitle}>
          <i className="bi bi-plus-circle-fill" />
          Kunci Slot Manual
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ color: "#6c757d", fontSize: "0.8rem", marginBottom: "0.5rem", display: "block" }}>Tanggal</label>
            <input
              type="date"
              value={tanggalManual}
              onChange={(e) => setTanggalManual(e.target.value)}
              style={S.input}
              min={today}
            />
          </div>

          <div>
            <label style={{ color: "#6c757d", fontSize: "0.8rem", marginBottom: "0.5rem", display: "block" }}>Jam Mulai</label>
            <select style={S.select} value={jamMulai} onChange={(e) => setJamMulai(e.target.value)}>
              {generateTimeSlots().map((t) => (
                <option key={t} value={t}>{t} WIB</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: "#6c757d", fontSize: "0.8rem", marginBottom: "0.5rem", display: "block" }}>Durasi (menit)</label>
            <input
              type="number"
              min="10"
              max="300"
              step="5"
              value={durasiMenit}
              onChange={(e) => setDurasiMenit(e.target.value)}
              style={S.input}
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button style={{ ...S.btn, width: "100%" }} onClick={handleAdd} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-lock-fill" /> Kunci Slot</>}
            </button>
          </div>
        </div>

        {msg && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              fontSize: "0.85rem",
              background: msg.type === "success" ? "rgba(74,222,128,0.12)" : "rgba(220,53,69,0.12)",
              color: msg.type === "success" ? "#4ade80" : "#dc3545",
              border: `1px solid ${msg.type === "success" ? "rgba(74,222,128,0.3)" : "rgba(220,53,69,0.3)"}`,
            }}
          >
            {msg.text}
          </div>
        )}
      </div>

      {/* Slot list */}
      <div style={S.card}>
        <div style={S.cardTitle}>
          <i className="bi bi-list-check" />
          Slot Terkunci Hari Ini ({todaySlots.length})
        </div>

        {todaySlots.length === 0 ? (
          <p style={{ color: "#6c757d", fontSize: "0.88rem" }}>Belum ada slot yang dikunci hari ini.</p>
        ) : (
          <div style={S.tableWrapper}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Jam Mulai</th>
                  <th style={S.th}>Durasi</th>
                  <th style={S.th}>Jam Selesai (Est.)</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {todaySlots.map((slot) => {
                  const [h, m] = slot.jamMulai.split(":").map(Number);
                  const endMin = h * 60 + m + Number(slot.durasiMenit);
                  const endH = Math.floor(endMin / 60);
                  const endM = endMin % 60;
                  const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

                  return (
                    <tr key={slot.id}>
                      <td style={S.td}>
                        <strong style={{ color: "#ffc107" }}>{slot.jamMulai}</strong> WIB
                      </td>
                      <td style={S.td}>{slot.durasiMenit} menit</td>
                      <td style={S.td}>{endTime} WIB</td>
                      <td style={S.td}>
                        <span style={{ ...S.badge, ...S.badgeDanger }}>
                          <i className="bi bi-lock-fill" /> Terkunci
                        </span>
                      </td>
                      <td style={S.td}>
                        <button
                          style={{ ...S.btn, ...S.btnDanger, padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                          onClick={() => onDeleteSlot(slot.id, slot.jamMulai)}
                        >
                          <i className="bi bi-trash3-fill" /> Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingHistory({ slots }) {
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState(null);

  const today = getTodayStr();
  
  // Enhanced filters
  const getFilteredSlots = () => {
    switch (filter) {
      case "today":
        return slots.filter((s) => s.tanggal === today);
      case "completed":
        return slots.filter((s) => s.tanggal === today && (s.status === "selesai" || s.status === "batal"));
      case "pending":
        return slots.filter((s) => s.tanggal === today && s.status === "pending");
      case "cancelled":
        return slots.filter((s) => s.status === "batal");
      default:
        return slots;
    }
  };

  const filtered = getFilteredSlots();
  const sorted = [...filtered].sort((a, b) => {
    const dateCompare = b.tanggal.localeCompare(a.tanggal);
    return dateCompare !== 0 ? dateCompare : b.jamMulai.localeCompare(a.jamMulai);
  });

  const handleUpdateStatus = async (id, newStatus, reason = "") => {
    const statusText = newStatus === "selesai" ? "SELESAI" : "BATAL";
    const confirmText = reason ? 
      `${statusText} dengan alasan: ${reason}?` : 
      `Ubah status menjadi ${statusText}?`;
      
    if (!window.confirm(confirmText)) return;
    
    setUpdating(id);
    try {
      const updateData = { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      
      if (newStatus === "batal" && reason) {
        updateData.cancelReason = reason;
        updateData.cancelledAt = new Date().toISOString();
      } else if (newStatus === "selesai") {
        updateData.completedAt = new Date().toISOString();
      }
      
      await updateDoc(doc(db, "booked_slots", id), updateData);
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
    setUpdating(null);
  };

  const handleCancel = (slot) => {
    const reason = prompt("Alasan pembatalan (opsional):", "Dibatalkan oleh admin");
    if (reason !== null) { // null means user clicked Cancel
      handleUpdateStatus(slot.id, "batal", reason);
    }
  };

  return (
    <div>
      <div style={S.header}>
        <h1 style={S.title}>Riwayat Booking</h1>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            style={{ ...S.btn, ...(filter === "all" ? {} : S.btnSecondary), fontSize: "0.75rem", padding: "0.5rem 0.75rem" }}
            onClick={() => setFilter("all")}
          >
            Semua ({slots.length})
          </button>
          <button
            style={{ ...S.btn, ...(filter === "today" ? {} : S.btnSecondary), fontSize: "0.75rem", padding: "0.5rem 0.75rem" }}
            onClick={() => setFilter("today")}
          >
            Hari Ini ({slots.filter((s) => s.tanggal === today).length})
          </button>
          <button
            style={{ ...S.btn, ...(filter === "pending" ? {} : S.btnSecondary), fontSize: "0.75rem", padding: "0.5rem 0.75rem" }}
            onClick={() => setFilter("pending")}
          >
            <i className="bi bi-clock" /> Pending ({slots.filter((s) => s.tanggal === today && s.status === "pending").length})
          </button>
          <button
            style={{ ...S.btn, ...(filter === "completed" ? {} : S.btnSecondary), fontSize: "0.75rem", padding: "0.5rem 0.75rem" }}
            onClick={() => setFilter("completed")}
          >
            <i className="bi bi-check-circle" /> Selesai Hari Ini ({slots.filter((s) => s.tanggal === today && (s.status === "selesai" || s.status === "batal")).length})
          </button>
          <button
            style={{ ...S.btn, ...(filter === "cancelled" ? {} : S.btnSecondary), fontSize: "0.75rem", padding: "0.5rem 0.75rem" }}
            onClick={() => setFilter("cancelled")}
          >
            <i className="bi bi-x-circle" /> Dibatalkan ({slots.filter((s) => s.status === "batal").length})
          </button>
        </div>
      </div>

      <div style={S.card}>
        {sorted.length === 0 ? (
          <p style={{ color: "#6c757d" }}>Belum ada data booking.</p>
        ) : (
          <div style={S.tableWrapper}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Waktu & Nama</th>
                  <th style={S.th}>Rute Perjalanan</th>
                  <th style={S.th}>Harga</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((slot) => {
                  const st = slot.status || "pending";
                  let badgeStyle = { ...S.badge, background: "rgba(255,193,7,0.15)", color: "#ffc107", border: "1px solid rgba(255,193,7,0.3)" };
                  let icon = "bi-clock-history";
                  let stText = "Pending";
                  
                  if (st === "selesai") {
                    badgeStyle = { ...S.badge, ...S.badgeSuccess };
                    icon = "bi-check-circle-fill";
                    stText = "Selesai";
                  } else if (st === "batal") {
                    badgeStyle = { ...S.badge, ...S.badgeDanger };
                    icon = "bi-x-circle-fill";
                    stText = "Batal";
                  }

                  return (
                    <tr key={slot.id} style={{ opacity: st === "batal" ? 0.6 : 1 }}>
                      <td style={S.td}>
                        <div style={{ color: "#adb5bd", fontSize: "0.75rem", marginBottom: "0.2rem" }}>{slot.tanggal}</div>
                        <div>
                          <strong style={{ color: "#ffc107", fontSize: "1rem" }}>{slot.jamMulai}</strong> WIB
                        </div>
                        <div style={{ fontWeight: 600, color: "#e0e0e0", marginTop: "0.2rem" }}>
                          {slot.nama || "Tanpa Nama"}
                        </div>
                      </td>
                      <td style={S.td}>
                        <div style={{ fontSize: "0.8rem", color: "#adb5bd", marginBottom: "0.3rem", maxWidth: "250px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <i className="bi bi-geo-alt-fill text-warning" /> {slot.lokasiJemput || "-"}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#adb5bd", maxWidth: "250px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <i className="bi bi-flag-fill text-success" /> {slot.lokasiTujuan || "-"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#6c757d", marginTop: "0.3rem" }}>Est: ±{slot.durasiMenit} menit</div>
                      </td>
                      <td style={S.td}>
                        <strong style={{ color: "#4ade80" }}>{slot.totalHarga ? formatRupiah(slot.totalHarga) : "-"}</strong>
                      </td>
                      <td style={S.td}>
                        <span style={badgeStyle}>
                          <i className={`bi ${icon}`} /> {stText}
                        </span>
                      </td>
                      <td style={S.td}>
                        {st === "pending" && (
                          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                            <button
                              style={{ 
                                ...S.btn, 
                                padding: "0.3rem 0.6rem", 
                                fontSize: "0.7rem", 
                                background: "linear-gradient(135deg, #4ade80, #16a34a)", 
                                color: "#fff",
                                minWidth: "auto"
                              }}
                              onClick={() => handleUpdateStatus(slot.id, "selesai")}
                              disabled={updating === slot.id}
                              title="Tandai Selesai"
                            >
                              <i className="bi bi-check-lg" />
                            </button>
                            <button
                              style={{ 
                                ...S.btn, 
                                ...S.btnDanger, 
                                padding: "0.3rem 0.6rem", 
                                fontSize: "0.7rem",
                                minWidth: "auto"
                              }}
                              onClick={() => handleCancel(slot)}
                              disabled={updating === slot.id}
                              title="Batalkan Booking"
                            >
                              <i className="bi bi-x-lg" />
                            </button>
                          </div>
                        )}
                        {st === "selesai" && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <span style={{ fontSize: "0.7rem", color: "#4ade80" }}>
                              <i className="bi bi-check-circle-fill" />
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#6c757d" }}>
                              {slot.autoCompleted ? "Auto" : "Manual"}
                            </span>
                          </div>
                        )}
                        {st === "batal" && (
                          <div>
                            <div style={{ fontSize: "0.7rem", color: "#dc3545", marginBottom: "0.2rem" }}>
                              <i className="bi bi-x-circle-fill" /> Dibatalkan
                            </div>
                            {slot.cancelReason && (
                              <div style={{ fontSize: "0.65rem", color: "#6c757d", fontStyle: "italic" }}>
                                "{slot.cancelReason}"
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Settings() {
  const [waNumber, setWaNumber] = useState(() => localStorage.getItem("admin_wa_number") || "6282310699436");
  const [adminPin, setAdminPin] = useState(() => localStorage.getItem("admin_pin") || "1234");
  const [driverLocation, setDriverLocation] = useState(() => {
    const stored = localStorage.getItem("admin_driver_location");
    return stored ? JSON.parse(stored) : null;
  });
  const [gettingLocation, setGettingLocation] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGetDriverLocation = () => {
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
          const addressName = data.name || data.address?.road || "Lokasi Driver";
          const suburb = data.address?.suburb || data.address?.village || "";
          const city = data.address?.city || data.address?.town || data.address?.county || "";
          
          let fullAddr = addressName;
          if (suburb) fullAddr += `, ${suburb}`;
          if (city) fullAddr += `, ${city}`;
          
          const locationData = {
            lat,
            lng,
            name: addressName,
            address: fullAddr
          };
          setDriverLocation(locationData);
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

  const handleSave = () => {
    // Simpan ke localStorage atau Firestore
    localStorage.setItem("admin_wa_number", waNumber);
    localStorage.setItem("admin_pin", adminPin);
    if (driverLocation) {
      localStorage.setItem("admin_driver_location", JSON.stringify(driverLocation));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div style={S.header}>
        <h1 style={S.title}>Pengaturan</h1>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>
          <i className="bi bi-gear-fill" />
          Konfigurasi Aplikasi
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ color: "#adb5bd", fontSize: "0.82rem", marginBottom: "0.5rem", display: "block" }}>
            Nomor WhatsApp (format: 628xxx)
          </label>
          <input
            type="text"
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
            style={S.input}
            placeholder="628123456789"
          />
          <p style={{ color: "#6c757d", fontSize: "0.75rem", marginTop: "0.4rem" }}>
            Nomor ini akan digunakan untuk tombol "Pesan via WhatsApp" di form publik.
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ color: "#adb5bd", fontSize: "0.82rem", marginBottom: "0.5rem", display: "block" }}>
            PIN Admin Baru
          </label>
          <input
            type="password"
            value={adminPin}
            onChange={(e) => setAdminPin(e.target.value)}
            style={S.input}
            placeholder="Masukkan PIN baru"
          />
          <p style={{ color: "#6c757d", fontSize: "0.75rem", marginTop: "0.4rem" }}>
            Ganti PIN untuk akses admin panel. Minimal 4 karakter.
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ color: "#adb5bd", fontSize: "0.82rem", marginBottom: "0.5rem", display: "block" }}>
            <i className="bi bi-geo-alt-fill" /> Lokasi Driver (untuk perhitungan jarak jemput)
          </label>
          
          {driverLocation ? (
            <div style={{ 
              background: "rgba(74,222,128,0.08)", 
              border: "1px solid rgba(74,222,128,0.3)", 
              borderRadius: "10px", 
              padding: "0.85rem 1rem",
              marginBottom: "0.75rem"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <i className="bi bi-check-circle-fill" style={{ color: "#4ade80", fontSize: "1.1rem" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#4ade80", fontWeight: 600, fontSize: "0.9rem" }}>
                    Lokasi Tersimpan
                  </div>
                  <div style={{ color: "#adb5bd", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                    {driverLocation.address}
                  </div>
                  <div style={{ color: "#6c757d", fontSize: "0.7rem", marginTop: "0.25rem" }}>
                    Koordinat: {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDriverLocation(null)}
                style={{
                  background: "rgba(220,53,69,0.15)",
                  border: "1px solid rgba(220,53,69,0.3)",
                  color: "#dc3545",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <i className="bi bi-trash3-fill" />
                Hapus Lokasi
              </button>
            </div>
          ) : (
            <div style={{
              background: "rgba(255,193,7,0.08)",
              border: "1px solid rgba(255,193,7,0.3)",
              borderRadius: "10px",
              padding: "0.85rem 1rem",
              marginBottom: "0.75rem",
              color: "#ffc107",
              fontSize: "0.82rem"
            }}>
              <i className="bi bi-exclamation-triangle-fill" /> Lokasi driver belum diatur. Biaya jemput akan dihitung dari 0 km.
            </div>
          )}

          <button 
            onClick={handleGetDriverLocation} 
            disabled={gettingLocation}
            style={{ 
              background: gettingLocation ? "#3a3f47" : "rgba(16, 185, 129, 0.15)", 
              border: `1px solid ${gettingLocation ? "#3a3f47" : "rgba(16, 185, 129, 0.3)"}`,
              color: gettingLocation ? "#6c757d" : "#4ade80", 
              padding: "0.65rem 1.25rem", 
              borderRadius: "10px", 
              fontSize: "0.88rem",
              fontWeight: 700,
              cursor: gettingLocation ? "wait" : "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem",
              width: "100%",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
          >
            {gettingLocation ? (
              <>
                <span className="spinner-border spinner-border-sm" style={{ width: "14px", height: "14px", borderWidth: "2px" }} />
                Mendapatkan GPS...
              </>
            ) : (
              <>
                <i className="bi bi-crosshair" />
                {driverLocation ? "Perbarui Lokasi GPS" : "Set Lokasi GPS Saya"}
              </>
            )}
          </button>
          
          <p style={{ color: "#6c757d", fontSize: "0.75rem", marginTop: "0.4rem" }}>
            Lokasi ini akan digunakan sebagai titik awal untuk menghitung "Biaya Jemput" ke customer.
          </p>
        </div>

        <button style={S.btn} onClick={handleSave}>
          <i className="bi bi-save-fill" />
          Simpan Pengaturan
        </button>

        {saved && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              background: "rgba(74,222,128,0.12)",
              color: "#4ade80",
              fontSize: "0.85rem",
              border: "1px solid rgba(74,222,128,0.3)",
            }}
          >
            <i className="bi bi-check-circle-fill" /> Pengaturan berhasil disimpan!
          </div>
        )}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>
          <i className="bi bi-info-circle-fill" />
          Informasi Sistem
        </div>
        <table style={{ width: "100%", fontSize: "0.88rem" }}>
          <tbody>
            <tr>
              <td style={{ padding: "0.5rem 0", color: "#6c757d" }}>Versi App</td>
              <td style={{ padding: "0.5rem 0", color: "#e0e0e0", fontWeight: 600 }}>v1.0.0</td>
            </tr>
            <tr>
              <td style={{ padding: "0.5rem 0", color: "#6c757d" }}>Firebase Project</td>
              <td style={{ padding: "0.5rem 0", color: "#e0e0e0", fontWeight: 600 }}>anjemkuy-1451d</td>
            </tr>
            <tr>
              <td style={{ padding: "0.5rem 0", color: "#6c757d" }}>Environment</td>
              <td style={{ padding: "0.5rem 0", color: "#e0e0e0", fontWeight: 600 }}>Development</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────
export default function AdminDashboard() {
  const { isAuthenticated, loading, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Firestore real-time listener
  useEffect(() => {
    const q = query(collection(db, "booked_slots"), orderBy("tanggal", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSlots(data);
        setLoadingSlots(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoadingSlots(false);
      }
    );
    return () => unsub();
  }, []);

  // Auto-unlock completed slots system
  useEffect(() => {
    const checkAutoUnlock = async () => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      const toUpdate = slots.filter(slot => {
        // Only check today's pending slots
        if (slot.tanggal !== today || slot.status !== "pending") return false;
        
        const [startH, startM] = slot.jamMulai.split(":").map(Number);
        const endTime = new Date();
        endTime.setHours(startH, startM + slot.durasiMenit + 20, 0, 0); // +20 buffer

        // If current time > end time + buffer, slot should be auto-completed
        return now >= endTime;
      });

      // Update slots that are past their completion time
      for (const slot of toUpdate) {
        try {
          await updateDoc(doc(db, "booked_slots", slot.id), { 
            status: "selesai",
            autoCompleted: true,
            completedAt: new Date().toISOString(),
            note: "Auto-completed after duration ended"
          });
          console.log(`✅ Auto-completed slot: ${slot.jamMulai} (${slot.durasiMenit}min + 20min buffer ended)`);
        } catch (error) {
          console.error("Error auto-completing slot:", error);
        }
      }
    };

    // Check every 2 minutes for auto-unlock
    const interval = setInterval(checkAutoUnlock, 120000);
    
    // Initial check after slots are loaded
    if (slots.length > 0 && !loadingSlots) {
      checkAutoUnlock();
    }

    return () => clearInterval(interval);
  }, [slots, loadingSlots]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/admin/login", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleAddSlot = async (tanggal, jamMulai, durasiMenit) => {
    await addDoc(collection(db, "booked_slots"), {
      tanggal,
      jamMulai,
      durasiMenit: Number(durasiMenit),
      status: "pending",
      nama: "Manual Admin Lock",
      createdAt: new Date().toISOString()
    });
  };

  const handleDeleteSlot = async (id, jam) => {
    if (!window.confirm(`Hapus slot ${jam}?`)) return;
    await deleteDoc(doc(db, "booked_slots", id));
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  if (loading || loadingSlots) {
    return (
      <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div style={S.root}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{ ...S.mobileHeader, display: "flex" }} className="admin-mobile-header">
          <button style={S.hamburger} onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
            <i className={`bi ${sidebarOpen ? "bi-x-lg" : "bi-list"}`} />
          </button>
          <div style={{ color: "#ffc107", fontWeight: 700, fontSize: "1.1rem" }}>
            <i className="bi bi-motorcycle" /> Anjem Kuy
          </div>
          <div style={{ width: "40px" }} />
        </div>
      )}

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          style={{ ...S.overlay, ...S.overlayVisible }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        currentPath={location.pathname}
        onNavigate={navigate}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div style={{ ...S.main, ...(isMobile ? S.mainMobile : {}) }}>
        <Routes>
          <Route path="/" element={<DashboardHome slots={slots} />} />
          <Route path="/slots" element={<SlotManagement slots={slots} onAddSlot={handleAddSlot} onDeleteSlot={handleDeleteSlot} />} />
          <Route path="/bookings" element={<BookingHistory slots={slots} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}
