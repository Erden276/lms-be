import React, { useState, useEffect } from "react";
import "../../../components/shared.css";
import "./kuis.css";
import Sidebar from "../../../components/Sidebar";
import { useSidebar } from "../../../components/useSidebar";
import Navbar from "../../../components/Navbar";
import { apiClient } from "../../../utils/apiClient";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function HasilKuis({ onNavigate, onLogout, idKuis }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);

  useEffect(() => {
    const fetchResult = async () => {
      if (!idKuis) {
        setError("ID Kuis tidak ditemukan");
        setLoading(false);
        return;
      }
      try {
        const statusRes = await apiClient.get(`/api/kuis/${idKuis}/status`);
        if (!statusRes?.sudahDikerjakan) {
          setError("Anda belum mengerjakan kuis ini. Silakan kerjakan kuis terlebih dahulu.");
          setLoading(false);
          return;
        }
        const res = await apiClient.get(`/api/kuis/${idKuis}/hasil`);
        setResult(res);
        setUserAnswers(res.answers || []);
      } catch (err) {
        console.error("Gagal memuat hasil kuis:", err);
        setError(err.message || "Gagal memuat hasil kuis");
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [idKuis]);

  // Remove early LoadingSpinner return


  if (error) {
    return (
      <div className="page-shell">
        <Sidebar onNavigate={onNavigate} onLogout={onLogout} activePage="daftarTugas" mobileOpen={sidebarOpen} onClose={closeSidebar} />
        <main className="page-main">
          <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} />
          <div className="page-content">
            <div className="quiz-result-container">
              <div className="quiz-result-card">
                <div className="quiz-result-icon">
                  <span className="material-symbols-outlined">quiz</span>
                </div>
                <h2 className="quiz-result-title">Belum Mengerjakan Kuis</h2>
                <p className="quiz-result-subtitle">Anda belum mengerjakan kuis ini. Silakan kerjakan kuis terlebih dahulu.</p>
                <button className="quiz-back-btn" onClick={() => onNavigate && onNavigate("daftarTugas")}>
                  <span className="material-symbols-outlined">arrow_back</span>
                  Kembali ke Daftar Tugas
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { skor, soal } = result || {};

  return (
    <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
      <Sidebar onNavigate={onNavigate} onLogout={onLogout} activePage="daftarTugas" mobileOpen={sidebarOpen} onClose={closeSidebar} />
      <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
        <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} onNavigate={onNavigate} />
        <div className="page-content">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="skeleton-card" style={{ height: '350px', width: '100%' }}></div>
              <div className="skeleton-card" style={{ height: '200px', width: '100%' }}></div>
            </div>
          ) : (
            <>
              <div className="quiz-result-container">
            <div className="quiz-result-card">
              <div className="quiz-result-icon">
                <span className="material-symbols-outlined">{skor >= 70 ? "emoji_events" : "school"}</span>
              </div>
              <h2 className="quiz-result-title">Kuis Selesai!</h2>
              <p className="quiz-result-subtitle">Berikut adalah hasil kuis Anda</p>

              <div className="quiz-score-display">
                <div className={`quiz-score-circle ${skor >= 70 ? "quiz-score-circle--pass" : "quiz-score-circle--fail"}`}>
                  <span className="quiz-score-number">{skor || 0}</span>
                  <span className="quiz-score-label">SKOR</span>
                </div>
              </div>

              <div className="quiz-stats-grid">
                <div className="quiz-stat quiz-stat--green">
                  <p className="quiz-stat-num">
                    {soal?.filter((q, i) => userAnswers[i] === q.jawabanBenar).length || 0}
                  </p>
                  <p className="quiz-stat-lbl">BENAR</p>
                </div>
                <div className="quiz-stat quiz-stat--red">
                  <p className="quiz-stat-num">
                    {soal?.filter((q, i) => userAnswers[i] !== undefined && userAnswers[i] !== q.jawabanBenar).length || 0}
                  </p>
                  <p className="quiz-stat-lbl">SALAH</p>
                </div>
                <div className="quiz-stat quiz-stat--blue">
                  <p className="quiz-stat-num">{soal?.length || 0}</p>
                  <p className="quiz-stat-lbl">TOTAL SOAL</p>
                </div>
              </div>

              <div style={{
                marginTop: "2rem",
                padding: "1.5rem",
                backgroundColor: "var(--slate-50)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)"
              }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 600, color: "var(--slate-800)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.25rem", marginRight: "0.5rem", verticalAlign: "middle" }}>
                    assessment
                  </span>
                  Detail Jawaban
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {soal?.map((q, idx) => {
                    const correctAnswer = q.jawabanBenar;
                    const userAnswer = userAnswers[idx];
                    const isCorrect = userAnswer === correctAnswer;
                    const notAnswered = userAnswer === undefined;

                    return (
                      <div key={idx} style={{
                        padding: "1rem",
                        backgroundColor: "white",
                        borderRadius: "var(--radius-md)",
                        border: `2px solid ${isCorrect ? "var(--emerald-200)" : notAnswered ? "var(--slate-200)" : "var(--red-200)"}`,
                        boxShadow: "var(--shadow-sm)"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", flex: 1 }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: "1.75rem", height: "1.75rem", borderRadius: "50%",
                              backgroundColor: isCorrect ? "var(--emerald-100)" : notAnswered ? "var(--slate-100)" : "var(--red-100)",
                              color: isCorrect ? "var(--emerald-600)" : notAnswered ? "var(--slate-600)" : "var(--red-600)",
                              fontWeight: 600, fontSize: "0.875rem"
                            }}>
                              {idx + 1}
                            </span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", fontWeight: 500, color: "var(--slate-800)" }}>
                                {q.pertanyaan}
                              </p>
                            </div>
                          </div>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "0.25rem",
                            padding: "0.35rem 0.75rem", borderRadius: "var(--radius-full)",
                            fontSize: "0.8rem", fontWeight: 600,
                            backgroundColor: isCorrect ? "var(--emerald-100)" : notAnswered ? "var(--slate-100)" : "var(--red-100)",
                            color: isCorrect ? "var(--emerald-700)" : notAnswered ? "var(--slate-600)" : "var(--red-700)"
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                              {isCorrect ? "check_circle" : notAnswered ? "help" : "cancel"}
                            </span>
                            {isCorrect ? "BENAR" : notAnswered ? "TIDAK DIJAWAB" : "SALAH"}
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                          <div>
                            <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.8rem", fontWeight: 600, color: "var(--slate-600)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Jawaban Anda
                            </p>
                            <div style={{
                              padding: "0.75rem", backgroundColor: notAnswered ? "var(--slate-50)" : "var(--slate-100)",
                              borderRadius: "var(--radius-md)", border: `1px solid ${notAnswered ? "var(--slate-200)" : "var(--slate-300)"}`,
                              minHeight: "2.5rem", display: "flex", alignItems: "center"
                            }}>
                              <span style={{ fontSize: "0.875rem", color: notAnswered ? "var(--slate-400)" : "var(--slate-700)", fontWeight: notAnswered ? 400 : 500 }}>
                                {notAnswered ? "Tidak dijawab" : String.fromCharCode(65 + userAnswer)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.8rem", fontWeight: 600, color: "var(--slate-600)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Jawaban Benar
                            </p>
                            <div style={{
                              padding: "0.75rem", backgroundColor: "var(--emerald-50)",
                              borderRadius: "var(--radius-md)", border: "1px solid var(--emerald-200)",
                              minHeight: "2.5rem", display: "flex", alignItems: "center"
                            }}>
                              <span style={{ fontSize: "0.875rem", color: "var(--emerald-700)", fontWeight: 500 }}>
                                {String.fromCharCode(65 + correctAnswer)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: "0.75rem" }}>
                          <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.8rem", fontWeight: 600, color: "var(--slate-600)" }}>
                            Pilihan Jawaban:
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                            {q.options.map((option, optIdx) => (
                              <div key={optIdx} style={{
                                padding: "0.5rem 0.75rem",
                                backgroundColor: optIdx === correctAnswer ? "var(--emerald-50)" : "var(--slate-50)",
                                borderRadius: "var(--radius-sm)",
                                border: `1px solid ${optIdx === correctAnswer ? "var(--emerald-200)" : "var(--slate-200)"}`,
                                fontSize: "0.8rem",
                                color: optIdx === correctAnswer ? "var(--emerald-700)" : "var(--slate-600)"
                              }}>
                                <span style={{ fontWeight: 600, marginRight: "0.5rem" }}>{String.fromCharCode(65 + optIdx)}.</span>
                                {option}
                                {optIdx === correctAnswer && (
                                  <span className="material-symbols-outlined" style={{ fontSize: "0.9rem", marginLeft: "0.5rem", verticalAlign: "middle" }}>check_circle</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button className="quiz-back-btn" onClick={() => onNavigate && onNavigate("daftarTugas")} style={{ marginTop: "2rem" }}>
                <span className="material-symbols-outlined">arrow_back</span>
                Kembali ke Daftar Tugas
              </button>
            </div>
          </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
