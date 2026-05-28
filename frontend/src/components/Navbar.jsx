import React, { useState, useEffect } from "react";
import "./shared.css";
import "../pages/mahasiswa/dashboard/notifikasi.css";
import { apiClient } from "../utils/apiClient";

const AVATAR_MAHASISWA =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlRblArhYvkrSWfEx3UWaIaP5bdg8OpReWzF-sc4sB_2K3sC4IYv7Q4-lWy6VUtGhc5esYpVi12_HYjLZdjx6ILoT60xad1GfsEtHStVQIigk44gnAXnpEAjWrPWVYNa_AKdaDPqXQwdlJDbcccdQ96CZrZ6btx50rBBy3LvfY-eINJ1MtiJWLJpWBAo2nnbaNr3i-_Yn3B_BsVkOxpG3hVSKt38J2-NxnAah9LFYcNLvZARv4lzr86P24cdV4haCMW80Nudw5Lku";

const AVATAR_DOSEN =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjoXu55KCdSSPl-2t0t7d2EH6gux6Xz8nZaCdXHePrj-gGn1ZWZyBoOucWc2yVgrhmNFyy8cKbxWH8i9Wm5VKkpqX9jraXjkHTr8PVU1oN3V4nkzLWUUm6nyAIS3hGDic_uY0YoNLNNZluKTKqFwJb2gYlRl9eATGdlXClTx6IXpYvk-2u1qqvfUGTzs-QJPlXTouWTyNYzTe8j8mS09evVA_aHTYfHxneVwUsb2jUygYzuAIDU5KwqO2kISzLvnzaTentePscoGoo";

export default function Navbar({ role, onOpenSidebar, onNavigate }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const isClosed = localStorage.getItem("sidebarClosed") === "true";
    if (isClosed) {
      document.body.classList.add("sidebar-closed");
    } else {
      document.body.classList.remove("sidebar-closed");
    }
  }, []);

  const handleHamburgerClick = () => {
    if (window.innerWidth < 768) {
      if (onOpenSidebar) onOpenSidebar();
    } else {
      const isClosed = document.body.classList.toggle("sidebar-closed");
      localStorage.setItem("sidebarClosed", String(isClosed));
    }
  };

  const isDosen = role === "Dosen";
  const isMahasiswa = role === "Mahasiswa";
  const defaultAvatar = isDosen ? AVATAR_DOSEN : AVATAR_MAHASISWA;

  const storedUserStr = localStorage.getItem("user");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : {};
  const userName = storedUser.nama || (isDosen ? "Dosen" : "Mahasiswa");
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatar);

  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    if (storedUser.fotoUrl) {
      setAvatarUrl(`${API_BASE}${storedUser.fotoUrl}`);
    } else {
      setAvatarUrl(defaultAvatar);
    }
  }, [storedUser.fotoUrl, API_BASE, defaultAvatar]);

  const DOSEN_NOTIFICATIONS = [
    { id: 'd1', title: 'Jadwal UTS Semester Genap', desc: 'UTS akan dilaksanakan pada tanggal 2-6 Juni 2026. Pastikan materi sudah diunggah sebelum pelaksanaan.', time: '1 jam lalu', read: false, type: 'akademik' },
    { id: 'd2', title: 'Pengumuman Libur Nasional', desc: 'Perkuliahan diliburkan pada Kamis, 29 Mei 2026 dalam rangka Hari Raya Waisak. Jadwal dapat disesuaikan.', time: '3 jam lalu', read: false, type: 'akademik' },
    { id: 'd3', title: 'Jadwal UAS Semester Genap', desc: 'UAS dijadwalkan pada tanggal 30 Juni - 4 Juli 2026. Dosen dimohon mengumpulkan soal maksimal 2 minggu sebelumnya.', time: '5 jam lalu', read: false, type: 'akademik' },
    { id: 'd4', title: 'Batas Input Nilai UTS', desc: 'Batas akhir pengisian nilai UTS adalah 13 Juni 2026. Harap segera mengisi nilai setelah pelaksanaan ujian.', time: 'Kemarin', read: true, type: 'akademik' },
    { id: 'd5', title: 'Rapat Koordinasi Akademik', desc: 'Rapat koordinasi semester genap akan diadakan pada Jumat, 23 Mei 2026 pukul 09.00 WIB di Ruang Rapat Utama.', time: 'Kemarin', read: true, type: 'akademik' },
    { id: 'd6', title: 'Revisi Kalender Akademik', desc: 'Kalender akademik 2025/2026 telah diperbarui. Silakan unduh versi terbaru melalui portal akademik kampus.', time: '2 hari lalu', read: true, type: 'akademik' },
    { id: 'd7', title: 'Pengisian KRS Mahasiswa', desc: 'Periode pengisian KRS semester ganjil 2026/2027 dibuka 1-15 Juli 2026. Dosen wali dimohon melakukan persetujuan tepat waktu.', time: '3 hari lalu', read: true, type: 'akademik' },
  ];

  useEffect(() => {
    if (isDosen) {
      setNotifications(DOSEN_NOTIFICATIONS);
      setUnreadCount(DOSEN_NOTIFICATIONS.filter(n => !n.read).length);
      return;
    }

    if (!isMahasiswa) return;

    const fetchNotifications = async () => {
      try {
        const [res, unreadRes] = await Promise.all([
          apiClient.get('/api/notifikasi'),
          apiClient.get('/api/notifikasi/unread-count')
        ]);
        const notifList = Array.isArray(res) ? res : (res.data || []);
        
        setNotifications(notifList.slice(0, 10).map(n => ({
          id: n.idNotifikasi || Date.now(),
          title: n.judul || '',
          desc: n.pesan || '',
          time: n.createdAt ? new Date(n.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Baru',
          read: n.isRead || false,
          type: n.tipe || 'info'
        })));

        setUnreadCount(unreadRes?.count || 0);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isMahasiswa, isDosen]);

  const name = isDosen ? `Halo, ${userName}` : `Halo, ${userName}`;
  const subtitle = isDosen ? "Dosen" : "Mahasiswa";
  const placeholder = isDosen ? "Cari materi atau mahasiswa..." : "Cari materi atau tugas...";

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Mock global data for search
  const searchIndex = [
    { id: 's1', type: 'Mahasiswa', title: 'Budi Santoso', desc: 'NIM: 1301210001 - Kelas IF-48-08', mhsPage: 'profile', dosenPage: 'dosenProfile' },
    { id: 's2', type: 'Mahasiswa', title: 'Siti Aminah', desc: 'NIM: 1301210002 - Kelas IF-48-08', mhsPage: 'profile', dosenPage: 'dosenProfile' },
    { id: 's3', type: 'Materi', title: 'Pemrograman Web', desc: 'Bab 1 - Konsep Dasar Web', mhsPage: 'daftarMataKuliah', dosenPage: 'dosenMateri' },
    { id: 's4', type: 'Materi', title: 'Rekayasa Perangkat Lunak', desc: 'Modul 3 - SDLC', mhsPage: 'daftarMataKuliah', dosenPage: 'dosenMateri' },
    { id: 's5', type: 'Tugas', title: 'Tugas PBO', desc: 'Tenggat: 20 Desember 2024', mhsPage: 'daftarTugas', dosenPage: 'dosenTugas' },
    { id: 's6', type: 'Tugas', title: 'Analisis Kebutuhan RPL', desc: 'Tenggat: 20 Desember 2024', mhsPage: 'daftarTugas', dosenPage: 'dosenTugas' },
    { id: 's7', type: 'Forum', title: 'Diskusi Web API', desc: 'Forum pertemuan ke-4', mhsPage: 'forumDiskusi', dosenPage: 'dosenForum' },
  ];

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    if (val.trim() === "") {
      setIsSearchOpen(false);
      setSearchResults([]);
      return;
    }

    const q = val.toLowerCase();
    const results = searchIndex.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.desc.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
    );
    
    setSearchResults(results);
    setIsSearchOpen(true);
  };

  const handleResultClick = (result) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    if (onNavigate) {
      onNavigate(isDosen ? result.dosenPage : result.mhsPage);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar__left">
        <button className="navbar__hamburger" onClick={handleHamburgerClick}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        {!isDosen && <div className="navbar__search" style={{ position: "relative" }}>
          <span className="material-symbols-outlined navbar__search-icon">search</span>
          <input
            className="navbar__search-input"
            placeholder={placeholder}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {isSearchOpen && (
            <div className="search-dropdown" style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              left: 0,
              width: "100%",
              minWidth: "300px",
              backgroundColor: "var(--color-surface)",
              boxShadow: "var(--shadow-md)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              zIndex: 50,
              maxHeight: "350px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column"
            }}>
              {searchResults.length > 0 ? (
                searchResults.map(res => (
                  <div 
                    key={res.id} 
                    className="search-item" 
                    onClick={() => handleResultClick(res)}
                    style={{
                      padding: "0.75rem 1rem",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--color-border)",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--slate-50)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--blue-900)" }}>{res.title}</span>
                      <span style={{ fontSize: "0.625rem", padding: "0.15rem 0.5rem", borderRadius: "1rem", backgroundColor: "var(--blue-50)", color: "var(--blue-700)", fontWeight: 700, textTransform: "uppercase" }}>{res.type}</span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--slate-500)", margin: 0 }}>{res.desc}</p>
                  </div>
                ))
              ) : (
                <div style={{ padding: "1rem", textAlign: "center", color: "var(--slate-500)", fontSize: "0.875rem" }}>
                  Tidak ada hasil untuk "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>}
      </div>
      <div className="navbar__right">
        <button className="navbar__bell" onClick={() => setNotifOpen(!notifOpen)} style={{ position: "relative" }}>
          <span className="material-symbols-outlined">notifications</span>
          {unreadCount > 0 && (
            <span className="navbar__bell-dot" style={{
              position: 'absolute', top: '0', right: '0',
              minWidth: '16px', height: '16px', borderRadius: '8px',
              background: '#ef4444', color: 'white', fontSize: '10px',
              fontWeight: 700, display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: '0 4px',
              transform: 'translate(25%, -25%)'
            }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {notifOpen && (
          <div className="notif-dropdown">
            <div className="notif-header">
              <h3>Notifikasi</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {isMahasiswa && notifications.length > 0 && (  
                  <button className="notif-close" onClick={async () => {
                    try {
                      await apiClient.put('/api/notifikasi/read-all');
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      setUnreadCount(0);
                    } catch (e) {
                      console.error('Gagal menandai semua:', e);
                    }
                  }} title="Tandai semua telah dibaca">
                    <span className="material-symbols-outlined">done_all</span>
                  </button>
                )}
                <button className="notif-close" onClick={() => setNotifOpen(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            <div className="notif-list">
              {notifications.length > 0 ? notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-item ${notif.read ? "notif-read" : "notif-unread"}`}
                  onClick={async () => {
                    if (!notif.read && isMahasiswa) {
                      try {
                        await apiClient.put(`/api/notifikasi/${notif.id}/read`);
                        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                        setUnreadCount(prev => Math.max(0, prev - 1));
                      } catch (e) {}
                    }
                    setNotifOpen(false);
                    if (onNavigate) {
                      if (isDosen) {
                        if (notif.type === "tugas") onNavigate("dosenKelompok");
                        else if (notif.type === "forum") onNavigate("dosenForum");
                        else if (notif.type === "presensi") onNavigate("dosenPresensi");
                      } else {
                        if (notif.type === "tugas") onNavigate("daftarTugas");
                        else if (notif.type === "kuis") onNavigate("daftarTugas");
                        else if (notif.type === "materi") onNavigate("daftarMataKuliah");
                        else if (notif.type === "presensi") onNavigate("presensiMahasiswa");
                        else if (notif.type === "forum") onNavigate("forumDiskusi");
                      }
                    }
                  }}
                >
                  <div className="notif-icon">
                    <span className="material-symbols-outlined">
                      {notif.type === "tugas" ? "assignment" :
                       notif.type === "kuis" ? "quiz" :
                       notif.type === "materi" ? "menu_book" :
                       notif.type === "forum" ? "forum" :
                       notif.type === "presensi" ? "qr_code_scanner" :
                       notif.type === "nilai" ? "grade" :
                       notif.type === "akademik" ? "school" : "notifications"}
                    </span>
                  </div>
                  <div className="notif-content">
                    <p className="notif-title">{notif.title}</p>
                    <p className="notif-desc">{notif.desc}</p>
                    <p className="notif-time">{notif.time}</p>
                  </div>
                </div>
              )) : (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--slate-400)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>notifications_off</span>
                  <p style={{ fontSize: "0.875rem" }}>Tidak ada notifikasi</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="navbar__divider"></div>
        <div
          className="navbar__profile"
          style={{ cursor: "pointer" }}
          onClick={() => onNavigate && onNavigate(isDosen ? "dosenProfile" : "profile")}
          title="Lihat Profil"
        >
          <div className="navbar__profile-info">
            <p className="navbar__profile-name">{name}</p>
            <p className="navbar__profile-role">{subtitle}</p>
          </div>
          <div className="navbar__avatar">
            <img alt={`Foto profil ${name}`} src={avatarUrl} />
          </div>
        </div>
      </div>
    </header>
  );
}
