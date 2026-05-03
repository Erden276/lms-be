import React, { useState, useEffect } from "react";
import "../../../shared.css";
import "../../mahasiswa/profile/profile.css";
import "./dosenProfile.css";
import SidebarDosen from "../../../SidebarDosen";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";
import { apiClient } from "../../../utils/apiClient";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjoXu55KCdSSPl-2t0t7d2EH6gux6Xz8nZaCdXHePrj-gGn1ZWZyBoOucWc2yVgrhmNFyy8cKbxWH8i9Wm5VKkpqX9jraXjkHTr8PVU1oN3V4nkzLWUUm6nyAIS3hGDic_uY0YoNLNNZluKTKqFwJb2gYlRl9eATGdlXClTx6IXpYvk-2u1qqvfUGTzs-QJPlXTouWTyNYzTe8j8mS09evVA_aHTYfHxneVwUsb2jUygYzuAIDU5KwqO2kISzLvnzaTentePscoGoo";

export default function DosenProfile({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const storedUserStr = localStorage.getItem("user");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : {};

  const [formData, setFormData] = useState({
    email: storedUser.email || "",
    telepon: storedUser.telepon || "",
    bidang: "",
    officeRoom: "",
  });
  const [profileData, setProfileData] = useState({
    nama: storedUser.nama || "Dosen",
    nidn: storedUser.nomorInduk || "-",
  });
  const [pwForm, setPwForm] = useState({ old: "", newPw: "", confirm: "" });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/api/dosen/profile/profile');
        if (res && res.data) {
          const d = res.data;
          setProfileData({
            nama: d.nama || storedUser.nama || "Dosen",
            nidn: d.nidn || storedUser.nomorInduk || "-",
          });
          setFormData({
            email: d.email || storedUser.email || "",
            telepon: d.telepon || storedUser.telepon || "",
            bidang: d.bidang || "",
            officeRoom: d.officeRoom || "",
          });
        }
      } catch (error) {
        console.error("Gagal memuat profil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put('/api/dosen/profile/profile', formData);
      // Update localStorage too
      const updatedUser = { ...storedUser, email: formData.email, telepon: formData.telepon };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setEditMode(false);
      showToast("success", "Data profil berhasil diperbarui.");
    } catch (error) {
      showToast("error", error.message || "Gagal memperbarui profil.");
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
      await apiClient.post('/api/dosen/profile/profile/change-password', {
        old: pwForm.old,
        newPw: pwForm.newPw,
      });
      setShowPasswordModal(false);
      setPwForm({ old: "", newPw: "", confirm: "" });
      showToast("success", "Kata sandi berhasil diubah.");
    } catch (error) {
      showToast("error", error.message || "Gagal mengubah kata sandi.");
    }
  };

  return (
    <div
      className="page-shell"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {toast && (
        <div className={`prf-toast prf-toast--${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{toast.msg}</span>
        </div>
      )}

      {showPasswordModal && (
        <div
          className="prf-modal-overlay"
          onClick={() => setShowPasswordModal(false)}
        >
          <div className="prf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prf-modal-header">
              <h3>Ubah Kata Sandi</h3>
              <button
                className="prf-modal-close"
                onClick={() => setShowPasswordModal(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handlePwSubmit} className="prf-modal-body">
              {[
                ["Kata Sandi Lama", "old"],
                ["Kata Sandi Baru", "newPw"],
                ["Konfirmasi Kata Sandi", "confirm"],
              ].map(([label, key]) => (
                <div key={key} className="prf-field">
                  <label className="prf-label">{label}</label>
                  <input
                    className="prf-input"
                    type="password"
                    placeholder="••••••••"
                    value={pwForm[key]}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
              <div className="prf-modal-actions">
                <button
                  type="button"
                  className="prf-btn-cancel"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="prf-btn-save">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SidebarDosen
        onNavigate={onNavigate}
        onLogout={onLogout}
        activePage="dosenProfile"
        mobileOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <main
        className="page-main"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <Navbar role="Dosen" onOpenSidebar={openSidebar} onNavigate={typeof nav !== "undefined" ? nav : (typeof onNavigate !== "undefined" ? onNavigate : undefined)} />

        <div className="page-content">
          {/* Identity Card */}
          <div className="prf-identity-card dprf-identity-card">
            <div className="prf-avatar-wrap">
              <img
                src={AVATAR}
                alt="Foto Profil Dosen"
                className="prf-avatar"
              />
              <button className="prf-avatar-edit" title="Ganti foto">
                <span className="material-symbols-outlined">photo_camera</span>
              </button>
            </div>
            <div className="prf-identity-info">
              <h1 className="prf-name">{profileData.nama}</h1>
              <div className="prf-identity-meta">
                <span className="prf-nim-badge dprf-nidn-badge">
                  NIDN: {profileData.nidn}
                </span>
                <span className="prf-verified">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "1rem", color: "#059669" }}
                  >
                    verified
                  </span>
                  Akun Terverifikasi
                </span>
              </div>
              <div className="dprf-tags">
                <span className="dprf-tag">Dosen Tetap</span>
                <span className="dprf-tag dprf-tag--teal">S3 Informatika</span>
              </div>
            </div>
          </div>

          {/* Data + Security */}
          <div className="prf-main-row">
            <div className="prf-data-card">
              <div className="prf-data-header">
                <div className="prf-data-title">
                  <span
                    className="material-symbols-outlined"
                    style={{
                      color: "var(--color-secondary)",
                      fontSize: "1.25rem",
                    }}
                  >
                    id_card
                  </span>
                  <h2>Data Pribadi</h2>
                </div>
                {editMode ? (
                  <div className="prf-edit-actions">
                    <button
                      className="prf-btn-cancel-sm"
                      onClick={() => setEditMode(false)}
                      disabled={isSaving}
                    >
                      Batal
                    </button>
                    <button className="prf-btn-save-sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>
                ) : (
                  <button
                    className="prf-sunting-btn"
                    onClick={() => setEditMode(true)}
                  >
                    Sunting Data
                  </button>
                )}
              </div>

              <div className="prf-data-grid">
                <div className="prf-data-field">
                  <p className="prf-field-label">EMAIL INSTITUSI</p>
                  {editMode ? (
                    <input
                      className="prf-input"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, telepon: e.target.value })
                      }
                    />
                  ) : (
                    <p className="prf-field-value">{formData.telepon}</p>
                  )}
                </div>
              </div>

              <div className="prf-data-field prf-fullwidth">
                <p className="prf-field-label">BIDANG KEAHLIAN</p>
                {editMode ? (
                  <input
                    className="prf-input"
                    value={formData.bidang}
                    onChange={(e) =>
                      setFormData({ ...formData, bidang: e.target.value })
                    }
                  />
                ) : (
                  <p className="prf-field-value prf-prodi">{formData.bidang}</p>
                )}
              </div>

              <div className="prf-data-grid prf-data-grid--3">
                <div className="prf-data-field">
                  <p className="prf-field-label">RUANG KANTOR</p>
                  {editMode ? (
                    <input
                      className="prf-input"
                      value={formData.officeRoom}
                      onChange={(e) =>
                        setFormData({ ...formData, officeRoom: e.target.value })
                      }
                    />
                  ) : (
                    <p className="prf-field-value">{formData.officeRoom}</p>
                  )}
                </div>
                <div className="prf-data-field">
                  <p className="prf-field-label">TAHUN AKADEMIK</p>
                  <p className="prf-field-value">2023/2024</p>
                </div>
              </div>
            </div>

            <div className="prf-security-card">
              <div className="prf-security-header">
                <span className="material-symbols-outlined prf-shield-icon">
                  security
                </span>
                <h2>Keamanan</h2>
              </div>
              <p className="prf-security-desc">
                Jaga keamanan akun Anda dengan memperbarui kata sandi secara
                berkala.
              </p>
              <button
                className="prf-pw-btn"
                onClick={() => setShowPasswordModal(true)}
              >
                <span className="material-symbols-outlined">lock_reset</span>
                Ubah Kata Sandi
              </button>
              <p className="prf-last-changed">
                Terakhir diubah 2 bulan yang lalu
              </p>
            </div>
          </div>

          {/* Mata Kuliah Diampu + Statistik */}
          <div className="prf-bottom-row">
            <div className="dprf-matkul-card">
              <div className="dprf-matkul-icon">
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <h3 className="dprf-matkul-title">Mata Kuliah Diampu</h3>
              <div className="dprf-matkul-list">
                {[
                  { name: "Sistem Operasi", code: "IF001", sks: 3 },
                  { name: "Basis Data Terdistribusi", code: "IF002", sks: 3 },
                  { name: "Metodologi Penelitian", code: "IF003", sks: 2 },
                ].map((mk) => (
                  <div key={mk.code} className="dprf-matkul-row">
                    <div>
                      <p className="dprf-mk-name">{mk.name}</p>
                      <p className="dprf-mk-code">
                        {mk.code} · {mk.sks} SKS
                      </p>
                    </div>
                    <span className="dprf-mk-badge">Aktif</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dprf-stats-card">
              <div className="dprf-stats-icon">
                <span className="material-symbols-outlined">bar_chart</span>
              </div>
              <h3 className="dprf-stats-title">Statistik Pengajaran</h3>
              {[
                { label: "Total Mahasiswa Aktif", value: 1248, icon: "group" },
                { label: "Tugas Diberikan", value: 24, icon: "assignment" },
                {
                  label: "Rata-rata Presensi",
                  value: "94.2%",
                  icon: "how_to_reg",
                },
              ].map((s) => (
                <div key={s.label} className="dprf-stat-row">
                  <span className="material-symbols-outlined dprf-stat-icon">
                    {s.icon}
                  </span>
                  <div>
                    <p className="dprf-stat-lbl">{s.label}</p>
                    <p className="dprf-stat-val">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
