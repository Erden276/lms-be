import logoImg from "./assets/logo.png";
import "./shared.css";

export default function Sidebar({ onNavigate, activePage, presensiRoute, onLogout, mobileOpen, onClose }) {
  var presRoute = presensiRoute || "presensiMahasiswa";

  function nav(page) {
    if (onNavigate) onNavigate(page);
    if (onClose) onClose(); // Close sidebar on mobile after navigation
  }

  function isActive(key) {
    if (key === "daftarMataKuliah" && activePage === "mataKuliah") return true;
    if (
      key === "presensi" &&
      (activePage === "presensi" || activePage === "presensiMahasiswa")
    )
      return true;
    return activePage === key;
  }

  function cls(key) {
    return "sidebar__link" + (isActive(key) ? " is-active" : "");
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={onClose} />
      )}

      <aside className={`sidebar${mobileOpen ? " sidebar--mobile-open" : ""}`}>
        {/* Mobile close button */}
        <button className="sidebar__mobile-close" onClick={onClose} aria-label="Tutup menu">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="sidebar__brand">
          <div className="sidebar__logo" style={{ background: 'transparent', boxShadow: 'none', width: 'auto', height: 'auto' }}>
            <img src={logoImg} alt="LeMaS" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
          </div>
          <div>
            <p className="sidebar__app-name">LeMaS</p>
            <p className="sidebar__app-sub">Learning Management System</p>
          </div>
        </div>

        <nav className="sidebar__nav">
          <button className={cls("dashboard")} onClick={() => nav("dashboard")}>
            <span className="material-symbols-outlined">home</span>
            Beranda
          </button>
          <button className={cls("daftarMataKuliah")} onClick={() => nav("daftarMataKuliah")}>
            <span className="material-symbols-outlined">menu_book</span>
            Mata Kuliah
          </button>
          <button className={cls("daftarTugas")} onClick={() => nav("daftarTugas")}>
            <span className="material-symbols-outlined">assignment</span>
            Tugas
          </button>
          <button className={cls("presensi")} onClick={() => nav(presRoute)}>
            <span className="material-symbols-outlined">how_to_reg</span>
            Presensi
          </button>
          <button className={cls("nilai")} onClick={() => nav("nilai")}>
            <span className="material-symbols-outlined">grade</span>
            Nilai
          </button>
          <button className={cls("forumDiskusi")} onClick={() => nav("forumDiskusi")}>
            <span className="material-symbols-outlined">forum</span>
            Diskusi
          </button>
          <button className={cls("profile")} onClick={() => nav("profile")}>
            <span className="material-symbols-outlined">account_circle</span>
            Profil
          </button>
        </nav>

        <div className="sidebar__footer">
          <button
            className="sidebar__logout-btn"
            onClick={() => { if (onLogout) onLogout(); }}
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
