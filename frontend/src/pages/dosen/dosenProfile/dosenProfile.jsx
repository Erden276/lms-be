import React, { useState, useRef, useEffect, useCallback } from "react";
import "../../../components/shared.css";
import "../../mahasiswa/profile/profile.css";
import "./dosenProfile.css";
import SidebarDosen from "../../../components/SidebarDosen";
import { useSidebar } from "../../../components/useSidebar";
import Navbar from "../../../components/Navbar";
import { apiClient } from "../../../utils/apiClient";

const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjoXu55KCdSSPl-2t0t7d2EH6gux6Xz8nZaCdXHePrj-gGn1ZWZyBoOucWc2yVgrhmNFyy8cKbxWH8i9Wm5VKkpqX9jraXjkHTr8PVU1oN3V4nkzLWUUm6nyAIS3hGDic_uY0YoNLNNZluKTKqFwJb2gYlRl9eATGdlXClTx6IXpYvk-2u1qqvfUGTzs-QJPlXTouWTyNYzTe8j8mS09evVA_aHTYfHxneVwUsb2jUygYzuAIDU5KwqO2kISzLvnzaTentePscoGoo";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function DosenProfile({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const storedUserStr = localStorage.getItem("user");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : {};

  const initialAvatar = storedUser.fotoUrl ? `${API_BASE}${storedUser.fotoUrl}` : DEFAULT_AVATAR;
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);

  const [formData, setFormData] = useState({
    email: storedUser.email || "",
    telepon: storedUser.telepon || "",
    bidang: "",
    officeRoom: "",
  });
  const [profileData, setProfileData] = useState({
    nama: storedUser.nama || "Dosen",
    nidn: storedUser.dosen?.nidn || "-",
  });
  const [mataKuliahList, setMataKuliahList] = useState([]);
  const [stats, setStats] = useState({
    totalMahasiswa: 0,
    tugasDiberikan: 0,
    rataPresensi: "0%"
  });
  const [pwForm, setPwForm] = useState({ old: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({ old: false, new: false, confirm: false });

  // Camera refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const streamRef = useRef(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetch profile data
        const res = await apiClient.get('/api/dosen/profile/profile');
        if (res && res.data) {
          const d = res.data;
          setProfileData({
            nama: d.nama || storedUser.nama || "Dosen",
            nidn: d.nidn || storedUser.dosen?.nidn || "-",
          });
          setFormData({
            email: d.email || storedUser.email || "",
            telepon: d.telepon || storedUser.telepon || "",
            bidang: d.bidang || "",
            officeRoom: d.officeRoom || "",
          });
        }
        // Fetch photo
        const meRes = await apiClient.get('/api/profile/me');
        if (meRes?.data?.fotoUrl) {
          setAvatarUrl(`${API_BASE}${meRes.data.fotoUrl}`);
        }
        
        // Fetch courses taught by this dosen
        const mkRes = await apiClient.get('/api/mata-kuliah');
        setMataKuliahList(Array.isArray(mkRes) ? mkRes : (mkRes.data || []));

        // Fetch stats from dashboard
        const dashRes = await apiClient.get('/api/dosen/dashboard');
        if (dashRes?.stats) {
          setStats({
            totalMahasiswa: dashRes.stats.totalMahasiswa || 0,
            // You can use tugasPending or another metric here, we'll use tugasPending
            tugasDiberikan: dashRes.stats.tugasPending || 0,
            rataPresensi: dashRes.stats.rataPresensi || "0%"
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
    if (pwForm.newPw.length < 6) {
      showToast("error", "Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (!/[A-Z]/.test(pwForm.newPw)) {
      showToast("error", "Kata sandi baru harus mengandung huruf besar.");
      return;
    }
    if (!/[a-z]/.test(pwForm.newPw)) {
      showToast("error", "Kata sandi baru harus mengandung huruf kecil.");
      return;
    }
    if (!/[0-9]/.test(pwForm.newPw)) {
      showToast("error", "Kata sandi baru harus mengandung angka.");
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwForm.newPw)) {
      showToast("error", "Kata sandi baru harus mengandung simbol.");
      return;
    }
    try {
      await apiClient.post('/api/profile/change-password', {
        oldPassword: pwForm.old,
        newPassword: pwForm.newPw,
      });
      setShowPasswordModal(false);
      setPwForm({ old: "", newPw: "", confirm: "" });
      showToast("success", "Kata sandi berhasil diubah.");
    } catch (error) {
      showToast("error", error.message || "Gagal mengubah kata sandi.");
    }
  };

  // === Camera Functions ===
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 }
      });
      streamRef.current = stream;
      setCameraActive(true);
      setPhotoPreview(null);
      setPhotoFile(null);
    } catch (error) {
      showToast("error", "Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.");
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setCameraActive(false);
  };

  const uploadPhoto = async () => {
    if (!photoFile) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('photo', photoFile);
      const res = await apiClient.post('/api/profile/photo', fd);
      if (res?.data?.fotoUrl) {
        setAvatarUrl(`${API_BASE}${res.data.fotoUrl}`);
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        u.fotoUrl = res.data.fotoUrl;
        localStorage.setItem("user", JSON.stringify(u));
      }
      setShowPhotoModal(false);
      setPhotoPreview(null);
      setPhotoFile(null);
      showToast("success", "Foto profil berhasil diperbarui!");
    } catch (error) {
      showToast("error", error.message || "Gagal mengunggah foto.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const closePhotoModal = () => {
    stopCamera();
    setShowPhotoModal(false);
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  return (
    <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
      {toast && (
        <div className={`prf-toast prf-toast--${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === "success" ? "check_circle" : "error"}
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
              {[
                ["Kata Sandi Lama", "old", "old"],
                ["Kata Sandi Baru", "newPw", "new"],
                ["Konfirmasi Kata Sandi", "confirm", "confirm"],
              ].map(([label, key, showKey]) => (
                <div key={key} className="prf-field prf-field--pw">
                  <label className="prf-label">{label}</label>
                  <div className="prf-pw-input-wrap">
                    <input
                      className="prf-input prf-input--pw"
                      type={showPw[showKey] ? "text" : "password"}
                      placeholder="••••••••"
                      value={pwForm[key]}
                      onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                    />
                    <button
                      type="button"
                      className="prf-pw-toggle"
                      onClick={() => setShowPw({ ...showPw, [showKey]: !showPw[showKey] })}
                    >
                      <span className="material-symbols-outlined">{showPw[showKey] ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
              ))}
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

      {/* Photo Upload Modal */}
      {showPhotoModal && (
        <div className="prf-modal-overlay" onClick={closePhotoModal}>
          <div className="prf-modal prf-photo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prf-modal-header">
              <h3>Ganti Foto Profil</h3>
              <button className="prf-modal-close" onClick={closePhotoModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="prf-modal-body prf-photo-body">
              <div className="prf-photo-preview-area">
                {cameraActive ? (
                  <video ref={videoRef} autoPlay playsInline muted className="prf-camera-video" />
                ) : photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="prf-photo-preview-img" />
                ) : (
                  <div className="prf-photo-placeholder">
                    <span className="material-symbols-outlined" style={{ fontSize: "4rem", color: "#94a3b8" }}>person</span>
                    <p>Pilih foto dari file atau ambil dari kamera</p>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="prf-photo-actions">
                {cameraActive ? (
                  <>
                    <button className="prf-photo-btn prf-photo-btn--capture" onClick={capturePhoto}>
                      <span className="material-symbols-outlined">photo_camera</span>
                      Ambil Foto
                    </button>
                    <button className="prf-photo-btn prf-photo-btn--cancel" onClick={stopCamera}>
                      <span className="material-symbols-outlined">close</span>
                      Batal
                    </button>
                  </>
                ) : (
                  <>
                    <button className="prf-photo-btn prf-photo-btn--camera" onClick={startCamera}>
                      <span className="material-symbols-outlined">photo_camera</span>
                      Buka Kamera
                    </button>
                    <button className="prf-photo-btn prf-photo-btn--file" onClick={() => fileInputRef.current?.click()}>
                      <span className="material-symbols-outlined">folder_open</span>
                      Pilih dari File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                  </>
                )}
              </div>
            </div>
            {photoPreview && !cameraActive && (
              <div className="prf-modal-actions" style={{ padding: "0 1.5rem 1.5rem" }}>
                <button className="prf-btn-cancel" onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}>
                  Hapus
                </button>
                <button className="prf-btn-save" onClick={uploadPhoto} disabled={uploadingPhoto}>
                  {uploadingPhoto ? "Mengunggah..." : "Simpan Foto"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <SidebarDosen onNavigate={onNavigate} onLogout={onLogout} activePage="dosenProfile" mobileOpen={sidebarOpen} onClose={closeSidebar} />

      <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
        <Navbar role="Dosen" onOpenSidebar={openSidebar} onNavigate={onNavigate} />

        <div className="page-content">
          {/* Identity Card */}
          <div className="prf-identity-card dprf-identity-card">
            <div className="prf-avatar-wrap">
              <img src={avatarUrl} alt="Foto Profil Dosen" className="prf-avatar" onError={(e) => { e.target.src = DEFAULT_AVATAR; }} />
              <button className="prf-avatar-edit" title="Ganti foto" onClick={() => setShowPhotoModal(true)}>
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
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "#059669" }}>verified</span>
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
                  <span className="material-symbols-outlined" style={{ color: "var(--color-secondary)", fontSize: "1.25rem" }}>id_card</span>
                  <h2>Data Pribadi</h2>
                </div>
              </div>

              <div className="prf-data-grid">
                <div className="prf-data-field">
                  <p className="prf-field-label">EMAIL INSTITUSI</p>
                  <p className="prf-field-value">{formData.email}</p>
                </div>
                <div className="prf-data-field">
                  <p className="prf-field-label">NOMOR TELEPON</p>
                  <p className="prf-field-value">{formData.telepon}</p>
                </div>
              </div>

              <div className="prf-data-field prf-fullwidth">
                <p className="prf-field-label">BIDANG KEAHLIAN</p>
                <p className="prf-field-value prf-prodi">{formData.bidang}</p>
              </div>

              <div className="prf-data-grid prf-data-grid--3">
                <div className="prf-data-field">
                  <p className="prf-field-label">RUANG KANTOR</p>
                  <p className="prf-field-value">{formData.officeRoom}</p>
                </div>
                <div className="prf-data-field">
                  <p className="prf-field-label">TAHUN AKADEMIK</p>
                  <p className="prf-field-value">2023/2024</p>
                </div>
              </div>
              <div className="prf-admin-notice">
                <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "#7c5800" }}>info</span>
                <p>Untuk mengubah data pribadi, ajukan permintaan ke <strong>administrator akademik</strong>.</p>
              </div>
            </div>

            <div className="prf-security-card">
              <div className="prf-security-header">
                <span className="material-symbols-outlined prf-shield-icon">security</span>
                <h2>Keamanan</h2>
              </div>
              <p className="prf-security-desc">
                Jaga keamanan akun Anda dengan memperbarui kata sandi secara berkala.
              </p>
              <button className="prf-pw-btn" onClick={() => setShowPasswordModal(true)}>
                <span className="material-symbols-outlined">lock_reset</span>
                Ubah Kata Sandi
              </button>
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
                {mataKuliahList.length > 0 ? (
                  mataKuliahList.map((mk) => (
                    <div key={mk.idMataKuliah} className="dprf-matkul-row">
                      <div>
                        <p className="dprf-mk-name">{mk.namaMataKuliah}</p>
                        <p className="dprf-mk-code">MK-{mk.idMataKuliah} · 3 SKS</p>
                      </div>
                      <span className="dprf-mk-badge">Aktif</span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "var(--slate-500)", fontSize: "0.875rem" }}>Belum ada mata kuliah yang diampu.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
