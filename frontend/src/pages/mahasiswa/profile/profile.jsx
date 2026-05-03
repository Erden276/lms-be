import React, { useState } from "react";
import "../../../shared.css";
import "./profile.css";
import Sidebar from "../../../Sidebar";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";
import { apiClient } from "../../../utils/apiClient";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlRblArhYvkrSWfEx3UWaIaP5bdg8OpReWzF-sc4sB_2K3sC4IYv7Q4-lWy6VUtGhc5esYpVi12_HYjLZdjx6ILoT60xad1GfsEtHStVQIigk44gnAXnpEAjWrPWVYNa_AKdaDPqXQwdlJDbcccdQ96CZrZ6btx50rBBy3LvfY-eINJ1MtiJWLJpWBAo2nnbaNr3i-_Yn3B_BsVkOxpG3hVSKt38J2-NxnAah9LFYcNLvZARv4lzr86P24cdV4haCMW80Nudw5Lku";

export default function Profile({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const storedUserStr = localStorage.getItem("user");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : {};

  const [formData, setFormData] = useState({
    email: storedUser.email || "firman.ajah@gimana.com",
    telepon: storedUser.telepon || "081234567890",
  });
  const [pwForm, setPwForm] = useState({ old: "", newPw: "", confirm: "" });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async () => {
    if (!storedUser.nomorInduk) return;
    setIsSaving(true);
    try {
      await apiClient.patch(`/api/users/${storedUser.nomorInduk}`, formData);
      
      // Update local storage
      const updatedUser = { ...storedUser, ...formData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      setEditMode(false);
      showToast("success", "Data profil berhasil diperbarui.");
    } catch (error) {
      showToast("error", "Gagal memperbarui profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (!pwForm.old || !pwForm.newPw || !pwForm.confirm) {
      showToast("error", "Semua kolom wajib diisi.");
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      showToast("error", "Kata sandi baru tidak cocok.");
      return;
    }
    
    try {
      await apiClient.patch(`/api/users/${storedUser.nomorInduk}`, { password: pwForm.newPw });
      setShowPasswordModal(false);
      setPwForm({ old: "", newPw: "", confirm: "" });
      showToast("success", "Kata sandi berhasil diubah.");
    } catch (error) {
      showToast("error", "Gagal mengubah kata sandi.");
    }
  };

  return (
    <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
      {/* Toast */}
      {toast && (
        <div className={`prf-toast prf-toast--${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === "success" ? "check_circle" : toast.type === "info" ? "info" : "error"}
          </span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="prf-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="prf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prf-modal-header">
              <h3>Ubah Kata Sandi</h3>
              <button className="prf-modal-close" onClick={() => setShowPasswordModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handlePwSubmit} className="prf-modal-body">
              <div className="prf-field">
                <label className="prf-label">Kata Sandi Lama</label>
                <input
                  className="prf-input"
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.old}
                  onChange={(e) => setPwForm({ ...pwForm, old: e.target.value })}
                />
              </div>
              <div className="prf-field">
                <label className="prf-label">Kata Sandi Baru</label>
                <input
                  className="prf-input"
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.newPw}
                  onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                />
              </div>
              <div className="prf-field">
                <label className="prf-label">Konfirmasi Kata Sandi</label>
                <input
                  className="prf-input"
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                />
              </div>
              <div className="prf-modal-actions">
                <button type="button" className="prf-btn-cancel" onClick={() => setShowPasswordModal(false)}>
                  Batal
                </button>
                <button type="submit" className="prf-btn-save">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar onNavigate={onNavigate} onLogout={onLogout} activePage="profile" mobileOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main */}
      <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
        {/* Navbar */}
        <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} onNavigate={typeof nav !== "undefined" ? nav : (typeof onNavigate !== "undefined" ? onNavigate : undefined)} />

        <div className="page-content">
          {/* ── Hero Identity Card ── */}
          <div className="prf-identity-card">
            <div className="prf-avatar-wrap">
              <img src={AVATAR} alt="Foto Profil Mahasiswa" className="prf-avatar" />
              <button className="prf-avatar-edit" title="Ganti foto" onClick={() => showToast("info", "Fitur ganti foto akan segera tersedia.")}>
                <span className="material-symbols-outlined">photo_camera</span>
              </button>
            </div>
            <div className="prf-identity-info">
              <h1 className="prf-name">{storedUser.nama || "Moch Firmansyah"}</h1>
              <div className="prf-identity-meta">
                <span className="prf-nim-badge">NIM: {storedUser.nomorInduk || "20240901002"}</span>
                <span className="prf-verified">
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "#059669" }}>verified</span>
                  Akun Terverifikasi
                </span>
              </div>
            </div>
          </div>

          {/* ── Data + Security Row ── */}
          <div className="prf-main-row">
            {/* Data Pribadi */}
            <div className="prf-data-card">
              <div className="prf-data-header">
                <div className="prf-data-title">
                  <span className="material-symbols-outlined" style={{ color: "var(--color-secondary)", fontSize: "1.25rem" }}>
                    id_card
                  </span>
                  <h2>Data Pribadi</h2>
                </div>
                {editMode ? (
                  <div className="prf-edit-actions">
                    <button className="prf-btn-cancel-sm" onClick={() => setEditMode(false)} disabled={isSaving}>Batal</button>
                    <button className="prf-btn-save-sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>
                ) : (
                  <button className="prf-sunting-btn" onClick={() => setEditMode(true)}>
                    Sunting Data
                  </button>
                )}
              </div>

              <div className="prf-data-grid">
                <div className="prf-data-field">
                  <p className="prf-field-label">EMAIL MAHASISWA</p>
                  {editMode ? (
                    <input
                      className="prf-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  ) : (
                    <p className="prf-field-value">{formData.email}</p>
                  )}
                </div>
                <div className="prf-data-field">
                  <p className="prf-field-label">NOMOR TELEPON</p>
                  {editMode ? (
                    <input
                      className="prf-input"
                      value={formData.telepon}
                      onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    />
                  ) : (
                    <p className="prf-field-value">{formData.telepon}</p>
                  )}
                </div>
              </div>

              <div className="prf-data-field prf-fullwidth">
                <p className="prf-field-label">PROGRAM STUDI</p>
                <p className="prf-field-value prf-prodi">Teknik Informatika - Rekayasa Perangkat Lunak</p>
              </div>

              <div className="prf-data-grid prf-data-grid--3">
                <div className="prf-data-field">
                  <p className="prf-field-label">SEMESTER</p>
                  <p className="prf-field-value">
                    Semester 4 (Genap)
                    <span className="prf-reguler-badge">REGULER</span>
                  </p>
                </div>
                <div className="prf-data-field">
                  <p className="prf-field-label">TAHUN AKADEMIK</p>
                  <p className="prf-field-value">2023/2024</p>
                </div>
              </div>
            </div>

            {/* Keamanan */}
            <div className="prf-security-card">
              <div className="prf-security-header">
                <span className="material-symbols-outlined prf-shield-icon">security</span>
                <h2>Keamanan</h2>
              </div>
              <p className="prf-security-desc">
                Jaga keamanan akun Anda dengan memperbarui kata sandi secara berkala.
                Pastikan menggunakan kombinasi karakter yang kuat.
              </p>
              <button className="prf-pw-btn" onClick={() => setShowPasswordModal(true)}>
                <span className="material-symbols-outlined">lock_reset</span>
                Ubah Kata Sandi
              </button>
              <p className="prf-last-changed">Terakhir diubah 3 bulan yang lalu</p>
            </div>
          </div>

          {/* ── Bottom Cards ── */}
          <div className="prf-bottom-row">
            {/* Status Akademik */}
            <div className="prf-status-card">
              <div className="prf-status-bg-icon">
                <span className="material-symbols-outlined">school</span>
              </div>
              <h3 className="prf-status-title">Status Akademik</h3>
              <p className="prf-status-desc">
                Anda telah menyelesaikan 64 SKS dari total 144 SKS yang direncanakan.
              </p>
              <div className="prf-status-bar-track">
                <div className="prf-status-bar-fill" style={{ width: "44%" }}></div>
              </div>
              <p className="prf-status-pct">44% Terpenuhi · 64 / 144 SKS</p>
            </div>

            {/* Notifikasi Penting */}
            <div className="prf-notif-card">
              <div className="prf-notif-bg-icon">
                <span className="material-symbols-outlined">notifications_active</span>
              </div>
              <h3 className="prf-notif-title">Notifikasi Penting</h3>
              <p className="prf-notif-desc">
                Pengisian KRS Semester Ganjil 2024/2025 akan segera dibuka.
              </p>
              <button className="prf-notif-link" onClick={() => onNavigate && onNavigate("nilai")}>
                Lihat Detail →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
