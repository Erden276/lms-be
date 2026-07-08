import React, { useState, useEffect } from "react";
import "../../../components/shared.css";
import "./pengumpulanTugas.css";
import Sidebar from "../../../components/Sidebar";
import { useSidebar } from "../../../components/useSidebar";
import Navbar from "../../../components/Navbar";
import { apiClient } from "../../../utils/apiClient";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlRblArhYvkrSWfEx3UWaIaP5bdg8OpReWzF-sc4sB_2K3sC4IYv7Q4-lWy6VUtGhc5esYpVi12_HYjLZdjx6ILoT60xad1GfsEtHStVQIigk44gnAXnpEAjWrPWVYNa_AKdaDPqXQwdlJDbcccdQ96CZrZ6btx50rBBy3LvfY-eINJ1MtiJWLJpWBAo2nnbaNr3i-_Yn3B_BsVkOxpG3hVSKt38J2-NxnAah9LFYcNLvZARv4lzr86P24cdV4haCMW80Nudw5Lku";

export default function PengumpulanTugas({ onNavigate, onLogout, taskId }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [task, setTask] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [detailTugas, setDetailTugas] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const nim = user.nomorInduk || "";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDetail = async () => {
    if (!taskId || !nim) return;
    try {
      const res = await apiClient.get(`/api/tugas/${taskId}?nim=${nim}`);
      const data = res.data || res;
      setTask({
        id: data.id,
        judul: data.judul,
        mataKuliah: data.mataKuliah,
        detailTugas: data.detailTugas,
        deadlineTugas: data.deadlineTugas,
      });
      if (data.sudahKumpul && data.pengumpulan) {
        setSubmission(data.pengumpulan);
        setDetailTugas(data.pengumpulan.detailTugas || "");
      }
    } catch (error) {
      console.error(error);
      showToast("Gagal memuat detail tugas", "error");
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [taskId, nim]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const isDeadlinePassed = () => {
    if (!task?.deadlineTugas) return false;
    return new Date(task.deadlineTugas) < new Date();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Cek deadline - tidak bisa submit jika sudah lewat
    if (isDeadlinePassed() && !submission) {
      showToast("Deadline tugas telah lewat. Anda tidak dapat mengumpulkan tugas ini.", "error");
      return;
    }

    if (!file && !submission?.fileJawaban) {
      showToast("Harap pilih file untuk diunggah.", "error");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("idTugas", String(taskId));
      formData.append("nim", nim);
      formData.append("judul", task?.judul || "");
      formData.append("detailTugas", detailTugas || "");
      if (file) {
        formData.append("file", file);
      } else if (submission?.fileJawaban) {
        formData.append("fileJawaban", submission.fileJawaban);
      }

      const response = await apiClient.post(`/api/tugas/${taskId}/submit`, formData);

      showToast("Tugas berhasil dikumpulkan!");
      setFile(null);
      fetchDetail();
    } catch (error) {
      console.error("Error submit:", error);
      showToast(error.message || "Gagal mengumpulkan tugas.", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "5rem", right: "1.5rem", zIndex: 999,
          background: toast.type === "error" ? "#fef2f2" : "#ecfdf5",
          color: toast.type === "error" ? "#dc2626" : "#059669",
          border: `1px solid ${toast.type === "error" ? "#fecaca" : "#a7f3d0"}`,
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

      <Sidebar
        onNavigate={onNavigate}
        onLogout={onLogout}
        activePage="daftarTugas"
        mobileOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
        <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} />

        <div className="page-content">
          <div className="pt-page-header">
            <button className="pt-back-btn" onClick={() => onNavigate && onNavigate("daftarTugas")}>
              <span className="material-symbols-outlined">arrow_back</span>
              Kembali
            </button>
            <h2 className="pt-title">Pengumpulan Tugas</h2>
          </div>

          {task && (
            <div className="pt-card">
              <div className="pt-task-info">
                <h3 className="pt-task-name">{task.judul}</h3>
                <p className="pt-task-mk">{task.mataKuliah}</p>
                <p className="pt-task-deadline">
                  <span className="material-symbols-outlined">schedule</span>
                  Deadline: {formatDate(task.deadlineTugas)}
                </p>
                {task.detailTugas && (
                  <div className="pt-task-desc">
                    <strong>Deskripsi:</strong>
                    <p>{task.detailTugas}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning jika deadline lewat dan belum kumpul */}
          {isDeadlinePassed() && !submission && (
            <div style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "0.75rem",
              padding: "1rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <span className="material-symbols-outlined" style={{ color: "#dc2626", fontSize: "1.5rem" }}>
                lock
              </span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: "#dc2626" }}>
                  Deadline Telah Lewat
                </p>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#7f1d1d", marginTop: "0.25rem" }}>
                  Anda tidak dapat mengumpulkan tugas ini karena sudah melewati batas waktu pengumpulan.
                </p>
              </div>
            </div>
          )}

          <div className="pt-card">
            <h4 className="pt-section-title">
              {submission ? "Perbarui Pengumpulan" : "Unggah Jawaban"}
            </h4>
            <form onSubmit={handleSubmit} className="pt-form">
              <div className="pt-field">
                <label className="pt-label">File Jawaban (PDF, Word, Zip, dll)</label>
                <input
                  type="file"
                  className="pt-file-input"
                  onChange={handleFileChange}
                  disabled={isDeadlinePassed() && !submission}
                />
                {file && (
                  <p className="pt-file-name">
                    <span className="material-symbols-outlined">description</span>
                    {file.name}
                  </p>
                )}
                {submission && !file && submission.fileJawaban && (
                  <p className="pt-file-name">
                    <span className="material-symbols-outlined">description</span>
                    File sebelumnya:{" "}
                    <a
                      href={`${import.meta.env.VITE_API_URL || "http://localhost:3000"}${submission.fileJawaban}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#4b53bc", fontWeight: 600, textDecoration: "underline" }}
                    >
                      {submission.fileJawaban.split("/").pop()}
                    </a>
                  </p>
                )}
              </div>

              <div className="pt-field">
                <label className="pt-label">Catatan / Keterangan (opsional)</label>
                <textarea
                  className="pt-textarea"
                  rows={4}
                  value={detailTugas}
                  onChange={(e) => setDetailTugas(e.target.value)}
                  placeholder="Tulis catatan tambahan untuk tugas ini..."
                  disabled={isDeadlinePassed() && !submission}
                />
              </div>

              <div className="pt-actions">
                <button
                  type="button"
                  className="pt-btn pt-btn--secondary"
                  onClick={() => onNavigate && onNavigate("daftarTugas")}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="pt-btn pt-btn--primary"
                  disabled={loading || (isDeadlinePassed() && !submission)}
                  style={{
                    backgroundColor: (isDeadlinePassed() && !submission) ? "var(--slate-400)" : undefined,
                    cursor: (isDeadlinePassed() && !submission) ? "not-allowed" : undefined
                  }}
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined" style={{ animation: "spin 1s linear infinite" }}>progress_activity</span>
                      Mengirim...
                    </>
                  ) : submission ? (
                    <>
                      <span className="material-symbols-outlined">update</span>
                      Perbarui
                    </>
                  ) : isDeadlinePassed() ? (
                    <>
                      <span className="material-symbols-outlined">lock</span>
                      Deadline Lewat
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      Kirim
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
