import React, { useState, useEffect } from "react";
import "../../../components/shared.css";
import "./mataKuliah.css";
import "./videoMataKuliah.css";
import Sidebar from "../../../components/Sidebar";
import { useSidebar } from "../../../components/useSidebar";
import Navbar from "../../../components/Navbar";
import { apiClient } from "../../../utils/apiClient";
import LoadingSpinner from "../../../components/LoadingSpinner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function MataKuliah({ onNavigate, onLogout, idMataKuliah = 1 }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [activeModule, setActiveModule] = useState(null);
  const [toast, setToast] = useState(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pdf: 0, video: 0, tugas: 0, kuis: 0 });

  const getRawMaterialType = (item) => {
    return String(item?.tipe_modul || item?.tipe || item?.type || "").trim();
  };

  const getMaterialTypeCategory = (rawType) => {
    const normalized = String(rawType || "").trim().toLowerCase();
    if (normalized === "video") return "video";
    if (normalized === "link") return "link";
    if (normalized === "presentasi") return "presentasi";
    if (normalized === "dokumen") return "dokumen";
    if (normalized === "spreadsheet") return "spreadsheet";
    if (normalized === "pdf") return "pdf";
    return "file";
  };

  const getTypeIcon = (rawType) => {
    const normalized = String(rawType || "").trim().toLowerCase();
    const icons = {
      pdf: "picture_as_pdf",
      video: "play_circle",
      link: "link",
      presentasi: "slideshow",
      dokumen: "description",
      spreadsheet: "table_chart",
    };
    return icons[normalized] || "insert_drive_file";
  };

  const getMaterialAction = (typeCategory) => {
    if (typeCategory === "video") return "play";
    if (typeCategory === "link") return "open";
    return "download";
  };

  const isYouTubeUrl = (url) => {
    if (!url) return false;
    return /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)/i.test(url);
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const matches = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
    return matches ? matches[1] : null;
  };

  const getYouTubeEmbedUrl = (url) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
  };

  const getYouTubeThumbnail = (url) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop";
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const nim = user.nomorInduk || "";

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Fetch course detail
        const courseRes = await apiClient.get(`/api/mata-kuliah/${idMataKuliah}`);
        const courseData = courseRes.data || courseRes;
        setCourse(courseData);

        // Fetch materi dengan progress dari API baru
        const materiRes = await apiClient.get(`/api/materi/mata-kuliah/${idMataKuliah}?nim=${nim}`);
        const materiData = Array.isArray(materiRes) ? materiRes : (materiRes.data || []);
        
        const formattedModules = materiData.map((m, index) => {
          const rawType = getRawMaterialType(m);
          const typeCategory = getMaterialTypeCategory(rawType);
          const materialLabel = rawType || (typeCategory === "video" ? "Video" : "Dokumen");
          return {
            id: m.id || index + 1,
            title: m.judul || m.namaFile || "Materi Tanpa Judul",
            meta: materialLabel,
            type: typeCategory,
            action: getMaterialAction(typeCategory),
            status: "active",
            url: m.url || m.fileUrl || m.link || "",
            deskripsi: m.deskripsi || "Tidak ada deskripsi untuk modul ini.",
            sudahAkses: m.sudahAkses || false
          };
        });

        setModules(formattedModules.length > 0 ? formattedModules : [
          { id: 1, title: "Belum ada materi", meta: "-", type: "pdf", action: "none", status: "", deskripsi: "Dosen belum mengunggah materi.", sudahAkses: false }
        ]);
        if (formattedModules.length > 0) setActiveModule(formattedModules[0].id);

        // Hitung stats PDF dan Video
        const pdfCount = formattedModules.filter(m => m.type === "pdf").length;
        const videoCount = formattedModules.filter(m => m.type === "video").length;

        // Fetch tugas count
        let tugasCount = 0;
        try {
          const tugasRes = await apiClient.get(`/api/tugas?idMataKuliah=${idMataKuliah}`);
          const tugasData = Array.isArray(tugasRes) ? tugasRes : (tugasRes.data || []);
          tugasCount = tugasData.length;
        } catch(e) { /* ignore */ }

        // Fetch kuis count
        let kuisCount = 0;
        try {
          const kuisRes = await apiClient.get(`/api/kuis/mata-kuliah/${idMataKuliah}`);
          const kuisData = Array.isArray(kuisRes) ? kuisRes : (kuisRes.data || []);
          kuisCount = kuisData.length;
        } catch(e) { /* ignore */ }

        setStats({ pdf: pdfCount, video: videoCount, tugas: tugasCount, kuis: kuisCount });

      } catch (error) {
        console.error("Gagal memuat mata kuliah", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [idMataKuliah, nim]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Remove early LoadingSpinner return




  return (
    <div className="page-shell">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "5rem", right: "1.5rem", zIndex: 999,
          background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0",
          padding: "0.75rem 1.25rem", borderRadius: "0.75rem", fontWeight: 600,
          fontSize: "0.875rem", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", gap: "0.5rem"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>{"check_circle"}</span>
          {toast}
        </div>
      )}

      {/* Video Modal */}
      {videoOpen && (
        <div className="mk-video-modal" onClick={() => setVideoOpen(false)}>
          <div className="mk-video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="mk-video-modal-close" onClick={() => setVideoOpen(false)}>
              <span className="material-symbols-outlined">{"close"}</span>
            </button>
            <div className="mk-video-modal-header">
              <h3>{modules.find(m => m.id === activeModule)?.title || "Video Pembelajaran"}</h3>
              <p>{modules.find(m => m.id === activeModule)?.meta || "Materi Video"}</p>
            </div>
            <div className="mk-video-player-wrapper">
              {(() => {
                const activeVideo = modules.find(m => m.id === activeModule) || {};
                if (isYouTubeUrl(activeVideo.url)) {
                  return (
                    <div className="mk-video-embed">
                      <iframe
                        className="mk-video-player"
                        src={getYouTubeEmbedUrl(activeVideo.url)}
                        title={activeVideo.title || "Video Pembelajaran"}
                        frameBorder="0"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  );
                }
                return (
                  <video
                    className="mk-video-player"
                    controls
                    autoPlay
                    src={activeVideo.url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
                    poster={getYouTubeThumbnail(activeVideo.url)}
                  >
                    {"Browser Anda tidak mendukung tag video."}
                  </video>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── Sidebar ─── */}
      <Sidebar onNavigate={onNavigate} onLogout={onLogout} activePage="mataKuliah" mobileOpen={sidebarOpen} onClose={closeSidebar} />

        {/* ─── Main ─── */}
      <main className="page-main">
        {/* Navbar */}
        <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} onNavigate={typeof nav !== "undefined" ? nav : (typeof onNavigate !== "undefined" ? onNavigate : undefined)} />

        {/* Content */}
        <div className="page-content">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="skeleton-text skeleton-text--title" style={{ height: '2rem', width: '20rem' }}></div>
              <div className="skeleton-text skeleton-text--medium" style={{ height: '1.25rem', width: '30rem' }}></div>
              <div className="mk-body-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="skeleton-card" style={{ height: '300px', width: '100%' }}></div>
                  <div className="skeleton-card" style={{ height: '150px', width: '100%' }}></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="skeleton-card" style={{ height: '250px', width: '100%' }}></div>
                  <div className="skeleton-card" style={{ height: '100px', width: '100%' }}></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Course header */}
              <div className="mk-course-header">
            <span className="mk-faculty-badge">
              <span className="material-symbols-outlined">{"school"}</span>
              {"FAKULTAS INFORMATIKA"}
            </span>
            <h2 className="mk-course-title">{"Mata Kuliah: "}{course?.namaMataKuliah || course?.nama || "Mata Kuliah"}</h2>
            <p className="mk-course-desc">
              {"Silakan pelajari materi dan kerjakan tugas yang tersedia."}
            </p>
          </div>

          {/* Body grid */}
          <div className="mk-body-grid">
            {/* Left */}
            <div className="mk-left-col">
              {/* Video Player or Thumbnail */}
              {(() => {
                const activeData = modules.find(m => m.id === activeModule) || modules[0];
                return (
                  <>
                    <div className="mk-video-card">
                      <div className="mk-video-thumb">
                        <span className={`mk-type-badge mk-badge-${activeData?.type || "default"}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                            {getTypeIcon(activeData?.meta)}
                          </span>
                          {activeData?.type === "pdf"
                            ? "PDF"
                            : activeData?.type === "presentasi"
                              ? "Presentasi"
                              : activeData?.type === "link"
                                ? "Link"
                                : activeData?.type === "dokumen"
                                  ? "Dokumen"
                                  : activeData?.type === "spreadsheet"
                                    ? "Excel"
                                    : "Materi"}
                        </span>
                        {activeData?.type === "video" ? (
                          <img
                            src={
                              isYouTubeUrl(activeData?.url)
                                ? getYouTubeThumbnail(activeData.url)
                                : "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop"
                            }
                            alt={activeData?.title}
                          />
                        ) : (
                          <div className={`mk-file-placeholder mk-placeholder-${activeData?.type || "default"}`} />
                        )}
                        <div className="mk-video-overlay" onClick={async () => {
                          if (activeData?.action === "play") {
                            try {
                              await apiClient.post(`/api/materi/${activeData.id}/access`, { nim });
                              setModules(prev => prev.map(mod => 
                                mod.id === activeData.id ? { ...mod, sudahAkses: true } : mod
                              ));
                            } catch (err) {
                              console.error("Failed to mark video access:", err);
                            }
                            setVideoOpen(true);
                          } else if (activeData?.action === "open") {
                            window.open(activeData.url, '_blank');
                          } else if (activeData?.action === "download") {
                            const fileUrl = activeData.url?.startsWith('http') ? activeData.url : `${API_BASE}${activeData.url}`;
                            window.open(fileUrl, '_blank');
                          }
                        }} style={{ cursor: "pointer" }}>
                          <button className="mk-play-btn">
                            <span className="material-symbols-outlined">
                              {activeData?.action === "play" ? "play_arrow" : activeData?.action === "open" ? "open_in_new" : "download"}
                            </span>
                          </button>
                          <span className="mk-video-lbl">
                            {activeData?.action === "play" ? "Putar Video" : activeData?.action === "open" ? "Buka Link" : "Unduh Materi"}
                          </span>
                        </div>
                        <div className="mk-video-info">
                          <p className="mk-video-title">{activeData?.title}</p>
                          <p className="mk-video-meta">{activeData?.meta}</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mk-desc-card">
                      <h3 className="mk-desc-heading">
                        <span className="material-symbols-outlined">{"info"}</span>
                        {"Deskripsi Materi"}
                      </h3>
                      <p className="mk-desc-body">
                        {activeData?.deskripsi}
                      </p>
                      <div className="mk-stats-row">
                        {[[String(stats.pdf).padStart(2,'0'),"Modul PDF","mataKuliah"],[String(stats.video).padStart(2,'0'),"Video Ajar","mataKuliah"],[String(stats.tugas).padStart(2,'0'),"Tugas","daftarTugas"],[String(stats.kuis).padStart(2,'0'),"Kuis","kuis"]].map(([n,l,page]) => (
                          <div key={l} className="mk-stat-chip" style={{ cursor: "pointer" }} onClick={() => onNavigate && onNavigate(page)}>
                            <p className="mk-stat-num">{n}</p>
                            <p className="mk-stat-lbl">{l}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Right */}
            <div className="mk-right-col">
              {/* Module List */}
              <div className="mk-module-card">
                <div className="mk-module-header">
                  <h3>{"Daftar Materi"}</h3>
                  <span className="mk-prog-badge">{modules.length} {"MODUL"}</span>
                </div>
                <div className="mk-module-list">
                  {modules.map((m) => {
                    const isActive = m.id === activeModule;
                    return (
                      <div
                        key={m.id}
                        className={`mk-mod-item ${isActive ? "mk-mod-active" : ""}`}
                        onClick={async () => {
                          setActiveModule(m.id);
                          if (m.type === "video") {
                            // Mark video as accessed
                            try {
                              await apiClient.post(`/api/materi/${m.id}/access`, { nim });
                              // Update local state
                              setModules(prev => prev.map(mod => 
                                mod.id === m.id ? { ...mod, sudahAkses: true } : mod
                              ));
                            } catch (err) {
                              console.error("Failed to mark video access:", err);
                            }
                            setVideoOpen(true);
                          }
                        }}
                      >
                        <div className={`mk-mod-icon mk-icon-${m.type} ${isActive ? "mk-icon-on" : ""}`}>
                          <span className="material-symbols-outlined">
                            {getTypeIcon(m.meta)}
                          </span>
                        </div>
                        <div className="mk-mod-info">
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <p className={`mk-mod-title ${isActive ? "mk-mod-title--active" : ""}`}>{m.title}</p>
                            {/* Green checkmark for accessed materials */}
                            {m.sudahAkses && (
                              <span 
                                className="material-symbols-outlined" 
                                style={{ 
                                  color: "#059669", 
                                  fontSize: "1.1rem",
                                  background: "#ecfdf5",
                                  borderRadius: "50%",
                                  padding: "2px"
                                }}
                              >
                                {"check_circle"}
                              </span>
                            )}
                          </div>
                          <p className={`mk-mod-meta  ${isActive ? "mk-mod-meta--active"  : ""}`}>{m.meta}</p>
                          {m.action === "download" && (
                            <button 
                              className="mk-dl-btn" 
                              onClick={async (e) => {
                                e.stopPropagation();
                                // Mark as accessed
                                try {
                                  await apiClient.post(`/api/materi/${m.id}/access`, { nim });
                                  // Update local state
                                  setModules(prev => prev.map(mod => 
                                    mod.id === m.id ? { ...mod, sudahAkses: true } : mod
                                  ));
                                } catch (err) {
                                  console.error("Failed to mark access:", err);
                                }
                                showToast(`Mengunduh: ${m.title}`);
                                // Use absolute URL if provided, otherwise prepend base URL
                                const fileUrl = m.url?.startsWith('http') ? m.url : `${API_BASE}${m.url}`;
                                window.open(fileUrl, '_blank');
                              }}
                            >
                              <span className="material-symbols-outlined">{"download"}</span>
                              {"Unduh Modul"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instructor */}
              <div className="mk-instructor-card">
                <p className="mk-inst-label">{"PENGAJAR"}</p>
                <div className="mk-inst-row">
                  <div className="mk-inst-avatar" style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #2f9696, #4b53bc)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                    {(course?.dosen?.user?.nama || course?.dosenNama || "??").split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="mk-inst-info">
                    <p className="mk-inst-name">{course?.dosen?.user?.nama || course?.dosenNama || "Dosen"}</p>
                    <p className="mk-inst-role">{"Dosen "}{course?.namaMataKuliah || course?.nama || ""}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}



