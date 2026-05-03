import { useState } from "react";
import "./login.css";

function Login({ onLogin }) {
  const [role, setRole] = useState("Mahasiswa");
  const [showPassword, setShowPassword] = useState(false);
  const [nomorInduk, setNomorInduk] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      // Mengambil URL backend dari environment variable (.env)
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nomorInduk: nomorInduk,
          password: password,
          role: role, // Optional: backend lms-be dapat menerima role jika diperlukan
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal melakukan login");
      }

      // 1. Simpan token JWT ke localStorage untuk sesi
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      // 2. Beritahu App component bahwa login berhasil
      if (onLogin) {
        // Backend mengembalikan role dalam huruf kapital (misal "MAHASISWA" atau "DOSEN")
        // Namun App.jsx mengharapkan format "Mahasiswa" atau "Dosen" (huruf awal kapital)
        const rawRole = data.data.user.role || role;
        const formattedRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
        
        onLogin(formattedRole);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-main">
      {/* Background Elements */}
      <div className="bg-gradient-overlay"></div>
      <div className="circle-decoration-1"></div>
      <div className="circle-decoration-2"></div>

      <div className="login-container">
        {/* Logo & Branding */}
        <div className="brand-header">
          <div className="logo-box">
            <h1 className="logo-text"></h1>
          </div>
          <h2 className="welcome-text">Selamat Datang</h2>
          <p className="welcome-subtext">
            Silakan masuk ke Learning Management System Kelompok 8.
          </p>
        </div>

        {/* Login Card */}
        <div className="login-card">
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

          <form
            className="login-form"
            onSubmit={handleLoginSubmit}
          >
            {errorMsg && (
              <div style={{ color: "red", marginBottom: "1rem", fontSize: "14px", textAlign: "center", backgroundColor: "#ffebee", padding: "8px", borderRadius: "4px" }}>
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
                <a className="forgot-password" href="#">
                  Lupa sandi?
                </a>
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

            {/* Remember Me */}
            <div className="remember-me">
              <input id="remember" type="checkbox" />
              <label htmlFor="remember">Tetap masuk di perangkat ini</label>
            </div>

            {/* Primary Button */}
            <button className="submit-button" type="submit" disabled={isLoading}>
              <span>{isLoading ? "Memproses..." : "Masuk"}</span>
              {!isLoading && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="footer">
          <p className="footer-text">
            Belum memiliki akun?{" "}
            <a className="academic-admin-link" href="#">
              Hubungi Administrasi Akademik
            </a>
          </p>
          <div className="footer-links">
            <a href="#">Bantuan</a>
            <a href="#">Privasi</a>
            <a href="#">Syarat</a>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;
