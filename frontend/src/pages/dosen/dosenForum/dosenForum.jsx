import React, { useState, useRef, useEffect } from "react";
import "../../../components/shared.css";
import "../../mahasiswa/forumDiskusi/forumDiskusi.css";
import SidebarDosen from "../../../components/SidebarDosen";
import { useSidebar } from "../../../components/useSidebar";
import Navbar from "../../../components/Navbar";
import { apiClient } from "../../../utils/apiClient";
import LoadingSpinner from "../../../components/LoadingSpinner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjoXu55KCdSSPl-2t0t7d2EH6gux6Xz8nZaCdXHePrj-gGn1ZWZyBoOucWc2yVgrhmNFyy8cKbxWH8i9Wm5VKkpqX9jraXjkHTr8PVU1oN3V4nkzLWUUm6nyAIS3hGDic_uY0YoNLNNZluKTKqFwJb2gYlRl9eATGdlXClTx6IXpYvk-2u1qqvfUGTzs-QJPlXTouWTyNYzTe8j8mS09evVA_aHTYfHxneVwUsb2jUygYzuAIDU5KwqO2kISzLvnzaTentePscoGoo";


function Avatar({ src, initials, color, size = 40 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={initials || "avatar"}
        className="fd-avatar-img"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      className="fd-avatar-initials"
      style={{
        width: size,
        height: size,
        background: color || "#64748b",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 800,
        fontSize: size * 0.35,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

const COURSE_COLORS = ["#4b53bc", "#2f9696", "#c47f17", "#7c3aed", "#0891b2", "#059669", "#dc2626", "#be185d"];

export default function DosenForum({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [view, setView] = useState("courses"); // "courses" | "forum" | "create"
  const [threads, setThreads] = useState([]);
  const [toast, setToast] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const editorImageInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [mataKuliahList, setMataKuliahList] = useState([]);
  const [selectedMatkul, setSelectedMatkul] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);

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

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchThreads = async (matkulId) => {
    const id = matkulId || (selectedMatkul && selectedMatkul.idMataKuliah);
    if (!id) return;
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/dosen/forum/mata-kuliah/${id}`);
      const data = res.data || res;
      if (Array.isArray(data)) {
        const formatted = data.map(t => ({
          id: t.id,
          authorName: t.authorName || "User",
          authorRole: t.authorRole === "DOSEN" ? "DOSEN PENGAMPU" : null,
          authorInitials: t.authorName ? t.authorName.substring(0, 2).toUpperCase() : "U",
          authorColor: "#4b53bc",
          time: t.time ? new Date(t.time).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "",
          title: t.title || "",
          content: t.content || "",
          likes: t.likes || 0,
          liked: t.liked || false,
          lampiran: t.lampiran || null,
          replies: (t.replies || t.comments || []).map(c => ({
            id: c.id,
            authorName: c.authorName || "User",
            authorInitials: c.authorName ? c.authorName.substring(0, 2).toUpperCase() : "U",
            authorColor: "#64748b",
            time: c.time ? new Date(c.time).toLocaleDateString("id-ID") : "",
            content: c.content || "",
            likes: 0,
            liked: false,
          })),
          replyCount: t.replyCount || (t.replies || t.comments || []).length,
          collapsed: (t.replies || t.comments || []).length > 0
        }));
        setThreads(formatted);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMatkul) fetchThreads(selectedMatkul.idMataKuliah);
  }, [selectedMatkul]);

  const handleSelectCourse = (matkul) => {
    setSelectedMatkul(matkul);
    setView("forum");
  };

  const handleBackToCourses = () => {
    setView("courses");
    setSelectedMatkul(null);
    setThreads([]);
  };

  const wrapText = (before, after = before) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart,
      end = ta.selectionEnd;
    const sel = formBody.slice(start, end);
    const next =
      formBody.slice(0, start) + before + sel + after + formBody.slice(end);
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

      await apiClient.post("/api/dosen/forum/", formData);
      
      setFormTitle("");
      setFormBody("");
      setAttachedFile(null);
      setView("forum");
      showToast("success", "Diskusi berhasil dibuat!");
      fetchThreads(); // reload threads
    } catch (error) {
      showToast("error", error.message || "Gagal membuat diskusi");
    }
  };

  const toggleLike = async (threadId, replyId) => {
    // Optimistic update
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId && !replyId)
          return {
            ...t,
            likes: t.liked ? t.likes - 1 : t.likes + 1,
            liked: !t.liked,
          };
        if (t.id === threadId && replyId)
          return {
            ...t,
            replies: t.replies.map((r) =>
              r.id === replyId
                ? {
                    ...r,
                    likes: r.liked ? r.likes - 1 : r.likes + 1,
                    liked: !r.liked,
                  }
                : r,
            ),
          };
        return t;
      }),
    );
    // Persist to backend
    try {
      await apiClient.post(`/api/dosen/forum/${threadId}/like`);
    } catch (error) {
      console.error('Like error:', error);
      fetchThreads();
    }
  };

  const submitReply = async (threadId) => {
    if (!replyText.trim()) return;
    try {
      await apiClient.post(`/api/dosen/forum/${threadId}/reply`, {
        isiKomentar: replyText.trim()
      });
      setReplyingTo(null);
      setReplyText("");
      showToast("success", "Balasan berhasil dikirim!");
      await fetchThreads();
      setExpandedIds(prev => new Set([...prev, threadId]));
    } catch (error) {
      showToast("error", error.message || "Gagal mengirim balasan");
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setAttachedFile(file);
  };

  if (loadingCourses) {
    return <LoadingSpinner message="Memuat daftar mata kuliah..." fullPage={true} />;
  }

  if (loading) {
    return <LoadingSpinner message="Memuat diskusi..." fullPage={true} />;
  }

  return (
    <div
      className="page-shell"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {toast && (
        <div className={`fd-toast fd-toast--${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{toast.msg}</span>
        </div>
      )}

      <SidebarDosen
        onNavigate={onNavigate}
        onLogout={onLogout}
        activePage="dosenForum"
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
          onNavigate={onNavigate}
        />

        <div className="page-content">
          {/* COURSE LIST VIEW */}
          {view === "courses" && (
            <>
              <div className="fd-topbar">
                <div>
                  <nav className="fd-breadcrumb">
                    <span className="fd-breadcrumb--active">Forum Diskusi</span>
                  </nav>
                  <h2 className="fd-page-title">Forum Diskusi</h2>
                  <p className="fd-page-sub">
                    Pilih mata kuliah untuk melihat dan mengelola forum diskusi kelas.
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
          )}

          {/* FORUM LIST */}
          {view === "forum" && (
            <>
              <div className="fd-topbar">
                <div>
                  <nav className="fd-breadcrumb">
                    <button className="fd-breadcrumb-link" onClick={handleBackToCourses}>FORUM DISKUSI</button>
                    <span className="material-symbols-outlined">chevron_right</span>
                    <span className="fd-breadcrumb--active">{selectedMatkul?.namaMataKuliah || "MATA KULIAH"}</span>
                  </nav>
                  <h2 className="fd-page-title">Forum Diskusi — {selectedMatkul?.namaMataKuliah}</h2>
                  <p className="fd-page-sub">
                    Ruang interaksi dosen dan mahasiswa untuk diskusi akademik.
                    <br />
                    Sebagai dosen, Anda dapat memantau dan merespons semua diskusi.
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
                      <div className="fd-thread-header">
                        <div className="fd-thread-author-row">
                          <div className="fd-thread-author-info">
                            <Avatar
                              src={thread.authorAvatar}
                              initials={thread.authorInitials}
                              color={thread.authorColor}
                              size={48}
                            />
                            <div>
                              <p className="fd-author-name">
                                {thread.authorName}
                                {thread.authorRole && (
                                  <span className="fd-role-badge">
                                    {thread.authorRole}
                                  </span>
                                )}
                              </p>
                              {thread.title && (
                                <p className="fd-thread-subtitle">
                                  {thread.title}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="fd-time">{thread.time}</span>
                        </div>
                        <div
                          className="fd-thread-body"
                          dangerouslySetInnerHTML={{ __html: thread.content || "" }}
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
                            <span
                              className="material-symbols-outlined"
                              style={{
                                fontVariationSettings: thread.liked
                                  ? "'FILL' 1"
                                  : "'FILL' 0",
                              }}
                            >
                              favorite
                            </span>
                            {thread.likes} Suka
                          </button>
                          <button
                            className="fd-action-btn"
                            onClick={() => {
                              setReplyingTo(
                                replyingTo === thread.id ? null : thread.id,
                              );
                              setReplyText("");
                            }}
                          >
                            <span className="material-symbols-outlined">
                              reply
                            </span>
                            Balas
                          </button>
                          {thread.replyCount > 0 && thread.collapsed && (
                            <button
                              className="fd-expand-btn"
                              onClick={() => toggleExpand(thread.id)}
                            >
                              <span className="material-symbols-outlined">
                                {isExpanded ? "expand_less" : "expand_more"}
                              </span>
                              {thread.replyCount} komentar
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && thread.replies.length > 0 && (
                        <div className="fd-replies">
                          {thread.replies.map((reply) => (
                            <div key={reply.id} className="fd-reply">
                              <Avatar
                                src={reply.authorAvatar}
                                initials={reply.authorInitials}
                                color={reply.authorColor}
                                size={36}
                              />
                              <div className="fd-reply-body">
                                <div className="fd-reply-header">
                                  <span className="fd-reply-name">
                                    {reply.authorName}
                                  </span>
                                  <span className="fd-reply-time">
                                    {reply.time}
                                  </span>
                                </div>
                                <p
                                  className="fd-reply-text"
                                  dangerouslySetInnerHTML={{
                                    __html: reply.content || "",
                                  }}
                                />
                                <button
                                  className={`fd-reply-action ${reply.liked ? "fd-action-btn--liked" : ""}`}
                                  onClick={() =>
                                    toggleLike(thread.id, reply.id)
                                  }
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{
                                      fontSize: "0.875rem",
                                      fontVariationSettings: reply.liked
                                        ? "'FILL' 1"
                                        : "'FILL' 0",
                                    }}
                                  >
                                    favorite
                                  </span>
                                  Suka
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {thread.collapsed && !isExpanded && (
                        <button
                          className="fd-collapsed-pill"
                          onClick={() => toggleExpand(thread.id)}
                        >
                          <span className="material-symbols-outlined">
                            comment
                          </span>
                          {thread.replyCount} komentar · Tampilkan semua
                        </button>
                      )}

                      {replyingTo === thread.id && (
                        <div className="fd-reply-input-wrap">
                          <Avatar
                            src={AVATAR}
                            initials="F"
                            color="#4b53bc"
                            size={34}
                          />
                          <div className="fd-reply-input-area">
                            <textarea
                              className="fd-reply-textarea"
                              placeholder="Tulis respons Anda..."
                              rows={3}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                            />
                            <div className="fd-reply-input-actions">
                              <button
                                className="fd-reply-cancel"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText("");
                                }}
                              >
                                Batal
                              </button>
                              <button
                                className="fd-reply-submit"
                                onClick={() => submitReply(thread.id)}
                              >
                                <span className="material-symbols-outlined">
                                  send
                                </span>
                                Kirim
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
          )}

          {/* CREATE VIEW */}
          {view === "create" && (
            <>
              <div className="fd-topbar">
                <div>
                  <nav className="fd-breadcrumb">
                    <span>Mata Kuliah</span>
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                    <button
                      className="fd-breadcrumb-link"
                      onClick={() => setView("forum")}
                    >
                      {selectedMatkul?.namaMataKuliah || "Forum Diskusi"}
                    </button>
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                    <span className="fd-breadcrumb--active">Buat Baru</span>
                  </nav>
                  <h2 className="fd-create-title">Buat Diskusi Baru</h2>
                  <p className="fd-create-sub">
                    Buat pengumuman atau pertanyaan untuk didiskusikan mahasiswa
                    di kelas.
                  </p>
                </div>
              </div>

              <div className="fd-create-card">
                <form onSubmit={handleSubmit}>
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
                  <div className="fd-field">
                    <label className="fd-label">Isi Diskusi</label>
                    <div className="fd-editor-wrap">
                      <div className="fd-toolbar">
                        <button
                          type="button"
                          className="fd-tool-btn"
                          title="Bold"
                          onClick={() => wrapText("**")}
                        >
                          <span className="material-symbols-outlined">
                            format_bold
                          </span>
                        </button>
                        <button
                          type="button"
                          className="fd-tool-btn"
                          title="Italic"
                          onClick={() => wrapText("_")}
                        >
                          <span className="material-symbols-outlined">
                            format_italic
                          </span>
                        </button>
                        <button
                          type="button"
                          className="fd-tool-btn"
                          title="List"
                          onClick={() => setFormBody((b) => b + "\n- ")}
                        >
                          <span className="material-symbols-outlined">
                            format_list_bulleted
                          </span>
                        </button>
                        <button
                          type="button"
                          className="fd-tool-btn"
                          title="Link"
                          onClick={() => wrapText("[", "](url)")}
                        >
                          <span className="material-symbols-outlined">
                            link
                          </span>
                        </button>
                        <button
                          type="button"
                          className="fd-tool-btn"
                          title="Image"
                          onClick={() => editorImageInputRef.current?.click()}
                        >
                          <span className="material-symbols-outlined">
                            image
                          </span>
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
                        placeholder="Jelaskan detail diskusi..."
                        rows={9}
                        value={formBody}
                        onChange={(e) => setFormBody(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="fd-field">
                    <label className="fd-label">
                      Lampirkan File (Opsional)
                    </label>
                    <div
                      className={`fd-dropzone ${dragOver ? "fd-dropzone--over" : ""}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: "none" }}
                        onChange={(e) =>
                          setAttachedFile(e.target.files[0] || null)
                        }
                      />
                      {attachedFile ? (
                        <div className="fd-attached">
                          <span
                            className="material-symbols-outlined"
                            style={{ color: "var(--color-secondary)" }}
                          >
                            attach_file
                          </span>
                          <span className="fd-attached-name">
                            {attachedFile.name}
                          </span>
                          <button
                            type="button"
                            className="fd-attached-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAttachedFile(null);
                            }}
                          >
                            <span className="material-symbols-outlined">
                              close
                            </span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="material-symbols-outlined fd-upload-icon">
                            cloud_upload
                          </span>
                          <p className="fd-upload-text">
                            Tarik file ke sini atau{" "}
                            <span className="fd-upload-link">pilih file</span>
                          </p>
                          <p className="fd-upload-hint">
                            PDF, PNG, JPG (Maks. 5MB)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="fd-form-actions">
                    <button
                      type="button"
                      className="fd-btn-cancel"
                      onClick={() => setView("forum")}
                    >
                      Batal
                    </button>
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
