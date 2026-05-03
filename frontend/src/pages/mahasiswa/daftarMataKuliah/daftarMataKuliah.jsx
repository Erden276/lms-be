import React, { useState, useEffect } from "react";
import "../../../shared.css";
import "./daftarMataKuliah.css";
import Sidebar from "../../../Sidebar";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";
import { apiClient } from "../../../utils/apiClient";

export default function DaftarMataKuliah({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await apiClient.get("/api/mata-kuliah");
        // Berhubung backend hanya mengembalikan idMataKuliah dan namaMataKuliah,
        // kita tambahkan properti dummy untuk kebutuhan UI sementara
        const formattedData = data.map(course => ({
          id: course.idMataKuliah,
          name: course.namaMataKuliah,
          category: "Mata Kuliah",
          icon: "menu_book",
          desc: "Materi dan tugas untuk mata kuliah " + course.namaMataKuliah,
          progress: 0
        }));
        setCourses(formattedData);
      } catch (error) {
        console.error("Gagal memuat mata kuliah", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
        <main className="page-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Memuat daftar mata kuliah...
        </main>
      </div>
    );
  }

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
            <p className="dm-hero-subtitle">Selamat Belajar – Tetap Semangat!</p>
          </div>
        </div>

        {/* Course Grid */}
        <div className="dm-grid-wrap">
          <div className="dm-course-grid">
            {courses.length > 0 ? courses.map((c) => (
              <div key={c.id} className="dm-course-card">
                <div className="dm-card-top">
                  <div className="dm-course-icon">
                    <span className="material-symbols-outlined">{c.icon}</span>
                  </div>
                  <span className="dm-cat-badge">{c.category}</span>
                </div>
                <h3 className="dm-course-name">{c.name}</h3>
                <p className="dm-course-desc">{c.desc}</p>
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
