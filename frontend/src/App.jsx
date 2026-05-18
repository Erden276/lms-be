import { useState } from "react";
import Login from "./pages/auth/login/login";
import Dashboard from "./pages/mahasiswa/dashboard/dashboard";
import DashboardDosen from "./pages/dosen/dashboardDosen/dashboardDosen";
import DaftarMataKuliah from "./pages/mahasiswa/daftarMataKuliah/daftarMataKuliah";
import MataKuliah from "./pages/mahasiswa/mataKuliah/mataKuliah";
import DaftarTugas from "./pages/mahasiswa/daftarTugas/daftarTugas";
import Kuis from "./pages/mahasiswa/kuis/kuis";
import HasilKuis from "./pages/mahasiswa/kuis/hasilKuis";
import PresensiMahasiswa from "./pages/mahasiswa/presensiMahasiswa/presensiMahasiswa";
import ForumDiskusi from "./pages/mahasiswa/forumDiskusi/forumDiskusi";
import Profile from "./pages/mahasiswa/profile/profile";
import Nilai from "./pages/mahasiswa/nilai/nilai";
import PengumpulanTugas from "./pages/mahasiswa/pengumpulanTugas/pengumpulanTugas";

// Dosen-specific pages
import DosenPresensi from "./pages/dosen/dosenPresensi/dosenPresensi";
import DosenTugas from "./pages/dosen/dosenTugas/dosenTugas";
import DosenKelompok from "./pages/dosen/dosenKelompok/dosenKelompok";
import DosenNilaiIndividu from "./pages/dosen/dosenNilaiIndividu/dosenNilaiIndividu";
import DosenForum from "./pages/dosen/dosenForum/dosenForum";
import DosenProfile from "./pages/dosen/dosenProfile/dosenProfile";
import DosenMateri from "./pages/dosen/dosenMateri/dosenMateri";
import FAQ from "./pages/faq/faq";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [currentPage, setCurrentPage] = useState({ page: "dashboard" });
  const [showFaq, setShowFaq] = useState(false);

  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setCurrentPage({ page: role === "Dosen" ? "dosenDashboard" : "dashboard" });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole("");
    setCurrentPage({ page: "dashboard" });
  };

  const navigateTo = (target) => {
    if (typeof target === "string") {
      setCurrentPage({ page: target });
    } else {
      setCurrentPage(target); // { page: "mataKuliah", id: 1 }
    }
  };

  if (showFaq) {
    return (
      <div>
        <div style={{ padding: "1rem 2rem", background: "#fff", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => setShowFaq(false)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: "#7c5800", fontWeight: 600, fontSize: "0.9rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>arrow_back</span>
            Kembali
          </button>
        </div>
        <FAQ />
      </div>
    );
  }

  if (isLoggedIn) {
    const sharedProps = {
      onNavigate: navigateTo,
      onLogout: handleLogout,
      ...currentPage,
    };
    const pageName = currentPage.page;

    // ── MAHASISWA pages ──
    if (pageName === "daftarMataKuliah")
      return <DaftarMataKuliah {...sharedProps} />;
    if (pageName === "mataKuliah") return <MataKuliah {...sharedProps} />;
    if (pageName === "daftarTugas") return <DaftarTugas {...sharedProps} />;
    if (pageName === "kuis") return <Kuis {...sharedProps} idKuis={currentPage.idKuis} />;
    if (pageName === "hasilKuis") return <HasilKuis {...sharedProps} idKuis={currentPage.idKuis} />;
    if (pageName === "presensiMahasiswa")
      return <PresensiMahasiswa {...sharedProps} />;
    if (pageName === "forumDiskusi") return <ForumDiskusi {...sharedProps} />;
    if (pageName === "profile") return <Profile {...sharedProps} />;
    if (pageName === "nilai") return <Nilai {...sharedProps} />;
    if (pageName === "pengumpulanTugas")
      return <PengumpulanTugas {...sharedProps} taskId={currentPage.taskId} />;

    // ── DOSEN-specific pages ──
    if (pageName === "dosenPresensi") return <DosenPresensi {...sharedProps} />;
    if (pageName === "dosenTugas") return <DosenTugas {...sharedProps} />;
    if (pageName === "dosenKelompok") return <DosenKelompok {...sharedProps} />;
    if (pageName === "dosenNilaiIndividu") return <DosenNilaiIndividu {...sharedProps} />;
    if (pageName === "dosenForum") return <DosenForum {...sharedProps} />;
    if (pageName === "dosenProfile") return <DosenProfile {...sharedProps} />;
    if (pageName === "dosenMateri") return <DosenMateri {...sharedProps} />;
    if (pageName === "faq") return <div><div style={{ padding: "1rem 2rem", background: "#fff", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: "0.75rem" }}><button onClick={() => navigateTo(userRole === "Dosen" ? "dosenDashboard" : "dashboard")} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: "#7c5800", fontWeight: 600, fontSize: "0.9rem" }}><span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>arrow_back</span>Kembali</button></div><FAQ /></div>;

    // Default dashboard per role
    if (userRole === "Mahasiswa") {
      return <Dashboard {...sharedProps} />;
    } else if (userRole === "Dosen") {
      return <DashboardDosen {...sharedProps} />;
    } else {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}
        >
          <h2>Akses role tidak ditemukan.</h2>
          <button
            onClick={handleLogout}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#4b53bc",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Kembali ke Login
          </button>
        </div>
      );
    }
  }

  return (
    <div>
      <Login onLogin={handleLogin} onFaq={() => setShowFaq(true)} />
    </div>
  );
}

export default App;
