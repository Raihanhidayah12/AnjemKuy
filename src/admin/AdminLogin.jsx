// ============================================================
// src/admin/AdminLogin.jsx
// Admin login page
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "./AdminAuthContext";

const S = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f1114 0%, #1a1d23 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
    padding: "1rem",
  },
  card: {
    background: "#1e2227",
    border: "1px solid #2d3139",
    borderRadius: "20px",
    padding: "2.5rem",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  logo: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  icon: {
    fontSize: "3.5rem",
    color: "#ffc107",
    marginBottom: "1rem",
  },
  title: {
    color: "#ffc107",
    fontSize: "1.8rem",
    fontWeight: 800,
    marginBottom: "0.25rem",
  },
  subtitle: {
    color: "#6c757d",
    fontSize: "0.88rem",
  },
  label: {
    color: "#adb5bd",
    fontSize: "0.82rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    background: "#13161a",
    border: "1px solid #3a3f47",
    borderRadius: "12px",
    color: "#e0e0e0",
    padding: "0.85rem 1rem",
    fontSize: "1.1rem",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    letterSpacing: "0.3em",
    textAlign: "center",
    fontWeight: 600,
  },
  inputFocus: {
    borderColor: "#ffc107",
    boxShadow: "0 0 0 3px rgba(255,193,7,0.15)",
  },
  error: {
    background: "rgba(220,53,69,0.12)",
    border: "1px solid rgba(220,53,69,0.3)",
    borderRadius: "10px",
    color: "#dc3545",
    padding: "0.65rem 1rem",
    fontSize: "0.85rem",
    marginTop: "0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  btn: {
    background: "linear-gradient(135deg, #ffc107, #e6a800)",
    color: "#212529",
    border: "none",
    borderRadius: "12px",
    padding: "0.9rem",
    fontWeight: 700,
    fontSize: "1rem",
    width: "100%",
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.1s",
    marginTop: "1.5rem",
    letterSpacing: "0.02em",
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  backLink: {
    textAlign: "center",
    marginTop: "1.5rem",
  },
  link: {
    color: "#6c757d",
    textDecoration: "none",
    fontSize: "0.88rem",
    transition: "color 0.2s",
  },
};

export default function AdminLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAdminAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    setTimeout(() => {
      const success = login(pin);
      if (success) {
        navigate("/admin", { replace: true });
      } else {
        setError(true);
        setPin("");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={S.logo}>
          <div style={S.icon}>
            <i className="bi bi-shield-lock-fill" />
          </div>
          <h1 style={S.title}>Admin Panel</h1>
          <p style={S.subtitle}>Anjem Kuy Dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={S.label} htmlFor="pin">
            Masukkan PIN
          </label>
          <input
            id="pin"
            type="password"
            maxLength={6}
            placeholder="••••"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ ...S.input, ...(focused ? S.inputFocus : {}) }}
            autoFocus
            disabled={loading}
          />

          {error && (
            <div style={S.error}>
              <i className="bi bi-exclamation-circle-fill" />
              <span>PIN salah. Silakan coba lagi.</span>
            </div>
          )}

          <button
            type="submit"
            style={{ ...S.btn, ...(loading || !pin ? S.btnDisabled : {}) }}
            disabled={loading || !pin}
            onMouseOver={(e) => !loading && pin && (e.currentTarget.style.opacity = "0.88")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Memverifikasi...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2" />
                Masuk
              </>
            )}
          </button>
        </form>

        <div style={S.backLink}>
          <a
            href="/"
            style={S.link}
            onMouseOver={(e) => (e.currentTarget.style.color = "#ffc107")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#6c757d")}
          >
            <i className="bi bi-arrow-left me-2" />
            Kembali ke halaman utama
          </a>
        </div>
      </div>
    </div>
  );
}
