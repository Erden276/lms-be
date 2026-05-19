import { useState } from "react";
import "./login.css";
import { apiClient } from "../../../utils/apiClient";
import logoImg from "../../../assets/logo.png";
import LoadingSpinner from "../../../components/LoadingSpinner";

function Login({ onLogin, onFaq }) {
  const [role, setRole] = useState("Mahasiswa");
  const [showPassword, setShowPassword] = useState(false);
  const [nomorInduk, setNomorInduk] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState(null); // 'privasi' | 'syarat' | null

  if (isLoading) {
    return <LoadingSpinner message="Menghubungkan ke sistem..." fullPage={true} />;
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const data = await apiClient.post("/api/auth/login", {
        nomorInduk: nomorInduk,
        password: password,
        role: role,
      }, { skipAuthRedirect: true });

      // 1. Simpan token JWT ke localStorage untuk sesi
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      // 2. Beritahu App component bahwa login berhasil
      if (onLogin) {
        const rawRole = data.data.user.role || role;
        const formattedRole =
          rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
        onLogin(formattedRole);
      }
    } catch (err) {
      setErrorMsg(err.message || "Gagal melakukan login");
    } finally {
      setIsLoading(false);
    }
  };

  const MODAL_CONTENT = {
    privasi: {
      title: "Kebijakan Privasi",
      icon: "shield",
      sections: [
        {
          heading: "Data yang Kami Kumpulkan",
          body: "Kami mengumpulkan data yang diperlukan untuk keperluan akademik, meliputi: nama lengkap, nomor induk (NIM/NIP), alamat email, nomor telepon, serta data aktivitas pembelajaran seperti catatan presensi, nilai, dan pengumpulan tugas.",
        },
        {
          heading: "Tujuan Penggunaan Data",
          body: "Data yang dikumpulkan digunakan semata-mata untuk: pengelolaan administrasi akademik, komunikasi resmi antara kampus dan civitas akademika, serta evaluasi dan peningkatan kualitas pembelajaran.",
        },
        {
          heading: "Penyimpanan & Keamanan",
          body: "Seluruh data disimpan di server kampus yang terlindungi. Kami menggunakan enkripsi dan autentikasi token (JWT) untuk menjaga keamanan akses. Data tidak dibagikan kepada pihak ketiga di luar institusi.",
        },
        {
          heading: "Hak Pengguna",
          body: "Pengguna berhak mengajukan permintaan koreksi atau pembaruan data pribadi melalui administrator akademik kampus. Akun yang tidak aktif akan dinonaktifkan sesuai kebijakan institusi.",
        },
      ],
    },
    syarat: {
      title: "Syarat & Ketentuan",
      icon: "gavel",
      sections: [
        {
          heading: "Kepemilikan Akun",
          body: "Akun LeMaS bersifat pribadi dan tidak boleh dipinjamkan, dibagikan, atau digunakan oleh orang lain. Pengguna bertanggung jawab penuh atas seluruh aktivitas yang dilakukan menggunakan akunnya.",
        },
        {
          heading: "Penggunaan yang Dilarang",
          body: "Pengguna dilarang: menyebarkan konten yang tidak pantas atau melanggar hukum, melakukan manipulasi data presensi atau nilai, menyalahgunakan hak akses yang diberikan, serta mengganggu kenyamanan pengguna lain di forum diskusi.",
        },
        {
          heading: "Tanggung Jawab Akademik",
          body: "Pengumpulan tugas, kehadiran, dan partisipasi dalam forum adalah tanggung jawab masing-masing pengguna. Keterlambatan atau kelalaian tidak dapat diklaim sebagai kesalahan sistem kecuali terbukti terjadi gangguan teknis.",
        },
        {
          heading: "Konten & Hak Cipta",
          body: "Seluruh materi perkuliahan yang diunggah oleh dosen merupakan hak cipta institusi dan/atau pengajar yang bersangkutan. Dilarang mendistribusikan materi di luar platform tanpa izin tertulis.",
        },
        {
          heading: "Sanksi Pelanggaran",
          body: "Pelanggaran terhadap syarat penggunaan dapat mengakibatkan peringatan, pembatasan fitur, hingga penonaktifan akun secara permanen oleh administrator, sesuai dengan tingkat pelanggaran yang dilakukan.",
        },
      ],
    },
  };

  return (
    <main className="login-main">
      {/* Background Elements */}
      <div className="bg-gradient-overlay"></div>
      <div className="circle-decoration-1"></div>
      <div className="circle-decoration-2"></div>

      <div className="login-container">
        {/* Login Card */}
        <div className="login-card">
          {/* Logo & Branding */}
          <div className="brand-header">
            <div className="logo-container-wrapper">
              <div className="logo-box">
                <img src={logoImg} alt="LeMaS Logo" className="logo-img" />
              </div>
            </div>
            <h2 className="welcome-text">LeMaS</h2>
            <p className="welcome-subtext">
              Learning Management System
            </p>
          </div>

          {/* Role Toggle */}
          <div className="role-toggle">
            <button
              onClick={() => setRole("Mahasiswa")}
              className={`role-button ${role === "Mahasiswa" ? "active" : ""}`}
            >
              Mahasiswa
            </button>
            <button
              onClick={() => setRole("Dosen")}
              className={`role-button ${role === "Dosen" ? "active" : ""}`}
            >
              Dosen
            </button>
          </div>

          <form className="login-form" onSubmit={handleLoginSubmit}>
            {errorMsg && (
              <div
                style={{
                  color: "#d32f2f",
                  marginBottom: "1rem",
                  fontSize: "14px",
                  textAlign: "center",
                  backgroundColor: "#ffebee",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #ef5350",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>error</span>
                {errorMsg}
              </div>
            )}
            {/* Input Field: Nomor Induk */}
            <div className="form-group">
              <label htmlFor="id_number">Nomor Induk</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">
                  person
                </span>
                <input
                  className="input-field"
                  id="id_number"
                  placeholder="Contoh: 2106001234"
                  type="text"
                  value={nomorInduk}
                  onChange={(e) => setNomorInduk(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input Field: Kata Sandi */}
            <div className="form-group">
              <div className="form-group-header">
                <label htmlFor="password">Kata Sandi</label>
              </div>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">
                  lock
                </span>
                <input
                  className="input-field"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  type="button"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Primary Button */}
            <button
              className="submit-button"
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? "Memproses..." : "Masuk"}</span>
              {!isLoading && (
                <span className="material-symbols-outlined">arrow_forward</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="footer">
          <div className="footer-links">
            <a href="#" onClick={(e) => { e.preventDefault(); onFaq && onFaq(); }}>Bantuan</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setModal("privasi"); }}>Privasi</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setModal("syarat"); }}>Syarat</a>
          </div>
        </div>

        {/* Modal Privasi / Syarat */}
        {modal && (
          <div className="lm-modal-overlay" onClick={() => setModal(null)}>
            <div className="lm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="lm-modal-header">
                <div className="lm-modal-title">
                  <span className="material-symbols-outlined lm-modal-icon">{MODAL_CONTENT[modal].icon}</span>
                  <h3>{MODAL_CONTENT[modal].title}</h3>
                </div>
                <button className="lm-modal-close" onClick={() => setModal(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="lm-modal-body">
                {MODAL_CONTENT[modal].sections.map((sec, i) => (
                  <div key={i} className="lm-modal-section">
                    <h4>{sec.heading}</h4>
                    <p>{sec.body}</p>
                  </div>
                ))}
              </div>
              <div className="lm-modal-footer">
                <p>© {new Date().getFullYear()} LeMaS – Learning Management System Kelompok 8</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default Login;
