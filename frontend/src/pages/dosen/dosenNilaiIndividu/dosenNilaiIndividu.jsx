import React, { useState, useEffect } from "react";
import "../../../shared.css";
import "./dosenNilaiIndividu.css";
import SidebarDosen from "../../../SidebarDosen";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";
import { apiClient } from "../../../utils/apiClient";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const MEMBER_COLORS = ["#4b53bc", "#2f9696", "#c47f17", "#7c3aed", "#0891b2", "#059669", "#dc2626", "#be185d", "#8991fe"];

function initials(name) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function getColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}

export default function DosenNilaiIndividu({ onNavigate, onLogout, idMataKuliah, idTugas, tipe }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [mataKuliahList, setMataKuliahList] = useState([]);
  const [selectedMk, setSelectedMk] = useState("");
  const [tugasList, setTugasList] = useState([]);
  const [selectedTugas, setSelectedTugas] = useState(null);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [filter, setFilter] = useState("semua");
  const [loading, setLoading] = useState(false);
  const [loadingMhs, setLoadingMhs] = useState(false);
  const [toast, setToast] = useState(null);
  const [nilaiModal, setNilaiModal] = useState(null);
  const [nilaiInput, setNilaiInput] = useState("");

  useEffect(() => {
    if (idMataKuliah) {
      setSelectedMk(String(idMataKuliah));
    }
  }, [idMataKuliah]);

  useEffect(() => {
    if (idTugas && tugasList.length > 0) {
      const found = tugasList.find(t => 
        String(t.idTugas) === String(idTugas) && 
        (!tipe || t.tipe === tipe)
      );
      if (found) {
        setSelectedTugas(found);
      }
    }
  }, [idTugas, tugasList, tipe]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { fetchMataKuliah(); }, []);

  useEffect(() => {
    if (selectedMk) {
      setSelectedTugas(null);
      setMahasiswaList([]);
      fetchTugasList();
    }
  }, [selectedMk]);

  useEffect(() => {
    if (selectedTugas) fetchMahasiswaList();
  }, [selectedTugas]);

  const fetchMataKuliah = async () => {
    try {
      const res = await apiClient.get('/api/mata-kuliah');
      const data = res?.data || res;
      if (Array.isArray(data)) setMataKuliahList(data);
    } catch (e) {}
  };

  const fetchTugasList = async () => {
    if (!selectedMk) return;
    setLoading(true);
    setTugasList([]);
    try {
      const res = await apiClient.get(`/api/nilai/tugas-list/${selectedMk}`);
      const data = res?.data || res;
      const list = Array.isArray(data) ? data : (data?.data || []);
      setTugasList(list);
    } catch (e) {
      showToast("Gagal memuat daftar tugas", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchMahasiswaList = async () => {
    if (!selectedTugas) return;
    setLoadingMhs(true);
    setMahasiswaList([]);
    try {
      const res = await apiClient.get(`/api/nilai/submissions/tugas/${selectedTugas.idTugas}?idMataKuliah=${selectedMk}&tipe=${selectedTugas.tipe || 'Tugas'}`);
      const data = res?.data || res;
      const list = Array.isArray(data) ? data : (data?.data || []);
      setMahasiswaList(list);
    } catch (e) {
      showToast("Gagal memuat data mahasiswa", "error");
    } finally {
      setLoadingMhs(false);
    }
  };

  const filteredList = mahasiswaList.filter(m => {
    if (filter === "kumpul") return m.sudahKumpul;
    if (filter === "belum") return !m.sudahKumpul;
    return true;
  });

  const openNilaiModal = (mhs) => {
    setNilaiModal(mhs);
    setNilaiInput(mhs.nilai !== null && mhs.nilai !== undefined ? String(mhs.nilai) : "");
  };

  const saveNilai = async () => {
    if (!nilaiModal) return;
    const nilai = parseFloat(nilaiInput);
    if (isNaN(nilai) || nilai < 0 || nilai > 100) {
      showToast("Nilai harus antara 0-100", "error");
      return;
    }
    try {
      await apiClient.post('/api/nilai/submissions/nilai', {
        nomorInduk: nilaiModal.nomorInduk,
        idMataKuliah: selectedMk,
        nilaiTugas: nilai
      });
      showToast("Nilai berhasil disimpan!");
      setNilaiModal(null);
      setMahasiswaList(prev => prev.map(m =>
        m.nim === nilaiModal.nim ? { ...m, nilai } : m
      ));
    } catch (e) {
      showToast(e.message || "Gagal menyimpan nilai", "error");
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const getLetterGrade = (nilai) => {
    if (nilai === null || nilai === undefined) return "-";
    if (nilai >= 85) return "A";
    if (nilai >= 80) return "A-";
    if (nilai >= 75) return "B+";
    if (nilai >= 70) return "B";
    if (nilai >= 65) return "B-";
    if (nilai >= 60) return "C";
    if (nilai >= 50) return "D";
    return "E";
  };

  const sudahKumpulCount = mahasiswaList.filter(m => m.sudahKumpul).length;
  const sudahNilaiCount = mahasiswaList.filter(m => m.nilai !== null && m.nilai !== undefined).length;

  return (
    <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
      {toast && (
        <div className={`dni-toast dni-toast--${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.msg}
        </div>
      )}

      {nilaiModal && (
        <div className="dni-overlay" onClick={() => setNilaiModal(null)}>
          <div className="dni-modal" onClick={e => e.stopPropagation()}>
            <div className="dni-modal-header">
              <h3>Beri Nilai</h3>
              <button className="dni-modal-close" onClick={() => setNilaiModal(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="dni-modal-body">
              <div className="dni-student-info">
                <div className="dni-avatar" style={{ background: getColor(nilaiModal.nim) }}>
                  {initials(nilaiModal.nama)}
                </div>
                <div>
                  <p className="dni-student-name">{nilaiModal.nama}</p>
                  <p className="dni-student-nim">{nilaiModal.nomorInduk}</p>
                </div>
              </div>
              <p className="dni-task-title">
                <strong>Tugas:</strong> {selectedTugas?.judul || "-"}
              </p>
              <div className="dni-input-group">
                <label>Nilai Tugas (0–100)</label>
                <div className="dni-input-wrap">
                  <input
                    type="number" min="0" max="100"
                    value={nilaiInput}
                    onChange={e => setNilaiInput(e.target.value)}
                    placeholder="0-100"
                    className="dni-input"
                  />
                  <span className="dni-input-suffix">/100</span>
                </div>
                {nilaiInput !== "" && (
                  <span className="dni-letter-grade">
                    Grade: <strong>{getLetterGrade(parseFloat(nilaiInput))}</strong>
                  </span>
                )}
              </div>
            </div>
            <div className="dni-modal-footer">
              <button className="dni-btn-cancel" onClick={() => setNilaiModal(null)}>Batal</button>
              <button className="dni-btn-save" onClick={saveNilai}>
                <span className="material-symbols-outlined">save</span>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <SidebarDosen onNavigate={onNavigate} onLogout={onLogout} activePage="dosenNilaiIndividu" mobileOpen={sidebarOpen} onClose={closeSidebar} />

      <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
        <Navbar role="Dosen" onOpenSidebar={openSidebar} onNavigate={typeof onNavigate !== "undefined" ? onNavigate : undefined} />

        <div className="page-content">
          <div className="dni-header">
            <div>
              <h2 className="dni-title">{selectedTugas?.tipe === 'Kuis' ? 'Nilai Kuis Mahasiswa' : 'Nilai Tugas Individu'}</h2>
              <p className="dni-subtitle">
                {selectedTugas?.tipe === 'Kuis' 
                  ? 'Hasil dan nilai kuis mahasiswa yang bersifat permanen' 
                  : 'Pilih mata kuliah dan tugas untuk memberi penilaian'}
              </p>
            </div>
          </div>

          {/* Step 1 & 2: Pilih Matkul + Tugas */}
          <div className="dni-filters">
            <div className="dni-select-wrap">
              <label>Mata Kuliah</label>
              <select value={selectedMk} onChange={e => setSelectedMk(e.target.value)} className="dni-select">
                <option value="">-- Pilih Mata Kuliah --</option>
                {mataKuliahList.map(mk => (
                  <option key={mk.idMataKuliah} value={mk.idMataKuliah}>{mk.namaMataKuliah}</option>
                ))}
              </select>
            </div>

            {selectedMk && (
              <div className="dni-select-wrap">
                <label>Tugas</label>
                {loading ? (
                  <p style={{ fontSize: "0.875rem", color: "var(--slate-500)" }}>Memuat tugas...</p>
                ) : tugasList.length === 0 ? (
                  <p style={{ fontSize: "0.875rem", color: "var(--slate-500)" }}>Belum ada tugas untuk mata kuliah ini</p>
                ) : (
                  <select
                    value={selectedTugas?.idTugas || ""}
                    onChange={e => {
                      const t = tugasList.find(t => String(t.idTugas) === e.target.value);
                      setSelectedTugas(t || null);
                    }}
                    className="dni-select"
                  >
                    <option value="">-- Pilih Tugas --</option>
                    {tugasList.map(t => (
                      <option key={t.idTugas} value={t.idTugas}>{t.judul}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Info bar tugas terpilih */}
          {selectedTugas && (
            <div className="dni-tugas-info">
              <div className="dni-tugas-info-left">
                <span className="material-symbols-outlined">assignment</span>
                <div>
                  <p className="dni-tugas-name">
                    <span style={{ 
                      padding: "0.25rem 0.5rem", 
                      fontSize: "0.75rem", 
                      borderRadius: "4px", 
                      background: selectedTugas.tipe === 'Kuis' ? 'var(--blue-50)' : 'var(--slate-100)', 
                      color: selectedTugas.tipe === 'Kuis' ? 'var(--blue-700)' : 'var(--slate-700)', 
                      fontWeight: 600,
                      marginRight: "0.5rem",
                      display: "inline-block"
                    }}>
                      {selectedTugas.tipe || 'Tugas'}
                    </span>
                    {selectedTugas.judul}
                  </p>
                  <p className="dni-tugas-deadline">
                    Deadline: {selectedTugas.deadlineTugas ? formatDate(selectedTugas.deadlineTugas) : "Tanpa deadline"}
                  </p>
                </div>
              </div>
              {mahasiswaList.length > 0 && (
                <div className="dni-tugas-stats">
                  <span className="dni-stat-pill dni-stat-pill--green">{sudahKumpulCount} Sudah Kumpul</span>
                  <span className="dni-stat-pill dni-stat-pill--gray">{mahasiswaList.length - sudahKumpulCount} Belum Kumpul</span>
                  <span className="dni-stat-pill dni-stat-pill--blue">{sudahNilaiCount} Sudah Dinilai</span>
                </div>
              )}
            </div>
          )}

          {/* Filter tabs */}
          {selectedTugas && mahasiswaList.length > 0 && (
            <div className="dni-tabs" style={{ marginBottom: "1rem" }}>
              {[
                { key: "semua", label: `Semua (${mahasiswaList.length})` },
                { key: "kumpul", label: `Sudah Kumpul (${sudahKumpulCount})` },
                { key: "belum", label: `Belum Kumpul (${mahasiswaList.length - sudahKumpulCount})` },
              ].map(tab => (
                <button key={tab.key} className={`dni-tab ${filter === tab.key ? "dni-tab--active" : ""}`} onClick={() => setFilter(tab.key)}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          {!selectedMk ? (
            <div className="dni-empty">
              <span className="material-symbols-outlined">school</span>
              <p>Pilih mata kuliah terlebih dahulu</p>
            </div>
          ) : !selectedTugas ? (
            <div className="dni-empty">
              <span className="material-symbols-outlined">assignment</span>
              <p>Pilih tugas untuk melihat daftar mahasiswa</p>
            </div>
          ) : loadingMhs ? (
            <div className="dni-loading">
              <span className="material-symbols-outlined">hourglass_empty</span>
              <p>Memuat data mahasiswa...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="dni-empty">
              <span className="material-symbols-outlined">inbox</span>
              <p>Tidak ada data untuk filter ini</p>
            </div>
          ) : (
            <div className="dni-table-wrap">
              <table className="dni-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Mahasiswa</th>
                    <th>Status</th>
                    <th>Tanggal Kumpul</th>
                    <th>{selectedTugas?.tipe === 'Kuis' ? 'Pengerjaan' : 'File Jawaban'}</th>
                    <th>Nilai</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((m, i) => (
                    <tr key={m.nim} className={!m.sudahKumpul ? "dni-row--belum" : ""}>
                      <td className="dni-cell-no">{i + 1}</td>
                      <td>
                        <div className="dni-student-cell">
                          <div className="dni-avatar-sm" style={{ background: getColor(m.nim) }}>
                            {initials(m.nama)}
                          </div>
                          <div>
                            <p className="dni-name">{m.nama}</p>
                            <p className="dni-nim">{m.nomorInduk}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {m.sudahKumpul ? (
                          <span className="dni-status dni-status--kumpul">
                            <span className="material-symbols-outlined">check_circle</span> Sudah Kumpul
                          </span>
                        ) : (
                          <span className="dni-status dni-status--belum">
                            <span className="material-symbols-outlined">cancel</span> Belum Kumpul
                          </span>
                        )}
                      </td>
                      <td>{m.sudahKumpul ? formatDate(m.tanggalKumpul) : "-"}</td>
                      <td>
                        {selectedTugas?.tipe === 'Kuis' ? (
                          m.sudahKumpul ? (
                            <span style={{ color: "var(--emerald-600)", fontWeight: 500, fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>check_circle</span> Kuis Selesai
                            </span>
                          ) : (
                            <span style={{ color: "var(--slate-400)", fontSize: "0.875rem" }}>-</span>
                          )
                        ) : (
                          m.fileJawaban ? (
                            <a href={`${API_BASE}${m.fileJawaban}`} target="_blank" rel="noopener noreferrer" className="dni-file-link">
                              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>description</span>
                              Lihat File
                            </a>
                          ) : (
                            <span style={{ color: "var(--slate-400)", fontSize: "0.875rem" }}>-</span>
                          )
                        )}
                      </td>
                      <td>
                        {m.nilai !== null && m.nilai !== undefined ? (
                          <span className="dni-nilai-badge">
                            {m.nilai} <span style={{ opacity: 0.7 }}>({getLetterGrade(m.nilai)})</span>
                          </span>
                        ) : (
                          <span className="dni-nilai-badge dni-nilai-badge--empty">-</span>
                        )}
                      </td>
                      <td>
                        {selectedTugas?.tipe === 'Kuis' ? (
                          m.sudahKumpul ? (
                            <span style={{ color: "var(--slate-500)", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>lock</span> Permanen
                            </span>
                          ) : (
                            <span style={{ color: "var(--slate-400)", fontSize: "0.8rem" }}>—</span>
                          )
                        ) : m.sudahKumpul ? (
                          <button className="dni-btn-nilai" onClick={() => openNilaiModal(m)}>
                            <span className="material-symbols-outlined">edit</span>
                            {m.nilai !== null ? "Edit" : "Nilai"}
                          </button>
                        ) : (
                          <span style={{ color: "var(--slate-400)", fontSize: "0.8rem" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}