import React, { useState, useEffect, useCallback } from "react";
import "../../../shared.css";
import "./dosenPresensi.css";
import SidebarDosen from "../../../SidebarDosen";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";
import { apiClient } from "../../../utils/apiClient";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjoXu55KCdSSPl-2t0t7d2EH6gux6Xz8nZaCdXHePrj-gGn1ZWZyBoOucWc2yVgrhmNFyy8cKbxWH8i9Wm5VKkpqX9jraXjkHTr8PVU1oN3V4nkzLWUUm6nyAIS3hGDic_uY0YoNLNNZluKTKqFwJb2gYlRl9eATGdlXClTx6IXpYvk-2u1qqvfUGTzs-QJPlXTouWTyNYzTe8j8mS09evVA_aHTYfHxneVwUsb2jUygYzuAIDU5KwqO2kISzLvnzaTentePscoGoo";

const QR_TTL = 15 * 60;

const INITIAL_STUDENTS = [];

const STATUS_OPTS = ["Hadir", "Sakit", "Izin", "Alpa"];
const MATKUL_LIST = [
  { id: 1, name: "Basis Data",           room: "Lab 302 - Gedung B", time: "08:00 - 10:30" },
  { id: 2, name: "Pemrograman Web", room: "Ruang A204",          time: "10:30 - 12:00" },
  { id: 3, name: "Metodologi Penelitian",    room: "Ruang Teater 1",      time: "13:30 - 15:00" },
];

function statusColor(s) {
  return ({ Hadir: "#2f9696", Sakit: "#4b53bc", Izin: "#c47f17", Alpa: "#dc2626" }[s] ?? "#64748b");
}
function generateToken() {
  return `LeMaS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
function qrUrl(token) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(token)}`;
}
function fmtTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function DosenPresensi({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [toast, setToast]     = useState(null);
  const [token, setToken]     = useState(generateToken);
  const [timeLeft, setTimeLeft] = useState(QR_TTL);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [selectedMatkul, setSelectedMatkul] = useState(MATKUL_LIST[0]);
  const [sessionActive, setSessionActive]   = useState(true);
  const [showMatkul, setShowMatkul]         = useState(false);
  const [page, setPage] = useState(1);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStudents = async () => {
    try {
      const res = await apiClient.get(`/api/presensi/mata-kuliah/${selectedMatkul.id}`);
      if (res && res.data) {
        setStudents(res.data);
      }
    } catch (error) {
      console.error(error);
      setStudents([]);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedMatkul]);

  useEffect(() => {
    if (!sessionActive || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, sessionActive]);

  useEffect(() => {
    if (timeLeft <= 0) handleRefresh();
  }, [timeLeft]);

  const handleRefresh = useCallback(() => {
    setQrLoaded(false);
    setToken(generateToken());
    setTimeLeft(QR_TTL);
    showToast("QR Code diperbarui!");
  }, []);

  const handleStatusChange = (id, newStatus) => {
    setStudents((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus } : s));
  };

  const statCount = (status) => students.filter((s) => s.status === status).length;
  const urgency = timeLeft < 60 ? "urgent" : timeLeft < 5 * 60 ? "warning" : "normal";

  const endSession = () => {
    setSessionActive(false);
    showToast("Sesi presensi telah ditutup.");
  };

  return (
    <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
      {/* Toast */}
      {toast && (
        <div className={`dp-toast dp-toast--${toast.type}`}>
          <span className="material-symbols-outlined">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      <SidebarDosen onNavigate={onNavigate} onLogout={onLogout} activePage="dosenPresensi" mobileOpen={sidebarOpen} onClose={closeSidebar} />

      <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
        <Navbar role="Dosen" onOpenSidebar={openSidebar} onNavigate={typeof nav !== "undefined" ? nav : (typeof onNavigate !== "undefined" ? onNavigate : undefined)} />

        <div className="page-content">
          {/* Top bar */}
          <div className="dp-topbar">
            <div>
              <h2 className="dp-page-title">Manajemen Presensi</h2>
              <p className="dp-page-sub">Hasilkan QR Code presensi dan pantau kehadiran mahasiswa secara real-time.</p>
            </div>
            <div className="dp-top-actions">
              <div className="dp-matkul-selector" onClick={() => setShowMatkul(!showMatkul)}>
                <span className="material-symbols-outlined">menu_book</span>
                <span>{selectedMatkul.name}</span>
                <span className="material-symbols-outlined">expand_more</span>
                {showMatkul && (
                  <div className="dp-matkul-dropdown">
                    {MATKUL_LIST.map((mk) => (
                      <button key={mk.id} className={`dp-matkul-opt ${selectedMatkul.id === mk.id ? "active" : ""}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedMatkul(mk); setShowMatkul(false); handleRefresh(); }}>
                        <strong>{mk.name}</strong>
                        <span>{mk.time}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="dp-btn-outline" onClick={() => showToast("Laporan diunduh!")}>
                <span className="material-symbols-outlined">download</span>
                Unduh Laporan
              </button>
              {sessionActive ? (
                <button className="dp-btn-danger" onClick={endSession}>
                  <span className="material-symbols-outlined">stop_circle</span>
                  Tutup Sesi
                </button>
              ) : (
                <button className="dp-btn-primary" onClick={() => { setSessionActive(true); handleRefresh(); }}>
                  <span className="material-symbols-outlined">play_circle</span>
                  Buka Sesi
                </button>
              )}
            </div>
          </div>

          {/* Upper grid: QR + Session Info */}
          <div className="dp-upper-grid">
            {/* QR Card */}
            <div className="dp-qr-card">
              <div className="dp-qr-header">
                <h3>Kode QR Presensi</h3>
                <p>Tampilkan ke kelas atau bagikan ke mahasiswa</p>
              </div>
              <div className="dp-qr-frame">
                {!qrLoaded && (
                  <div className="dp-qr-skeleton">
                    <span className="material-symbols-outlined">qr_code_2</span>
                    <span>Memuat QR...</span>
                  </div>
                )}
                <img
                  key={token}
                  src={qrUrl(token)}
                  alt="QR Code Presensi"
                  className={`dp-qr-img ${qrLoaded ? "dp-qr-img--visible" : ""} ${!sessionActive ? "dp-qr-img--expired" : ""}`}
                  onLoad={() => setQrLoaded(true)}
                />
                {!sessionActive && (
                  <div className="dp-qr-overlay">
                    <span className="material-symbols-outlined">lock</span>
                    <span>Sesi Ditutup</span>
                  </div>
                )}
              </div>
              <div className="dp-qr-token">
                <span className="dp-token-label">Token</span>
                <code className="dp-token-value">{token.split("-").slice(0, 2).join("-")}</code>
              </div>
              <div className="dp-qr-footer">
                <div className="dp-ttl-info">
                  <span className="dp-ttl-label">Masa Berlaku</span>
                  <span className={`dp-ttl-value dp-ttl--${urgency}`}>{fmtTime(timeLeft)} Menit</span>
                </div>
                <div className="dp-ttl-bar-track">
                  <div className={`dp-ttl-bar-fill dp-ttl--${urgency}`} style={{ width: `${(timeLeft / QR_TTL) * 100}%` }} />
                </div>
                <div className="dp-qr-actions">
                  <button className="dp-btn-refresh" onClick={handleRefresh}>
                    <span className="material-symbols-outlined">refresh</span>
                    Perbarui
                  </button>
                  <button className="dp-btn-share" onClick={() => showToast("Link presensi disalin!")}>
                    <span className="material-symbols-outlined">share</span>
                    Bagikan
                  </button>
                </div>
              </div>
            </div>

            {/* Right: session info + stats */}
            <div className="dp-info-col">
              <div className="dp-session-card">
                <span className="dp-chip">SESI AKTIF</span>
                <h2 className="dp-session-title">{selectedMatkul.name}</h2>
                <div className="dp-session-details">
                  <div className="dp-detail-item">
                    <span className="material-symbols-outlined">schedule</span>
                    <div>
                      <p className="dp-detail-label">Waktu Perkuliahan</p>
                      <p className="dp-detail-value">{selectedMatkul.time} WIB</p>
                    </div>
                  </div>
                  <div className="dp-detail-item">
                    <span className="material-symbols-outlined">meeting_room</span>
                    <div>
                      <p className="dp-detail-label">Ruangan</p>
                      <p className="dp-detail-value">{selectedMatkul.room}</p>
                    </div>
                  </div>
                  <div className="dp-detail-item">
                    <span className="material-symbols-outlined">tag</span>
                    <div>
                      <p className="dp-detail-label">Kode Mata Kuliah</p>
                      <p className="dp-detail-value">{selectedMatkul.id}</p>
                    </div>
                  </div>
                  <div className="dp-detail-item">
                    <span className="material-symbols-outlined">circle</span>
                    <div>
                      <p className="dp-detail-label">Status Sesi</p>
                      <p className={`dp-detail-value ${sessionActive ? "dp-status--active" : "dp-status--closed"}`}>
                        {sessionActive ? "● Berlangsung" : "● Ditutup"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="dp-stats-grid">
                {[
                  { label: "HADIR",  value: statCount("Hadir"), color: "#2f9696", icon: "check_circle" },
                  { label: "SAKIT",  value: statCount("Sakit"), color: "#4b53bc", icon: "medication" },
                  { label: "IZIN",   value: statCount("Izin"),  color: "#c47f17", icon: "event_busy" },
                  { label: "ALPA",   value: statCount("Alpa"),  color: "#dc2626", icon: "cancel" },
                ].map((s) => (
                  <div key={s.label} className="dp-stat-card">
                    <span className="material-symbols-outlined dp-stat-icon" style={{ color: s.color }}>{s.icon}</span>
                    <p className="dp-stat-label">{s.label}</p>
                    <p className="dp-stat-value" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Student Table */}
          <div className="dp-table-card">
            <div className="dp-table-header">
              <div>
                <h3>Daftar Hadir Mahasiswa</h3>
                <p>{students.length} mahasiswa terdaftar</p>
              </div>
              <div className="dp-table-actions">
                <button className="dp-icon-btn" onClick={() => showToast("Filter diterapkan!")}>
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
                <button className="dp-icon-btn" onClick={() => showToast("Disortir!")}>
                  <span className="material-symbols-outlined">sort</span>
                </button>
              </div>
            </div>
            <div className="dp-table-wrap">
              <table className="dp-table">
                <thead>
                  <tr>
                    <th>NAMA MAHASISWA</th>
                    <th>NIM</th>
                    <th>STATUS KEHADIRAN</th>
                    <th>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="dp-student-cell">
                          {s.photo ? (
                            <img src={s.photo} alt={s.name} className="dp-avatar-img" />
                          ) : (
                            <div className="dp-avatar-initials" style={{ backgroundColor: s.color }}>{s.initials}</div>
                          )}
                          <span className="dp-student-name">{s.name}</span>
                        </div>
                      </td>
                      <td className="dp-nim">{s.nim}</td>
                      <td>
                        <div className="dp-status-wrap">
                          <select
                            className="dp-status-select"
                            style={{ color: statusColor(s.status) }}
                            value={s.status}
                            onChange={(e) => handleStatusChange(s.id, e.target.value)}
                          >
                            {STATUS_OPTS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined dp-select-icon" style={{ color: statusColor(s.status) }}>expand_more</span>
                        </div>
                      </td>
                      <td>
                        <button className="dp-action-btn" onClick={() => showToast(`Aksi untuk ${s.name}`)}>
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="dp-pagination-row">
              <p className="dp-pagination-info">Menampilkan {students.length} mahasiswa terdaftar</p>
              <div className="dp-pagination">
                {[1,2,3].map((n) => (
                  <button key={n} className={`dp-page-btn ${page === n ? "dp-page-btn--active" : ""}`} onClick={() => setPage(n)}>{n}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
