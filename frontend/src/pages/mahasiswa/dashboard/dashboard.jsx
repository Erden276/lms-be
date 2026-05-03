import React, { useState, useEffect } from "react";
import "../../../shared.css";
import "./dashboard.css";
import "./notifikasi.css";
import Sidebar from "../../../Sidebar";
import Navbar from "../../../Navbar";
import { apiClient } from "../../../utils/apiClient";

const AVATAR_HERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlRblArhYvkrSWfEx3UWaIaP5bdg8OpReWzF-sc4sB_2K3sC4IYv7Q4-lWy6VUtGhc5esYpVi12_HYjLZdjx6ILoT60xad1GfsEtHStVQIigk44gnAXnpEAjWrPWVYNa_AKdaDPqXQwdlJDbcccdQ96CZrZ6btx50rBBy3LvfY-eINJ1MtiJWLJpWBAo2nnbaNr3i-_Yn3B_BsVkOxpG3hVSKt38J2-NxnAah9LFYcNLvZARv4lzr86P24cdV4haCMW80Nudw5Lku";

export default function Dashboard({ onNavigate, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(storedUser);
        const res = await apiClient.get("/api/dashboard/mahasiswa");
        setDashboardData(res.data);
      } catch (error) {
        console.error("Gagal memuat dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page-shell">
        <main className="page-main">
          <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            Memuat dashboard...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-shell">
      {/* Sidebar*/}
      <Sidebar
        onNavigate={onNavigate}
        onLogout={onLogout}
        activePage="dashboard"
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <main className="page-main">
        {/* Navbar */}
        <Navbar role="Mahasiswa" onOpenSidebar={() => setSidebarOpen(true)} onNavigate={typeof nav !== "undefined" ? nav : (typeof onNavigate !== "undefined" ? onNavigate : undefined)} />

        {/* Content */}
        <div className="page-content">
          <div className="db-grid">
            {/* ── Left Column ── */}
            <div className="db-left">
              <div className="db-page-header">
                <h1>Dashboard Mahasiswa</h1>
                <p>Selamat datang kembali di ekosistem pembelajaran Anda.</p>
              </div>

              {/* Hero Card — clickable to profile */}
              <div
                className="db-hero-card"
                style={{ cursor: "pointer" }}
                onClick={() => onNavigate && onNavigate("profile")}
                title="Lihat Profil"
              >
                <div className="db-hero-circle-1"></div>
                <div className="db-hero-circle-2"></div>
                <div className="db-hero-body">
                  <div className="db-hero-avatar">
                    <img alt="Profile" src={AVATAR_HERO} />
                  </div>
                  <div className="db-hero-info">
                    <span className="db-badge">Profil Mahasiswa</span>
                    <h2 className="db-hero-name">Halo, {user?.nama || "Mahasiswa"}</h2>
                    <p className="db-hero-sub">{user?.role || "S1 Informatika"}</p>
                  </div>
                  <div className="db-hero-stats">
                    <div className="db-stat-box">
                      <p className="db-stat-val">3.82</p>
                      <p className="db-stat-lbl">IPK</p>
                    </div>
                    <div className="db-stat-box">
                      <p className="db-stat-val">18</p>
                      <p className="db-stat-lbl">SKS</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Tugas Card */}
              <div className="db-glass-card">
                <div className="db-card-header">
                  <div className="db-card-title">
                    <div className="db-card-icon">
                      <span className="material-symbols-outlined">analytics</span>
                    </div>
                    <h3>Progress Tugas</h3>
                  </div>
                  <button
                    className="db-link-btn"
                    onClick={() => onNavigate && onNavigate("daftarTugas")}
                  >
                    Lihat Semua
                  </button>
                </div>

                <div className="db-progress-list">
                  {dashboardData?.progress && (
                    <div
                      className="db-progress-item"
                      style={{ cursor: "pointer" }}
                      onClick={() => onNavigate && onNavigate("daftarTugas")}
                    >
                      <div className="db-progress-row">
                        <div>
                          <p className="db-progress-title">Progres Seluruh Tugas</p>
                          <p className="db-progress-sub">{dashboardData.progress.tugasSelesai} dari {dashboardData.progress.totalTugas} tugas selesai</p>
                        </div>
                        <p className="db-progress-pct" style={{ color: "var(--color-secondary)" }}>
                          {dashboardData.progress.persentase}% Selesai
                        </p>
                      </div>
                      <div className="db-bar-track">
                        <div
                          className="db-bar-fill"
                          style={{ width: `${dashboardData.progress.persentase}%`, backgroundColor: "var(--color-secondary)" }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {!dashboardData?.progress && (
                    <p style={{ padding: "1rem", color: "var(--slate-500)", textAlign: "center" }}>
                      Belum ada progres tugas.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right Column ── */}
            <div className="db-right">
              {/* Presensi Card */}
              <div className="db-presensi-card">
                <div className="db-qr-icon">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    qr_code_scanner
                  </span>
                </div>
                <h3>Presensi Hari Ini</h3>
                <p>
                  Pindai kode QR yang diberikan dosen untuk mencatat kehadiran
                  Anda di kelas.
                </p>
                <button
                  className="db-scan-btn"
                  onClick={() => onNavigate && onNavigate("presensiMahasiswa")}
                >
                  <span className="material-symbols-outlined">qr_code_2</span>
                  Pindai QR Kehadiran
                </button>
                <div className="db-schedule-row">
                  <div>
                    <p className="db-sched-lbl">Jadwal Terdekat</p>
                    <p className="db-sched-time">13:30 - Matematika Diskrit</p>
                  </div>
                  <span className="db-pulse-dot"></span>
                </div>
              </div>

              {/* Class Card — clickable to mata kuliah */}
              {dashboardData?.mataKuliah?.length > 0 ? (
                <div
                  className="db-class-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => onNavigate && onNavigate("daftarMataKuliah")}
                  title="Lihat Mata Kuliah"
                >
                  <div className="db-class-img">
                    <img
                      alt="Class background"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtNpKwFZav3hPQNROHLqMB2o394QiCKTzXnWGCA4jQ7vjp7HqGSQN1LcHB27MYQDXJtAnwr6pxoWFEZUFBNlyz6A9kW7VQIi3yLc3P1xhc5ew1NbdfZVyomgzxCksrpp7DXTeJpYdGB27okVcjUXadgSq5YAmxYsrvM5D9yN7W--tqRwIjK9Nz_rIFQCVabhwmUzxA0w2iAhs9vSmapoqQG8z9eo5-2fU7RMBqgnYsB7t_sB-HrTlex3xESSk8gcEfA3wn66kKpVX6"
                    />
                    <div className="db-class-overlay"></div>
                    <span className="db-class-badge">Mata Kuliah Aktif ({dashboardData.mataKuliah.length})</span>
                  </div>
                  <div className="db-class-body">
                    <div className="db-info-item">
                      <span className="material-symbols-outlined">auto_stories</span>
                      <div>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                          {dashboardData.mataKuliah[0].nama}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>
                          Mata Kuliah Anda
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="db-class-card" style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                  <p style={{ color: 'var(--slate-500)' }}>Belum ada mata kuliah yang diambil.</p>
                </div>
              )}

              {/* Discussion Card */}
              <div className="db-discussion-card">
                <div className="db-disc-header">
                  <span className="material-symbols-outlined">forum</span>
                  <h3>Diskusi Terbaru</h3>
                </div>
                {dashboardData?.threads?.length > 0 ? (
                  dashboardData.threads.slice(0, 2).map((thread, idx) => (
                    <div
                      key={idx}
                      className="db-disc-box"
                      style={{ cursor: "pointer", marginBottom: "0.5rem" }}
                      onClick={() => onNavigate && onNavigate("forumDiskusi")}
                    >
                      <p className="db-disc-author">{thread.authorName}</p>
                      <p className="db-disc-text">"{thread.judul}"</p>
                    </div>
                  ))
                ) : (
                  <div className="db-disc-box">
                    <p className="db-disc-text">Belum ada diskusi terbaru.</p>
                  </div>
                )}
                <button
                  className="db-disc-btn"
                  onClick={() => onNavigate && onNavigate("forumDiskusi")}
                >
                  Lihat Semua Diskusi
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

