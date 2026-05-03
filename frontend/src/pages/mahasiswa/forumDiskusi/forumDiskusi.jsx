import React, { useState, useRef, useEffect } from "react";
import "../../../shared.css";
import "./forumDiskusi.css";
import Sidebar from "../../../Sidebar";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlRblArhYvkrSWfEx3UWaIaP5bdg8OpReWzF-sc4sB_2K3sC4IYv7Q4-lWy6VUtGhc5esYpVi12_HYjLZdjx6ILoT60xad1GfsEtHStVQIigk44gnAXnpEAjWrPWVYNa_AKdaDPqXQwdlJDbcccdQ96CZrZ6btx50rBBy3LvfY-eINJ1MtiJWLJpWBAo2nnbaNr3i-_Yn3B_BsVkOxpG3hVSKt38J2-NxnAah9LFYcNLvZARv4lzr86P24cdV4haCMW80Nudw5Lku";

const INITIAL_THREADS = [
  {
    id: 1,
    authorName: "Dr. Aris Setiawan",
    authorRole: "DOSEN PENGAMPU",
    authorAvatar: "https://i.pravatar.cc/48?img=12",
    authorColor: null,
    authorInitials: null,
    time: "15 menit yang lalu",
    content:
      'Ada pertanyaan soal materi hari ini? Kita sudah membahas tentang <strong>Fitts\' Law</strong> dan penerapannya pada desain antarmuka mobile. Silakan tuliskan poin yang paling menantang bagi Anda.',
    likes: 12,
    liked: false,
    replies: [
      {
        id: 11,
        authorName: "Fajar Ramadhan",
        authorAvatar: "https://i.pravatar.cc/40?img=33",
        authorColor: null,
        authorInitials: null,
        time: "8 MENIT YANG LALU",
        content:
          "Izin bertanya Pak, bagaimana penerapan Fitts' Law pada desain perangkat yang menggunakan <em>haptic feedback</em> berlibih? Apakah ada penyesuaian ukuran target secara dinamis?",
        likes: 0,
        liked: false,
      },
      {
        id: 12,
        authorName: "Siti Nurhaliza",
        authorAvatar: null,
        authorColor: "#2f9696",
        authorInitials: "SN",
        time: "BARU SAJA",
        content:
          "Sangat menarik materi tadi Pak. Menurut saya, yang paling menantang adalah menyeimbangkan antara <em>distance to target</em> dengan estetika visual yang minimalis di layar smartphone kecil.",
        likes: 0,
        liked: false,
      },
    ],
    replyCount: 2,
  },
  {
    id: 2,
    authorName: "Andi Wijaya",
    authorRole: null,
    authorAvatar: null,
    authorColor: "#c47f17",
    authorInitials: "AW",
    time: "3 jam yang lalu",
    title: "Diskusi: Prinsip Gestalt",
    content:
      "Apakah pengelompokan elemen berdasarkan warna (Prinsip Similarity) selalu lebih efektif dibandingkan kedekatan posisi?",
    likes: 5,
    liked: false,
    replies: [],
    replyCount: 24,
    collapsed: true,
  },
  {
    id: 3,
    authorName: "Rizky Pratama",
    authorRole: null,
    authorAvatar: "https://i.pravatar.cc/48?img=60",
    authorColor: null,
    authorInitials: null,
    time: "1 hari yang lalu",
    title: "Diskusi: Hick's Law dalam Menu Navigasi",
    content:
      "Bagaimana kita menentukan jumlah optimal item menu agar sesuai dengan Hick's Law tanpa mengorbankan fitur penting aplikasi?",
    likes: 8,
    liked: false,
    replies: [],
    replyCount: 11,
    collapsed: true,
  },
];

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

import { apiClient } from "../../../utils/apiClient";

export default function ForumDiskusi({ onNavigate, onLogout, idMataKuliah = 1 }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [view, setView] = useState("forum"); // "forum" | "create"
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);   // thread id
  const [replyText, setReplyText] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set([1]));

  // Create form state
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const res = await apiClient.get(`/api/forum/mata-kuliah/${idMataKuliah}`);
        const data = res.data || res;
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map(t => ({
            id: t.id,
            authorName: t.authorName || "User",
            authorRole: t.authorRole || null,
            authorAvatar: null,
            authorColor: "#2f9696",
            authorInitials: (t.authorName || "U").substring(0, 2).toUpperCase(),
            time: t.time ? new Date(t.time).toLocaleDateString("id-ID") : "",
            title: t.title || "",
            content: t.content || "",
            likes: 0,
            liked: false,
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
          setThreads(INITIAL_THREADS); // fallback if empty
        }
      } catch (error) {
        setThreads(INITIAL_THREADS);
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, [idMataKuliah]);

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

  // ── Submit new discussion ──
  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) {
      showToast("error", "Judul dan isi diskusi tidak boleh kosong.");
      return;
    }

    try {
      await apiClient.post("/api/forum/create", {
        idMataKuliah,
        judul: formTitle.trim(),
        isiForum: formBody.trim()
      });
      showToast("success", "Diskusi berhasil dibuat!");
      // Refetch
      const res = await apiClient.get(`/api/forum/mata-kuliah/${idMataKuliah}`);
      const data = res.data || res;
      if (Array.isArray(data)) {
        const formatted = data.map(t => ({
          id: t.id,
          authorName: t.authorName || "User",
          authorRole: t.authorRole || null,
          authorAvatar: null,
          authorColor: "#2f9696",
          authorInitials: (t.authorName || "U").substring(0, 2).toUpperCase(),
          time: t.time ? new Date(t.time).toLocaleDateString("id-ID") : "",
          title: t.title || "",
          content: t.content || "",
          likes: 0,
          liked: false,
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
      }
    } catch (error) {
      showToast("error", "Gagal membuat diskusi");
    }

    setFormTitle("");
    setFormBody("");
    setAttachedFile(null);
    setView("forum");
  };

  // ── Like ──
  const toggleLike = (threadId, replyId) => {
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
  };

  // ── Submit reply ──
  const submitReply = async (threadId) => {
    if (!replyText.trim()) return;
    try {
      await apiClient.post(`/api/forum/${threadId}/reply`, {
        isiKomentar: replyText.trim()
      });
      // Refetch threads to show the new reply
      const res = await apiClient.get(`/api/forum/mata-kuliah/${idMataKuliah}`);
      const data = res.data || res;
      if (Array.isArray(data)) {
        const formatted = data.map(t => ({
          id: t.id,
          authorName: t.authorName || "User",
          authorRole: t.authorRole || null,
          authorAvatar: null,
          authorColor: "#2f9696",
          authorInitials: (t.authorName || "U").substring(0, 2).toUpperCase(),
          time: t.time ? new Date(t.time).toLocaleDateString("id-ID") : "",
          title: t.title || "",
          content: t.content || "",
          likes: 0,
          liked: false,
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
        // Auto-expand the thread we just replied to
        setExpandedIds(prev => new Set([...prev, threadId]));
      }
      setReplyingTo(null);
      setReplyText("");
      showToast("success", "Balasan berhasil dikirim!");
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
        <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} onNavigate={typeof nav !== "undefined" ? nav : (typeof onNavigate !== "undefined" ? onNavigate : undefined)} />

        <div className="page-content">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>Memuat forum...</div>
          ) : (
            <>
              {/* ════════════════════ FORUM LIST VIEW ════════════════════ */}
              {view === "forum" && (
                <>
                  {/* Top bar */}
                  <div className="fd-topbar">
                    <div>
                      <nav className="fd-breadcrumb">
                        <span>MATA KULIAH</span>
                        <span className="material-symbols-outlined">chevron_right</span>
                        <span>DESAIN INTERAKSI</span>
                        <span className="material-symbols-outlined">chevron_right</span>
                        <span className="fd-breadcrumb--active">FORUM DISKUSI</span>
                      </nav>
                      <h2 className="fd-page-title">Forum Diskusi Kelas</h2>
                      <p className="fd-page-sub">
                        Ruang kolaborasi untuk mendalami materi Desain Interaksi pekan ini.<br />
                        Silakan berbagi pandangan atau bertanya langsung kepada pengampu.
                      </p>
                    </div>
                    <button className="fd-new-btn" onClick={() => setView("create")}>
                      <span className="material-symbols-outlined">add</span>
                      Mulai Diskusi Baru
                    </button>
                  </div>

                  {/* Thread list */}
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
                              dangerouslySetInnerHTML={{ __html: thread.content }}
                            />
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
                                    <p className="fd-reply-text" dangerouslySetInnerHTML={{ __html: reply.content }} />
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
                </>
              )}

              {/* ════════════════════ CREATE VIEW ════════════════════ */}
              {view === "create" && (
                <>
                  <div className="fd-topbar">
                    <div>
                      <nav className="fd-breadcrumb">
                        <span>Mata Kuliah</span>
                        <span className="material-symbols-outlined">chevron_right</span>
                        <span>Desain Interaksi</span>
                        <span className="material-symbols-outlined">chevron_right</span>
                        <button className="fd-breadcrumb-link" onClick={() => setView("forum")}>Forum Diskusi</button>
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
                            <button type="button" className="fd-tool-btn" title="Image" onClick={() => wrapText("![alt](", ")")}>
                              <span className="material-symbols-outlined">image</span>
                            </button>
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}
