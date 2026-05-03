import React, { useState } from "react";
import "../../../shared.css";
import "./daftarTugas.css";
import Sidebar from "../../../Sidebar";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlRblArhYvkrSWfEx3UWaIaP5bdg8OpReWzF-sc4sB_2K3sC4IYv7Q4-lWy6VUtGhc5esYpVi12_HYjLZdjx6ILoT60xad1GfsEtHStVQIigk44gnAXnpEAjWrPWVYNa_AKdaDPqXQwdlJDbcccdQ96CZrZ6btx50rBBy3LvfY-eINJ1MtiJWLJpWBAo2nnbaNr3i-_Yn3B_BsVkOxpG3hVSKt38J2-NxnAah9LFYcNLvZARv4lzr86P24cdV4haCMW80Nudw5Lku";

const ALL_TASKS = [
  { id: 1, course: "PBO",                deadlineLabel: "Besok, 23:59",  deadlineUrgent: true,  name: "Tugas PBO - Praktikum 7",           progress: 50,  status: "sedang_berjalan", action: "lanjutkan", isQuiz: false },
  { id: 2, course: "BASIS DATA",         deadlineLabel: "3 Hari Lagi",   deadlineUrgent: false, name: "Laporan Basis Data - Modul 4",        progress: 0,   status: "belum_dikerjakan", action: "lanjutkan", isQuiz: false },
  { id: 3, course: "ALGORITMA",          deadlineLabel: "Telah Selesai", deadlineUrgent: false, name: "Kuis Pemrograman Dasar",              progress: 0,   status: "belum_dikerjakan", action: "lanjutkan", isQuiz: true },
  { id: 4, course: "ARSITEKTUR KOMPUTER",deadlineLabel: "5 Hari Lagi",   deadlineUrgent: false, name: "Analisis Pipeline Prosesor",          progress: 25,  status: "sedang_berjalan", action: "lanjutkan", isQuiz: false },
  { id: 5, course: "DESAIN INTERAKSI",   deadlineLabel: "7 Hari Lagi",   deadlineUrgent: false, name: "Prototipe Antarmuka Mobile (Figma)",  progress: 0,   status: "belum_dikerjakan", action: "lanjutkan", isQuiz: false },
];

const FILTERS = [
  { key: "semua",            label: "Semua" },
  { key: "belum_dikerjakan", label: "Belum Dikerjakan" },
  { key: "sedang_berjalan",  label: "Sedang Berjalan" },
  { key: "selesai",          label: "Selesai" },
];

function getBarColor(status, progress) {
  if (status === "selesai") return "#2f9696";
  if (progress === 0)       return "#cbd5e1";
  return "#c47f17";
}

export default function DaftarTugas({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [activeFilter, setActiveFilter] = useState("semua");
  const [toast, setToast] = useState(null);

  const filtered = activeFilter === "semua"
    ? ALL_TASKS
    : ALL_TASKS.filter((t) => t.status === activeFilter);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "5rem", right: "1.5rem", zIndex: 999,
          background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0",
          padding: "0.75rem 1.25rem", borderRadius: "0.75rem", fontWeight: 600,
          fontSize: "0.875rem", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", gap: "0.5rem"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>check_circle</span>
          {toast}
        </div>
      )}

      {/* ─── Sidebar ─── */}
      <Sidebar
        onNavigate={onNavigate}
        onLogout={onLogout}
        activePage="daftarTugas"
        mobileOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* ─── Main ─── */}
      <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
        {/* Navbar */}
        <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} onNavigate={typeof nav !== "undefined" ? nav : (typeof onNavigate !== "undefined" ? onNavigate : undefined)} />

        {/* Page Content */}
        <div className="page-content">
          {/* Page Header */}
          <div className="dt-page-header">
            <h2 className="dt-title">Daftar Tugas</h2>
            <p className="dt-subtitle">Pantau seluruh tenggat waktu dan progres pembelajaran Anda</p>
          </div>

          {/* Filter Tabs */}
          <div className="dt-filter-tabs">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`dt-filter-btn ${activeFilter === f.key ? "dt-filter-btn--active" : ""}`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
                {f.key !== "semua" && (
                  <span className="dt-filter-count">
                    {ALL_TASKS.filter((t) => t.status === f.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Task List */}
          <div className="dt-task-list">
            {filtered.length === 0 ? (
              <div className="dt-empty">
                <span className="material-symbols-outlined">task_alt</span>
                <p>Tidak ada tugas dalam kategori ini.</p>
              </div>
            ) : (
              filtered.map((task) => (
                <div key={task.id} className="dt-task-card">
                  {/* Top row */}
                  <div className="dt-task-top">
                    <div className="dt-task-meta">
                      <span className="dt-course-badge">{task.course}</span>
                      <span className={`dt-deadline ${task.deadlineUrgent ? "dt-deadline--urgent" : task.status === "selesai" ? "dt-deadline--done" : "dt-deadline--normal"}`}>
                        <span className="material-symbols-outlined">
                          {task.status === "selesai" ? "check_circle" : "schedule"}
                        </span>
                        {task.deadlineLabel}
                      </span>
                    </div>
                    {/* Action button */}
                    {task.action === "lanjutkan" ? (
                      <button
                        className="dt-btn dt-btn--primary"
                        onClick={() => onNavigate && onNavigate(task.isQuiz ? "kuis" : "mataKuliah")}
                      >
                        Lanjutkan
                      </button>
                    ) : (
                      <button
                        className="dt-btn dt-btn--outline"
                        onClick={() => showToast(`Membuka detail: ${task.name}`)}
                      >
                        Lihat Detail
                      </button>
                    )}
                  </div>

                  {/* Task name */}
                  <h3 className="dt-task-name">{task.name}</h3>

                  {/* Progress bar */}
                  <div className="dt-bar-row">
                    <div className="dt-bar-track">
                      <div
                        className="dt-bar-fill"
                        style={{ width: `${task.progress}%`, backgroundColor: getBarColor(task.status, task.progress) }}
                      ></div>
                    </div>
                    <span className="dt-bar-pct" style={{ color: getBarColor(task.status, task.progress) }}>
                      {task.progress}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Section */}
          <div className="dt-footer-grid">
            {/* Fokus Card */}
            <div className="dt-fokus-card">
              <h3 className="dt-fokus-title">Fokus Pembelajaran Minggu Ini</h3>
              <p className="dt-fokus-desc">
                Anda telah menyelesaikan 60% dari target tugas pekan ini. Tetap semangat, sisa 2 tugas lagi!
              </p>
              <div className="dt-fokus-stats">
                <div className="dt-fokus-stat dt-fokus-stat--blue">
                  <p className="dt-fokus-num">08</p>
                  <p className="dt-fokus-lbl">JAM BELAJAR</p>
                </div>
                <div className="dt-fokus-stat dt-fokus-stat--amber">
                  <p className="dt-fokus-num">12</p>
                  <p className="dt-fokus-lbl">TUGAS SELESAI</p>
                </div>
                <div className="dt-fokus-stat dt-fokus-stat--teal">
                  <p className="dt-fokus-num">85</p>
                  <p className="dt-fokus-lbl">SKOR RATA-RATA</p>
                </div>
              </div>
            </div>

            {/* CTA Dark Card */}
            <div className="dt-cta-card">
              <h3 className="dt-cta-title">Mulai Tugas Baru?</h3>
              <p className="dt-cta-desc">
                Unduh panduan pengerjaan tugas akhir semester untuk persiapan lebih awal.
              </p>
              <button
                className="dt-cta-btn"
                onClick={() => showToast("File panduan sedang diunduh...")}
              >
                <span className="material-symbols-outlined">download</span>
                Unduh Panduan (.PDF)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
