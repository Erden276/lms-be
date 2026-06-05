import React, { useState, useRef, useEffect } from "react";
import "../../../components/shared.css";
import "./dosenMateri.css";
import SidebarDosen from "../../../components/SidebarDosen";
import { useSidebar } from "../../../components/useSidebar";
import Navbar from "../../../components/Navbar";
import { apiClient } from "../../../utils/apiClient";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjoXu55KCdSSPl-2t0t7d2EH6gux6Xz8nZaCdXHePrj-gGn1ZWZyBoOucWc2yVgrhmNFyy8cKbxWH8i9Wm5VKkpqX9jraXjkHTr8PVU1oN3V4nkzLWUUm6nyAIS3hGDic_uY0YoNLNNZluKTKqFwJb2gYlRl9eATGdlXClTx6IXpYvk-2u1qqvfUGTzs-QJPlXTouWTyNYzTe8j8mS09evVA_aHTYfHxneVwUsb2jUygYzuAIDU5KwqO2kISzLvnzaTentePscoGoo";

const TIPE_LIST = [
  "PDF",
  "Video",
  "Link",
  "Presentasi",
  "Dokumen",
  "Spreadsheet",
];

function tipeIcon(tipe) {
  const icons = {
    PDF: "picture_as_pdf",
    Video: "play_circle",
    Link: "link",
    Presentasi: "slideshow",
    Dokumen: "description",
    Spreadsheet: "table_chart",
  };
  return icons[tipe] || "insert_drive_file";
}

function tipeColor(tipe) {
  const colors = {
    PDF: "#dc2626",
    Video: "#7c3aed",
    Link: "#0891b2",
    Presentasi: "#c47f17",
    Dokumen: "#4b53bc",
    Spreadsheet: "#059669",
  };
  return colors[tipe] || "#64748b";
}

const INITIAL_MATERI = [];

export default function DosenMateri({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [materi, setMateri] = useState(INITIAL_MATERI);
  const [loading, setLoading] = useState(true);
  const [matkulList, setMatkulList] = useState([]);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState("list"); // "list" | "create" | "edit"
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filterMatkul, setFilterMatkul] = useState("Semua");
  const [filterTipe, setFilterTipe] = useState("Semua");
  const [previewItem, setPreviewItem] = useState(null);
  const fileInputRef = useRef(null);

  const fetchMatkulList = async () => {
    try {
      const res = await apiClient.get("/api/mata-kuliah");
      const data = Array.isArray(res) ? res : res.data || [];
      setMatkulList(
        data.map((mk) => ({ id: mk.idMataKuliah, name: mk.namaMataKuliah })),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const [form, setForm] = useState({
    judul: "",
    tipe: "PDF",
    matkul: 1,
    deskripsi: "",
    url: "",
    file: null,
    canDownload: true,
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMateri = async (
    mkFilter = filterMatkul,
    tpFilter = filterTipe,
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (mkFilter && mkFilter !== "Semua") params.append("matkul", mkFilter);
      if (tpFilter && tpFilter !== "Semua") params.append("tipe", tpFilter);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await apiClient.get(`/api/modul-ajar${query}`);
      const data = Array.isArray(res) ? res : res.data || [];
      if (Array.isArray(data)) {
        setMateri(
          data.map((m) => ({
            id: m.idModulAjar || m.id,
            judul: m.judul,
            tipe: m.tipe_modul || m.tipe,
            matkul: m.idMataKuliah || m.matkul,
            matakuliah:
              m.mataKuliah?.namaMataKuliah || m.matakuliah || "Mata Kuliah",
            deskripsi: m.deskripsi,
            url: m.url,
            ukuran: m.ukuran,
            tanggal: m.tanggal
              ? new Date(m.tanggal).toISOString().slice(0, 10)
              : "",
            diunduh: m.diunduh || 0,
            canDownload: m.canDownload,
            file: null,
          })),
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (mkFilter !== false && tpFilter !== false && arguments[2] !== false) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMatkulList();
    fetchMateri("Semua", "Semua");
  }, []);

  useEffect(() => {
    fetchMateri(filterMatkul, filterTipe);
  }, [filterMatkul, filterTipe]);

  const matakuliahName = (id) =>
    matkulList.find((m) => m.id === id)?.name || id;

  const filtered = materi.filter((m) => {
    const mk =
      filterMatkul === "Semua" || String(m.matkul) === String(filterMatkul);
    const tp = filterTipe === "Semua" || m.tipe === filterTipe;
    return mk && tp;
  });

  const startCreate = () => {
    setForm({
      judul: "",
      tipe: "PDF",
      matkul: matkulList.length > 0 ? matkulList[0].id : 1,
      deskripsi: "",
      url: "",
      file: null,
      canDownload: true,
    });
    setEditId(null);
    setView("create");
  };

  const startEdit = (item) => {
    setForm({
      judul: item.judul,
      tipe: item.tipe,
      matkul: item.matkul,
      deskripsi: item.deskripsi,
      url: item.url || "",
      file: null,
      canDownload: true, // Force to true since restriction is removed
    });
    setEditId(item.id);
    setView("edit");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul.trim()) {
      showToast("Judul materi wajib diisi.", "error");
      return;
    }
    if (form.tipe === "Link" && !form.url.trim()) {
      showToast("URL wajib diisi untuk tipe Link/Video.", "error");
      return;
    }

    try {
      const payload = new FormData();
      payload.append("judul", form.judul);
      payload.append("tipe_modul", form.tipe);
      payload.append("idMataKuliah", form.matkul);
      payload.append("deskripsi", form.deskripsi);
      payload.append("url", form.url);
      payload.append("canDownload", form.canDownload);
      if (form.file) {
        payload.append("file", form.file);
      }

      if (view === "create") {
        await apiClient.post("/api/modul-ajar", payload);
        showToast("Materi berhasil ditambahkan!");
      } else {
        // use URL encoded JSON for PUT instead of FormData if backend doesn't handle multer in PUT
        await apiClient.put(`/api/modul-ajar/${editId}`, {
          judul: form.judul,
          tipe_modul: form.tipe,
          idMataKuliah: form.matkul,
          deskripsi: form.deskripsi,
          url: form.url,
          canDownload: form.canDownload,
        });
        showToast("Materi berhasil diperbarui!");
      }
      fetchMateri();
      setView("list");
    } catch (error) {
      showToast(error.message || "Gagal menyimpan materi", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const currentDeleteId = deleteId;
    
    // Optimistic delete: Close modal and update UI instantly ("satset")
    setDeleteId(null);
    setMateri(prev => prev.filter(m => m.id !== currentDeleteId));
    
    try {
      await apiClient.delete(`/api/modul-ajar/${currentDeleteId}`);
      showToast("Materi dihapus.");
      // Silent background sync
      fetchMateri(filterMatkul, filterTipe, false);
    } catch (error) {
      showToast("Gagal menghapus", "error");
      // Revert UI if fail
      fetchMateri();
    }
  };

  const handleDownload = async (item) => {
    showToast(`Mengunduh: ${item.judul}`);
    try {
      await apiClient.post(`/api/modul-ajar/${item.id}/download`);
      fetchMateri();
    } catch (error) {}
  };

  const needsUrl = form.tipe === "Link" || form.tipe === "Video";
  const needsFile = !needsUrl;

  return (
    <div
      className="page-shell"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Toast */}
      {toast && (
        <div className={`dm-toast dm-toast--${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="dm-overlay" onClick={() => setDeleteId(null)}>
          <div
            className="dm-modal dm-modal--sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dm-modal-icon">
              <span className="material-symbols-outlined">delete_forever</span>
            </div>
            <h3>Hapus Materi?</h3>
            <p>Materi ini akan dihapus permanen dan tidak bisa dikembalikan.</p>
            <div className="dm-modal-actions">
              <button
                className="dm-btn-cancel"
                onClick={() => setDeleteId(null)}
              >
                Batal
              </button>
              <button className="dm-btn-delete" onClick={handleDelete}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="dm-overlay" onClick={() => setPreviewItem(null)}>
          <div
            className="dm-modal dm-modal--preview"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dm-preview-header">
              <div
                className="dm-preview-icon"
                style={{
                  background: `${tipeColor(previewItem.tipe)}18`,
                  color: tipeColor(previewItem.tipe),
                }}
              >
                <span className="material-symbols-outlined">
                  {tipeIcon(previewItem.tipe)}
                </span>
              </div>
              <div>
                <h3 className="dm-preview-title">{previewItem.judul}</h3>
                <p className="dm-preview-sub">
                  {previewItem.matakuliah} · {previewItem.tipe}
                </p>
              </div>
              <button
                className="dm-preview-close"
                onClick={() => setPreviewItem(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="dm-preview-body">
              <div className="dm-preview-info-grid">
                <div className="dm-preview-info-item">
                  <span className="material-symbols-outlined">
                    calendar_today
                  </span>
                  <div>
                    <p className="dm-pi-label">Tanggal Upload</p>
                    <p className="dm-pi-val">{previewItem.tanggal}</p>
                  </div>
                </div>
                {previewItem.ukuran && (
                  <div className="dm-preview-info-item">
                    <span className="material-symbols-outlined">folder</span>
                    <div>
                      <p className="dm-pi-label">Ukuran File</p>
                      <p className="dm-pi-val">{previewItem.ukuran}</p>
                    </div>
                  </div>
                )}
                {previewItem.url && (
                  <div className="dm-preview-info-item">
                    <span className="material-symbols-outlined">link</span>
                    <div>
                      <p className="dm-pi-label">URL</p>
                      <p className="dm-pi-val dm-url-val">{previewItem.url}</p>
                    </div>
                  </div>
                )}
              </div>
              {previewItem.deskripsi && (
                <div className="dm-preview-desc">
                  <p className="dm-pi-label">Deskripsi</p>
                  <p className="dm-preview-desc-text">
                    {previewItem.deskripsi}
                  </p>
                </div>
              )}
            </div>
            <div className="dm-preview-footer">
              <button
                className="dm-btn-cancel"
                onClick={() => setPreviewItem(null)}
              >
                Tutup
              </button>
              {previewItem.canDownload && (
                <button
                  className="dm-btn-download"
                  onClick={() => {
                    handleDownload(previewItem);
                    setPreviewItem(null);
                  }}
                >
                  <span className="material-symbols-outlined">download</span>
                  Unduh Materi
                </button>
              )}
              {!previewItem.canDownload && previewItem.url && (
                <button
                  className="dm-btn-download"
                  onClick={() => {
                    showToast("Membuka link...");
                    setPreviewItem(null);
                  }}
                >
                  <span className="material-symbols-outlined">open_in_new</span>
                  Buka Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <SidebarDosen
        onNavigate={onNavigate}
        onLogout={onLogout}
        activePage="dosenMateri"
        mobileOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <main
        className="page-main"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <Navbar
          role="Dosen"
          onOpenSidebar={openSidebar}
          onNavigate={
            typeof nav !== "undefined"
              ? nav
              : typeof onNavigate !== "undefined"
                ? onNavigate
                : undefined
          }
        />

        <div className="page-content">
          {/* ═══════════════ LIST VIEW ═══════════════ */}
          {view === "list" && (
            <>
              <div className="dm-topbar">
                <div>
                  <h2 className="dm-page-title">Manajemen Materi</h2>
                  <p className="dm-page-sub">
                    Kelola modul ajar, dokumen, video, dan tautan materi untuk
                    mahasiswa Anda.
                  </p>
                </div>
                <button className="dm-btn-primary" onClick={startCreate}>
                  <span className="material-symbols-outlined">add</span>
                  Tambah Materi
                </button>
              </div>

              {/* Stats */}
              <div className="dm-stats-row">
                {[
                  {
                    label: "Total Materi",
                    value: materi.length,
                    icon: "menu_book",
                    color: "var(--color-secondary)",
                  },
                  {
                    label: "Dapat Diunduh",
                    value: materi.filter((m) => m.canDownload).length,
                    icon: "download",
                    color: "#2f9696",
                  },
                  {
                    label: "Link & Video",
                    value: materi.filter((m) => !m.canDownload).length,
                    icon: "play_circle",
                    color: "#7c3aed",
                  },
                ].map((s) =>
                  loading ? (
                    <div
                      key={s.label}
                      className="dm-stat-mini skeleton-shimmer"
                      style={{ border: "none", height: "4.5rem" }}
                    ></div>
                  ) : (
                    <div key={s.label} className="dm-stat-mini">
                      <div
                        className="dm-stat-icon-wrap"
                        style={{ background: `${s.color}18` }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ color: s.color }}
                        >
                          {s.icon}
                        </span>
                      </div>
                      <div>
                        <p className="dm-stat-val" style={{ color: s.color }}>
                          {s.value}
                        </p>
                        <p className="dm-stat-lbl">{s.label}</p>
                      </div>
                    </div>
                  ),
                )}
              </div>

              {/* Filters */}
              <div
                className="dm-filter-row"
                style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}
              >
                <div className="dm-filter-group--select">
                  <label className="dm-filter-label">Mata Kuliah:</label>
                  <select
                    className="dm-filter-select"
                    value={filterMatkul}
                    onChange={(e) => setFilterMatkul(e.target.value)}
                  >
                    <option value="Semua">Semua Mata Kuliah</option>
                    {matkulList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="dm-filter-group--select">
                  <label className="dm-filter-label">Tipe:</label>
                  <select
                    className="dm-filter-select"
                    value={filterTipe}
                    onChange={(e) => setFilterTipe(e.target.value)}
                  >
                    <option value="Semua">Semua Tipe</option>
                    {TIPE_LIST.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Materi Grid */}
              {filtered.length === 0 ? (
                <div className="dm-empty">
                  <span className="material-symbols-outlined dm-empty-icon">
                    folder_open
                  </span>
                  <p>Tidak ada materi yang sesuai filter.</p>
                  <button className="dm-btn-primary" onClick={startCreate}>
                    Tambah Materi Baru
                  </button>
                </div>
              ) : (
                <div className="dm-materi-grid">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      className="dm-materi-card"
                      onClick={() => setPreviewItem(item)}
                    >
                      {/* Header */}
                      <div className="dm-card-header">
                        <div
                          className="dm-card-icon"
                          style={{
                            background: `${tipeColor(item.tipe)}15`,
                            color: tipeColor(item.tipe),
                          }}
                        >
                          <span className="material-symbols-outlined">
                            {tipeIcon(item.tipe)}
                          </span>
                        </div>
                        <div className="dm-card-type-col">
                          <span
                            className="dm-tipe-badge"
                            style={{
                              background: `${tipeColor(item.tipe)}18`,
                              color: tipeColor(item.tipe),
                            }}
                          >
                            {item.tipe}
                          </span>
                          {item.canDownload ? (
                            <span className="dm-dl-badge dm-dl-badge--yes">
                              <span className="material-symbols-outlined">
                                download
                              </span>{" "}
                              Bisa Diunduh
                            </span>
                          ) : (
                            <span className="dm-dl-badge dm-dl-badge--link">
                              <span className="material-symbols-outlined">
                                open_in_new
                              </span>{" "}
                              Link
                            </span>
                          )}
                        </div>
                        <div className="dm-card-menu">
                          <button
                            className="dm-icon-btn"
                            title="Edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(item);
                            }}
                          >
                            <span className="material-symbols-outlined">
                              edit
                            </span>
                          </button>
                          <button
                            className="dm-icon-btn dm-icon-btn--red"
                            title="Hapus"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(item.id);
                            }}
                          >
                            <span className="material-symbols-outlined">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="dm-card-title">{item.judul}</h3>
                      <p className="dm-card-matkul">
                        <span className="material-symbols-outlined">
                          school
                        </span>
                        {item.matakuliah}
                      </p>
                      {item.deskripsi && (
                        <p className="dm-card-desc">{item.deskripsi}</p>
                      )}

                      {/* Footer */}
                      <div className="dm-card-footer">
                        <div className="dm-card-meta">
                          <span className="material-symbols-outlined">
                            calendar_today
                          </span>
                          {item.tanggal}
                        </div>
                        <button
                          className="dm-dl-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewItem(item);
                          }}
                        >
                          <span className="material-symbols-outlined">
                            visibility
                          </span>
                          Lihat Detail
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══════════════ CREATE / EDIT FORM ═══════════════ */}
          {(view === "create" || view === "edit") && (
            <>
              <div className="dm-topbar">
                <div>
                  <nav className="dm-breadcrumb">
                    <button
                      className="dm-breadcrumb-link"
                      onClick={() => setView("list")}
                    >
                      Manajemen Materi
                    </button>
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                    <span className="dm-breadcrumb-active">
                      {view === "create" ? "Tambah Materi Baru" : "Edit Materi"}
                    </span>
                  </nav>
                  <h2 className="dm-page-title">
                    {view === "create" ? "Tambah Materi Baru" : "Edit Materi"}
                  </h2>
                  <p className="dm-page-sub">
                    Isi detail materi yang akan diberikan kepada mahasiswa.
                  </p>
                </div>
              </div>

              <div className="dm-form-card">
                <form onSubmit={handleSubmit}>
                  <div className="dm-form-grid">
                    {/* Judul */}
                    <div className="dm-field dm-field--full">
                      <label className="dm-label">
                        Judul Materi <span className="dm-required">*</span>
                      </label>
                      <input
                        className="dm-input"
                        placeholder="Masukkan judul materi..."
                        value={form.judul}
                        onChange={(e) =>
                          setForm({ ...form, judul: e.target.value })
                        }
                      />
                    </div>

                    {/* Tipe */}
                    <div className="dm-field">
                      <label className="dm-label">Tipe Materi</label>
                      <div className="dm-tipe-grid">
                        {TIPE_LIST.map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`dm-tipe-opt ${form.tipe === t ? "dm-tipe-opt--active" : ""}`}
                            style={
                              form.tipe === t
                                ? {
                                    borderColor: tipeColor(t),
                                    background: `${tipeColor(t)}12`,
                                    color: tipeColor(t),
                                  }
                                : {}
                            }
                            onClick={() => setForm({ ...form, tipe: t })}
                          >
                            <span className="material-symbols-outlined">
                              {tipeIcon(t)}
                            </span>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mata Kuliah */}
                    <div className="dm-field">
                      <label className="dm-label">Mata Kuliah</label>
                      <select
                        className="dm-select"
                        value={form.matkul}
                        onChange={(e) =>
                          setForm({ ...form, matkul: e.target.value })
                        }
                      >
                        {matkulList.map((mk) => (
                          <option key={mk.id} value={mk.id}>
                            {mk.name} ({mk.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* URL field for Link/Video */}
                    {needsUrl && (
                      <div className="dm-field dm-field--full">
                        <label className="dm-label">
                          URL {form.tipe} <span className="dm-required">*</span>
                        </label>
                        <div className="dm-url-wrap">
                          <span className="material-symbols-outlined dm-url-icon">
                            link
                          </span>
                          <input
                            className="dm-input dm-input--url"
                            type="url"
                            placeholder={
                              form.tipe === "Video"
                                ? "https://youtube.com/watch?v=..."
                                : "https://..."
                            }
                            value={form.url}
                            onChange={(e) =>
                              setForm({ ...form, url: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* File Upload */}
                    {needsFile && (
                      <div className="dm-field dm-field--full">
                        <label className="dm-label">Upload File</label>
                        <div
                          className="dm-file-drop"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            style={{ display: "none" }}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                file: e.target.files[0] || null,
                              })
                            }
                          />
                          {form.file ? (
                            <div className="dm-file-selected">
                              <span
                                className="material-symbols-outlined"
                                style={{ color: tipeColor(form.tipe) }}
                              >
                                {tipeIcon(form.tipe)}
                              </span>
                              <div>
                                <p className="dm-file-name">{form.file.name}</p>
                                <p className="dm-file-size">
                                  {(form.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <button
                                type="button"
                                className="dm-file-remove"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setForm({ ...form, file: null });
                                }}
                              >
                                <span className="material-symbols-outlined">
                                  close
                                </span>
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="material-symbols-outlined dm-upload-icon">
                                cloud_upload
                              </span>
                              <p className="dm-upload-text">
                                Klik atau seret file ke sini
                              </p>
                              <p className="dm-upload-hint">
                                PDF, DOCX, PPTX, XLSX (Maks. 50MB)
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Deskripsi */}
                    <div className="dm-field dm-field--full">
                      <label className="dm-label">Deskripsi (opsional)</label>
                      <textarea
                        className="dm-textarea"
                        rows={4}
                        placeholder="Jelaskan isi materi ini..."
                        value={form.deskripsi}
                        onChange={(e) =>
                          setForm({ ...form, deskripsi: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="dm-form-actions">
                    <button
                      type="button"
                      className="dm-btn-cancel"
                      onClick={() => setView("list")}
                    >
                      Batal
                    </button>
                    <button type="submit" className="dm-btn-submit">
                      <span className="material-symbols-outlined">save</span>
                      {view === "create" ? "Simpan Materi" : "Perbarui Materi"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
