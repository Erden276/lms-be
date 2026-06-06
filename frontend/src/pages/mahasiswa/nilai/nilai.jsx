import React, { useState, useEffect } from "react";
import "../../../components/shared.css";
import "./nilai.css";
import Sidebar from "../../../components/Sidebar";
import { useSidebar } from "../../../components/useSidebar";
import Navbar from "../../../components/Navbar";
import { apiClient } from "../../../utils/apiClient";
import LoadingSpinner from "../../../components/LoadingSpinner";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlRblArhYvkrSWfEx3UWaIaP5bdg8OpReWzF-sc4sB_2K3sC4IYv7Q4-lWy6VUtGhc5esYpVi12_HYjLZdjx6ILoT60xad1GfsEtHStVQIigk44gnAXnpEAjWrPWVYNa_AKdaDPqXQwdlJDbcccdQ96CZrZ6btx50rBBy3LvfY-eINJ1MtiJWLJpWBAo2nnbaNr3i-_Yn3B_BsVkOxpG3hVSKt38J2-NxnAah9LFYcNLvZARv4lzr86P24cdV4haCMW80Nudw5Lku";

const INITIAL_SEMESTERS = [];

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
    return <span className="nlai-badge nlai-badge--pending">{"Proses"}</span>;
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
  if (score === null || score === undefined) return "-";
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
  return totalSks > 0 ? (totalBobot / totalSks).toFixed(2) : "-";
}

function calculateGrade(score) {
  if (score === null || score === undefined) return null;
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
}

function convertGradeToPoint(grade) {
  const map = {
    A: 4,
    "A-": 3.75,
    "B+": 3.5,
    B: 3.0,
    "B-": 2.75,
    C: 2.0,
    D: 1.0,
    E: 0,
  };
  return map[grade] || 0;
}

export default function Nilai({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [semesters, setSemesters] = useState([]);
  const [activeSem, setActiveSem] = useState(0);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const storedUserStr = localStorage.getItem("user");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : {};

  useEffect(() => {
    const fetchTranskrip = async () => {
      try {
        const res = await apiClient.get("/api/nilai/transkrip/mahasiswa");

        let data = res;
        if (res && res.data) data = res.data;
        if (res && res.status === "success" && res.data) data = res.data;

        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          const keys = Object.keys(data).sort(
            (a, b) =>
              (a === "null" ? 99 : Number(a)) - (b === "null" ? 99 : Number(b)),
          );
          const formattedSems = keys.map((k) => {
            let totalSks = 0;
            let totalPoint = 0;

            const isAktif = Number(k) > 3;

            const matkul = (data[k] || []).map((m) => {
              const tugas =
                !isAktif && m.nilaiTugas !== null && m.nilaiTugas !== undefined ? parseFloat(m.nilaiTugas) : null;
              const kuis =
                !isAktif && m.nilaiKuis !== null && m.nilaiKuis !== undefined ? parseFloat(m.nilaiKuis) : null;
              const finalScore =
                !isAktif && m.nilaiAkhir !== null && m.nilaiAkhir !== undefined
                  ? parseFloat(m.nilaiAkhir)
                  : null;
              const grade =
                !isAktif && finalScore !== null ? calculateGrade(finalScore) : null;

              const sks = m.mataKuliah?.sks || 3;
              totalSks += sks;
              if (grade) {
                totalPoint += convertGradeToPoint(grade) * sks;
              }

              return {
                kode: `MK${m.idMataKuliah}`,
                nama: m.mataKuliah?.namaMataKuliah || "Mata Kuliah",
                sks: sks,
                tugas: tugas,
                uts: kuis,
                uas: finalScore,
                nilai: grade,
              };
            });

            const ipk =
              totalSks > 0 && totalPoint > 0 ? totalPoint / totalSks : null;

            return {
              label: !isAktif ? `Semester ${k}` : `Semester ${k} (Aktif)`,
              year: !isAktif
                ? "Tahun Akademik 2023/2024"
                : "Sedang Berlangsung - Nilai belum final",
              ipk: ipk,
              sks: totalSks,
              matkul: matkul,
            };
          });

          if (formattedSems.length > 0) {
            setSemesters(formattedSems);
            setActiveSem(formattedSems.length - 1);
          } else {
            setSemesters(INITIAL_SEMESTERS);
            setActiveSem(0);
          }
        } else {
          setSemesters(INITIAL_SEMESTERS);
          setActiveSem(0);
        }
      } catch (error) {
        console.error("Error fetching transkrip:", error);
        setSemesters(INITIAL_SEMESTERS);
        setActiveSem(0);
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

  const handleUnduhTranskrip = () => {
    const nama = storedUser?.nama || "Mahasiswa";
    const nim = storedUser?.nomorInduk || "-";
    const selesai = semesters.filter((s) => s.ipk !== null);
    const ipkFinal = ipkKumulatif;
    const sksTotal = totalSksSelesai;

    const rows = selesai
      .flatMap((sem) =>
        sem.matkul.map(
          (mk) => `
        <tr>
          <td>${mk.kode}</td>
          <td>${mk.nama}</td>
          <td style="text-align:center">${mk.sks}</td>
          <td style="text-align:center">${mk.tugas ?? "-"}</td>
          <td style="text-align:center">${mk.uts ?? "-"}</td>
          <td style="text-align:center">${mk.uas ?? "-"}</td>
          <td style="text-align:center">${mk.nilai ?? "-"}</td>
        </tr>
      `,
        ),
      )
      .join("");

    const html = `
      <html><head><title>Transkrip Nilai - ${nama}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 2rem; font-size: 12px; }
        h2 { text-align: center; margin-bottom: 0.25rem; }
        p { text-align: center; margin: 0 0 1.5rem; color: #555; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e3a5f; color: white; padding: 8px; text-align: left; }
        td { padding: 7px 8px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) td { background: #f8fafc; }
        .footer { margin-top: 1.5rem; display: flex; justify-content: space-between; font-size: 11px; color: #555; }
        .ipk { font-size: 13px; font-weight: bold; }
      </style>
      </head><body>
      <h2>TRANSKRIP NILAI AKADEMIK</h2>
      <p>Nama: <b>${nama}</b> &nbsp;|&nbsp; NIM: <b>${nim}</b></p>
      <table>
        <thead><tr>
          <th>Kode MK</th><th>Mata Kuliah</th><th>SKS</th>
          <th>Tugas</th><th>UTS</th><th>UAS</th><th>Nilai</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">
        <span class="ipk">Rata-Rata Nilai Siswa: ${ipkFinal}</span>
        <span>Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
      </div>
      </body></html>
    `;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 500);
  };

  const sem = semesters[activeSem] || {
    matkul: [],
    label: "",
    year: "",
    sks: 0,
    ipk: null,
  };
  const ipkKumulatif = semesters.length > 0 ? getIPKKumulatif(semesters) : "-";
  const totalSksSelesai =
    semesters.length > 0
      ? semesters
          .filter((s) => s.ipk !== null)
          .reduce((acc, s) => acc + s.sks, 0)
      : 0;

  // Remove early LoadingSpinner return

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
            {"check_circle"}
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
        <Navbar
          role="Mahasiswa"
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
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div
                className="skeleton-text skeleton-text--title"
                style={{ height: "2rem", width: "15rem" }}
              ></div>
              <div
                className="skeleton-text skeleton-text--medium"
                style={{ height: "1.25rem", width: "20rem" }}
              ></div>
              <div className="nlai-summary-grid">
                <div
                  className="nlai-sum-card skeleton-card"
                  style={{ height: "5rem", border: "none" }}
                ></div>
                <div
                  className="nlai-sum-card skeleton-card"
                  style={{ height: "5rem", border: "none" }}
                ></div>
              </div>
              <div
                className="skeleton-card"
                style={{ height: "320px", width: "100%" }}
              ></div>
            </div>
          ) : (
            <>
              {/* Page Header */}
              <div className="nlai-page-header">
                <div>
                  <h1 className="nlai-title">{"Transkrip Nilai"}</h1>
                  <p className="nlai-subtitle">
                    {"Rekap nilai akademik "}
                    {storedUser.nama || "Mahasiswa"}
                    {" - NIM "}
                    {storedUser.nomorInduk || "NIM"}
                  </p>
                </div>
                <button
                  className="nlai-download-btn"
                  onClick={handleUnduhTranskrip}
                >
                  <span className="material-symbols-outlined">
                    {"download"}
                  </span>
                  {"Unduh Transkrip"}
                </button>
              </div>

              {/* Summary Cards */}
              <div className="nlai-summary-grid">
                <div className="nlai-sum-card nlai-sum-card--blue">
                  <span className="material-symbols-outlined nlai-sum-icon">
                    {"grade"}
                  </span>
                  <div>
                    <p className="nlai-sum-val">{ipkKumulatif}</p>
                    <p className="nlai-sum-lbl">{"IPK Kumulatif"}</p>
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
                    {"calendar_today"}
                  </span>
                  <div>
                    <p className="nlai-sum-val">{semesters.length}</p>
                    <p className="nlai-sum-lbl">{"Semester Ditempuh"}</p>
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

              {semesters.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "4rem 2rem",
                    background: "white",
                    borderRadius: "1rem",
                    marginTop: "2rem",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "4rem", color: "var(--slate-300)" }}
                  >
                    {"article"}
                  </span>
                  <h3 style={{ marginTop: "1rem", color: "var(--slate-700)" }}>
                    {"Belum Ada Transkrip Nilai"}
                  </h3>
                  <p style={{ color: "var(--slate-500)", marginTop: "0.5rem" }}>
                    {
                      "Nilai akan muncul setelah dosen melakukan penilaian pada akhir semester."
                    }
                  </p>
                </div>
              ) : (
                <>
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
                          <p className="nlai-sem-meta-lbl">{"Total SKS"}</p>
                          <p className="nlai-sem-meta-val">
                            {sem.sks} {"SKS"}
                          </p>
                        </div>
                        <div className="nlai-sem-meta-divider"></div>
                        <div className="nlai-sem-meta-item">
                          <p className="nlai-sem-meta-lbl">{"IP Semester"}</p>
                          <p className="nlai-sem-meta-val nlai-sem-meta-val--blue">
                            {sem.ipk !== null
                              ? sem.ipk.toFixed(2)
                              : "Belum Final"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="nlai-table-wrap">
                      <table className="nlai-table">
                        <thead>
                          <tr>
                            <th>{"Kode MK"}</th>
                            <th>{"Mata Kuliah"}</th>
                            <th className="nlai-th-center">{"SKS"}</th>
                            <th className="nlai-th-center">{"Tugas"}</th>
                            <th className="nlai-th-center">{"UTS"}</th>
                            <th className="nlai-th-center">{"UAS"}</th>
                            <th className="nlai-th-center">{"Nilai Akhir"}</th>
                            <th className="nlai-th-center">{"Mutu"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sem.matkul.map((mk, i) => {
                            const hasAll =
                              mk.tugas !== null &&
                              mk.uts !== null &&
                              mk.uas !== null;
                            const avg = hasAll
                              ? (
                                  mk.tugas * 0.3 +
                                  mk.uts * 0.3 +
                                  mk.uas * 0.4
                                ).toFixed(1)
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
                                    {avg !== null ? avg : "-"}
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
                        {"info"}
                      </span>
                      <p>{"Bobot Nilai: Tugas 30% • UTS 30% • UAS 40%"}</p>
                    </div>
                  </div>

                  {/* IPK History Chart */}
                  <div className="nlai-chart-card">
                    <h3 className="nlai-chart-title">
                      Perkembangan IP Per Semester
                    </h3>
                    <div className="nlai-chart-bars">
                      {semesters
                        .filter((s) => s.ipk !== null)
                        .map((s, i) => {
                          const pct = (s.ipk / 4.0) * 100;
                          return (
                            <div key={i} className="nlai-chart-col">
                              <div className="nlai-bar-wrap">
                                <span className="nlai-bar-val">
                                  {s.ipk.toFixed(2)}
                                </span>
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
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
