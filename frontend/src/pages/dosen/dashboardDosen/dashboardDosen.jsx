import React, { useState, useEffect } from "react";
import "../../../shared.css";
import "./dashboardDosen.css";
import SidebarDosen from "../../../SidebarDosen";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";
import { apiClient } from "../../../utils/apiClient";

const AVATAR_DOSEN =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjoXu55KCdSSPl-2t0t7d2EH6gux6Xz8nZaCdXHePrj-gGn1ZWZyBoOucWc2yVgrhmNFyy8cKbxWH8i9Wm5VKkpqX9jraXjkHTr8PVU1oN3V4nkzLWUUm6nyAIS3hGDic_uY0YoNLNNZluKTKqFwJb2gYlRl9eATGdlXClTx6IXpYvk-2u1qqvfUGTzs-QJPlXTouWTyNYzTe8j8mS09evVA_aHTYfHxneVwUsb2jUygYzuAIDU5KwqO2kISzLvnzaTentePscoGoo";

export default function DashboardDosen({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [toast, setToast] = useState(null);
  const [detailMatkul, setDetailMatkul] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    lecturerName: "Dosen",
    stats: {
      totalMahasiswa: 0,
      tugasPending: 0,
      rataPresensi: "0%"
    },
    pendingTasks: [],
    jadwal: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiClient.get('/api/dosen/dashboard');
        if (res && res.data) {
          setDashboardData(res.data);
        } else if (res) {
          setDashboardData(res);
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const nav = (page) => onNavigate && onNavigate(page);

  return (
    <div className="page-shell">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "5rem", right: "1.5rem", zIndex: 999,
          background: toast.type === "error" ? "#fff1f2" : "#ecfdf5",
          color: toast.type === "error" ? "#dc2626" : "#059669",
          border: toast.type === "error" ? "1px solid #fecaca" : "1px solid #a7f3d0",
          padding: "0.75rem 1.25rem", borderRadius: "0.75rem", fontWeight: 600,
          fontSize: "0.875rem", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", gap: "0.5rem"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>
            {toast.type === "error" ? "error" : "check_circle"}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Jadwal detail mini-modal */}
      {detailMatkul && (
        <div className="dd-mini-overlay" onClick={() => setDetailMatkul(null)}>
          <div className="dd-mini-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dd-mini-modal-hdr">
              <div className="dd-mini-time-box" style={{ background: detailMatkul.color }}>
                <span>{detailMatkul.time}</span>
                <span style={{ fontSize: "0.5rem" }}>WIB</span>
              </div>
              <div>
                <p className="dd-mini-title">{detailMatkul.subject}</p>
                <p className="dd-mini-sub">{detailMatkul.room}</p>
              </div>
              <button className="dd-mini-close" onClick={() => setDetailMatkul(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="dd-mini-actions">
              <button className="dd-mini-btn dd-mini-btn--amber" onClick={() => { setDetailMatkul(null); nav("dosenPresensi"); }}>
                <span className="material-symbols-outlined">qr_code_2</span>
                Buka Presensi QR
              </button>
              <button className="dd-mini-btn dd-mini-btn--blue" onClick={() => { setDetailMatkul(null); nav("dosenMateri"); }}>
                <span className="material-symbols-outlined">menu_book</span>
                Kelola Materi
              </button>
              <button className="dd-mini-btn dd-mini-btn--teal" onClick={() => { setDetailMatkul(null); nav("dosenForum"); }}>
                <span className="material-symbols-outlined">forum</span>
                Buka Forum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Sidebar ─── */}
      <SidebarDosen onNavigate={onNavigate} onLogout={onLogout} activePage="dosenDashboard" mobileOpen={sidebarOpen} onClose={closeSidebar} />

      {/* ─── Main ─── */}
      <main className="page-main">
        {/* Navbar */}
        <Navbar role="Dosen" onOpenSidebar={openSidebar} onNavigate={typeof nav !== "undefined" ? nav : (typeof onNavigate !== "undefined" ? onNavigate : undefined)} />

        {/* Content */}
        <div className="page-content">
          {/* Page Header */}
          <div className="dd-page-header">
            <div>
              <h2 className="dd-title">Dashbord Dosen</h2>
              <p className="dd-subtitle">Selamat pagi, Pak / Bu {dashboardData.lecturerName}. Berikut ringkasan kurasi akademik Anda hari ini.</p>
            </div>
            <div className="dd-action-row">
              <button className="dd-btn dd-btn--blue" onClick={() => nav("dosenTugas")}>
                <span className="material-symbols-outlined">add_task</span>
                + Kelola Tugas
              </button>
              <button className="dd-btn dd-btn--dark" onClick={() => nav("dosenMateri")}>
                <span className="material-symbols-outlined">post_add</span>
                + Tambah Materi
              </button>
              <button className="dd-btn dd-btn--amber" onClick={() => nav("dosenPresensi")}>
                <span className="material-symbols-outlined">qr_code_2</span>
                Hasilkan QR Presensi
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="dd-stats-grid">
            <div className="dd-stat-card" style={{ cursor: "pointer" }} onClick={() => nav("dosenKelompok")}>
              <div className="dd-stat-top">
                <div className="dd-stat-icon dd-icon--blue">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <span className="dd-badge dd-badge--green">Bulan ini</span>
              </div>
              <p className="dd-stat-label">Total Mahasiswa Aktif</p>
              <p className="dd-stat-value">{dashboardData.stats.totalMahasiswa}</p>
            </div>

            <div className="dd-stat-card" style={{ cursor: "pointer" }} onClick={() => nav("dosenKelompok")}>
              <div className="dd-stat-top">
                <div className="dd-stat-icon dd-icon--orange">
                  <span className="material-symbols-outlined">pending_actions</span>
                </div>
                <span className="dd-badge dd-badge--orange">Butuh Perhatian</span>
              </div>
              <p className="dd-stat-label">Tugas Belum Dinilai</p>
              <p className="dd-stat-value">{dashboardData.stats.tugasPending}</p>
            </div>

            <div className="dd-stat-card" style={{ cursor: "pointer" }} onClick={() => nav("dosenPresensi")}>
              <div className="dd-stat-top">
                <div className="dd-stat-icon dd-icon--teal">
                  <span className="material-symbols-outlined">auto_graph</span>
                </div>
                <span className="dd-badge dd-badge--teal">Sangat Baik</span>
              </div>
              <p className="dd-stat-label">Rata-rata Presensi</p>
              <p className="dd-stat-value">{dashboardData.stats.rataPresensi}</p>
            </div>
          </div>

          {/* Quick Nav Tiles */}
          <div className="dd-quick-nav">
            {[
              { icon: "assignment", label: "Manajemen Tugas", page: "dosenTugas", color: "var(--color-secondary)" },
              { icon: "groups", label: "Kelompok & Nilai", page: "dosenKelompok", color: "#2f9696" },
              { icon: "menu_book", label: "Manajemen Materi", page: "dosenMateri", color: "#c47f17" },
              { icon: "how_to_reg", label: "Presensi & QR", page: "dosenPresensi", color: "#7c3aed" },
              { icon: "forum", label: "Forum Diskusi", page: "dosenForum", color: "#0891b2" },
              { icon: "account_circle", label: "Profil Dosen", page: "dosenProfile", color: "#059669" },
            ].map((tile) => (
              <button key={tile.page} className="dd-quick-tile" onClick={() => nav(tile.page)}>
                <div className="dd-quick-icon" style={{ background: `${tile.color}18`, color: tile.color }}>
                  <span className="material-symbols-outlined">{tile.icon}</span>
                </div>
                <span className="dd-quick-label">{tile.label}</span>
                <span className="material-symbols-outlined dd-quick-arrow">arrow_forward</span>
              </button>
            ))}
          </div>

          {/* Data Table */}
          <div className="dd-table-card">
            <div className="dd-table-head-row">
              <div>
                <h3 className="dd-table-title">Tugas Menunggu Penilaian</h3>
                <p className="dd-table-sub">Prioritas penilaian berdasarkan tenggat waktu pengumpulan.</p>
              </div>
              <button className="dd-table-link" onClick={() => nav("dosenKelompok")}>Lihat Semua →</button>
            </div>
            <div className="dd-table-wrapper">
              <table className="dd-table">
                <thead>
                  <tr>
                    <th>Nama Kelompok / Mahasiswa</th>
                    <th>Nama Tugas</th>
                    <th>Tanggal Kumpul</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.pendingTasks.length > 0 ? dashboardData.pendingTasks.map((row, i) => (
                    <tr key={i} style={{ cursor: "pointer" }} onClick={() => nav("dosenKelompok")}>
                      <td>
                        <div className="dd-student-cell">
                          <div className={`dd-avatar ${row.av}`}>{row.code}</div>
                          <div>
                            <p className="dd-cell-name">{row.name}</p>
                            <p className="dd-cell-sub">{row.type}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="dd-cell-name">{row.task}</p>
                        <p className="dd-cell-sub">{row.course}</p>
                      </td>
                      <td>
                        <p className="dd-cell-name">{row.date}</p>
                        <p className={row.late ? "dd-late" : "dd-ontime"}>{row.timeStatus}</p>
                      </td>
                      <td><span className="dd-status-badge">Submitted</span></td>
                      <td style={{ textAlign: "right" }}>
                        <button className="dd-grade-btn" onClick={(e) => { e.stopPropagation(); nav("dosenKelompok"); }}>
                          Beri Nilai
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>Tidak ada tugas yang menunggu penilaian.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Grid */}
          <div className="dd-footer-grid">
            {/* Schedule */}
            <div className="dd-schedule-card u-glass">
              <div className="dd-sched-header">
                <h3>Jadwal Mengajar Hari Ini</h3>
                <span>Senin, 16 Okt 2023</span>
              </div>
              <div className="dd-sched-list">
                {dashboardData.jadwal.length > 0 ? dashboardData.jadwal.map((s, i) => (
                  <div key={i} className="dd-sched-item dd-sched-item--clickable" onClick={() => setDetailMatkul(s)}>
                    <div className="dd-time-box" style={{ backgroundColor: s.color }}>
                      <span className="dd-time-val">{s.time}</span>
                      <span className="dd-time-zone">WIB</span>
                    </div>
                    <div className="dd-sched-info">
                      <p className="dd-sched-name">{s.subject}</p>
                      <p className="dd-sched-room">{s.room}</p>
                    </div>
                    <button className="dd-arrow-btn" onClick={(e) => { e.stopPropagation(); setDetailMatkul(s); }}>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                )) : (
                  <div style={{ padding: "1rem", color: "#64748b" }}>Tidak ada jadwal mengajar hari ini.</div>
                )}
              </div>
            </div>

            {/* Banner */}
            <div className="dd-banner-card" style={{ cursor: "pointer" }} onClick={() => nav("dosenKelompok")}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBy8KGz3t51144zS6UQIyIU8ZW9LlWKExAwAE0EYBSMd8xjBrDEDMdyN6TSGMoHuO2OBFHGkDiJuXiA7I62wUbHUnV30wKyQRh1YDFJdfuio83pIPkwmsG9aWE2wsXeE_fcSuHIlCWIXBc2NWXHOkYvCMM4h_H3qWsir3i7rNnwhGwbuCo8ww3WB7XBZ06Tlpj5neS7xIvYPg7Xb0Ip2PHkzUK1p1RyVmFMTQuvRYk0kF4QWN7vU_2WBKbpA8qCygIgSCWtx4oUQjXY"
                alt="E-Learning Experience"
              />
              <div className="dd-banner-overlay">
                <h3>Pantau Progress<br />Pembelajaran Digital</h3>
                <p>Gunakan analitik kurasi untuk melihat area yang paling menantang bagi mahasiswa Anda.</p>
                <button className="dd-report-btn" onClick={(e) => { e.stopPropagation(); nav("dosenKelompok"); }}>
                  Lihat Laporan Analitik
                  <span className="material-symbols-outlined">trending_up</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
