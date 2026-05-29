import React, { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "../../../components/shared.css";
import "./presensiMahasiswa.css";
import Sidebar from "../../../components/Sidebar";
import { useSidebar } from "../../../components/useSidebar";
import Navbar from "../../../components/Navbar";
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
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [activeTab, setActiveTab] = useState("hariIni"); // hariIni | semua
  const [toast, setToast]           = useState(null);   
  const [scanCode, setScanCode]     = useState("");
  const [upcoming, setUpcoming]     = useState([]);
  const [history, setHistory]       = useState([]);
  const [dateFilter, setDateFilter] = useState("semua"); // semua | minggu | bulan
  const scanTimeoutRef              = useRef(null);
  const html5QrCodeRef              = useRef(null);
  const scannerContainerId          = "pmh-qr-reader";

  const activeClass = upcoming.find(c => c.id === selectedClassId) || upcoming[0];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Hanya mata kuliah yang diikuti mahasiswa (berdasarkan relasi Presensi di DB)
        const res = await apiClient.get('/api/mata-kuliah/mahasiswa/me');
        const list = Array.isArray(res) ? res : (res?.data || []);
        const formatted = list.map((c) => ({
          id: c.idMataKuliah,
          code: `MK${c.idMataKuliah.toString().padStart(3, '0')}`,
          name: c.namaMataKuliah,
          jadwal: c.jadwal || "",
          waktu: c.waktu || ""
        }));
        setUpcoming(formatted);

        if (formatted.length > 0) {
          const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const now = new Date();
          const todayName = daysIndo[now.getDay()].toLowerCase();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();

          let selectedId = null;
          let foundOngoing = false;
          let foundToday = false;
          let todayFirstId = null;

          for (let i = 0; i < formatted.length; i++) {
            const c = formatted[i];
            if (!c.jadwal) continue;

            const scheduledDays = c.jadwal.split(',').map(d => d.trim().toLowerCase());
            if (scheduledDays.includes(todayName)) {
              if (todayFirstId === null) {
                todayFirstId = c.id;
              }
              foundToday = true;

              if (c.waktu) {
                const parts = c.waktu.split('-');
                if (parts.length === 2) {
                  const [startStr, endStr] = parts.map(p => p.trim());
                  const [startH, startM] = startStr.split(':').map(Number);
                  const [endH, endM] = endStr.split(':').map(Number);

                  if (!isNaN(startH) && !isNaN(startM) && !isNaN(endH) && !isNaN(endM)) {
                    const startMinutes = startH * 60 + startM;
                    const endMinutes = endH * 60 + endM;

                    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
                      selectedId = c.id;
                      foundOngoing = true;
                      break;
                    }
                  }
                }
              }
            }
          }

          if (foundOngoing) {
            setSelectedClassId(selectedId);
            setActiveTab("hariIni");
          } else if (foundToday && todayFirstId !== null) {
            setSelectedClassId(todayFirstId);
            setActiveTab("hariIni");
          } else {
            setSelectedClassId(formatted[0].id);
            setActiveTab("semua"); // Fallback to semua tab if no classes today
          }
        }
      } catch (error) {
        console.error("Failed to load courses", error);
        setUpcoming([]);
      }
    };
    fetchCourses();
  }, []);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(scanTimeoutRef.current), []);

  const fetchHistory = useCallback(async () => {
    if (activeClass) {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

        // Add cache-busting to get fresh data
        const res = await apiClient.get(`/api/presensi/mahasiswa/${activeClass.id}?_t=${Date.now()}`);
        const allData = res.data || res || [];
        const myRecords = Array.isArray(allData) ? allData : [];

        // Menghapus duplikasi per tanggal pertemuan (prioritaskan status selain Alpha)
        const uniqueRecordsMap = new Map();
        myRecords.forEach(h => {
          const dateKey = h.tanggalPertemuan;
          if (!dateKey) return;
          
          const existing = uniqueRecordsMap.get(dateKey);
          if (existing) {
            // Jika data sebelumnya Alpha, dan data sekarang bukan Alpha (contoh: Hadir), maka timpa
            if (existing.statusKehadiran === "Alpha" && h.statusKehadiran !== "Alpha") {
              uniqueRecordsMap.set(dateKey, h);
            }
          } else {
            uniqueRecordsMap.set(dateKey, h);
          }
        });
        const dedupedRecords = Array.from(uniqueRecordsMap.values());

        // Format respons untuk UI - handle timezone correctly
        const formattedHist = dedupedRecords
          .sort((a, b) => {
            // Sort by tanggalPertemuan descending (paling baru di atas)
            const dateA = new Date(a.tanggalPertemuan || 0);
            const dateB = new Date(b.tanggalPertemuan || 0);
            return dateB - dateA;
          })
          .map(h => {
            // Convert UTC to local time
            const localDate = h.tanggalPertemuan ? new Date(h.tanggalPertemuan) : null;
            const localWaktu = h.waktuPresensi ? new Date(h.waktuPresensi) : null;
            
            // Format status: Alpha -> Alpa for UI
            const rawStatus = h.statusKehadiran || "Alpha";
            const displayStatus = rawStatus === "Alpha" ? "Alpa" : rawStatus;
            
            return {
              rawDate: h.tanggalPertemuan,
              date: localDate
                ? localDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })
                : "-",
              code: activeClass.code,
              name: activeClass.name,
              status: displayStatus,
              time: localWaktu ? localWaktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "-",
              rawStatus: h.statusKehadiran,
              rawWaktu: h.waktuPresensi
            };
          });
        setHistory(formattedHist);
      } catch (error) {
        console.error("DEBUG - fetchHistory error:", error);
        setHistory([]);
      }
    }
  }, [activeClass]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) { // SCANNING
          await html5QrCodeRef.current.stop();
        }
      } catch {
        // ignore stop errors
      }
      html5QrCodeRef.current = null;
    }
  }, []);

  const onQrCodeSuccess = useCallback(async (decodedText) => {
    await stopCamera();
    setScanState("scanning");
    try {
      if (!activeClass) throw new Error("Pilih kelas terlebih dahulu");
      await apiClient.post("/api/presensi/scan", {
        idMataKuliah: activeClass.id,
        token: decodedText
      });
      setScanState("success");
      showToast("success", `Absen berhasil! ${activeClass.name}`);
      // Refresh riwayat untuk update waktu presensi
      await fetchHistory();
    } catch (error) {
      setScanState("error");
      showToast("error", error.message || "Gagal melakukan presensi");
      setTimeout(() => setScanState("idle"), 2000);
    }
  }, [activeClass, stopCamera, fetchHistory]);

  const startScan = async () => {
    if (!activeClass) {
      showToast("error", "Pilih kelas terlebih dahulu");
      return;
    }
    setScanState("scanning");

    // Wait for the DOM element to render
    await new Promise((r) => setTimeout(r, 100));

    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => onQrCodeSuccess(decodedText),
        () => {} // ignore scan failures (no QR found in frame)
      );
    } catch (err) {
      console.error("Camera error:", err);
      setScanState("idle");
      showToast("error", "Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
    }
  };

  const handleManualInput = (e) => {
    setScanCode(e.target.value);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!scanCode.trim() || !activeClass) return;
    
    setScanState("scanning");
    try {
      await apiClient.post("/api/presensi/scan", {
        idMataKuliah: activeClass.id,
        token: scanCode.trim()
      });
      setScanState("success");
      showToast("success", `Absen berhasil! ${activeClass.name}`);
      // Refresh riwayat untuk update waktu presensi
      await fetchHistory();
    } catch (error) {
      setScanState("error");
      showToast("error", error.message || "Kode QR tidak valid. Silakan coba lagi.");
      setTimeout(() => setScanState("idle"), 2000);
    }
    setScanCode("");
  };

  const resetScan = async () => {
    clearTimeout(scanTimeoutRef.current);
    await stopCamera();
    setScanState("idle");
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
      {/* Sidebar */}
      <Sidebar onNavigate={onNavigate} onLogout={onLogout} activePage="presensiMahasiswa" mobileOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main */}
      <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
        <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} onNavigate={onNavigate} />

        {/* -- Toast Notification -- */}
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
                <p className="pmh-class-selector-label" style={{ fontWeight: 800, fontSize: "0.875rem", color: "#475569", marginBottom: "1rem" }}>Pilih Kelas</p>
                
                {/* Toggle Tab */}
                <div className="pmh-toggle-container">
                  <button 
                    className={`pmh-toggle-btn ${activeTab === 'hariIni' ? 'pmh-toggle-btn--active' : ''}`}
                    onClick={() => setActiveTab('hariIni')}
                  >
                    Jadwal Hari Ini
                  </button>
                  <button 
                    className={`pmh-toggle-btn ${activeTab === 'semua' ? 'pmh-toggle-btn--active' : ''}`}
                    onClick={() => setActiveTab('semua')}
                  >
                    Semua Jadwal
                  </button>
                </div>

                {/* Class List */}
                <div className="pmh-class-list">
                  {(() => {
                    const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                    const todayName = daysIndo[new Date().getDay()].toLowerCase();
                    
                    const filtered = activeTab === 'hariIni' 
                      ? upcoming.filter(c => c.jadwal && c.jadwal.split(',').map(d => d.trim().toLowerCase()).includes(todayName))
                      : upcoming;

                    if (filtered.length === 0) {
                      return (
                        <p style={{ color: "var(--slate-500)", textAlign: "center", padding: "1.5rem 0", fontSize: "0.875rem" }}>
                          {activeTab === 'hariIni' ? 'Tidak ada jadwal kelas hari ini.' : 'Belum terdaftar di mata kuliah manapun.'}
                        </p>
                      );
                    }

                    return filtered.map((c) => (
                      <div
                        key={c.id}
                        className={`pmh-class-card ${selectedClassId === c.id ? "pmh-class-card--active" : ""}`}
                        onClick={() => { setSelectedClassId(c.id); resetScan(); }}
                      >
                        <div className="pmh-class-card-header">
                          <span className="pmh-class-card-badge">{c.code}</span>
                          <span className="pmh-class-card-name">{c.name}</span>
                        </div>
                        <div className="pmh-class-card-time-row">
                          <span className="material-symbols-outlined">schedule</span>
                          <span>{c.jadwal ? `${c.jadwal} · ${c.waktu || '08:00 - 10:30'}` : (c.waktu || '08:00 - 10:30')}</span>
                        </div>
                      </div>
                    ));
                  })()}
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
                      <div id={scannerContainerId} className="pmh-camera-feed"></div>
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
                        <p className="pmh-success-sub">{activeClass?.name}</p>
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
                <h3 className="pmh-session-name">{activeClass?.name || "Memuat..."}</h3>
                <div className="pmh-session-details">
                  <div className="pmh-detail-row">
                    <span className="material-symbols-outlined">tag</span>
                    <span>Kode: {activeClass?.code || "-"}</span>
                  </div>
                  <div className="pmh-detail-row">
                    <span className="material-symbols-outlined">event_available</span>
                    <span>Total sesi: {history.length}</span>
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
                        strokeDasharray={`${history.length > 0 ? ((history.filter(h => h.status === "Hadir").length / history.length) * 188) : 0} 188`}
                        strokeDashoffset="47"
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                    <div className="pmh-ring-label">
                      <span className="pmh-ring-pct">{history.length > 0 ? Math.round((history.filter(h => h.status === "Hadir").length / history.length) * 100) : 0}%</span>
                      <span className="pmh-ring-sub">Kehadiran</span>
                    </div>
                  </div>
                  <div className="pmh-summary-stats">
                    <div className="pmh-sum-item">
                      <span className="pmh-sum-dot" style={{ backgroundColor: "#2f9696" }}></span>
                      <span className="pmh-sum-label">Hadir</span>
                      <span className="pmh-sum-val">{history.filter(h => h.status === "Hadir").length}</span>
                    </div>
                    <div className="pmh-sum-item">
                      <span className="pmh-sum-dot" style={{ backgroundColor: "#c47f17" }}></span>
                      <span className="pmh-sum-label">Izin</span>
                      <span className="pmh-sum-val">{history.filter(h => h.status === "Izin").length}</span>
                    </div>
                    <div className="pmh-sum-item">
                      <span className="pmh-sum-dot" style={{ backgroundColor: "#4b53bc" }}></span>
                      <span className="pmh-sum-label">Sakit</span>
                      <span className="pmh-sum-val">{history.filter(h => h.status === "Sakit").length}</span>
                    </div>
                    <div className="pmh-sum-item">
                      <span className="pmh-sum-dot" style={{ backgroundColor: "#dc2626" }}></span>
                      <span className="pmh-sum-label">Alpa</span>
                      <span className="pmh-sum-val">{history.filter(h => h.status === "Alpa").length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* History */}
              <div className="pmh-history-card">
                <div className="pmh-history-header">
                  <h4 className="pmh-history-title">Riwayat Kehadiran</h4>
                  <div className="pmh-date-filter">
                    <button 
                      className={`pmh-filter-chip ${dateFilter === 'semua' ? 'pmh-filter-chip--active' : ''}`}
                      onClick={() => setDateFilter('semua')}
                    >Semua</button>
                    <button 
                      className={`pmh-filter-chip ${dateFilter === 'minggu' ? 'pmh-filter-chip--active' : ''}`}
                      onClick={() => setDateFilter('minggu')}
                    >Minggu Ini</button>
                    <button 
                      className={`pmh-filter-chip ${dateFilter === 'bulan' ? 'pmh-filter-chip--active' : ''}`}
                      onClick={() => setDateFilter('bulan')}
                    >Bulan Ini</button>
                  </div>
                </div>
                <div className="pmh-history-list">
                  {(() => {
                    const filtered = history.filter(h => {
                      if (dateFilter === 'semua') return true;
                      const hDate = new Date(h.rawDate || Date.now());
                      const now = new Date();
                      if (dateFilter === 'minggu') {
                        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                        return hDate >= weekAgo;
                      }
                      if (dateFilter === 'bulan') {
                        return hDate.getMonth() === now.getMonth() && hDate.getFullYear() === now.getFullYear();
                      }
                      return true;
                    });
                    return filtered.length > 0 ? filtered.map((h, i) => (
                    <div key={i} className="pmh-history-item">
                      <div className="pmh-history-left">
                        <p className="pmh-history-course">{h.code} - {h.name}</p>
                        <p className="pmh-history-date">{h.date} • {h.time}</p>
                      </div>
                      <StatusBadge status={h.status} />
                    </div>
                  )) : (
                    <p style={{ color: "var(--slate-500)", textAlign: "center", padding: "1rem" }}>
                      {dateFilter === 'semua' ? 'Belum ada riwayat kehadiran.' : 
                       dateFilter === 'minggu' ? 'Tidak ada kehadiran minggu ini.' :
                       'Tidak ada kehadiran bulan ini.'}
                    </p>
                  )})()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
