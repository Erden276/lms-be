import React, { useState, useEffect } from "react";
import "../../../shared.css";
import "./dosenTugas.css";
import SidebarDosen from "../../../SidebarDosen";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";
import { apiClient } from "../../../utils/apiClient";
import {
  extractTextFromFile,
  generateQuizFromText,
} from "../../../utils/extractor";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjoXu55KCdSSPl-2t0t7d2EH6gux6Xz8nZaCdXHePrj-gGn1ZWZyBoOucWc2yVgrhmNFyy8cKbxWH8i9Wm5VKkpqX9jraXjkHTr8PVU1oN3V4nkzLWUUm6nyAIS3hGDic_uY0YoNLNNZluKTKqFwJb2gYlRl9eATGdlXClTx6IXpYvk-2u1qqvfUGTzs-QJPlXTouWTyNYzTe8j8mS09evVA_aHTYfHxneVwUsb2jUygYzuAIDU5KwqO2kISzLvnzaTentePscoGoo";

const MATKUL_LIST = [
  "Sistem Operasi",
  "Basis Data Terdistribusi",
  "Metodologi Penelitian",
];

const INITIAL_TASKS = [];

function daysLeft(deadline) {
  const diff = Math.ceil(
    (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24),
  );
  return diff;
}

export default function DosenTugas({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState("list"); // "list" | "create" | "edit"
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filter, setFilter] = useState("Semua");
  const [gradeModal, setGradeModal] = useState(null);
  const [gradeInputs, setGradeInputs] = useState({});

  const [form, setForm] = useState({
    title: "",
    matkul: MATKUL_LIST[0],
    desc: "",
    type: "Kelompok",
    deadline: "",
    total: 41,
  });

  const [isConverting, setIsConverting] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState(0);
  const [quizData, setQuizData] = useState([]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTasks = async () => {
    try {
      const res = await apiClient.get('/api/dosen/tugas');
      if (res && res.data) {
        const formatted = res.data.map(t => ({
          id: t.idTugas,
          title: t.judul,
          matkul: t.mataKuliah?.namaMataKuliah || "Mata Kuliah",
          matkulId: t.idMataKuliah,
          desc: t.deskripsi,
          type: t.tipeTugas || "Individu",
          deadline: t.deadlineTugas ? t.deadlineTugas.split('T')[0] : "",
          createdAt: t.tanggalDibuat ? t.tanggalDibuat.split('T')[0] : "",
          submitted: t.pengumpulanTugas?.length || 0,
          total: 41,
          status: "Aktif"
        }));
        setTasks(formatted);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.deadline) {
      showToast("Judul dan deadline wajib diisi.", "error");
      return;
    }
    try {
      await apiClient.post('/api/dosen/tugas', {
        judul: form.title,
        idMataKuliah: MATKUL_LIST.indexOf(form.matkul) + 1, // dummy mapped id
        deskripsi: form.desc,
        tipeTugas: form.type,
        deadlineTugas: new Date(form.deadline).toISOString(),
      });
      setForm({
        title: "",
        matkul: MATKUL_LIST[0],
        desc: "",
        type: "Kelompok",
        deadline: "",
        total: 41,
      });
      setView("list");
      showToast("Tugas berhasil dibuat!");
      fetchTasks();
    } catch (error) {
      showToast("Gagal membuat tugas", "error");
    }
  };

  const handleEdit = (task) => {
    setForm({
      title: task.title,
      matkul: task.matkul,
      desc: task.desc,
      type: task.type,
      deadline: task.deadline,
      total: task.total,
    });
    setEditId(task.id);
    setView("edit");
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setTasks((prev) =>
      prev.map((t) => (t.id === editId ? { ...t, ...form } : t)),
    );
    setView("list");
    showToast("Tugas berhasil diperbarui!");
  };

  const confirmDelete = (id) => setDeleteId(id);
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(`/api/dosen/tugas/${deleteId}`);
      showToast("Tugas dihapus.");
      fetchTasks();
    } catch (error) {
      showToast("Gagal menghapus", "error");
    }
    setDeleteId(null);
  };

  const handleGradeTask = (task) => {
    if (task.type === "Kelompok") {
      if (onNavigate) onNavigate("dosenKelompok");
    } else {
      setGradeModal(task);
      setGradeInputs({});
    }
  };

  const saveGrades = () => {
    setGradeModal(null);
    showToast("Nilai berhasil disimpan!");
  };

  const filtered =
    filter === "Semua" ? tasks : tasks.filter((t) => t.status === filter);

  function startForm() {
    setForm({
      title: "",
      matkul: MATKUL_LIST[0],
      desc: "",
      type: "Kelompok",
      deadline: "",
      total: 41,
    });
    setView("create");
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsConverting(true);
    try {
      showToast("Mengekstrak teks dari file...");
      const text = await extractTextFromFile(file);

      showToast("AI sedang menganalisis dan membuat kuis...");
      // Ambil API Key dari environment variable (VITE_GEMINI_API_KEY)
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const extractedQuestions = await generateQuizFromText(text, apiKey);

      setQuizData(extractedQuestions);
      setQuizQuestions(extractedQuestions.length);
      showToast(`Berhasil mengekstrak ${extractedQuestions.length} soal!`);
    } catch (error) {
      console.error(error);
      showToast(
        error.message || "Terjadi kesalahan saat memproses file.",
        "error",
      );
    } finally {
      setIsConverting(false);
      e.target.value = null; // reset input
    }
  };

  const renderTaskForm = (onSubmit, submitLabel) => {
    return (
      <div className="dt-form-card">
        <form onSubmit={onSubmit}>
          <div className="dt-form-grid">
            <div className="dt-field dt-field--full">
              <label className="dt-label">
                Judul Tugas/Kuis <span>*</span>
              </label>
              <input
                className="dt-input"
                placeholder="Masukkan judul..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="dt-field">
              <label className="dt-label">Mata Kuliah</label>
              <select
                className="dt-select"
                value={form.matkul}
                onChange={(e) => setForm({ ...form, matkul: e.target.value })}
              >
                {MATKUL_LIST.map((mk) => (
                  <option key={mk}>{mk}</option>
                ))}
              </select>
            </div>
            <div className="dt-field">
              <label className="dt-label">Tipe</label>
              <select
                className="dt-select"
                value={form.type}
                onChange={(e) => {
                  setForm({ ...form, type: e.target.value });
                  setQuizQuestions(0);
                }}
              >
                <option>Individu</option>
                <option>Kelompok</option>
                <option>Kuis</option>
              </select>
            </div>
            <div className="dt-field">
              <label className="dt-label">
                Deadline <span>*</span>
              </label>
              <input
                className="dt-input"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
            <div className="dt-field">
              <label className="dt-label">Total Mahasiswa</label>
              <input
                className="dt-input"
                type="number"
                min={1}
                value={form.total}
                onChange={(e) => setForm({ ...form, total: +e.target.value })}
              />
            </div>

            {form.type === "Kuis" && (
              <div
                className="dt-field dt-field--full"
                style={{
                  padding: "1.5rem",
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.125rem",
                      color: "var(--blue-900)",
                    }}
                  >
                    Editor Soal Kuis
                  </h3>
                  <div>
                    <input
                      type="file"
                      accept=".docx,.pdf,.xlsx,.txt"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                      id="upload-word-btn"
                    />
                    <label
                      htmlFor="upload-word-btn"
                      className="dt-btn-primary"
                      style={{
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 1rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      <span className="material-symbols-outlined">
                        auto_awesome
                      </span>
                      Ekstrak Otomatis AI
                    </label>
                  </div>
                </div>

                {isConverting && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "var(--slate-500)",
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        animation: "spin 1s linear infinite",
                        fontSize: "2rem",
                      }}
                    >
                      autorenew
                    </span>
                    <p style={{ marginTop: "0.5rem", fontWeight: 600 }}>
                      Sedang menganalisis dokumen yang anda inputkan
                    </p>
                  </div>
                )}

                {quizData.length === 0 && !isConverting && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      border: "1px dashed var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--slate-400)",
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "3rem", marginBottom: "0.5rem" }}
                    >
                      post_add
                    </span>
                    <p>
                      Belum ada soal. Silakan unggah dokumen (Word, PDF, Excel,
                      Txt) untuk diekstrak oleh AI, atau tambah manual.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setQuizData([
                          ...quizData,
                          {
                            id: Date.now(),
                            text: "",
                            options: ["", "", "", ""],
                            correctIndex: 0,
                          },
                        ])
                      }
                      style={{
                        marginTop: "1rem",
                        padding: "0.5rem 1rem",
                        border: "none",
                        backgroundColor: "var(--blue-50)",
                        color: "var(--blue-700)",
                        borderRadius: "var(--radius-md)",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Tambah Soal Manual
                    </button>
                  </div>
                )}

                {quizData.length > 0 && !isConverting && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                    }}
                  >
                    {quizData.map((q, qIndex) => (
                      <div
                        key={q.id}
                        style={{
                          padding: "1rem",
                          backgroundColor: "var(--slate-50)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              color: "var(--slate-700)",
                            }}
                          >
                            Soal {qIndex + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuizData(
                                quizData.filter((item) => item.id !== q.id),
                              )
                            }
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--red-600)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: "1.25rem" }}
                            >
                              delete
                            </span>
                          </button>
                        </div>
                        <textarea
                          className="dt-textarea"
                          rows={2}
                          value={q.text}
                          onChange={(e) => {
                            const newData = [...quizData];
                            newData[qIndex].text = e.target.value;
                            setQuizData(newData);
                          }}
                          placeholder="Pertanyaan..."
                          style={{ marginBottom: "1rem" }}
                        />
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          {q.options.map((opt, oIndex) => (
                            <div
                              key={oIndex}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correctIndex === oIndex}
                                onChange={() => {
                                  const newData = [...quizData];
                                  newData[qIndex].correctIndex = oIndex;
                                  setQuizData(newData);
                                }}
                                style={{
                                  width: "1.25rem",
                                  height: "1.25rem",
                                  accentColor: "var(--emerald-600)",
                                }}
                                title="Tandai sebagai jawaban benar"
                              />
                              <input
                                className="dt-input"
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newData = [...quizData];
                                  newData[qIndex].options[oIndex] =
                                    e.target.value;
                                  setQuizData(newData);
                                }}
                                placeholder={`Opsi ${String.fromCharCode(65 + oIndex)}`}
                                style={{ flex: 1, padding: "0.5rem" }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setQuizData([
                          ...quizData,
                          {
                            id: Date.now(),
                            text: "",
                            options: ["", "", "", ""],
                            correctIndex: 0,
                          },
                        ])
                      }
                      style={{
                        padding: "0.75rem",
                        border: "1px dashed var(--color-border)",
                        backgroundColor: "transparent",
                        color: "var(--slate-600)",
                        borderRadius: "var(--radius-md)",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span className="material-symbols-outlined">add</span>
                      Tambah Soal
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="dt-field dt-field--full">
              <label className="dt-label">Deskripsi / Instruksi</label>
              <textarea
                className="dt-textarea"
                rows={4}
                placeholder="Jelaskan instruksi pengerjaan..."
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
              />
            </div>
          </div>
          <div className="dt-form-actions">
            <button
              type="button"
              className="dt-btn-cancel"
              onClick={() => setView("list")}
            >
              Batal
            </button>
            <button type="submit" className="dt-btn-submit">
              <span className="material-symbols-outlined">save</span>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div
      className="page-shell"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Toast */}
      {toast && (
        <div className={`dt-toast dt-toast--${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="dt-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="dt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dt-modal-icon">
              <span className="material-symbols-outlined">delete_forever</span>
            </div>
            <h3>Hapus Tugas?</h3>
            <p>
              Tindakan ini tidak dapat dibatalkan. Semua data pengumpulan
              mahasiswa untuk tugas ini akan ikut terhapus.
            </p>
            <div className="dt-modal-actions">
              <button
                className="dt-btn-cancel"
                onClick={() => setDeleteId(null)}
              >
                Batal
              </button>
              <button className="dt-btn-delete" onClick={handleDelete}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {gradeModal && (
        <div className="dt-overlay" onClick={() => setGradeModal(null)}>
          <div
            className="dt-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <div
              className="dt-modal-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ color: "var(--blue-900)" }}>
                Penilaian Individu: {gradeModal.title}
              </h3>
              <button
                className="dt-btn-cancel"
                style={{ padding: "0.25rem 0.5rem" }}
                onClick={() => setGradeModal(null)}
              >
                X
              </button>
            </div>
            <div
              className="dt-modal-body"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "var(--blue-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    color: "var(--blue-700)",
                  }}
                >
                  F
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>Firman Mahasiswa</p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      color: "var(--slate-500)",
                    }}
                  >
                    NIM: 1301210001
                  </p>
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    className="dt-input"
                    style={{ width: "80px", textAlign: "center" }}
                    value={gradeInputs["1301210001"] || ""}
                    onChange={(e) =>
                      setGradeInputs({
                        ...gradeInputs,
                        1301210001: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  S
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>Siti Aminah</p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      color: "var(--slate-500)",
                    }}
                  >
                    NIM: 1301210002
                  </p>
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    className="dt-input"
                    style={{ width: "80px", textAlign: "center" }}
                    value={gradeInputs["1301210002"] || ""}
                    onChange={(e) =>
                      setGradeInputs({
                        ...gradeInputs,
                        1301210002: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="dt-modal-actions" style={{ marginTop: "1rem" }}>
              <button
                className="dt-btn-cancel"
                onClick={() => setGradeModal(null)}
              >
                Batal
              </button>
              <button className="dt-btn-submit" onClick={saveGrades}>
                Simpan Nilai
              </button>
            </div>
          </div>
        </div>
      )}

      <SidebarDosen
        onNavigate={onNavigate}
        onLogout={onLogout}
        activePage="dosenTugas"
        mobileOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <main
        className="page-main"
        style={{ backgroundColor: "var(--color-background)" }}
      >
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

        <div className="page-content">
          {/* Top bar */}
          <div className="dt-topbar">
            <div>
              <h2 className="dt-page-title">
                {view === "list"
                  ? "Tugas"
                  : view === "create"
                    ? "Buat Tugas Baru"
                    : "Edit Tugas"}
              </h2>
              <p className="dt-page-sub">
                {view === "list"
                  ? "Kelola semua tugas yang Anda berikan kepada mahasiswa."
                  : view === "create"
                    ? "Isi detail tugas yang akan diberikan kepada mahasiswa."
                    : "Perbarui informasi tugas yang sudah ada."}
              </p>
            </div>
            {view === "list" && (
              <button className="dt-btn-primary" onClick={startForm}>
                <span className="material-symbols-outlined">add_task</span>
                Buat Tugas Baru
              </button>
            )}
          </div>

          {/* LIST VIEW */}
          {view === "list" && (
            <>
              {/* Filters */}
              <div className="dt-filter-row">
                {["Semua", "Aktif", "Selesai"].map((f) => (
                  <button
                    key={f}
                    className={`dt-filter-btn ${filter === f ? "dt-filter-btn--active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
                <span className="dt-filter-count">{filtered.length} tugas</span>
              </div>

              {/* Stats row */}
              <div className="dt-stats-row">
                {[
                  {
                    label: "Total Tugas",
                    value: tasks.length,
                    icon: "assignment",
                    color: "var(--color-secondary)",
                  },
                  {
                    label: "Tugas Aktif",
                    value: tasks.filter((t) => t.status === "Aktif").length,
                    icon: "pending_actions",
                    color: "#c47f17",
                  },
                  {
                    label: "Selesai",
                    value: tasks.filter((t) => t.status === "Selesai").length,
                    icon: "task_alt",
                    color: "#2f9696",
                  },
                  {
                    label: "Belum Dinilai",
                    value: 42,
                    icon: "rate_review",
                    color: "#dc2626",
                  },
                ].map((s) => (
                  <div key={s.label} className="dt-stat-mini">
                    <span
                      className="material-symbols-outlined"
                      style={{ color: s.color }}
                    >
                      {s.icon}
                    </span>
                    <div>
                      <p
                        className="dt-stat-mini-val"
                        style={{ color: s.color }}
                      >
                        {s.value}
                      </p>
                      <p className="dt-stat-mini-lbl">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Task Cards */}
              <div className="dt-task-grid">
                {filtered.map((task) => {
                  const dl = daysLeft(task.deadline);
                  const progress = Math.round(
                    (task.submitted / task.total) * 100,
                  );
                  return (
                    <div key={task.id} className="dt-task-card">
                      <div className="dt-task-card-header">
                        <div className="dt-task-meta">
                          <span
                            className={`dt-type-badge dt-type-badge--${task.type === "Kelompok" ? "group" : "individual"}`}
                          >
                            <span className="material-symbols-outlined">
                              {task.type === "Kelompok" ? "groups" : "person"}
                            </span>
                            {task.type}
                          </span>
                          <span
                            className={`dt-status-badge dt-status-badge--${task.status === "Aktif" ? "active" : "done"}`}
                          >
                            {task.status}
                          </span>
                        </div>
                        <div className="dt-task-actions-menu">
                          <button
                            className="dt-edit-btn"
                            onClick={() => handleEdit(task)}
                          >
                            <span className="material-symbols-outlined">
                              edit
                            </span>
                          </button>
                          <button
                            className="dt-delete-btn"
                            onClick={() => confirmDelete(task.id)}
                          >
                            <span className="material-symbols-outlined">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                      <h3 className="dt-task-title">{task.title}</h3>
                      <p className="dt-task-matkul">
                        <span className="material-symbols-outlined">
                          menu_book
                        </span>
                        {task.matkul}
                      </p>
                      <p className="dt-task-desc">{task.desc}</p>
                      <div className="dt-task-progress">
                        <div className="dt-progress-info">
                          <span className="dt-progress-label">Pengumpulan</span>
                          <span className="dt-progress-val">
                            {task.submitted}/{task.total}
                          </span>
                        </div>
                        <div className="dt-progress-track">
                          <div
                            className="dt-progress-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="dt-task-footer">
                        <div
                          className={`dt-deadline ${dl < 0 ? "dt-deadline--late" : dl < 3 ? "dt-deadline--soon" : ""}`}
                        >
                          <span className="material-symbols-outlined">
                            event
                          </span>
                          {dl < 0
                            ? `Lewat ${Math.abs(dl)} hari`
                            : dl === 0
                              ? "Hari ini"
                              : `${dl} hari lagi`}
                        </div>
                        <button
                          className="dt-grade-btn"
                          onClick={() => handleGradeTask(task)}
                        >
                          <span className="material-symbols-outlined">
                            grade
                          </span>
                          Nilai
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* CREATE / EDIT VIEW */}
          {view === "create" && renderTaskForm(handleCreate, "Buat Tugas")}
          {view === "edit" && renderTaskForm(handleUpdate, "Simpan Perubahan")}
        </div>
      </main>
    </div>
  );
}
