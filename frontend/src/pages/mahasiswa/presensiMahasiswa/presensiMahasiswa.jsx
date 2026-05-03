import React, { useState, useEffect, useRef } from "react";
import "../../../shared.css";
import "./presensiMahasiswa.css";
import Sidebar from "../../../Sidebar";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";
import { apiClient } from "../../../utils/apiClient";

const HISTORY = [];

function StatusBadge({ status }) {
  const map = {
    Hadir: { bg: "#ecfdf5", color: "#059669" },
    Sakit: { bg: "#eff6ff", color: "#4b53bc" },
    Izin:  { bg: "#fff8ed", color: "#c47f17" },
    Alpa:  { bg: "#fff1f2", color: "#dc2626" },
  };
  const s = map[status] ?? map.Alpa;
  return (
    <span className="pmh-status-badge" style={{ backgroundColor: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

export default function PresensiMahasiswa({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  // scan states: idle | scanning | success | error
  const [scanState, setScanState]   = useState("idle");
  const [selectedClass, setSelectedClass] = useState(0); 
  const [toast, setToast]           = useState(null);   
  const [scanCode, setScanCode]     = useState("");
  const [upcoming, setUpcoming]     = useState([]);
  const [history, setHistory]       = useState([]);
  const scanTimeoutRef              = useRef(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiClient.get('/api/mata-kuliah');
        const formatted = res.map((c) => ({
          id: c.idMataKuliah,
          code: `MK${c.idMataKuliah.toString().padStart(3, '0')}`,
          name: c.namaMataKuliah,
          time: "08:00 - 10:30",
          room: "Ruang Kelas",
          dosen: "Dosen Pengampu"
        }));
        setUpcoming(formatted);
      } catch (error) {
        console.error("Failed to load courses");
      }
    };
    fetchCourses();
  }, []);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(scanTimeoutRef.current), []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (upcoming.length > 0 && upcoming[selectedClass]) {
        try {
          const res = await apiClient.get(`/api/presensi/mata-kuliah/${upcoming[selectedClass].id}`);
          // Format respons untuk UI
          const formattedHist = res.data.map(h => ({
            date: new Date(h.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }),
            code: upcoming[selectedClass].code,
            name: upcoming[selectedClass].name,
            status: h.status.charAt(0).toUpperCase() + h.status.slice(1).toLowerCase(),
            time: "08:00"
          }));
          setHistory(formattedHist);
        } catch (error) {
          setHistory([]);
        }
      }
    };
    fetchHistory();
  }, [selectedClass, upcoming]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const startScan = () => {
    setScanState("scanning");
    scanTimeoutRef.current = setTimeout(async () => {
      try {
        if (!upcoming[selectedClass]) throw new Error("Pilih kelas terlebih dahulu");
        // Simulate a token we read from camera
        const simToken = `LeMaS-${Date.now()}`;
        await apiClient.post("/api/presensi/scan", {
          idMataKuliah: upcoming[selectedClass].id,
          token: simToken
        });
        setScanState("success");
        showToast("success", `Absen berhasil! ${upcoming[selectedClass].name}`);
      } catch (error) {
        setScanState("error");
        showToast("error", error.message || "Gagal melakukan presensi");
        setTimeout(() => setScanState("idle"), 2000);
      }
    }, 2400);
  };

  const handleManualInput = (e) => {
    setScanCode(e.target.value);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!scanCode.trim() || !upcoming[selectedClass]) return;
    
    setScanState("scanning");
    try {
      await apiClient.post("/api/presensi/scan", {
        idMataKuliah: upcoming[selectedClass].id,
        token: scanCode.trim()
      });
      setScanState("success");
      showToast("success", `Absen berhasil! ${upcoming[selectedClass].name}`);
    } catch (error) {
      setScanState("error");
      showToast("error", error.message || "Kode QR tidak valid. Silakan coba lagi.");
      setTimeout(() => setScanState("idle"), 2000);
    }
    setScanCode("");
  };

  const resetScan = () => {
    clearTimeout(scanTimeoutRef.current);
    setScanState("idle");
  };

  return (
    <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
      {/* Sidebar */}
      <Sidebar onNavigate={onNavigate} onLogout={onLogout} activePage="presensiMahasiswa" mobileOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main */}
      <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
        <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} onNavigate={typeof nav !== "undefined" ? nav : (typeof onNavigate !== "undefined" ? onNavigate : undefined)} />

        {/* ── Toast Notification ── */}
        {toast && (
          <div className={`pmh-toast pmh-toast--${toast.type}`}>
            <span className="material-symbols-outlined">
              {toast.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{toast.msg}</span>
          </div>
        )}

        <div className="page-content">
          {/* Page header */}
          <div className="pmh-page-header">
            <div>
              <h2 className="pmh-title">Presensi Kehadiran</h2>
              <p className="pmh-subtitle">Pindai kode QR dari dosen untuk mencatat kehadiran Anda</p>
            </div>
          </div>

          <div className="pmh-main-grid">
            {/* Left: Scanner */}
            <div className="pmh-scanner-col">
              {/* Class selector */}
              <div className="pmh-class-selector">
                <p className="pmh-class-selector-label">Pilih Kelas yang Sedang Berlangsung</p>
                <div className="pmh-class-tabs">
                  {upcoming.length > 0 ? upcoming.map((c, i) => (
                    <button
                      key={i}
                      className={`pmh-class-tab ${selectedClass === i ? "pmh-class-tab--active" : ""}`}
                      onClick={() => { setSelectedClass(i); resetScan(); }}
                    >
                      <span className="pmh-class-tab-code">{c.code}</span>
                      <span className="pmh-class-tab-name">{c.name}</span>
                      <span className="pmh-class-tab-time">{c.time}</span>
                    </button>
                  )) : (
                    <p style={{ color: "var(--slate-500)" }}>Tidak ada kelas aktif</p>
                  )}
                </div>
              </div>

              {/* Scanner card */}
              <div className="pmh-scanner-card">
                {/* State: idle */}
                {scanState === "idle" && (
                  <>
                    <div className="pmh-viewfinder pmh-viewfinder--idle">
                      <div className="pmh-vf-corner pmh-vf-corner--tl"></div>
                      <div className="pmh-vf-corner pmh-vf-corner--tr"></div>
                      <div className="pmh-vf-corner pmh-vf-corner--bl"></div>
                      <div className="pmh-vf-corner pmh-vf-corner--br"></div>
                      <div className="pmh-vf-inner">
                        <span className="material-symbols-outlined pmh-vf-icon">qr_code_scanner</span>
                        <p>Arahkan kamera ke QR Code</p>
                      </div>
                    </div>
                    <button className="pmh-scan-btn" onClick={startScan}>
                      <span className="material-symbols-outlined">photo_camera</span>
                      Pindai QR Code
                    </button>
                  </>
                )}

                {/* State: scanning */}
                {scanState === "scanning" && (
                  <>
                    <div className="pmh-viewfinder pmh-viewfinder--scanning">
                      <div className="pmh-vf-corner pmh-vf-corner--tl pmh-corner--active"></div>
                      <div className="pmh-vf-corner pmh-vf-corner--tr pmh-corner--active"></div>
                      <div className="pmh-vf-corner pmh-vf-corner--bl pmh-corner--active"></div>
                      <div className="pmh-vf-corner pmh-vf-corner--br pmh-corner--active"></div>
                      <div className="pmh-scan-line"></div>
                      <div className="pmh-vf-inner pmh-vf-inner--scanning">
                        <span className="material-symbols-outlined" style={{ fontSize: "2.5rem", color: "rgba(255,255,255,0.7)" }}>
                          qr_code_2
                        </span>
                        <p>Memindai...</p>
                      </div>
                    </div>
                    <button className="pmh-cancel-btn" onClick={resetScan}>
                      Batalkan
                    </button>
                  </>
                )}

                {/* State: success */}
                {scanState === "success" && (
                  <>
                    <div className="pmh-viewfinder pmh-viewfinder--success">
                      <div className="pmh-success-ring">
                        <span className="material-symbols-outlined pmh-success-icon">check_circle</span>
                      </div>
                      <div className="pmh-success-info">
                        <p className="pmh-success-title">Absen Berhasil!</p>
                        <p className="pmh-success-sub">{upcoming[selectedClass]?.name}</p>
                        <p className="pmh-success-time">
                          {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        </p>
                      </div>
                    </div>
                    <button className="pmh-scan-btn" style={{ backgroundColor: "var(--color-secondary)" }} onClick={resetScan}>
                      <span className="material-symbols-outlined">refresh</span>
                      Pindai Lagi
                    </button>
                  </>
                )}

                {/* State: error */}
                {scanState === "error" && (
                  <div className="pmh-viewfinder pmh-viewfinder--error">
                    <span className="material-symbols-outlined pmh-error-icon">error</span>
                    <p>Kode tidak valid</p>
                  </div>
                )}

                {/* Manual code input (demo helper) */}
                <div className="pmh-manual-section">
                  <p className="pmh-manual-hint">
                    <span className="material-symbols-outlined">info</span>
                    Demo: masukkan kode yang diawali <code>LeMaS-</code> untuk simulasi scan sukses
                  </p>
                  <form className="pmh-manual-form" onSubmit={handleManualSubmit}>
                    <input
                      className="pmh-manual-input"
                      type="text"
                      placeholder="Masukkan kode QR secara manual..."
                      value={scanCode}
                      onChange={handleManualInput}
                    />
                    <button className="pmh-manual-submit" type="submit">
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right: Info + History */}
            <div className="pmh-right-col">
              {/* Session info */}
              <div className="pmh-session-card">
                <div className="pmh-session-top">
                  <span className="pmh-session-chip">SESI AKTIF</span>
                  <span className="pmh-live-dot">
                    <span className="pmh-live-pulse"></span>
                    LIVE
                  </span>
                </div>
                <h3 className="pmh-session-name">{upcoming[selectedClass]?.name || "Memuat..."}</h3>
                <div className="pmh-session-details">
                  <div className="pmh-detail-row">
                    <span className="material-symbols-outlined">schedule</span>
                    <span>{upcoming[selectedClass]?.time || "-"} WIB</span>
                  </div>
                  <div className="pmh-detail-row">
                    <span className="material-symbols-outlined">location_on</span>
                    <span>{upcoming[selectedClass]?.room || "-"}</span>
                  </div>
                  <div className="pmh-detail-row">
                    <span className="material-symbols-outlined">person</span>
                    <span>{upcoming[selectedClass]?.dosen || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Attendance summary */}
              <div className="pmh-summary-card">
                <h4 className="pmh-summary-title">Rekap Kehadiran Semester</h4>
                <div className="pmh-summary-ring-wrap">
                  <div className="pmh-ring-chart">
                    <svg viewBox="0 0 80 80" className="pmh-ring-svg">
                      <circle cx="40" cy="40" r="30" fill="none" stroke="#e2e8f0" strokeWidth="10"/>
                      <circle cx="40" cy="40" r="30" fill="none" stroke="#2f9696" strokeWidth="10"
                        strokeDasharray={`${(12/16)*188} 188`}
                        strokeDashoffset="47"
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                    <div className="pmh-ring-label">
                      <span className="pmh-ring-pct">75%</span>
                      <span className="pmh-ring-sub">Kehadiran</span>
                    </div>
                  </div>
                  <div className="pmh-summary-stats">
                    <div className="pmh-sum-item">
                      <span className="pmh-sum-dot" style={{ backgroundColor: "#2f9696" }}></span>
                      <span className="pmh-sum-label">Hadir</span>
                      <span className="pmh-sum-val">12</span>
                    </div>
                    <div className="pmh-sum-item">
                      <span className="pmh-sum-dot" style={{ backgroundColor: "#c47f17" }}></span>
                      <span className="pmh-sum-label">Izin</span>
                      <span className="pmh-sum-val">2</span>
                    </div>
                    <div className="pmh-sum-item">
                      <span className="pmh-sum-dot" style={{ backgroundColor: "#4b53bc" }}></span>
                      <span className="pmh-sum-label">Sakit</span>
                      <span className="pmh-sum-val">1</span>
                    </div>
                    <div className="pmh-sum-item">
                      <span className="pmh-sum-dot" style={{ backgroundColor: "#dc2626" }}></span>
                      <span className="pmh-sum-label">Alpa</span>
                      <span className="pmh-sum-val">1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* History */}
              <div className="pmh-history-card">
                <h4 className="pmh-history-title">Riwayat Kehadiran</h4>
                <div className="pmh-history-list">
                  {history.length > 0 ? history.map((h, i) => (
                    <div key={i} className="pmh-history-item">
                      <div className="pmh-history-left">
                        <p className="pmh-history-course">{h.code} — {h.name}</p>
                        <p className="pmh-history-date">{h.date} · {h.time}</p>
                      </div>
                      <StatusBadge status={h.status} />
                    </div>
                  )) : (
                    <p style={{ color: "var(--slate-500)", textAlign: "center", padding: "1rem" }}>Belum ada riwayat kehadiran.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
