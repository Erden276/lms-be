import React from "react";
import "./shared.css";

export default function SidebarDosen({
  onNavigate,
  activePage,
  onLogout,
  mobileOpen,
  onClose,
}) {
  function nav(page) {
    if (onNavigate) onNavigate(page);
    if (onClose) onClose();
  }

  function isActive(key) {
    return activePage === key;
  }

  function cls(key) {
    return "sidebar__link" + (isActive(key) ? " is-active" : "");
  }

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar${mobileOpen ? " sidebar--mobile-open" : ""}`}>
        <button
          className="sidebar__mobile-close"
          onClick={onClose}
          aria-label="Tutup menu"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <span className="material-symbols-outlined">auto_stories</span>
          </div>
          <div>
            <p className="sidebar__app-name">LeMaS</p>
            <p className="sidebar__app-sub">Learning Management System</p>
          </div>
        </div>

        <nav className="sidebar__nav">
          <button
            className={cls("dosenDashboard")}
            onClick={() => nav("dosenDashboard")}
          >
            <span className="material-symbols-outlined">dashboard</span>
            Beranda
          </button>
          <button
            className={cls("dosenPresensi")}
            onClick={() => nav("dosenPresensi")}
          >
            <span className="material-symbols-outlined">qr_code_2</span>
            Presensi & QR
          </button>
          <button
            className={cls("dosenMateri")}
            onClick={() => nav("dosenMateri")}
          >
            <span className="material-symbols-outlined">menu_book</span>
            Materi
          </button>
          <button
            className={cls("dosenTugas")}
            onClick={() => nav("dosenTugas")}
          >
            <span className="material-symbols-outlined">assignment</span>
            Tugas
          </button>
          <button
            className={cls("dosenKelompok")}
            onClick={() => nav("dosenKelompok")}
          >
            <span className="material-symbols-outlined">groups</span>
            Kelompok & Nilai
          </button>
          <button
            className={cls("dosenForum")}
            onClick={() => nav("dosenForum")}
          >
            <span className="material-symbols-outlined">forum</span>
            Diskusi
          </button>
          <button
            className={cls("dosenProfile")}
            onClick={() => nav("dosenProfile")}
          >
            <span className="material-symbols-outlined">account_circle</span>
            Profil
          </button>
        </nav>

        <div className="sidebar__footer">
          <button
            className="sidebar__logout-btn"
            onClick={() => {
              if (onLogout) onLogout();
            }}
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
