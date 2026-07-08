import React, { useState, useEffect } from "react";
import "../../../components/shared.css";
import "./daftarMataKuliah.css";
import Sidebar from "../../../components/Sidebar";
import { useSidebar } from "../../../components/useSidebar";
import Navbar from "../../../components/Navbar";
import { apiClient } from "../../../utils/apiClient";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function DaftarMataKuliah({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const nim = user.nomorInduk || "";

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiClient.get("/api/mata-kuliah/mahasiswa/me");
        const data = Array.isArray(res) ? res : (res.data || []);
        
        // Fetch progress untuk setiap mata kuliah
        const coursesWithProgress = await Promise.all(
          data.map(async (course) => {
            let progress = 0;
            try {
              const progressRes = await apiClient.get(
                `/api/materi/mata-kuliah/${course.idMataKuliah}/progress?nim=${nim}`
              );
              const progressData = progressRes.data || progressRes;
              progress = progressData.percentage || 0;
            } catch (e) {
              console.error(`Error fetching progress for ${course.idMataKuliah}:`, e);
            }
            
            return {
              id: course.idMataKuliah,
              name: course.namaMataKuliah,
              category: "Mata Kuliah",
              icon: "menu_book",
              dosen: course.dosen?.user?.nama || "Belum ditentukan",
              jadwal: course.jadwal || "-",
              desc: "Materi dan tugas untuk mata kuliah " + course.namaMataKuliah,
              progress: progress
            };
          })
        );
        
        setCourses(coursesWithProgress);
      } catch (error) {
        console.error("Gagal memuat mata kuliah", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [nim]);

  return (
    <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
      {/* ─── Sidebar ─── */}
      <Sidebar
        onNavigate={onNavigate}
        onLogout={onLogout}
        activePage="daftarMataKuliah"
        mobileOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* ─── Main ─── */}
      <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
        {/* Navbar */}
        <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} onNavigate={typeof nav !== "undefined" ? nav : (typeof onNavigate !== "undefined" ? onNavigate : undefined)} />

        {/* Hero Banner */}
        <div className="dm-hero">
          <img
            className="dm-hero-bg"
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop"
            alt="Hero"
          />
          <div className="dm-hero-overlay"></div>
          <div className="dm-hero-content">
            <h2 className="dm-hero-title">Daftar Mata Kuliah Saya</h2>
            <p className="dm-hero-subtitle">Selamat Belajar</p>
          </div>
        </div>

        {/* Course Grid */}
        <div className="dm-grid-wrap">
          <div className="dm-course-grid">
            {loading ? (
              <>
                <div className="skeleton-card" style={{ height: "290px" }}></div>
                <div className="skeleton-card" style={{ height: "290px" }}></div>
                <div className="skeleton-card" style={{ height: "290px" }}></div>
              </>
            ) : courses.length > 0 ?
              courses.map((c) => (
                <div key={c.id} className="dm-course-card">
                  <div className="dm-card-top">
                  <div className="dm-course-icon">
                    <span className="material-symbols-outlined">{c.icon}</span>
                  </div>
                  <span className="dm-cat-badge">{c.category}</span>
                </div>
                <h3 className="dm-course-name">{c.name}</h3>
                <p className="dm-course-desc">{c.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '8px 0' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                    {c.dosen}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                    {c.jadwal}
                  </span>
                </div>
                <div className="dm-progress-row">
                  <p className="dm-prog-label">Progress Belajar</p>
                  <p className="dm-prog-pct">{c.progress}% Selesai</p>
                </div>
                <div className="dm-prog-track">
                  <div className="dm-prog-fill" style={{ width: `${c.progress}%` }}></div>
                </div>
                <button
                  className="dm-lihat-btn"
                  onClick={() => onNavigate && onNavigate({ page: "mataKuliah", idMataKuliah: c.id })}
                >
                  Lihat Materi →
                </button>
              </div>
            )) : (
              <div style={{ padding: "2rem", textAlign: "center", gridColumn: "1 / -1", color: "var(--slate-500)" }}>
                Belum ada mata kuliah yang tersedia.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
