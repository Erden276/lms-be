import React, { useState, useEffect } from "react";
import "../../../shared.css";
import "./nilai.css";
import Sidebar from "../../../Sidebar";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";
import { apiClient } from "../../../utils/apiClient";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlRblArhYvkrSWfEx3UWaIaP5bdg8OpReWzF-sc4sB_2K3sC4IYv7Q4-lWy6VUtGhc5esYpVi12_HYjLZdjx6ILoT60xad1GfsEtHStVQIigk44gnAXnpEAjWrPWVYNa_AKdaDPqXQwdlJDbcccdQ96CZrZ6btx50rBBy3LvfY-eINJ1MtiJWLJpWBAo2nnbaNr3i-_Yn3B_BsVkOxpG3hVSKt38J2-NxnAah9LFYcNLvZARv4lzr86P24cdV4haCMW80Nudw5Lku";

const INITIAL_SEMESTERS = [
  {
    label: "Semester 1",
    year: "2022/2023 Ganjil",
    ipk: 3.75,
    sks: 20,
    matkul: [
      {
        kode: "IF001",
        nama: "Pengantar Teknologi Informasi",
        sks: 3,
        tugas: 85,
        uts: 80,
        uas: 88,
        nilai: "A",
      },
      {
        kode: "IF002",
        nama: "Matematika Diskrit",
        sks: 4,
        tugas: 78,
        uts: 72,
        uas: 79,
        nilai: "B+",
      },
      {
        kode: "IF003",
        nama: "Algoritma & Pemrograman",
        sks: 4,
        tugas: 90,
        uts: 87,
        uas: 92,
        nilai: "A",
      },
      {
        kode: "MU001",
        nama: "Pendidikan Agama",
        sks: 2,
        tugas: 88,
        uts: 85,
        uas: 90,
        nilai: "A",
      },
      {
        kode: "MU002",
        nama: "Bahasa Indonesia",
        sks: 2,
        tugas: 82,
        uts: 78,
        uas: 80,
        nilai: "B+",
      },
      {
        kode: "IF004",
        nama: "Logika Komputasi",
        sks: 3,
        tugas: 75,
        uts: 70,
        uas: 74,
        nilai: "B",
      },
      {
        kode: "MU003",
        nama: "Pancasila",
        sks: 2,
        tugas: 80,
        uts: 77,
        uas: 82,
        nilai: "B+",
      },
    ],
  },
  {
    label: "Semester 2",
    year: "2022/2023 Genap",
    ipk: 3.82,
    sks: 21,
    matkul: [
      {
        kode: "IF005",
        nama: "Pemrograman Berorientasi Objek",
        sks: 4,
        tugas: 92,
        uts: 88,
        uas: 90,
        nilai: "A",
      },
      {
        kode: "IF006",
        nama: "Struktur Data",
        sks: 4,
        tugas: 85,
        uts: 82,
        uas: 86,
        nilai: "A-",
      },
      {
        kode: "IF007",
        nama: "Sistem Basis Data",
        sks: 3,
        tugas: 78,
        uts: 75,
        uas: 80,
        nilai: "B+",
      },
      {
        kode: "IF008",
        nama: "Jaringan Komputer Dasar",
        sks: 3,
        tugas: 80,
        uts: 77,
        uas: 79,
        nilai: "B+",
      },
      {
        kode: "MU004",
        nama: "Kewarganegaraan",
        sks: 2,
        tugas: 83,
        uts: 80,
        uas: 84,
        nilai: "A-",
      },
      {
        kode: "IF009",
        nama: "Matematika Komputasi",
        sks: 3,
        tugas: 72,
        uts: 68,
        uas: 71,
        nilai: "B",
      },
      {
        kode: "MU005",
        nama: "Bahasa Inggris Teknik",
        sks: 2,
        tugas: 88,
        uts: 84,
        uas: 86,
        nilai: "A-",
      },
    ],
  },
  {
    label: "Semester 3",
    year: "2023/2024 Ganjil",
    ipk: 3.9,
    sks: 22,
    matkul: [
      {
        kode: "IF010",
        nama: "Desain & Analisis Algoritma",
        sks: 4,
        tugas: 90,
        uts: 88,
        uas: 91,
        nilai: "A",
      },
      {
        kode: "IF011",
        nama: "Rekayasa Perangkat Lunak",
        sks: 3,
        tugas: 87,
        uts: 85,
        uas: 89,
        nilai: "A",
      },
      {
        kode: "IF012",
        nama: "Sistem Operasi",
        sks: 3,
        tugas: 82,
        uts: 80,
        uas: 83,
        nilai: "A-",
      },
      {
        kode: "IF013",
        nama: "Kalkulus & Statistika",
        sks: 4,
        tugas: 76,
        uts: 73,
        uas: 77,
        nilai: "B+",
      },
      {
        kode: "IF014",
        nama: "Kecerdasan Buatan Dasar",
        sks: 4,
        tugas: 91,
        uts: 89,
        uas: 93,
        nilai: "A",
      },
      {
        kode: "IF015",
        nama: "Basis Data Lanjut",
        sks: 4,
        tugas: 85,
        uts: 83,
        uas: 86,
        nilai: "A-",
      },
    ],
  },
  {
    label: "Semester 4 (Aktif)",
    year: "2023/2024 Genap",
    ipk: null,
    sks: 19,
    matkul: [
      {
        kode: "IF016",
        nama: "Analisis Desain Interaksi",
        sks: 3,
        tugas: 88,
        uts: 85,
        uas: null,
        nilai: null,
      },
      {
        kode: "IF017",
        nama: "Pemrograman Web Lanjut",
        sks: 4,
        tugas: 90,
        uts: 88,
        uas: null,
        nilai: null,
      },
      {
        kode: "IF018",
        nama: "Arsitektur & Org. Komputer",
        sks: 3,
        tugas: 82,
        uts: 78,
        uas: null,
        nilai: null,
      },
      {
        kode: "IF019",
        nama: "Machine Learning Dasar",
        sks: 4,
        tugas: 86,
        uts: 84,
        uas: null,
        nilai: null,
      },
      {
        kode: "IF020",
        nama: "Etika Profesi IT",
        sks: 2,
        tugas: 90,
        uts: 88,
        uas: null,
        nilai: null,
      },
      {
        kode: "IF021",
        nama: "Proyek Perangkat Lunak",
        sks: 3,
        tugas: 85,
        uts: null,
        uas: null,
        nilai: null,
      },
    ],
  },
];

const NILAI_COLOR = {
  A: { bg: "#ecfdf5", color: "#059669" },
  "A-": { bg: "#f0fdf4", color: "#16a34a" },
  "B+": { bg: "#eff6ff", color: "#2563eb" },
  B: { bg: "#f0f9ff", color: "#0284c7" },
  "B-": { bg: "#f0f4ff", color: "#4338ca" },
  C: { bg: "#fff7ed", color: "#ea580c" },
  D: { bg: "#fff1f2", color: "#dc2626" },
  E: { bg: "#fef2f2", color: "#b91c1c" },
};

function NilaiBadge({ nilai }) {
  if (!nilai)
    return <span className="nlai-badge nlai-badge--pending">Proses</span>;
  const style = NILAI_COLOR[nilai] || { bg: "#f8fafc", color: "#64748b" };
  return (
    <span
      className="nlai-badge"
      style={{ background: style.bg, color: style.color }}
    >
      {nilai}
    </span>
  );
}

function scoreBar(score) {
  if (score === null || score === undefined) return "—";
  return score;
}

// Compute IPK kumulatif from finished semesters
function getIPKKumulatif(semesters) {
  let totalBobot = 0,
    totalSks = 0;
  semesters.forEach((sem) => {
    if (sem.ipk !== null) {
      totalBobot += sem.ipk * sem.sks;
      totalSks += sem.sks;
    }
  });
  return totalSks > 0 ? (totalBobot / totalSks).toFixed(2) : "—";
}

function calculateGrade(tugas, kuis) {
  // Simplifikasi grading untuk integrasi, misal tugas 50% kuis 50%
  const total = (Number(tugas || 0) * 0.5) + (Number(kuis || 0) * 0.5);
  if (total >= 85) return "A";
  if (total >= 80) return "A-";
  if (total >= 75) return "B+";
  if (total >= 70) return "B";
  if (total >= 65) return "B-";
  if (total >= 60) return "C";
  if (total >= 50) return "D";
  return "E";
}

function convertGradeToPoint(grade) {
  const map = { "A": 4, "A-": 3.75, "B+": 3.5, "B": 3.0, "B-": 2.75, "C": 2.0, "D": 1.0, "E": 0 };
  return map[grade] || 0;
}

export default function Nilai({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [semesters, setSemesters] = useState([]);
  const [activeSem, setActiveSem] = useState(0); 
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTranskrip = async () => {
      try {
        const res = await apiClient.get('/api/nilai/transkrip/mahasiswa');
        if (res && res.data) {
          const keys = Object.keys(res.data).sort((a,b) => (a === 'null' ? 99 : Number(a)) - (b === 'null' ? 99 : Number(b)));
          const formattedSems = keys.map(k => {
            let totalSks = 0;
            let totalPoint = 0;
            
            const matkul = res.data[k].map(m => {
              const tugas = m.nilaiTugas ? parseFloat(m.nilaiTugas) : null;
              const kuis = m.nilaiKuis ? parseFloat(m.nilaiKuis) : null;
              const finalScore = m.nilaiAkhir ? parseFloat(m.nilaiAkhir) : null;
              const grade = finalScore ? calculateGrade(tugas, kuis) : null;
              
              const sks = 3; // hardcode sks for now as it's not in db
              totalSks += sks;
              if (grade) {
                totalPoint += convertGradeToPoint(grade) * sks;
              }

              return {
                kode: `MK${m.idMataKuliah}`,
                nama: m.mataKuliah?.namaMataKuliah || "Mata Kuliah",
                sks: sks,
                tugas: tugas,
                uts: kuis, // mapping kuis to uts in UI
                uas: finalScore,
                nilai: grade
              };
            });

            const ipk = totalSks > 0 && totalPoint > 0 ? totalPoint / totalSks : null;

            return {
              label: k === 'null' ? 'Semester Aktif' : `Semester ${k}`,
              year: 'Tahun Akademik',
              ipk: ipk,
              sks: totalSks,
              matkul: matkul
            };
          });
          
          if (formattedSems.length > 0) {
            setSemesters(formattedSems);
            setActiveSem(formattedSems.length - 1); // Set to last semester active
          } else {
            setSemesters(INITIAL_SEMESTERS);
            setActiveSem(3);
          }
        }
      } catch (error) {
        setSemesters(INITIAL_SEMESTERS);
        setActiveSem(3);
      } finally {
        setLoading(false);
      }
    };
    fetchTranskrip();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const sem = semesters[activeSem] || { matkul: [], label: "", year: "", sks: 0, ipk: null };
  const ipkKumulatif = semesters.length > 0 ? getIPKKumulatif(semesters) : "—";
  const totalSksSelesai = semesters.length > 0 ? semesters.filter((s) => s.ipk !== null).reduce(
    (acc, s) => acc + s.sks,
    0,
  ) : 0;

  const storedUserStr = localStorage.getItem("user");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : {};

  if (loading) {
    return <div className="page-shell"><main className="page-main"><div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Memuat transkrip...</div></main></div>;
  }

  return (
    <div
      className="page-shell"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "5rem",
            right: "1.5rem",
            zIndex: 999,
            background: "#ecfdf5",
            color: "#059669",
            border: "1px solid #a7f3d0",
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
            check_circle
          </span>
          {toast}
        </div>
      )}
      {/* Sidebar */}
      <Sidebar
        onNavigate={onNavigate}
        onLogout={onLogout}
        activePage="nilai"
        mobileOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main */}
      <main
        className="page-main"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        {/* Navbar */}
        <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} onNavigate={typeof nav !== "undefined" ? nav : (typeof onNavigate !== "undefined" ? onNavigate : undefined)} />

        <div className="page-content">
          {/* Page Header */}
          <div className="nlai-page-header">
            <div>
              <h1 className="nlai-title">Transkrip Nilai</h1>
              <p className="nlai-subtitle">
                Rekap nilai akademik {storedUser.nama || "Mahasiswa"} — NIM {storedUser.nomorInduk || "NIM"}
              </p>
            </div>
            <button
              className="nlai-download-btn"
              onClick={() =>
                showToast("Transkrip nilai sedang diunduh dalam format PDF...")
              }
            >
              <span className="material-symbols-outlined">download</span>
              Unduh Transkrip
            </button>
          </div>

          {/* Summary Cards */}
          <div className="nlai-summary-grid">
            <div className="nlai-sum-card nlai-sum-card--blue">
              <span className="material-symbols-outlined nlai-sum-icon">
                grade
              </span>
              <div>
                <p className="nlai-sum-val">{ipkKumulatif}</p>
                <p className="nlai-sum-lbl">IPK Kumulatif</p>
              </div>
            </div>
            <div className="nlai-sum-card nlai-sum-card--teal">
              <span className="material-symbols-outlined nlai-sum-icon">
                school
              </span>
              <div>
                <p className="nlai-sum-val">{totalSksSelesai}</p>
                <p className="nlai-sum-lbl">SKS Lulus</p>
              </div>
            </div>
            <div className="nlai-sum-card nlai-sum-card--amber">
              <span className="material-symbols-outlined nlai-sum-icon">
                calendar_today
              </span>
              <div>
                <p className="nlai-sum-val">{semesters.length}</p>
                <p className="nlai-sum-lbl">Semester Ditempuh</p>
              </div>
            </div>
            <div className="nlai-sum-card nlai-sum-card--purple">
              <span className="material-symbols-outlined nlai-sum-icon">
                workspace_premium
              </span>
              <div>
                <p className="nlai-sum-val">Cum Laude</p>
                <p className="nlai-sum-lbl">Predikat Target</p>
              </div>
            </div>
          </div>

          {/* Semester Tabs */}
          <div className="nlai-sem-tabs">
            {semesters.map((s, i) => (
              <button
                key={i}
                className={`nlai-sem-tab ${activeSem === i ? "nlai-sem-tab--active" : ""}`}
                onClick={() => setActiveSem(i)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Semester Detail */}
          <div className="nlai-semester-card">
            {/* Card Header */}
            <div className="nlai-sem-header">
              <div>
                <h2 className="nlai-sem-title">{sem.label}</h2>
                <p className="nlai-sem-year">{sem.year}</p>
              </div>
              <div className="nlai-sem-meta">
                <div className="nlai-sem-meta-item">
                  <p className="nlai-sem-meta-lbl">Total SKS</p>
                  <p className="nlai-sem-meta-val">{sem.sks} SKS</p>
                </div>
                <div className="nlai-sem-meta-divider"></div>
                <div className="nlai-sem-meta-item">
                  <p className="nlai-sem-meta-lbl">IP Semester</p>
                  <p className="nlai-sem-meta-val nlai-sem-meta-val--blue">
                    {sem.ipk !== null ? sem.ipk.toFixed(2) : "Belum Final"}
                  </p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="nlai-table-wrap">
              <table className="nlai-table">
                <thead>
                  <tr>
                    <th>Kode MK</th>
                    <th>Mata Kuliah</th>
                    <th className="nlai-th-center">SKS</th>
                    <th className="nlai-th-center">Tugas</th>
                    <th className="nlai-th-center">UTS</th>
                    <th className="nlai-th-center">UAS</th>
                    <th className="nlai-th-center">Nilai Akhir</th>
                    <th className="nlai-th-center">Mutu</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.matkul.map((mk, i) => {
                    const hasAll =
                      mk.tugas !== null && mk.uts !== null && mk.uas !== null;
                    const avg = hasAll
                      ? (mk.tugas * 0.3 + mk.uts * 0.3 + mk.uas * 0.4).toFixed(
                          1,
                        )
                      : null;
                    return (
                      <tr key={i} className="nlai-row">
                        <td className="nlai-code">{mk.kode}</td>
                        <td className="nlai-name">{mk.nama}</td>
                        <td className="nlai-center">{mk.sks}</td>
                        <td className="nlai-center">
                          <span
                            className={
                              mk.tugas !== null
                                ? "nlai-score"
                                : "nlai-score nlai-score--pending"
                            }
                          >
                            {scoreBar(mk.tugas)}
                          </span>
                        </td>
                        <td className="nlai-center">
                          <span
                            className={
                              mk.uts !== null
                                ? "nlai-score"
                                : "nlai-score nlai-score--pending"
                            }
                          >
                            {scoreBar(mk.uts)}
                          </span>
                        </td>
                        <td className="nlai-center">
                          <span
                            className={
                              mk.uas !== null
                                ? "nlai-score"
                                : "nlai-score nlai-score--pending"
                            }
                          >
                            {scoreBar(mk.uas)}
                          </span>
                        </td>
                        <td className="nlai-center">
                          <span
                            className={
                              avg !== null
                                ? "nlai-avg"
                                : "nlai-avg nlai-avg--pending"
                            }
                          >
                            {avg !== null ? avg : "—"}
                          </span>
                        </td>
                        <td className="nlai-center">
                          <NilaiBadge nilai={mk.nilai} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Weight Note */}
            <div className="nlai-weight-note">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "1rem", color: "var(--slate-400)" }}
              >
                info
              </span>
              <p>Bobot Nilai: Tugas 30% · UTS 30% · UAS 40%</p>
            </div>
          </div>

          {/* IPK History Chart */}
          <div className="nlai-chart-card">
            <h3 className="nlai-chart-title">Perkembangan IP Per Semester</h3>
            <div className="nlai-chart-bars">
              {semesters.filter((s) => s.ipk !== null).map((s, i) => {
                const pct = (s.ipk / 4.0) * 100;
                return (
                  <div key={i} className="nlai-chart-col">
                    <div className="nlai-bar-wrap">
                      <span className="nlai-bar-val">{s.ipk.toFixed(2)}</span>
                      <div className="nlai-bar-track">
                        <div
                          className="nlai-bar-fill"
                          style={{ height: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="nlai-bar-lbl">Sem {i + 1}</p>
                  </div>
                );
              })}
            </div>
            <div className="nlai-chart-legend">
              <span>Skala 4.0 — IP ≥ 3.51 = Cum Laude</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
