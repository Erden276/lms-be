import React, { useState, useEffect } from "react";
import "../../../components/shared.css";
import "./dashboardDosen.css";
import SidebarDosen from "../../../components/SidebarDosen";
import { useSidebar } from "../../../components/useSidebar";
import Navbar from "../../../components/Navbar";
import { apiClient } from "../../../utils/apiClient";
import LoadingSpinner from "../../../components/LoadingSpinner";

const AVATAR_DOSEN =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjoXu55KCdSSPl-2t0t7d2EH6gux6Xz8nZaCdXHePrj-gGn1ZWZyBoOucWc2yVgrhmNFyy8cKbxWH8i9Wm5VKkpqX9jraXjkHTr8PVU1oN3V4nkzLWUUm6nyAIS3hGDic_uY0YoNLNNZluKTKqFwJb2gYlRl9eATGdlXClTx6IXpYvk-2u1qqvfUGTzs-QJPlXTouWTyNYzTe8j8mS09evVA_aHTYfHxneVwUsb2jUygYzuAIDU5KwqO2kISzLvnzaTentePscoGoo";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function DashboardDosen({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [toast, setToast] = useState(null);
  const [selectedMateri, setSelectedMateri] = useState(null);
  const storedUserStr = localStorage.getItem("user");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : {};
  const initialAvatar = storedUser.fotoUrl
    ? `${API_BASE}${storedUser.fotoUrl}`
    : AVATAR_DOSEN;

  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);

  const [dashboardData, setDashboardData] = useState({
    lecturerName: "Dosen",
    stats: {
      totalMahasiswa: 0,
      tugasIndividu: 0,
      tugasKelompok: 0,
    },
    daftarMateri: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (storedUser.fotoUrl) {
          setAvatarUrl(`${API_BASE}${storedUser.fotoUrl}`);
        }
        const res = await apiClient.get("/api/dosen/dashboard");
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

  // Remove early LoadingSpinner return

  return (
    <div className="page-shell">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "5rem",
            right: "1.5rem",
            zIndex: 999,
            background: toast.type === "error" ? "#fff1f2" : "#ecfdf5",
            color: toast.type === "error" ? "#dc2626" : "#059669",
            border:
              toast.type === "error"
                ? "1px solid #fecaca"
                : "1px solid #a7f3d0",
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
            {toast.type === "error" ? "error" : "check_circle"}
          </span>
          {toast.msg}
        </div>
      )}

      {/* ─── Sidebar ─── */}
      <SidebarDosen
        onNavigate={onNavigate}
        onLogout={onLogout}
        activePage="dosenDashboard"
        mobileOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* ─── Main ─── */}
      <main className="page-main">
        {/* Navbar */}
        <Navbar
          role="Dosen"
          onOpenSidebar={openSidebar}
          onNavigate={
            typeof nav !== "undefined"
              ? nav
              : typeof onNavigate !== "undefined"
                ? onNavigate
                : undefined
          }
        />

        {/* Content */}
        <div className="page-content">
          {/* Page Header */}
          <div className="dd-page-header">
            <div>
              <h2 className="dd-title">Dashbord Dosen</h2>
              <p className="dd-subtitle">
                {loading
                  ? "Memuat ringkasan akademik Anda..."
                  : `Selamat pagi, Pak / Bu ${dashboardData?.lecturerName || "Dosen"}. Berikut ringkasan kurasi akademik Anda hari ini.`}
              </p>
            </div>
            <div className="dd-action-row">
              <button
                className="dd-btn dd-btn--blue"
                onClick={() => nav("dosenTugas")}
              >
                <span className="material-symbols-outlined">add_task</span>+
                Kelola Tugas
              </button>
              <button
                className="dd-btn dd-btn--dark"
                onClick={() => nav("dosenMateri")}
              >
                <span className="material-symbols-outlined">post_add</span>+
                Tambah Materi
              </button>
              <button
                className="dd-btn dd-btn--amber"
                onClick={() => nav("dosenPresensi")}
              >
                <span className="material-symbols-outlined">qr_code_2</span>
                Hasilkan QR Presensi
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="dd-stats-grid">
            {loading ? (
              <>
                <div
                  className="dd-stat-card skeleton-shimmer"
                  style={{ border: "none", minHeight: "8.5rem" }}
                ></div>
                <div
                  className="dd-stat-card skeleton-shimmer"
                  style={{ border: "none", minHeight: "8.5rem" }}
                ></div>
              </>
            ) : (
              <>
                <div className="dd-stat-card">
                  <div className="dd-stat-top">
                    <div className="dd-stat-icon dd-icon--blue">
                      <span className="material-symbols-outlined">group</span>
                    </div>
                    <span className="dd-badge dd-badge--green">Aktif</span>
                  </div>
                  <p className="dd-stat-label">Total Mahasiswa Aktif</p>
                  <p className="dd-stat-value">
                    {dashboardData?.stats?.totalMahasiswa || 0}
                  </p>
                </div>

                <div className="dd-stat-card">
                  <div className="dd-stat-top">
                    <div className="dd-stat-icon dd-icon--blue">
                      <span className="material-symbols-outlined">
                        description
                      </span>
                    </div>
                    <span className="dd-badge dd-badge--blue">Tugas</span>
                  </div>
                  <p className="dd-stat-label">Pengumpulan Tugas Individu</p>
                  <p className="dd-stat-value">
                    {dashboardData?.stats?.tugasIndividu || 0}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Daftar Materi */}
          <div className="dd-table-card" style={{ marginTop: "2rem" }}>
            <div className="dd-table-head-row">
              <div>
                <h3 className="dd-table-title">Daftar Materi</h3>
                <p className="dd-table-sub">
                  Materi yang tersedia untuk mahasiswa
                </p>
              </div>
              <button
                className="dd-table-link"
                onClick={() => nav("dosenMateri")}
              >
                Selengkapnya →
              </button>
            </div>
            <div className="dd-table-wrapper">
              <table className="dd-table">
                <thead>
                  <tr>
                    <th>Judul Materi</th>
                    <th>Mata Kuliah</th>
                    <th>Tipe</th>
                    <th>Tanggal Upload</th>
                    <th>Ukuran</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1, 2, 3].map((idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="dd-student-cell">
                            <div
                              className="dd-avatar av-blue skeleton-shimmer"
                              style={{
                                width: "2rem",
                                height: "2rem",
                                borderRadius: "0.5rem",
                              }}
                            ></div>
                            <div style={{ flex: 1 }}>
                              <div
                                className="skeleton-text skeleton-text--medium"
                                style={{ margin: 0 }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div
                            className="skeleton-text skeleton-text--medium"
                            style={{ margin: 0 }}
                          ></div>
                        </td>
                        <td>
                          <div
                            className="skeleton-text skeleton-text--short"
                            style={{ margin: 0 }}
                          ></div>
                        </td>
                        <td>
                          <div
                            className="skeleton-text skeleton-text--medium"
                            style={{ margin: 0 }}
                          ></div>
                        </td>
                        <td>
                          <div
                            className="skeleton-text skeleton-text--short"
                            style={{ margin: 0 }}
                          ></div>
                        </td>
                      </tr>
                    ))
                  ) : dashboardData?.daftarMateri?.length > 0 ? (
                    dashboardData.daftarMateri.slice(0, 5).map((materi, i) => (
                      <tr key={materi.id || i}>
                        <td>
                          <div className="dd-student-cell">
                            <div className="dd-avatar av-blue">
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "1rem" }}
                              >
                                {materi.tipe?.toLowerCase().includes("video")
                                  ? "play_circle"
                                  : materi.tipe?.toLowerCase().includes("pdf")
                                    ? "picture_as_pdf"
                                    : "description"}
                              </span>
                            </div>
                            <div>
                              <p className="dd-cell-name">{materi.judul}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="dd-cell-name">{materi.mataKuliah}</p>
                        </td>
                        <td>
                          <span className="dd-status-badge">{materi.tipe}</span>
                        </td>
                        <td>
                          <p className="dd-cell-name">{materi.tanggal}</p>
                        </td>
                        <td>
                          <p className="dd-cell-sub">{materi.ukuran}</p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ textAlign: "center", padding: "2rem" }}
                      >
                        Belum ada materi yang diupload.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
