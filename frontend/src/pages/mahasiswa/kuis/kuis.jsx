import React, { useState, useEffect } from "react";
import "../../../shared.css";
import "./kuis.css";
import Sidebar from "../../../Sidebar";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlRblArhYvkrSWfEx3UWaIaP5bdg8OpReWzF-sc4sB_2K3sC4IYv7Q4-lWy6VUtGhc5esYpVi12_HYjLZdjx6ILoT60xad1GfsEtHStVQIigk44gnAXnpEAjWrPWVYNa_AKdaDPqXQwdlJDbcccdQ96CZrZ6btx50rBBy3LvfY-eINJ1MtiJWLJpWBAo2nnbaNr3i-_Yn3B_BsVkOxpG3hVSKt38J2-NxnAah9LFYcNLvZARv4lzr86P24cdV4haCMW80Nudw5Lku";

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Apa output dari console.log(typeof [])?",
    options: ["array", "object", "undefined", "list"],
    correct: 1,
  },
  {
    id: 2,
    question: "Manakah yang BUKAN merupakan hook di React?",
    options: ["useState", "useEffect", "useRouter", "useContext"],
    correct: 2,
  },
  {
    id: 3,
    question: "Apa kepanjangan dari JSX?",
    options: ["JavaScript XML", "JavaScript Extension", "JSON XML", "Java Syntax Extension"],
    correct: 0,
  },
  {
    id: 4,
    question: "Berapa hasil dari 2 ** 3 dalam JavaScript?",
    options: ["6", "8", "9", "12"],
    correct: 1,
  },
  {
    id: 5,
    question: "Method array mana yang digunakan untuk filter elemen?",
    options: ["map()", "reduce()", "filter()", "forEach()"],
    correct: 2,
  },
];

const TIME_LIMIT = 30 * 60; // 30 minutes in seconds

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

import { apiClient } from "../../../utils/apiClient";

export default function QuizKuis({ onNavigate, onLogout, idKuis }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizTitle, setQuizTitle] = useState("Kuis");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!idKuis) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/api/kuis/${idKuis}/soal`);
        if (Array.isArray(res) && res.length > 0) {
          setQuestions(res);
          setAnswers(Array(res.length).fill(null));
        }
      } catch (error) {
        console.error("Gagal memuat kuis:", error);
      } finally {
        setLoading(false);
      }
    };
    
    const checkStatus = async () => {
      try {
        const statusRes = await apiClient.get(`/api/kuis/${idKuis}/status`);
        if (statusRes?.sudahDikerjakan) {
          onNavigate && onNavigate({ page: "hasilKuis", idKuis });
        }
      } catch (error) {
        console.error("Gagal cek status kuis:", error);
      }
    };
    
    fetchQuiz();
    checkStatus();
  }, [idKuis]);

  useEffect(() => {
    if (isSubmitted) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await apiClient.post(`/api/kuis/${idKuis}/submit`, {
        answers
      });
      
      if (response && response.score !== undefined) {
        setScore(response.score);
      } else {
        let correctCount = 0;
        questions.forEach((q, index) => {
          if (answers[index] === q.correct) {
            correctCount++;
          }
        });
        const finalScore = Math.round((correctCount / questions.length) * 100);
        setScore(finalScore);
      }
      setIsSubmitted(true);
      onNavigate && onNavigate({ page: "hasilKuis", idKuis });
    } catch (error) {
      console.error("Gagal mengirim kuis", error);
      setError("Gagal mengumpulkan kuis: " + (error.message || error.error || "Unknown error"));
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const answeredCount = answers.filter((a) => a !== null).length;

  if (isSubmitted) {
    return (
      <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
        <Sidebar
          onNavigate={onNavigate}
          onLogout={onLogout}
          activePage="daftarTugas"
          mobileOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
          <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} onNavigate={typeof nav !== "undefined" ? nav : (typeof onNavigate !== "undefined" ? onNavigate : undefined)} />

          <div className="page-content">
            <div className="quiz-result-container">
              <div className="quiz-result-card">
                <div className="quiz-result-icon">
                  <span className="material-symbols-outlined">{score >= 70 ? "emoji_events" : "school"}</span>
                </div>
                <h2 className="quiz-result-title">Kuis Selesai!</h2>
                <p className="quiz-result-subtitle">Berikut adalah hasil kuis Anda</p>

                <div className="quiz-score-display">
                  <div className={`quiz-score-circle ${score >= 70 ? "quiz-score-circle--pass" : "quiz-score-circle--fail"}`}>
                    <span className="quiz-score-number">{score}</span>
                    <span className="quiz-score-label">SKOR</span>
                  </div>
                </div>

                <div className="quiz-stats-grid">
                  <div className="quiz-stat quiz-stat--green">
                    <p className="quiz-stat-num">
                      {answers.filter((a, i) => a === questions[i]?.correct).length}
                    </p>
                    <p className="quiz-stat-lbl">BENAR</p>
                  </div>
                  <div className="quiz-stat quiz-stat--red">
                    <p className="quiz-stat-num">
                      {answers.filter((a, i) => a !== questions[i]?.correct && a !== null).length}
                    </p>
                    <p className="quiz-stat-lbl">SALAH</p>
                  </div>
                  <div className="quiz-stat quiz-stat--blue">
                    <p className="quiz-stat-num">{questions.length}</p>
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
                  <h3 style={{
                    margin: "0 0 1rem 0",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--slate-800)"
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: "1.25rem",
                      marginRight: "0.5rem",
                      verticalAlign: "middle"
                    }}>
                      assessment
                    </span>
                    Detail Jawaban
                  </h3>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem"
                  }}>
                    {questions.map((q, idx) => {
                      const userAnswer = answers[idx];
                      const correctAnswer = q.correct;
                      const isCorrect = userAnswer === correctAnswer;
                      const notAnswered = userAnswer === null;

                      return (
                        <div
                          key={idx}
                          style={{
                            padding: "1rem",
                            backgroundColor: "white",
                            borderRadius: "var(--radius-md)",
                            border: `2px solid ${isCorrect ? "var(--emerald-200)" : notAnswered ? "var(--slate-200)" : "var(--red-200)"}`,
                            boxShadow: "var(--shadow-sm)"
                          }}
                        >
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "0.75rem"
                          }}>
                            <div style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.75rem",
                              flex: 1
                            }}>
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "1.75rem",
                                height: "1.75rem",
                                borderRadius: "50%",
                                backgroundColor: isCorrect ? "var(--emerald-100)" : notAnswered ? "var(--slate-100)" : "var(--red-100)",
                                color: isCorrect ? "var(--emerald-600)" : notAnswered ? "var(--slate-600)" : "var(--red-600)",
                                fontWeight: 600,
                                fontSize: "0.875rem"
                              }}>
                                {idx + 1}
                              </span>
                              <div style={{ flex: 1 }}>
                                <p style={{
                                  margin: "0 0 0.5rem 0",
                                  fontSize: "0.95rem",
                                  fontWeight: 500,
                                  color: "var(--slate-800)"
                                }}>
                                  {q.question}
                                </p>
                              </div>
                            </div>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              padding: "0.35rem 0.75rem",
                              borderRadius: "var(--radius-full)",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              backgroundColor: isCorrect ? "var(--emerald-100)" : notAnswered ? "var(--slate-100)" : "var(--red-100)",
                              color: isCorrect ? "var(--emerald-700)" : notAnswered ? "var(--slate-600)" : "var(--red-700)"
                            }}>
                              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                                {isCorrect ? "check_circle" : notAnswered ? "help" : "cancel"}
                              </span>
                              {isCorrect ? "BENAR" : notAnswered ? "TIDAK DIJAWAB" : "SALAH"}
                            </span>
                          </div>

                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.75rem"
                          }}>
                            {/* Jawaban Mahasiswa */}
                            <div>
                              <p style={{
                                margin: "0 0 0.5rem 0",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "var(--slate-600)",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px"
                              }}>
                                Jawaban Anda
                              </p>
                              <div style={{
                                padding: "0.75rem",
                                backgroundColor: notAnswered ? "var(--slate-50)" : "var(--slate-100)",
                                borderRadius: "var(--radius-md)",
                                border: `1px solid ${notAnswered ? "var(--slate-200)" : "var(--slate-300)"}`,
                                minHeight: "2.5rem",
                                display: "flex",
                                alignItems: "center"
                              }}>
                                <span style={{
                                  fontSize: "0.875rem",
                                  color: notAnswered ? "var(--slate-400)" : "var(--slate-700)",
                                  fontWeight: notAnswered ? 400 : 500
                                }}>
                                  {notAnswered ? "Tidak dijawab" : String.fromCharCode(65 + userAnswer)}
                                </span>
                              </div>
                            </div>

                            {/* Jawaban Benar */}
                            <div>
                              <p style={{
                                margin: "0 0 0.5rem 0",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "var(--slate-600)",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px"
                              }}>
                                Jawaban Benar
                              </p>
                              <div style={{
                                padding: "0.75rem",
                                backgroundColor: "var(--emerald-50)",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--emerald-200)",
                                minHeight: "2.5rem",
                                display: "flex",
                                alignItems: "center"
                              }}>
                                <span style={{
                                  fontSize: "0.875rem",
                                  color: "var(--emerald-700)",
                                  fontWeight: 500
                                }}>
                                  {String.fromCharCode(65 + correctAnswer)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Detail Pilihan Jawaban */}
                          <div style={{ marginTop: "0.75rem" }}>
                            <p style={{
                              margin: "0 0 0.5rem 0",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: "var(--slate-600)"
                            }}>
                              Pilihan Jawaban:
                            </p>
                            <div style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.35rem"
                            }}>
                              {q.options.map((option, optIdx) => (
                                <div
                                  key={optIdx}
                                  style={{
                                    padding: "0.5rem 0.75rem",
                                    backgroundColor: optIdx === correctAnswer ? "var(--emerald-50)" : "var(--slate-50)",
                                    borderRadius: "var(--radius-sm)",
                                    border: `1px solid ${optIdx === correctAnswer ? "var(--emerald-200)" : "var(--slate-200)"}`,
                                    fontSize: "0.8rem",
                                    color: optIdx === correctAnswer ? "var(--emerald-700)" : "var(--slate-600)"
                                  }}
                                >
                                  <span style={{ fontWeight: 600, marginRight: "0.5rem" }}>
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  {option}
                                  {optIdx === correctAnswer && (
                                    <span className="material-symbols-outlined" style={{
                                      fontSize: "0.9rem",
                                      marginLeft: "0.5rem",
                                      verticalAlign: "middle"
                                    }}>
                                      check_circle
                                    </span>
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

                <button
                  className="quiz-back-btn"
                  onClick={() => onNavigate && onNavigate("daftarTugas")}
                  style={{ marginTop: "2rem" }}
                >
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

  if (loading) {
    return <div className="page-shell"><main className="page-main"><div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Memuat kuis...</div></main></div>;
  }

  return (
    <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
      <Sidebar
        onNavigate={onNavigate}
        onLogout={onLogout}
        activePage="daftarTugas"
        mobileOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
        {/* Navbar */}
        <header className="navbar">
          <div className="navbar__left">
            <button className="navbar__hamburger" onClick={openSidebar}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="navbar__title">Kuis - Pemrograman Dasar</span>
          </div>
          <div className="navbar__right">
            <button className="navbar__bell">
              <span className="material-symbols-outlined">notifications</span>
              <span className="navbar__bell-dot"></span>
            </button>
            <div className="navbar__divider"></div>
            <div className="navbar__profile" style={{ cursor: "pointer" }} onClick={() => onNavigate && onNavigate("profile")}>
              <div className="navbar__profile-info">
                <p className="navbar__profile-name">Halo, Firman</p>
                <p className="navbar__profile-role">Mahasiswa</p>
              </div>
              <div className="navbar__avatar">
                <img alt="Foto profil" src={AVATAR} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {/* Quiz Header */}
          <div className="quiz-header">
            <div className="quiz-header-left">
              <button className="quiz-back-btn-small" onClick={() => onNavigate && onNavigate("daftarTugas")}>
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <h2 className="quiz-title">Kuis Pemrograman Dasar</h2>
                <p className="quiz-subtitle">Jawab seluruh pertanyaan berikut dengan benar</p>
              </div>
            </div>
            <div className={`quiz-timer ${timeLeft < 300 ? "quiz-timer--urgent" : ""}`}>
              <span className="material-symbols-outlined">timer</span>
              <span className="quiz-timer-text">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Progress */}
          <div className="quiz-progress">
            <div className="quiz-progress-info">
              <span>Soal {currentQuestion + 1} dari {questions.length}</span>
              <span>{answeredCount} dari {questions.length} dijawab</span>
            </div>
            <div className="quiz-progress-bar">
              <div
                className="quiz-progress-fill"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="quiz-question-card">
            <h3 className="quiz-question-text">{questions[currentQuestion]?.question}</h3>

            <div className="quiz-options">
              {questions[currentQuestion]?.options.map((option, idx) => (
                <button
                  key={idx}
                  className={`quiz-option ${answers[currentQuestion] === idx ? "quiz-option--selected" : ""}`}
                  onClick={() => handleAnswerSelect(currentQuestion, idx)}
                >
                  <span className="quiz-option-letter">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="quiz-option-text">{option}</span>
                  {answers[currentQuestion] === idx && (
                    <span className="material-symbols-outlined quiz-option-check">check_circle</span>
                  )}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="quiz-nav">
              <button
                className="quiz-nav-btn quiz-nav-btn--outline"
                onClick={handlePrevQuestion}
                disabled={currentQuestion === 0}
              >
                <span className="material-symbols-outlined">chevron_left</span>
                Sebelumnya
              </button>

              {currentQuestion === questions.length - 1 ? (
                <button
                  className="quiz-nav-btn quiz-nav-btn--submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Mengumpulkan..." : "Kumpulkan Jawaban"}
                  <span className="material-symbols-outlined">check</span>
                </button>
              ) : (
                <button
                  className="quiz-nav-btn quiz-nav-btn--primary"
                  onClick={handleNextQuestion}
                >
                  Selanjutnya
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              )}
            </div>
          </div>

          {/* Question Navigator */}
          <div className="quiz-question-nav">
            <p className="quiz-question-nav-title">Navigasi Soal</p>
            <div className="quiz-question-dots">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  className={`quiz-question-dot ${idx === currentQuestion ? "quiz-question-dot--active" : ""} ${answers[idx] !== null ? "quiz-question-dot--answered" : ""}`}
                  onClick={() => setCurrentQuestion(idx)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
