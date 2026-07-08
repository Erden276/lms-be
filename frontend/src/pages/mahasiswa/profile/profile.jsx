import React, { useState, useRef, useEffect, useCallback } from "react";
import "../../../components/shared.css";
import "./profile.css";
import Sidebar from "../../../components/Sidebar";
import { useSidebar } from "../../../components/useSidebar";
import Navbar from "../../../components/Navbar";
import { apiClient } from "../../../utils/apiClient";

const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlRblArhYvkrSWfEx3UWaIaP5bdg8OpReWzF-sc4sB_2K3sC4IYv7Q4-lWy6VUtGhc5esYpVi12_HYjLZdjx6ILoT60xad1GfsEtHStVQIigk44gnAXnpEAjWrPWVYNa_AKdaDPqXQwdlJDbcccdQ96CZrZ6btx50rBBy3LvfY-eINJ1MtiJWLJpWBAo2nnbaNr3i-_Yn3B_BsVkOxpG3hVSKt38J2-NxnAah9LFYcNLvZARv4lzr86P24cdV4haCMW80Nudw5Lku";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Profile({ onNavigate, onLogout }) {
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

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/api/profile/me');
        if (res?.data) {
          const d = res.data;
          if (d.fotoUrl) {
            setAvatarUrl(`${API_BASE}${d.fotoUrl}`);
          }
          setFormData({
            email: d.email || storedUser.email || "",
            telepon: d.telepon || storedUser.telepon || "",
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
    if (!storedUser.nomorInduk) return;
    setIsSaving(true);
    try {
      // Gunakan endpoint /api/profile/me untuk update data sendiri
      await apiClient.patch('/api/profile/me', formData);
      
      const updatedUser = { ...storedUser, ...formData };
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
      setShowPw({ old: false, new: false, confirm: false });
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
      const formData = new FormData();
      formData.append('photo', photoFile);
      const res = await apiClient.post('/api/profile/photo', formData);
      if (res?.data?.fotoUrl) {
        setAvatarUrl(`${API_BASE}${res.data.fotoUrl}`);
        // Update localStorage
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
              <div className="prf-field prf-field--pw">
                <label className="prf-label">Kata Sandi Lama</label>
                <div className="prf-pw-input-wrap">
                  <input
                    className="prf-input prf-input--pw"
                    type={showPw.old ? "text" : "password"}
                    placeholder="••••••••"
                    value={pwForm.old}
                    onChange={(e) => setPwForm({ ...pwForm, old: e.target.value })}
                  />
                  <button
                    type="button"
                    className="prf-pw-toggle"
                    onClick={() => setShowPw({ ...showPw, old: !showPw.old })}
                  >
                    <span className="material-symbols-outlined">{showPw.old ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div className="prf-field prf-field--pw">
                <label className="prf-label">Kata Sandi Baru</label>
                <div className="prf-pw-input-wrap">
                  <input
                    className="prf-input prf-input--pw"
                    type={showPw.new ? "text" : "password"}
                    placeholder="••••••••"
                    value={pwForm.newPw}
                    onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                  />
                  <button
                    type="button"
                    className="prf-pw-toggle"
                    onClick={() => setShowPw({ ...showPw, new: !showPw.new })}
                  >
                    <span className="material-symbols-outlined">{showPw.new ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div className="prf-field prf-field--pw">
                <label className="prf-label">Konfirmasi Kata Sandi</label>
                <div className="prf-pw-input-wrap">
                  <input
                    className="prf-input prf-input--pw"
                    type={showPw.confirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  />
                  <button
                    type="button"
                    className="prf-pw-toggle"
                    onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                  >
                    <span className="material-symbols-outlined">{showPw.confirm ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
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
              {/* Preview area */}
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

              {/* Action buttons */}
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

      {/* Sidebar */}
      <Sidebar onNavigate={onNavigate} onLogout={onLogout} activePage="profile" mobileOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main */}
      <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
        <Navbar role="Mahasiswa" onOpenSidebar={openSidebar} onNavigate={onNavigate} />

        <div className="page-content">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="skeleton-card" style={{ height: '140px', borderRadius: '1rem' }}></div>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div className="skeleton-card" style={{ flex: '1 1 300px', height: '250px', borderRadius: '1rem' }}></div>
                <div className="skeleton-card" style={{ flex: '1 1 300px', height: '250px', borderRadius: '1rem' }}></div>
              </div>
            </div>
          ) : (
            <>
              {/* Identity Card */}
              <div className="prf-identity-card">
                <div className="prf-avatar-wrap">
                  <img src={avatarUrl} alt="Foto Profil Mahasiswa" className="prf-avatar" onError={(e) => { e.target.src = DEFAULT_AVATAR; }} />
                  <button className="prf-avatar-edit" title="Ganti foto" onClick={() => setShowPhotoModal(true)}>
                    <span className="material-symbols-outlined">photo_camera</span>
                  </button>
                </div>
                <div className="prf-identity-info">
                  <h1 className="prf-name">{storedUser.nama || "Mahasiswa"}</h1>
                  <div className="prf-identity-meta">
                    <span className="prf-nim-badge">NIM: {storedUser.nomorInduk || "-"}</span>
                    <span className="prf-verified">
                      <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "#059669" }}>verified</span>
                      Akun Terverifikasi
                    </span>
                  </div>
                </div>
              </div>

              {/* Data + Security Row */}
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
                  </div>

                  <div className="prf-data-grid">
                    <div className="prf-data-field">
                      <p className="prf-field-label">EMAIL MAHASISWA</p>
                      <p className="prf-field-value">{formData.email}</p>
                    </div>
                    <div className="prf-data-field">
                      <p className="prf-field-label">NOMOR TELEPON</p>
                      <p className="prf-field-value">{formData.telepon}</p>
                    </div>
                  </div>
                  <div className="prf-admin-notice">
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "#7c5800" }}>info</span>
                    <p>Untuk mengubah data pribadi, ajukan permintaan ke <strong>administrator akademik</strong>.</p>
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
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
