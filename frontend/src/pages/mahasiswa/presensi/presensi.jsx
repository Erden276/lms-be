import React, { useState, useEffect, useCallback } from "react";
import "../../../shared.css";
import "./presensi.css";
import Sidebar from "../../../Sidebar";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";
import { apiClient } from "../../../utils/apiClient";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlRblArhYvkrSWfEx3UWaIaP5bdg8OpReWzF-sc4sB_2K3sC4IYv7Q4-lWy6VUtGhc5esYpVi12_HYjLZdjx6ILoT60xad1GfsEtHStVQIigk44gnAXnpEAjWrPWVYNa_AKdaDPqXQwdlJDbcccdQ96CZrZ6btx50rBBy3LvfY-eINJ1MtiJWLJpWBAo2nnbaNr3i-_Yn3B_BsVkOxpG3hVSKt38J2-NxnAah9LFYcNLvZARv4lzr86P24cdV4haCMW80Nudw5Lku";

const QR_TTL = 15 * 60; // 15 minutes in seconds

const INITIAL_STUDENTS = [];

const STATUS_OPTS = ["Hadir", "Sakit", "Izin", "Alpa"];

function statusColor(s) {
  return (
    { Hadir: "#2f9696", Sakit: "#4b53bc", Izin: "#c47f17", Alpa: "#dc2626" }[
      s
    ] ?? "#64748b"
  );
}

function generateToken() {
  return `LeMaS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function qrUrl(token) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(token)}`;
}

function fmtTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s} Menit`;
}

const PAGE_SIZE = 4;

export default function Presensi({ onNavigate, onLogout, idMataKuliah = 1 }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };
  const [token, setToken] = useState(generateToken);
  const [timeLeft, setTimeLeft] = useState(QR_TTL);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(Math.max(1, students.length) / PAGE_SIZE); 

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await apiClient.get(`/api/presensi/mata-kuliah/${idMataKuliah}`);
        if (res && res.data) {
          setStudents(res.data);
        }
      } catch (error) {
        setStudents([]);
      }
    };
    fetchStudents();
  }, [idMataKuliah]);

  // Countdown tick
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  // Auto-refresh when expired
  useEffect(() => {
    if (timeLeft <= 0) handleRefresh();
  }, [timeLeft]);

  const handleRefresh = useCallback(() => {
    setQrLoaded(false);
    setToken(generateToken());
    setTimeLeft(QR_TTL);
  }, []);

  const handleStatusChange = (id, newStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
    );
  };

  const statCount = (status) =>
    students.filter((s) => s.status === status).length;

  const urgency =
    timeLeft < 60 ? "urgent" : timeLeft < 5 * 60 ? "warning" : "normal";

  return (
    <div
      className="page-shell"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "5rem",
            right: "1.5rem",
            zIndex: 999,
            background: "#ecfdf5",
            color: "#059669",
            border: "1px solid #a7f3d0",
            padding: "0.75rem 1.25rem",
            borderRadius: "0.75rem",
            fontWeight: 600,
            fontSize: "0.875rem",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "1.1rem" }}
          >
            check_circle
          </span>
          {toast}
        </div>
      )}
      {/* ─── Sidebar ─── */}
      <Sidebar
        onNavigate={onNavigate}
        onLogout={onLogout}
        activePage="presensi"
        presensiRoute="presensi"
        mobileOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* ─── Main ─── */}
      <main
        className="page-main"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} onNavigate={typeof nav !== "undefined" ? nav : (typeof onNavigate !== "undefined" ? onNavigate : undefined)} />

        <div className="page-content">
          {/* Breadcrumb + actions */}
          <div className="pr-top-bar">
            <div>
              <nav className="pr-breadcrumb">
                <span>LMS</span>
                <span className="material-symbols-outlined">chevron_right</span>
                <span>Mata Kuliah</span>
                <span className="material-symbols-outlined">chevron_right</span>
                <span className="pr-breadcrumb--active">
                  Presensi Kehadiran
                </span>
              </nav>
              <h2 className="pr-page-title">Presensi</h2>
            </div>
            <div className="pr-top-actions">
              <button
                className="pr-btn-outline"
                onClick={() => showToast("Laporan presensi sedang diunduh...")}
              >
                <span className="material-symbols-outlined">download</span>
                Unduh Laporan
              </button>
              <button
                className="pr-btn-primary"
                onClick={() => { setToken(generateToken()); setTimeLeft(QR_TTL); showToast("Sesi presensi baru dibuat!"); }}
              >
                <span className="material-symbols-outlined">add</span>
                Sesi Baru
              </button>
            </div>
          </div>

          {/* Upper section: QR + Info */}
          <div className="pr-upper-grid">
            {/* QR Code Card */}
            <div className="pr-qr-card">
              <div className="pr-qr-card-header">
                <h3>Kode QR Kehadiran</h3>
                <p>Pindai untuk mencatat kehadiran mahasiswa hari ini</p>
              </div>

              <div className="pr-qr-frame">
                {!qrLoaded && (
                  <div className="pr-qr-skeleton">
                    <span className="material-symbols-outlined">qr_code_2</span>
                  </div>
                )}
                <img
                  key={token}
                  src={qrUrl(token)}
                  alt="QR Code Kehadiran"
                  className={`pr-qr-img ${qrLoaded ? "pr-qr-img--visible" : ""}`}
                  onLoad={() => setQrLoaded(true)}
                />
              </div>

              <div className="pr-qr-footer">
                <div className="pr-qr-ttl">
                  <span className="pr-qr-ttl-label">Masa Berlaku</span>
                  <span className={`pr-qr-ttl-value pr-ttl--${urgency}`}>
                    {fmtTime(timeLeft)}
                  </span>
                </div>
                {/* Animated progress bar */}
                <div className="pr-ttl-bar-track">
                  <div
                    className={`pr-ttl-bar-fill pr-ttl--${urgency}`}
                    style={{ width: `${(timeLeft / QR_TTL) * 100}%` }}
                  ></div>
                </div>

                <button className="pr-refresh-btn" onClick={handleRefresh}>
                  <span className="material-symbols-outlined">refresh</span>
                  Perbarui Kode
                </button>
              </div>
            </div>

            {/* Right: Session Info + Stats */}
            <div className="pr-info-col">
              {/* Session Info */}
              <div className="pr-session-card">
                <span className="pr-session-chip">INFORMASI SESI</span>
                <h2 className="pr-session-title">
                  Analisis Desain Interaksi - IF002
                </h2>
                <div className="pr-session-details">
                  <div className="pr-session-detail-item">
                    <p className="pr-detail-label">Dosen Pengampu</p>
                    <p className="pr-detail-value">Budi Santoso, M.Kom.</p>
                  </div>
                  <div className="pr-session-detail-item">
                    <p className="pr-detail-label">Waktu Perkuliahan</p>
                    <p className="pr-detail-value">08:00 - 10:30 WIB</p>
                  </div>
                  <div className="pr-session-detail-item">
                    <p className="pr-detail-label">Ruang</p>
                    <p className="pr-detail-value">Lab Multimedia C</p>
                  </div>
                </div>
              </div>

              {/* Attendance Stats */}
              <div className="pr-stats-grid">
                {[
                  { label: "HADIR", value: 38, color: "#2f9696" },
                  {
                    label: "SAKIT",
                    value: statCount("Sakit"),
                    color: "#4b53bc",
                  },
                  { label: "IZIN", value: statCount("Izin"), color: "#c47f17" },
                  { label: "ALPA", value: statCount("Alpa"), color: "#dc2626" },
                ].map((s) => (
                  <div key={s.label} className="pr-stat-card">
                    <p className="pr-stat-label">{s.label}</p>
                    <p className="pr-stat-value" style={{ color: s.color }}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Student Attendance Table */}
          <div className="pr-table-card">
            <div className="pr-table-header">
              <h3>Daftar Hadir Mahasiswa</h3>
              <div className="pr-table-actions">
                <button className="pr-icon-btn" title="Filter" onClick={() => showToast("Filter presensi aktif")}>
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
                <button className="pr-icon-btn" title="Urutkan" onClick={() => showToast("Mengurutkan daftar...")}>
                  <span className="material-symbols-outlined">sort</span>
                </button>
              </div>
            </div>

            <table className="pr-table">
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
                      <div className="pr-student-cell">
                        {s.photo ? (
                          <img
                            src={s.photo}
                            alt={s.name}
                            className="pr-avatar-img"
                          />
                        ) : (
                          <div
                            className="pr-avatar-initials"
                            style={{ backgroundColor: s.color }}
                          >
                            {s.initials}
                          </div>
                        )}
                        <span className="pr-student-name">{s.name}</span>
                      </div>
                    </td>
                    <td className="pr-nim">{s.nim}</td>
                    <td>
                      <div className="pr-status-wrap">
                        <select
                          className="pr-status-select"
                          style={{ color: statusColor(s.status) }}
                          value={s.status}
                          onChange={(e) =>
                            handleStatusChange(s.id, e.target.value)
                          }
                        >
                          {STATUS_OPTS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <span
                          className="material-symbols-outlined pr-select-icon"
                          style={{ color: statusColor(s.status) }}
                        >
                          expand_more
                        </span>
                      </div>
                    </td>
                    <td>
                      <button className="pr-action-btn" onClick={() => handleStatusChange(s.id, STATUS_OPTS[(STATUS_OPTS.indexOf(s.status) + 1) % STATUS_OPTS.length])} title="Ubah status">
                        <span className="material-symbols-outlined">
                          more_horiz
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pr-pagination-row">
              <p className="pr-pagination-info">
                Menampilkan {PAGE_SIZE} dari {students.length} mahasiswa terdaftar
              </p>
              <div className="pr-pagination">
                <button
                  className="pr-page-btn pr-page-nav"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <span className="material-symbols-outlined">
                    chevron_left
                  </span>
                </button>
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    className={`pr-page-btn ${page === n ? "pr-page-btn--active" : ""}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  className="pr-page-btn pr-page-nav"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <span className="material-symbols-outlined">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
