import React, { useState, useRef, useEffect } from "react";
import "../../../components/shared.css";
import "./forumDiskusi.css";
import Sidebar from "../../../components/Sidebar";
import { useSidebar } from "../../../components/useSidebar";
import Navbar from "../../../components/Navbar";
import { apiClient } from "../../../utils/apiClient";
import LoadingSpinner from "../../../components/LoadingSpinner";
import DOMPurify from 'dompurify';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlRblArhYvkrSWfEx3UWaIaP5bdg8OpReWzF-sc4sB_2K3sC4IYv7Q4-lWy6VUtGhc5esYpVi12_HYjLZdjx6ILoT60xad1GfsEtHStVQIigk44gnAXnpEAjWrPWVYNa_AKdaDPqXQwdlJDbcccdQ96CZrZ6btx50rBBy3LvfY-eINJ1MtiJWLJpWBAo2nnbaNr3i-_Yn3B_BsVkOxpG3hVSKt38J2-NxnAah9LFYcNLvZARv4lzr86P24cdV4haCMW80Nudw5Lku";


function Avatar({ src, initials, color, size = 40 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={initials || "avatar"}
        className="fd-avatar-img"
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      className="fd-avatar-initials"
      style={{ width: size, height: size, background: color || "#64748b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: size * 0.35, flexShrink: 0 }}
    >
      {initials}
    </div>
  );
}

const COURSE_COLORS = ["#4b53bc", "#2f9696", "#c47f17", "#7c3aed", "#0891b2", "#059669", "#dc2626", "#be185d"];

export default function ForumDiskusi({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [view, setView] = useState("courses"); // "courses" | "forum" | "create"
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set([1]));
  const [mataKuliahList, setMataKuliahList] = useState([]);
  const [selectedMatkul, setSelectedMatkul] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Create form state
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const editorImageInputRef = useRef(null);

  // Fetch mata kuliah list
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiClient.get('/api/mata-kuliah');
        const data = Array.isArray(res) ? res : (res.data || []);
        setMataKuliahList(data);
      } catch (error) {
        console.error("Failed to load courses", error);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  const handleSelectCourse = (matkul) => {
    setSelectedMatkul(matkul);
    setView("forum");
  };

  const handleBackToCourses = () => {
    setView("courses");
    setSelectedMatkul(null);
    setThreads([]);
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchForumThreads = async (matkulId, silent = false) => {
    const id = matkulId || (selectedMatkul && selectedMatkul.idMataKuliah);
    if (!id) return;
    try {
      if (!silent) setLoading(true);
      const res = await apiClient.get(`/api/forum/mata-kuliah/${id}`);
      const data = res.data || res;
      if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map(t => ({
            id: t.id,
            authorName: t.authorName || "User",
            authorRole: t.authorRole || null,
            authorAvatar: null,
            authorColor: t.authorRole === "DOSEN" ? "#4b53bc" : "#2f9696",
            authorInitials: (t.authorName || "U").substring(0, 2).toUpperCase(),
            time: t.time ? new Date(t.time).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "",
            title: t.title || "",
            content: t.content || "",
            likes: t.likesCount || 0,
            liked: t.isLiked || false,
            lampiran: t.lampiran || null,
            replies: (t.comments || []).map(c => ({
              id: c.id,
              authorName: c.authorName || "User",
              authorInitials: (c.authorName || "U").substring(0, 2).toUpperCase(),
              authorColor: "#64748b",
              time: c.time ? new Date(c.time).toLocaleDateString("id-ID") : "",
              content: c.content || "",
              likes: 0,
              liked: false,
            })),
            replyCount: (t.comments || []).length,
            collapsed: (t.comments || []).length > 0
          }));
          setThreads(formatted);
      } else {
        setThreads([]);
      }
    } catch (error) {
      setThreads([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId;
    if (selectedMatkul) {
      fetchForumThreads(selectedMatkul.idMataKuliah);
      intervalId = setInterval(() => {
        fetchForumThreads(selectedMatkul.idMataKuliah, true);
      }, 5000); // 5 detik
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedMatkul]);

  // ── Toolbar actions (simulate rich-text with markdown-like wrap) ──
  const wrapText = (before, after = before) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = formBody.slice(start, end);
    const next = formBody.slice(0, start) + before + sel + after + formBody.slice(end);
    setFormBody(next);
    setTimeout(() => {
      ta.selectionStart = start + before.length;
      ta.selectionEnd = end + before.length;
      ta.focus();
    }, 0);
  };

  const handleEditorImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await apiClient.post("/api/forum/upload-image", formData);
      const url = res.url;
      
      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const before = formBody.slice(0, start);
        const after = formBody.slice(end);
        const markdown = `![Gambar](${API_BASE}${url})`;
        const next = before + markdown + after;
        setFormBody(next);
        
        // Reset value
        e.target.value = "";
        
        setTimeout(() => {
          ta.focus();
          ta.setSelectionRange(start + markdown.length, start + markdown.length);
        }, 0);
        showToast("success", "Gambar berhasil diunggah dan disisipkan!");
      }
    } catch (error) {
      showToast("error", error.message || "Gagal mengunggah gambar");
    }
  };

  // ── Submit new discussion ──
  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) {
      showToast("error", "Judul dan isi diskusi tidak boleh kosong.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("idMataKuliah", selectedMatkul.idMataKuliah);
      formData.append("judul", formTitle.trim());
      formData.append("isiForum", formBody.trim());
      if (attachedFile) {
        formData.append("lampiran", attachedFile);
      }

      await apiClient.post("/api/forum/thread", formData);
      showToast("success", "Diskusi berhasil dibuat!");
      setFormTitle("");
      setFormBody("");
      setAttachedFile(null);
      setView("forum");
      fetchForumThreads(null, true);
    } catch (error) {
      showToast("error", error.message || "Gagal membuat diskusi");
    }
  };

  // ── Like ──
  const toggleLike = async (threadId, replyId) => {
    // Optimistic update
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId && !replyId) {
          return { ...t, likes: t.liked ? t.likes - 1 : t.likes + 1, liked: !t.liked };
        }
        if (t.id === threadId && replyId) {
          return {
            ...t,
            replies: t.replies.map((r) =>
              r.id === replyId
                ? { ...r, likes: r.liked ? r.likes - 1 : r.likes + 1, liked: !r.liked }
                : r
            ),
          };
        }
        return t;
      })
    );
    // Persist to backend
    try {
      await apiClient.post('/api/forum/like', { idForum: threadId });
    } catch (error) {
      console.error('Like error:', error);
      // Revert on error by refetching
      fetchForumThreads(null, true);
    }
  };

  // ── Submit reply ──
  const submitReply = async (threadId) => {
    if (!replyText.trim()) return;
    try {
      await apiClient.post('/api/forum/comment', {
        idForum: threadId,
        isiKomentar: replyText.trim()
      });
      setReplyingTo(null);
      setReplyText("");
      showToast("success", "Balasan berhasil dikirim!");
      // Refetch threads to show the new reply
      await fetchForumThreads(null, true);
      setExpandedIds(prev => new Set([...prev, threadId]));
    } catch (error) {
      showToast("error", error.message || "Gagal mengirim balasan");
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // File drop
  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setAttachedFile(file);
  };

  /* ── Sidebar rendered via shared component ── */
  const SidebarView = () => (
    <Sidebar onNavigate={onNavigate} onLogout={onLogout} activePage="forumDiskusi" mobileOpen={sidebarOpen} onClose={closeSidebar} />
  );

  // Remove early LoadingSpinner returns


  return (
    <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
      {/* Toast */}
      {toast && (
        <div className={`fd-toast fd-toast--${toast.type}`}>
          <span className="material-symbols-outlined">{toast.type === "success" ? "check_circle" : "error"}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Sidebar */}
      <SidebarView />

      <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
        <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} onNavigate={onNavigate} />

        <div className="page-content">
          {/* ════════════════════ COURSE LIST VIEW ════════════════════ */}
          {view === "courses" && (
            loadingCourses ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="skeleton-text skeleton-text--title" style={{ height: '2rem', width: '15rem' }}></div>
                <div className="skeleton-text skeleton-text--medium" style={{ height: '1.25rem', width: '25rem' }}></div>
                <div className="fd-course-grid" style={{ marginTop: '1rem' }}>
                  <div className="skeleton-card" style={{ height: '180px' }}></div>
                  <div className="skeleton-card" style={{ height: '180px' }}></div>
                  <div className="skeleton-card" style={{ height: '180px' }}></div>
                </div>
              </div>
            ) : (
              <>
                <div className="fd-topbar">
                  <div>
                    <nav className="fd-breadcrumb">
                      <span className="fd-breadcrumb--active">Forum Diskusi</span>
                    </nav>
                    <h2 className="fd-page-title">Forum Diskusi</h2>
                    <p className="fd-page-sub">
                      Pilih mata kuliah untuk melihat forum diskusi kelas.
                    </p>
                  </div>
                </div>

                {mataKuliahList.length === 0 ? (
                  <div className="fd-empty-state" style={{ textAlign: "center", padding: "4rem 2rem", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "#94a3b8", marginBottom: "1rem" }}>school</span>
                    <h3>Tidak Ada Mata Kuliah</h3>
                    <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Belum ada mata kuliah yang tersedia.</p>
                  </div>
                ) : (
                  <div className="fd-course-grid">
                    {mataKuliahList.map((mk, i) => (
                      <div
                        key={mk.idMataKuliah}
                        className="fd-course-card"
                        onClick={() => handleSelectCourse(mk)}
                      >
                        <div className="fd-course-accent" style={{ backgroundColor: COURSE_COLORS[i % COURSE_COLORS.length] }}></div>
                        <div className="fd-course-body">
                          <div className="fd-course-icon" style={{ background: `${COURSE_COLORS[i % COURSE_COLORS.length]}15`, color: COURSE_COLORS[i % COURSE_COLORS.length] }}>
                            <span className="material-symbols-outlined">forum</span>
                          </div>
                          <h3 className="fd-course-name">{mk.namaMataKuliah}</h3>
                          <p className="fd-course-code">Kode: MK{String(mk.idMataKuliah).padStart(3, '0')}</p>
                          <div className="fd-course-footer">
                            <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>arrow_forward</span>
                            <span>Lihat Forum</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          )}

          {/* ════════════════════ FORUM LIST VIEW ════════════════════ */}
          {view === "forum" && (
            loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="skeleton-text skeleton-text--title" style={{ height: '2rem', width: '20rem' }}></div>
                <div className="skeleton-text skeleton-text--medium" style={{ height: '1.25rem', width: '30rem' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div className="skeleton-card" style={{ height: '120px' }}></div>
                  <div className="skeleton-card" style={{ height: '120px' }}></div>
                </div>
              </div>
            ) : (
              <>
                {/* Top bar */}
                <div className="fd-topbar">
                  <div>
                    <nav className="fd-breadcrumb">
                      <button className="fd-breadcrumb-link" onClick={handleBackToCourses}>Forum Diskusi</button>
                      <span className="material-symbols-outlined">chevron_right</span>
                      <span className="fd-breadcrumb--active">{selectedMatkul?.namaMataKuliah || "MATA KULIAH"}</span>
                    </nav>
                    <h2 className="fd-page-title">Forum Diskusi — {selectedMatkul?.namaMataKuliah}</h2>
                    <p className="fd-page-sub">
                      Ruang kolaborasi untuk mendalami materi kuliah.<br />
                      Silakan berbagi pandangan atau bertanya langsung kepada pengampu.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.625rem", flexShrink: 0 }}>
                    <button className="fd-new-btn" style={{ backgroundColor: "var(--color-secondary)" }} onClick={handleBackToCourses}>
                      <span className="material-symbols-outlined">arrow_back</span>
                      Kembali
                    </button>
                    <button className="fd-new-btn" onClick={() => setView("create")}>
                      <span className="material-symbols-outlined">add</span>
                      Mulai Diskusi Baru
                    </button>
                  </div>
                </div>

                {threads.length === 0 ? (
                  <div className="fd-empty-state" style={{ textAlign: "center", padding: "4rem 2rem", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "#94a3b8", marginBottom: "1rem" }}>forum</span>
                    <h3>Belum Ada Diskusi</h3>
                    <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Belum ada yang memulai diskusi di mata kuliah ini.</p>
                  </div>
                ) : (
                <div className="fd-thread-list">
                      {threads.map((thread) => {
                        const isExpanded = expandedIds.has(thread.id);
                        return (
                          <div key={thread.id} className="fd-thread-card">
                            {/* Thread header */}
                            <div className="fd-thread-header">
                              <div className="fd-thread-author-row">
                                <div className="fd-thread-author-info">
                                  <Avatar src={thread.authorAvatar} initials={thread.authorInitials} color={thread.authorColor} size={48} />
                                  <div>
                                    <p className="fd-author-name">
                                      {thread.authorName}
                                      {thread.authorRole && (
                                        <span className="fd-role-badge">{thread.authorRole}</span>
                                      )}
                                    </p>
                                    {thread.title && <p className="fd-thread-subtitle">{thread.title}</p>}
                                  </div>
                                </div>
                                <span className="fd-time">{thread.time}</span>
                              </div>
                              <div
                                className="fd-thread-body"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(thread.content || "") }}
                              />
                              {thread.lampiran && (
                                <div className="fd-thread-attachment" style={{ marginTop: "1rem" }}>
                                  {/\.(jpg|jpeg|png|gif)$/i.test(thread.lampiran) ? (
                                    <img
                                      src={`${API_BASE}${thread.lampiran}`}
                                      alt="Lampiran Gambar"
                                      style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "8px", border: "1px solid #e2e8f0", objectFit: "contain" }}
                                    />
                                  ) : (
                                    <a
                                      href={`${API_BASE}${thread.lampiran}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "#f1f5f9", borderRadius: "8px", color: "var(--color-primary)", textDecoration: "none", fontWeight: 500, fontSize: "0.875rem", border: "1px solid #e2e8f0" }}
                                    >
                                      <span className="material-symbols-outlined">attach_file</span>
                                      <span>Unduh Lampiran</span>
                                    </a>
                                  )}
                                </div>
                              )}
                              <div className="fd-thread-actions">
                                <button
                                  className={`fd-action-btn ${thread.liked ? "fd-action-btn--liked" : ""}`}
                                  onClick={() => toggleLike(thread.id)}
                                >
                                  <span className="material-symbols-outlined" style={{ fontVariationSettings: thread.liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                                  {thread.likes} Suka
                                </button>
                                <button className="fd-action-btn" onClick={() => { setReplyingTo(replyingTo === thread.id ? null : thread.id); setReplyText(""); }}>
                                  <span className="material-symbols-outlined">reply</span>
                                  Balas Komentar
                                </button>
                                {thread.replyCount > 0 && thread.collapsed && (
                                  <button className="fd-expand-btn" onClick={() => toggleExpand(thread.id)}>
                                    <span className="material-symbols-outlined">{isExpanded ? "expand_less" : "expand_more"}</span>
                                    {thread.replyCount} komentar
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Replies */}
                            {isExpanded && thread.replies.length > 0 && (
                              <div className="fd-replies">
                                {thread.replies.map((reply) => (
                                  <div key={reply.id} className="fd-reply">
                                    <Avatar src={reply.authorAvatar} initials={reply.authorInitials} color={reply.authorColor} size={36} />
                                    <div className="fd-reply-body">
                                      <div className="fd-reply-header">
                                        <span className="fd-reply-name">{reply.authorName}</span>
                                        <span className="fd-reply-time">{reply.time}</span>
                                      </div>
                                      <p className="fd-reply-text" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.content || "") }} />
                                      <button
                                        className={`fd-reply-action ${reply.liked ? "fd-action-btn--liked" : ""}`}
                                        onClick={() => toggleLike(thread.id, reply.id)}
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", fontVariationSettings: reply.liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                                        Balas Komentar
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Collapsed indicator */}
                            {thread.collapsed && !isExpanded && (
                              <button className="fd-collapsed-pill" onClick={() => toggleExpand(thread.id)}>
                                <span className="material-symbols-outlined">comment</span>
                                {thread.replyCount} komentar · Tampilkan semua
                              </button>
                            )}

                            {/* Reply input */}
                            {replyingTo === thread.id && (
                              <div className="fd-reply-input-wrap">
                                <Avatar src={AVATAR} initials="F" color="#4b53bc" size={34} />
                                <div className="fd-reply-input-area">
                                  <textarea
                                    className="fd-reply-textarea"
                                    placeholder="Tulis balasan Anda..."
                                    rows={3}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                  />
                                  <div className="fd-reply-input-actions">
                                    <button className="fd-reply-cancel" onClick={() => { setReplyingTo(null); setReplyText(""); }}>Batal</button>
                                    <button className="fd-reply-submit" onClick={() => submitReply(thread.id)}>
                                      <span className="material-symbols-outlined">send</span>
                                      Kirim Balasan
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                </div>
                )}
              </>
            )
          )}

          {/* ════════════════════ CREATE VIEW ════════════════════ */}
          {view === "create" && (
            <>
              <div className="fd-topbar">
                <div>
                  <nav className="fd-breadcrumb">
                    <button className="fd-breadcrumb-link" onClick={handleBackToCourses}>Forum Diskusi</button>
                    <span className="material-symbols-outlined">chevron_right</span>
                    <button className="fd-breadcrumb-link" onClick={() => setView("forum")}>{selectedMatkul?.namaMataKuliah || "Mata Kuliah"}</button>
                    <span className="material-symbols-outlined">chevron_right</span>
                    <span className="fd-breadcrumb--active">Buat Baru</span>
                  </nav>
                      <h2 className="fd-create-title">Buat Diskusi Baru</h2>
                      <p className="fd-create-sub">Bagikan pemikiran Anda atau tanyakan sesuatu kepada rekan mahasiswa dan dosen.</p>
                    </div>
                  </div>

                  <div className="fd-create-card">
                    <form onSubmit={handleSubmit}>
                      {/* Title field */}
                      <div className="fd-field">
                        <label className="fd-label">Judul Diskusi</label>
                        <input
                          className="fd-input"
                          type="text"
                          placeholder="Ketikkan judul diskusi yang deskriptif..."
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                        />
                      </div>

                      {/* Body field */}
                      <div className="fd-field">
                        <label className="fd-label">Isi Pertanyaan atau Diskusi</label>
                        <div className="fd-editor-wrap">
                          {/* Toolbar */}
                          <div className="fd-toolbar">
                            <button type="button" className="fd-tool-btn" title="Bold" onClick={() => wrapText("**")}>
                              <span className="material-symbols-outlined">format_bold</span>
                            </button>
                            <button type="button" className="fd-tool-btn" title="Italic" onClick={() => wrapText("_")}>
                              <span className="material-symbols-outlined">format_italic</span>
                            </button>
                            <button type="button" className="fd-tool-btn" title="List" onClick={() => setFormBody((b) => b + "\n- ")}>
                              <span className="material-symbols-outlined">format_list_bulleted</span>
                            </button>
                            <button type="button" className="fd-tool-btn" title="Link" onClick={() => wrapText("[", "](url)")}>
                              <span className="material-symbols-outlined">link</span>
                            </button>
                             <button type="button" className="fd-tool-btn" title="Image" onClick={() => editorImageInputRef.current?.click()}>
                               <span className="material-symbols-outlined">image</span>
                             </button>
                             <input
                               type="file"
                               ref={editorImageInputRef}
                               accept="image/*"
                               style={{ display: "none" }}
                               onChange={handleEditorImageUpload}
                             />
                          </div>
                          <textarea
                            ref={textareaRef}
                            className="fd-textarea"
                            placeholder="Jelaskan detail diskusi Anda di sini..."
                            rows={9}
                            value={formBody}
                            onChange={(e) => setFormBody(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* File upload */}
                      <div className="fd-field">
                        <label className="fd-label">Lampirkan File (Opsional)</label>
                        <div
                          className={`fd-dropzone ${dragOver ? "fd-dropzone--over" : ""}`}
                          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={handleFileDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            style={{ display: "none" }}
                            onChange={(e) => setAttachedFile(e.target.files[0] || null)}
                          />
                          {attachedFile ? (
                            <div className="fd-attached">
                              <span className="material-symbols-outlined" style={{ color: "var(--color-secondary)" }}>attach_file</span>
                              <span className="fd-attached-name">{attachedFile.name}</span>
                              <button
                                type="button"
                                className="fd-attached-remove"
                                onClick={(e) => { e.stopPropagation(); setAttachedFile(null); }}
                              >
                                <span className="material-symbols-outlined">close</span>
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="material-symbols-outlined fd-upload-icon">cloud_upload</span>
                              <p className="fd-upload-text">
                                Tarik file ke sini atau{" "}
                                <span className="fd-upload-link">pilih file</span>
                              </p>
                              <p className="fd-upload-hint">PDF, PNG, JPG (Maks. 5MB)</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="fd-form-actions">
                        <button type="button" className="fd-btn-cancel" onClick={() => setView("forum")}>Batal</button>
                        <button type="submit" className="fd-btn-submit">
                          <span className="material-symbols-outlined">send</span>
                          Kirim Diskusi
                        </button>
                      </div>
                    </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
