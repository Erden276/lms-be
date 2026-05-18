import React, { useState, useEffect } from "react";
import "../../../shared.css";
import "./daftarTugas.css";
import Sidebar from "../../../Sidebar";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";
import { apiClient } from "../../../utils/apiClient";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlRblArhYvkrSWfEx3UWaIaP5bdg8OpReWzF-sc4sB_2K3sC4IYv7Q4-lWy6VUtGhc5esYpVi12_HYjLZdjx6ILoT60xad1GfsEtHStVQIigk44gnAXnpEAjWrPWVYNa_AKdaDPqXQwdlJDbcccdQ96CZrZ6btx50rBBy3LvfY-eINJ1MtiJWLJpWBAo2nnbaNr3i-_Yn3B_BsVkOxpG3hVSKt38J2-NxnAah9LFYcNLvZARv4lzr86P24cdV4haCMW80Nudw5Lku";

const FILTERS = [
  { key: "semua",            label: "Semua" },
  { key: "belum_dikerjakan", label: "Belum Dikerjakan" },
  { key: "selesai",          label: "Selesai" },
];

function formatDeadlineLabel(deadlineTugas, sudahKumpul) {
  if (!deadlineTugas) return "Tanpa deadline";
  const d = new Date(deadlineTugas);
  const now = new Date();
  const diffMs = d - now;
  const diffH = Math.ceil(diffMs / (1000 * 60 * 60));
  if (sudahKumpul) return "Telah Dikumpulkan";
  if (diffH <= 0) return "Deadline telah lewat";
  if (diffH <= 24) return `${diffH} Jam Lagi`;
  const diffD = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `${diffD} Hari Lagi`;
}

function isDeadlinePassed(deadlineTugas) {
  if (!deadlineTugas) return false;
  return new Date(deadlineTugas) < new Date();
}

function formatDeadlineDisplay(deadlineTugas) {
  if (!deadlineTugas) return "-";
  const date = new Date(deadlineTugas);
  const dateStr = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `${dateStr}, ${timeStr}`;
}

export default function DaftarTugas({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [activeFilter, setActiveFilter] = useState("semua");
  const [toast, setToast] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [sortOrder, setSortOrder] = useState("deadline_asc"); // deadline_asc = terdekat ke terlama
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const nim = user.nomorInduk || "";

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const coursesRes = await apiClient.get('/api/mata-kuliah');
      let courses = Array.isArray(coursesRes) ? coursesRes : (coursesRes.data || []);
      
      // Filter to active semester only (same as dashboard)
      if (courses.length > 0) {
        const maxSemester = Math.max(...courses.map(c => c.semester || 0));
        if (maxSemester > 0) {
          courses = courses.filter(c => c.semester === maxSemester);
        }
      }
      
      setCourses(courses);

      const tugasRes = await apiClient.get('/api/tugas');
      const rawTugas = Array.isArray(tugasRes) ? tugasRes : (tugasRes.data || []);
      
      // Filter tugas hanya dari mata kuliah semester aktif
      const courseIds = courses.map(c => c.idMataKuliah);
      const filteredTugas = rawTugas.filter(t => courseIds.includes(t.idMataKuliah));

      const tugasFormatted = filteredTugas.map(t => {
        const deadline = t.deadlineTugas ? new Date(t.deadlineTugas) : null;
        const now = new Date();
        const sudahKumpul = t.sudahKumpul === true;
        // Status: cuma 2 kondisi - belum dikerjakan atau selesai
        const status = sudahKumpul ? "selesai" : "belum_dikerjakan";
        return {
          id: t.id,
          idMataKuliah: t.idMataKuliah,
          course: t.mataKuliah || "Mata Kuliah",
          deadline: t.deadlineTugas ? new Date(t.deadlineTugas) : null,
          deadlineLabel: formatDeadlineLabel(t.deadlineTugas, sudahKumpul),
          deadlineUrgent: deadline ? (deadline - now < 24 * 60 * 60 * 1000 && !sudahKumpul) : false,
          name: t.judul,
          status,
          sudahKumpul,
          action: sudahKumpul ? "lihat" : "kerjakan",
          isQuiz: false,
          // File tugas dari dosen (lampiran soal/instruksi)
          fileTugas: t.fileTugas || null,
          namaFileTugas: t.namaFileTugas || (t.fileTugas ? t.fileTugas.split('/').pop() : null),
          tipeFileTugas: t.tipeFileTugas || null,
          ukuranFile: t.ukuranFile || null,
          detailTugas: t.detailTugas || ""
        };
      });

const allKuis = [];
      for (const course of courses) {
        try {
          const kuisRes = await apiClient.get(`/api/kuis/mata-kuliah/${course.idMataKuliah}`);
          const kuisList = Array.isArray(kuisRes) ? kuisRes : (kuisRes.data || []);
          for (const k of kuisList) {
            try {
              const statusRes = await apiClient.get(`/api/kuis/${k.id}/status`);
              const sudahDikerjakan = statusRes?.sudahDikerjakan || false;
              const deadlineKuis = k.deadlineKuis ? new Date(k.deadlineKuis) : null;
              const now = new Date();
              const kuisStatus = sudahDikerjakan ? "selesai" : "belum_dikerjakan";
              allKuis.push({
                id: k.id,
                idMataKuliah: k.idMataKuliah || course.idMataKuliah,
                course: k.mataKuliah || course.namaMataKuliah || "Mata Kuliah",
                deadline: deadlineKuis,
                deadlineLabel: formatDeadlineLabel(k.deadlineKuis, sudahDikerjakan),
                deadlineUrgent: k.deadlineKuis ? (new Date(k.deadlineKuis) - new Date() < 24 * 60 * 60 * 1000) : false,
                name: k.judul,
                status: kuisStatus,
                sudahKumpul: sudahDikerjakan,
                action: sudahDikerjakan ? "lihat" : "kerjakan",
                isQuiz: true,
                jumlahSoal: k.jumlahSoal || 0,
                jumlahPengerjaan: k.jumlahPengerjaan || 0,
                totalMahasiswa: k.totalMahasiswa || 0
              });
            } catch (statusErr) {
              console.error("Error fetching kuis status for kuis", k.id, statusErr);
              allKuis.push({
                id: k.id,
                idMataKuliah: k.idMataKuliah || course.idMataKuliah,
                course: k.mataKuliah || course.namaMataKuliah || "Mata Kuliah",
                deadline: k.deadlineKuis ? new Date(k.deadlineKuis) : null,
                deadlineLabel: formatDeadlineLabel(k.deadlineKuis, false),
                deadlineUrgent: k.deadlineKuis ? (new Date(k.deadlineKuis) - new Date() < 24 * 60 * 60 * 1000) : false,
                name: k.judul,
                status: "belum_dikerjakan",
                sudahKumpul: false,
                action: "kerjakan",
                isQuiz: true,
                jumlahSoal: k.jumlahSoal || 0,
                jumlahPengerjaan: k.jumlahPengerjaan || 0,
                totalMahasiswa: k.totalMahasiswa || 0
              });
            }
          }
        } catch (e) {
          console.error("Error fetching kuis for course", course.idMataKuliah, e);
        }
      }

      setTasks([...tugasFormatted, ...allKuis]);
    } catch (error) {
      console.error(error);
      showToast("Gagal memuat daftar tugas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const tasksByCourse = selectedCourse === "all"
    ? tasks
    : tasks.filter(t => t.idMataKuliah === parseInt(selectedCourse));

  const filteredByStatus = activeFilter === "semua"
    ? tasksByCourse
    : tasksByCourse.filter((t) => t.status === activeFilter);

  // Sort by deadline
  const sortedTasks = [...filteredByStatus].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    if (sortOrder === "deadline_asc") {
      return a.deadline - b.deadline; // Terdekat ke terlama
    } else {
      return b.deadline - a.deadline; // Terlama ke terdekat
    }
  });

  const filtered = sortedTasks;

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
            <p className="dt-subtitle">Perhatikan deadline tugasnya yaa!!</p>
          </div>

          {/* Filter Tabs */}
          <div className="dt-filter-section" style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", justifyContent: "space-between" }}>
            <div className="dt-filter-tabs" style={{ marginBottom: 0 }}>
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`dt-filter-btn ${activeFilter === f.key ? "dt-filter-btn--active" : ""}`}
                  onClick={() => setActiveFilter(f.key)}
                >
                  {f.label}
                  <span className="dt-filter-count">
                    {f.key === "semua" ? tasksByCourse.length : tasksByCourse.filter((t) => t.status === f.key).length}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Course Filter Dropdown */}
            <div className="dt-course-filter" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--slate-500)", fontSize: "1.2rem" }}>filter_list</span>
              <select 
                className="dt-custom-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="all">Semua Mata Kuliah</option>
                {courses.map(c => (
                  <option key={c.idMataKuliah} value={c.idMataKuliah}>{c.namaMataKuliah}</option>
                ))}
              </select>
            </div>
            
            {/* Sort Dropdown */}
            <div className="dt-sort-filter" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--slate-500)", fontSize: "1.2rem" }}>sort</span>
              <select 
                className="dt-custom-select"
                style={{ minWidth: "180px" }}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="deadline_asc">Deadline: Terdekat</option>
                <option value="deadline_desc">Deadline: Terlama</option>
              </select>
            </div>
          </div>

          {/* Task List */}
          <div className="dt-task-list">
            {loading ? (
              <div className="dt-empty">
                <span className="material-symbols-outlined">hourglass_empty</span>
                <p>Memuat tugas...</p>
              </div>
            ) : filtered.length === 0 ? (
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
                      <span
                        className={`dt-deadline ${task.deadlineUrgent ? "dt-deadline--urgent" : task.status === "selesai" ? "dt-deadline--done" : "dt-deadline--normal"}`}
                        title={formatDeadlineDisplay(task.deadline)}
                        style={{ cursor: "help" }}
                      >
                        <span className="material-symbols-outlined">
                          {task.status === "selesai" ? "check_circle" : "schedule"}
                        </span>
                        <span style={{ display: "flex", flexDirection: "column", lineHeight: "1.2" }}>
                          <span>{task.deadlineLabel}</span>
                          <span style={{ fontSize: "0.7rem", opacity: 0.85, marginTop: "1px" }}>
                            {formatDeadlineDisplay(task.deadline)}
                          </span>
                        </span>
                      </span>
                    </div>
                    {/* Action button - disable if deadline passed and not submitted */}
                    {isDeadlinePassed(task.deadline) && !task.sudahKumpul ? (
                      <button
                        className="dt-btn dt-btn--disabled"
                        disabled
                        style={{
                          backgroundColor: "var(--slate-300)",
                          color: "var(--slate-500)",
                          cursor: "not-allowed"
                        }}
                      >
                        <span className="material-symbols-outlined">lock</span>
                        Deadline Lewat
                      </button>
                    ) : (
                      <button
                        className="dt-btn dt-btn--primary"
                        onClick={() => {
                          if (task.isQuiz) {
                            if (task.sudahKumpul) {
                              onNavigate && onNavigate({ page: "hasilKuis", idKuis: task.id });
                            } else {
                              onNavigate && onNavigate({ page: "kuis", idKuis: task.id });
                            }
                          } else {
                            onNavigate && onNavigate({ page: "pengumpulanTugas", taskId: task.id });
                          }
                        }}
                      >
                        {task.isQuiz ? (task.sudahKumpul ? "Lihat Nilai Kuis" : "Kerjakan Kuis") : (task.sudahKumpul ? "Lihat Pengumpulan" : "Kumpulkan")}
                      </button>
                    )}
                  </div>

                  {/* Task name */}
                  <h3 className="dt-task-name">{task.name}</h3>

                  {/* Deskripsi Tugas */}
                  {task.detailTugas && (
                    <p style={{
                      fontSize: "0.875rem",
                      color: "var(--slate-600)",
                      marginTop: "0.5rem",
                      marginBottom: "0.75rem",
                      lineHeight: "1.5"
                    }}>
                      {task.detailTugas}
                    </p>
                  )}

                  {/* File Lampiran dari Dosen */}
                  {task.fileTugas && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      backgroundColor: "var(--blue-50)",
                      borderRadius: "0.5rem",
                      marginTop: "0.5rem",
                      marginBottom: "0.75rem"
                    }}>
                      <span className="material-symbols-outlined" style={{ color: "var(--blue-600)", fontSize: "1.5rem" }}>
                        attach_file
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color: "var(--blue-900)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {task.namaFileTugas}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "0.25rem" }}>
                          Lampiran dari Dosen
                        </p>
                      </div>
                      <a
                        href={`${API_BASE}${task.fileTugas}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={task.namaFileTugas}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "0.5rem 0.75rem",
                          backgroundColor: "var(--blue-600)",
                          color: "white",
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          textDecoration: "none"
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>download</span>
                        Unduh
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
