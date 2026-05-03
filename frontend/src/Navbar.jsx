import React, { useState } from "react";
import "./shared.css";
import "./pages/mahasiswa/dashboard/notifikasi.css";

const AVATAR_MAHASISWA =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlRblArhYvkrSWfEx3UWaIaP5bdg8OpReWzF-sc4sB_2K3sC4IYv7Q4-lWy6VUtGhc5esYpVi12_HYjLZdjx6ILoT60xad1GfsEtHStVQIigk44gnAXnpEAjWrPWVYNa_AKdaDPqXQwdlJDbcccdQ96CZrZ6btx50rBBy3LvfY-eINJ1MtiJWLJpWBAo2nnbaNr3i-_Yn3B_BsVkOxpG3hVSKt38J2-NxnAah9LFYcNLvZARv4lzr86P24cdV4haCMW80Nudw5Lku";

const AVATAR_DOSEN =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjoXu55KCdSSPl-2t0t7d2EH6gux6Xz8nZaCdXHePrj-gGn1ZWZyBoOucWc2yVgrhmNFyy8cKbxWH8i9Wm5VKkpqX9jraXjkHTr8PVU1oN3V4nkzLWUUm6nyAIS3hGDic_uY0YoNLNNZluKTKqFwJb2gYlRl9eATGdlXClTx6IXpYvk-2u1qqvfUGTzs-QJPlXTouWTyNYzTe8j8mS09evVA_aHTYfHxneVwUsb2jUygYzuAIDU5KwqO2kISzLvnzaTentePscoGoo";

const mhsNotifications = [
  { id: 1, title: "Tugas PBO - Praktikum 7", desc: "Tenggat waktu besok, 23:59", time: "1 jam lalu", read: false, type: "tugas" },
  { id: 2, title: "Kuis Algoritma", desc: "Kuis akan dibuka dalam 3 hari", time: "2 jam lalu", read: false, type: "kuis" },
  { id: 3, title: "Materi Baru", desc: "Modul 5 telah diupload", time: "5 jam lalu", read: true, type: "materi" },
  { id: 4, title: "Presensi", desc: "Jangan lupa presensi kelas hari ini", time: "1 hari lalu", read: true, type: "presensi" },
];

const dosenNotifications = [
  { id: 1, title: "Tugas Baru Terkumpul", desc: "Kelompok 3 mengirim Tugas PBO", time: "10 menit lalu", read: false, type: "tugas" },
  { id: 2, title: "Diskusi Baru", desc: "Ada pertanyaan baru di Forum PBO", time: "2 jam lalu", read: false, type: "forum" },
  { id: 3, title: "Presensi Selesai", desc: "Sesi presensi untuk PBO telah ditutup", time: "1 hari lalu", read: true, type: "presensi" },
];

export default function Navbar({ role, onOpenSidebar, onNavigate }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isDosen = role === "Dosen";
  const avatarUrl = isDosen ? AVATAR_DOSEN : AVATAR_MAHASISWA;

  // Read logged-in user data from localStorage
  const storedUserStr = localStorage.getItem("user");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : {};
  const userName = storedUser.nama || (isDosen ? "Dosen" : "Mahasiswa");
  const firstName = userName.split(" ")[0];

  const name = isDosen ? `Halo, ${firstName}` : `Halo, ${firstName}`;
  const subtitle = isDosen ? "Dosen Tetap" : "Mahasiswa";
  const placeholder = isDosen ? "Cari materi atau mahasiswa..." : "Cari materi atau tugas...";
  const notifications = isDosen ? dosenNotifications : mhsNotifications;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Mock global data for search
  const searchIndex = [
    { id: 's1', type: 'Mahasiswa', title: 'Budi Santoso', desc: 'NIM: 1301210001 - Kelas IF-48-08', mhsPage: 'profile', dosenPage: 'dosenProfile' },
    { id: 's2', type: 'Mahasiswa', title: 'Siti Aminah', desc: 'NIM: 1301210002 - Kelas IF-48-08', mhsPage: 'profile', dosenPage: 'dosenProfile' },
    { id: 's3', type: 'Materi', title: 'Pengenalan Sistem Operasi', desc: 'Bab 1 - Konsep Dasar OS', mhsPage: 'daftarMataKuliah', dosenPage: 'dosenMateri' },
    { id: 's4', type: 'Materi', title: 'Arsitektur Komputer Modern', desc: 'Modul 3 - Organisasi Komputer', mhsPage: 'daftarMataKuliah', dosenPage: 'dosenMateri' },
    { id: 's5', type: 'Tugas', title: 'Tugas Besar PBO', desc: 'Tenggat: 20 Desember 2024', mhsPage: 'daftarTugas', dosenPage: 'dosenTugas' },
    { id: 's6', type: 'Tugas', title: 'Analisis Arsitektur Cloud', desc: 'Tenggat: 20 Desember 2024', mhsPage: 'daftarTugas', dosenPage: 'dosenTugas' },
    { id: 's7', type: 'Forum', title: 'Diskusi Algoritma Lanjut', desc: 'Forum pertemuan ke-4', mhsPage: 'forumDiskusi', dosenPage: 'dosenForum' },
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
        <button className="navbar__hamburger" onClick={onOpenSidebar}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        {isDosen && (
          <span className="navbar__title" style={{ marginRight: '1rem', display: window.innerWidth > 768 ? 'none' : 'none' }}>
            Dasbor
          </span>
        )}
        <div className="navbar__search" style={{ position: "relative" }}>
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
        </div>
      </div>
      <div className="navbar__right">
        <button className="navbar__bell" onClick={() => setNotifOpen(!notifOpen)} style={{ position: "relative" }}>
          <span className="material-symbols-outlined">notifications</span>
          <span className="navbar__bell-dot"></span>
        </button>

        {notifOpen && (
          <div className="notif-dropdown">
            <div className="notif-header">
              <h3>Notifikasi</h3>
              <button className="notif-close" onClick={() => setNotifOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="notif-list">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-item ${notif.read ? "notif-read" : "notif-unread"}`}
                  onClick={() => {
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
                      }
                    }
                  }}
                >
                  <div className="notif-icon">
                    <span className="material-symbols-outlined">
                      {notif.type === "tugas" ? "assignment" :
                       notif.type === "kuis" ? "quiz" :
                       notif.type === "materi" ? "menu_book" :
                       notif.type === "forum" ? "forum" : "qr_code_scanner"}
                    </span>
                  </div>
                  <div className="notif-content">
                    <p className="notif-title">{notif.title}</p>
                    <p className="notif-desc">{notif.desc}</p>
                    <p className="notif-time">{notif.time}</p>
                  </div>
                </div>
              ))}
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
