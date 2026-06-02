import React, { useState, useEffect, useCallback } from "react";
import "../../../components/shared.css";
import "./dosenPresensi.css";
import SidebarDosen from "../../../components/SidebarDosen";
import { useSidebar } from "../../../components/useSidebar";
import Navbar from "../../../components/Navbar";
import { apiClient } from "../../../utils/apiClient";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjoXu55KCdSSPl-2t0t7d2EH6gux6Xz8nZaCdXHePrj-gGn1ZWZyBoOucWc2yVgrhmNFyy8cKbxWH8i9Wm5VKkpqX9jraXjkHTr8PVU1oN3V4nkzLWUUm6nyAIS3hGDic_uY0YoNLNNZluKTKqFwJb2gYlRl9eATGdlXClTx6IXpYvk-2u1qqvfUGTzs-QJPlXTouWTyNYzTe8j8mS09evVA_aHTYfHxneVwUsb2jUygYzuAIDU5KwqO2kISzLvnzaTentePscoGoo";

const QR_TTL = 15 * 60;

const INITIAL_STUDENTS = [];

const STATUS_OPTS = ["Hadir", "Sakit", "Izin", "Alpa"];

function statusColor(s) {
  return ({ Hadir: "#2f9696", Sakit: "#4b53bc", Izin: "#c47f17", Alpa: "#dc2626" }[s] ?? "#64748b");
}
function generateToken() {
  return `LeMaS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
function qrUrl(token) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(token)}`;
}
function fmtTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function DosenPresensi({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [toast, setToast]     = useState(null);
  const [token, setToken]     = useState("");
  const [timeLeft, setTimeLeft] = useState(QR_TTL);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [loading, setLoading] = useState(true);
  const [mataKuliahList, setMataKuliahList] = useState([]);
  const [selectedMatkul, setSelectedMatkul] = useState({ id: null, name: "Memuat...", room: "-", time: "-", jadwal: "" });
  const [sessionActive, setSessionActive]   = useState(false);
  const [showMatkul, setShowMatkul]         = useState(false);
  const [showJadwal, setShowJadwal]         = useState(false);
  const [selectedDays, setSelectedDays]     = useState([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState("semua");
  const [tempDate, setTempDate]             = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [page, setPage] = useState(1);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch semua tanggal yang tersedia untuk matkul ini
  const fetchDates = useCallback(async () => {
    if (!selectedMatkul?.id) return;
    try {
      const res = await apiClient.get(`/api/dosen/presensi/dates/${selectedMatkul.id}`);
      const dates = res.dates || [];
      // Format tanggal ke YYYY-MM-DD
      const formattedDates = dates.map(d => {
        if (typeof d === 'string' && d.includes('T')) {
          return d.split('T')[0];
        }
        return new Date(d).toISOString().split('T')[0];
      }).filter(Boolean).sort().reverse();
      setAvailableDates(formattedDates);
    } catch (error) {
      console.error("Error fetching dates:", error);
    }
  }, [selectedMatkul?.id]);

  const fetchStudents = useCallback(async (overrideDate = null) => {
    if (!selectedMatkul?.id) return;
    try {
      let res;
      
      const cacheBuster = `_t=${Date.now()}`;
      // Gunakan overrideDate kalau ada, kalau tidak pakai selectedDateFilter
      const dateToUse = overrideDate || selectedDateFilter;
      
      // Jika ada tanggal yang dipilih (bukan "semua"), fetch by tanggal
      if (dateToUse && dateToUse !== "semua") {
        res = await apiClient.get(`/api/dosen/presensi/daftar-hadir/${selectedMatkul.id}/${dateToUse}?${cacheBuster}`);
      } else {
        // Fetch semua (default ke hari ini)
        res = await apiClient.get(`/api/dosen/presensi/matkul/${selectedMatkul.id}/daftar-hadir?${cacheBuster}`);
      }
      
      // Handle different response structures
      let data = [];
      if (res.data && Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        data = res.data.data;
      } else if (Array.isArray(res)) {
        data = res;
      }
      
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMatkul?.id, selectedDateFilter]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiClient.get('/api/mata-kuliah');
        const data = Array.isArray(res) ? res : (res.data || []);
        const formatted = data.map(c => ({
          id: c.idMataKuliah,
          name: c.namaMataKuliah,
          room: c.ruang || "Ruang Kelas",
          time: c.waktu || "08:00 - 10:30",
          jadwal: c.jadwal || ""
        }));
        setMataKuliahList(formatted);
        if (formatted.length > 0 && !selectedMatkul?.id) {
          setSelectedMatkul(formatted[0]);
          setSelectedDays(formatted[0].jadwal ? formatted[0].jadwal.split(',') : []);
        }
      } catch (error) {
        console.error("Failed to load courses");
      }
    };
    fetchCourses();
  }, []);

  // Update selectedDays when selectedMatkul changes
  useEffect(() => {
    if (selectedMatkul?.jadwal) {
      setSelectedDays(selectedMatkul.jadwal.split(','));
    } else {
      setSelectedDays([]);
    }
  }, [selectedMatkul?.id]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showJadwal && !e.target.closest('.dp-jadwal-popup') && !e.target.closest('.dp-btn-outline')) {
        setShowJadwal(false);
      }
      if (showMatkul && !e.target.closest('.dp-matkul-selector') && !e.target.closest('.dp-matkul-dropdown')) {
        setShowMatkul(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showJadwal, showMatkul]);

  useEffect(() => {
    if (selectedMatkul?.id) {
      setLoading(true);
      fetchDates();
      fetchStudents();
    }
  }, [selectedMatkul?.id, fetchDates, fetchStudents]);
  
  // Fetch students saat tanggal berubah
  useEffect(() => {
    if (selectedMatkul?.id && selectedDateFilter) {
      setLoading(true);
      fetchStudents();
    }
  }, [selectedDateFilter, selectedMatkul?.id, fetchStudents]);
  
  // Log students data for debugging
  useEffect(() => {
  }, [students, availableDates]);

  // Auto-refresh daftar hadir setiap 2 detik saat sesi aktif atau ada tanggal yang dipilih
  useEffect(() => {
    if (!selectedMatkul?.id) return;
    // Refresh selalu jalan kalau ada matkul dipilih, tapi lebih cepat saat sessionActive
    const intervalTime = sessionActive ? 2000 : 5000;
    const interval = setInterval(() => {
      fetchStudents();
    }, intervalTime);
    return () => clearInterval(interval);
  }, [selectedMatkul?.id, sessionActive, selectedDateFilter, fetchStudents]);

  useEffect(() => {
    if (!sessionActive || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, sessionActive]);

  useEffect(() => {
    if (timeLeft <= 0) handleRefresh();
  }, [timeLeft]);

  const handleRefresh = useCallback(() => {
    setQrLoaded(false);
    setToken("");
    setTimeLeft(QR_TTL);
    showToast("QR Code diperbarui!");
  }, []);

  const handleStatusChange = async (nim, newStatus) => {
    if (!selectedMatkul?.id) {
      showToast("Pilih mata kuliah terlebih dahulu", "error");
      return;
    }
    setStudents((prev) => prev.map((s) => s.nim === nim ? { ...s, status: newStatus } : s));
    try {
      // Gunakan API baru berdasarkan NIM dan mata kuliah
      await apiClient.put(`/api/dosen/presensi/nim/${nim}/matkul/${selectedMatkul.id}/status`, { status: newStatus });
      showToast("Status diperbarui");
    } catch (error) {
      console.error(error);
      showToast("Gagal memperbarui status", "error");
    }
  };

  const statCount = (status) => students.filter((s) => s.status === status).length;
  const urgency = timeLeft < 60 ? "urgent" : timeLeft < 5 * 60 ? "warning" : "normal";

  const endSession = () => {
    setSessionActive(false);
    showToast("Sesi presensi telah ditutup.");
  };

  const downloadReport = () => {
    if (!selectedMatkul?.id || students.length === 0) {
      showToast("Tidak ada data presensi untuk diunduh", "error");
      return;
    }

    // Header CSV
    const headers = ["No", "NIM", "Nama Mahasiswa", "Status", "Tanggal Pertemuan", "Waktu Presensi"];
    
    // Data rows
    const rows = students.map((s, index) => [
      index + 1,
      s.nim || "-",
      s.nama || "-",
      s.status || "Alpa",
      s.tanggalPertemuan ? new Date(s.tanggalPertemuan).toLocaleDateString('id-ID') : "-",
      s.waktuPresensi ? new Date(s.waktuPresensi).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "-"
    ]);

    // Summary
    const hadir = students.filter(s => s.status === "Hadir").length;
    const sakit = students.filter(s => s.status === "Sakit").length;
    const izin = students.filter(s => s.status === "Izin").length;
    const alpa = students.filter(s => s.status === "Alpa" || !s.status).length;

    const csvContent = [
      ["LAPORAN PRESENSI"],
      ["Mata Kuliah:", selectedMatkul.name],
      ["Tanggal:", new Date().toLocaleDateString('id-ID')],
      [],
      headers,
      ...rows,
      [],
      ["RINGKASAN"],
      ["Hadir:", hadir],
      ["Sakit:", sakit],
      ["Izin:", izin],
      ["Alpa:", alpa],
      ["Total:", students.length]
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    // Download
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Presensi_${selectedMatkul.name}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Laporan berhasil diunduh!");
  };

  return (
    <div className="page-shell" style={{ backgroundColor: "var(--color-background)" }}>
      {/* Toast */}
      {toast && (
        <div className={`dp-toast dp-toast--${toast.type}`}>
          <span className="material-symbols-outlined">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      <SidebarDosen onNavigate={onNavigate} onLogout={onLogout} activePage="dosenPresensi" mobileOpen={sidebarOpen} onClose={closeSidebar} />

      <main className="page-main" style={{ backgroundColor: "var(--color-background)" }}>
        <Navbar role="Dosen" onOpenSidebar={openSidebar} onNavigate={typeof nav !== "undefined" ? nav : (typeof onNavigate !== "undefined" ? onNavigate : undefined)} />

        <div className="page-content">
          {/* Top bar */}
          <div className="dp-topbar">
            <div>
              <h2 className="dp-page-title">Manajemen Presensi</h2>
              <p className="dp-page-sub">Hasilkan QR Code presensi dan pantau kehadiran mahasiswa secara real-time.</p>
            </div>
            <div className="dp-top-actions" style={{ position: 'relative' }}>
              <div className="dp-matkul-selector" onClick={() => setShowMatkul(!showMatkul)}>
                <span className="material-symbols-outlined">menu_book</span>
                <span>{selectedMatkul.name}</span>
                <span className="material-symbols-outlined">expand_more</span>
                {showMatkul && (
                  <div className="dp-matkul-dropdown">
                    {mataKuliahList.map((mk) => (
                      <button key={mk.id} className={`dp-matkul-opt ${selectedMatkul.id === mk.id ? "active" : ""}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedMatkul(mk); setShowMatkul(false); handleRefresh(); }}>
                        <strong>{mk.name}</strong>
                        <span>{mk.time}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="dp-btn-outline" onClick={() => setShowJadwal(!showJadwal)}>
                <span className="material-symbols-outlined">calendar_month</span>
                Pilih Tanggal
              </button>
              {showJadwal && (
                <div className="dp-jadwal-popup" onClick={(e) => e.stopPropagation()}>
                  <div className="dp-jadwal-header">
                    <span>Pilih Tanggal Presensi</span>
                    <button onClick={() => setShowJadwal(false)}>&times;</button>
                  </div>
                  <input 
                    type="date" 
                    className="dp-date-input"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                  />
                  <button
                    className="dp-btn-save-jadwal"
                    onClick={async () => {
                      if (tempDate) {
                        // Tambahkan tanggal ke dropdown filter
                        setAvailableDates(prev => [...new Set([...prev, tempDate])].sort().reverse());
                        setSelectedDateFilter(tempDate);
                        setShowJadwal(false);
                        
                        showToast(`Tanggal ${new Date(tempDate).toLocaleDateString('id-ID')} dipilih. Silakan klik Buka Sesi.`);
                        // Fetch dengan tanggal yang baru dipilih
                        setTimeout(() => fetchStudents(tempDate), 500);
                      } else {
                        setSelectedDateFilter("semua");
                        setShowJadwal(false);
                        showToast("Pilih tanggal atau tampilkan semua");
                      }
                    }}
                  >
                    Simpan
                  </button>
                </div>
              )}
              <button className="dp-btn-outline" onClick={downloadReport}>
                <span className="material-symbols-outlined">download</span>
                Unduh Laporan
              </button>
              {sessionActive ? (
                <button className="dp-btn-danger" onClick={endSession}>
                  <span className="material-symbols-outlined">stop_circle</span>
                  Tutup Sesi
                </button>
              ) : (
                <button className="dp-btn-primary" onClick={async () => {
                  if (!selectedMatkul?.id) {
                    showToast("Pilih mata kuliah terlebih dahulu", "error");
                    return;
                  }
                  
                  // Gunakan tanggal dari filter, atau hari ini jika filter adalah "semua"
                  const targetDate = (selectedDateFilter && selectedDateFilter !== "semua") ? selectedDateFilter : new Date().toISOString().split('T')[0];

                  try {
                    const res = await apiClient.post(`/api/dosen/presensi/matkul/${selectedMatkul.id}/generate`, { tanggal: targetDate });
                    if (res.token) {
                      setToken(res.token);
                      setTimeLeft(QR_TTL);
                      setQrLoaded(false);
                    } else {
                    }
                    setSessionActive(true);
                    
                    setAvailableDates(prev => [...new Set([...prev, targetDate])].sort().reverse());
                    setSelectedDateFilter(targetDate);
                    // Fetch dengan tanggal yang dipilih
                    setTimeout(() => fetchStudents(targetDate), 500);
                    showToast("Sesi presensi berhasil dibuat!");
                  } catch (error) {
                    if (error.message && error.message.includes('sudah ada')) {
                      setSessionActive(true);
                      // Generate new token for existing session
                      const newToken = `LeMaS-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                      setToken(newToken);
                      setTimeLeft(QR_TTL);
                      setQrLoaded(false);
                      
                      setAvailableDates(prev => [...new Set([...prev, targetDate])].sort().reverse());
                      setSelectedDateFilter(targetDate);
                      showToast("Sesi untuk tanggal ini sudah ada - Token baru dibuat");
                      // Fetch dengan tanggal target
                      setTimeout(() => fetchStudents(targetDate), 500);
                    } else {
                      showToast(error.message || "Gagal membuat sesi", "error");
                    }
                  }
                }}>
                  <span className="material-symbols-outlined">play_circle</span>
                  Buka Sesi
                </button>
              )}
            </div>
          </div>

          {/* Upper grid: QR + Session Info */}
          <div className="dp-upper-grid">
            {/* QR Card */}
            <div className="dp-qr-card">
              <div className="dp-qr-header">
                <h3>Kode QR Presensi</h3>
                <p>Tampilkan ke kelas atau bagikan ke mahasiswa</p>
              </div>
              <div className="dp-qr-frame">
                {!token ? (
                  <div className="dp-qr-skeleton">
                    <span className="material-symbols-outlined">qr_code</span>
                    <span>Buat sesi presensi terlebih dahulu</span>
                  </div>
                ) : (
                  <>
                    {!qrLoaded && (
                      <div className="dp-qr-skeleton">
                        <span className="material-symbols-outlined">qr_code_2</span>
                        <span>Memuat QR...</span>
                      </div>
                    )}
                    <img
                      key={token}
                      src={qrUrl(token)}
                      alt="QR Code Presensi"
                      className={`dp-qr-img ${qrLoaded ? "dp-qr-img--visible" : ""} ${!sessionActive ? "dp-qr-img--expired" : ""}`}
                      onLoad={() => setQrLoaded(true)}
                    />
                  </>
                )}
                {!sessionActive && token && (
                  <div className="dp-qr-overlay">
                    <span className="material-symbols-outlined">lock</span>
                    <span>Sesi Ditutup</span>
                  </div>
                )}
              </div>
              {token && (
                <div className="dp-qr-token">
                  <span className="dp-token-label">Token (untuk input manual)</span>
                  <code className="dp-token-value">{token}</code>
                </div>
              )}
              <div className="dp-qr-footer">
                <div className="dp-ttl-info">
                  <span className="dp-ttl-label">Masa Berlaku</span>
                  <span className={`dp-ttl-value dp-ttl--${urgency}`}>{fmtTime(timeLeft)} Menit</span>
                </div>
                <div className="dp-ttl-bar-track">
                  <div className={`dp-ttl-bar-fill dp-ttl--${urgency}`} style={{ width: `${(timeLeft / QR_TTL) * 100}%` }} />
                </div>
                <div className="dp-qr-actions">
                  <button className="dp-btn-refresh" onClick={handleRefresh}>
                    <span className="material-symbols-outlined">refresh</span>
                    Perbarui
                  </button>
                  <button className="dp-btn-share" onClick={() => showToast("Link presensi disalin!")}>
                    <span className="material-symbols-outlined">share</span>
                    Bagikan
                  </button>
                </div>
              </div>
            </div>

            {/* Right: session info + stats */}
            <div className="dp-info-col">
              <div className="dp-session-card">
                <span className="dp-chip">SESI AKTIF</span>
                <h2 className="dp-session-title">{selectedMatkul.name}</h2>
                <div className="dp-session-details">
                  <div className="dp-detail-item">
                    <span className="material-symbols-outlined">schedule</span>
                    <div>
                      <p className="dp-detail-label">Waktu Perkuliahan</p>
                      <p className="dp-detail-value">{selectedMatkul.time} WIB</p>
                    </div>
                  </div>
                  <div className="dp-detail-item">
                    <span className="material-symbols-outlined">meeting_room</span>
                    <div>
                      <p className="dp-detail-label">Ruangan</p>
                      <p className="dp-detail-value">{selectedMatkul.room}</p>
                    </div>
                  </div>
                  <div className="dp-detail-item">
                    <span className="material-symbols-outlined">tag</span>
                    <div>
                      <p className="dp-detail-label">Kode Mata Kuliah</p>
                      <p className="dp-detail-value">{selectedMatkul.id}</p>
                    </div>
                  </div>
                  <div className="dp-detail-item">
                    <span className="material-symbols-outlined">circle</span>
                    <div>
                      <p className="dp-detail-label">Status Sesi</p>
                      <p className={`dp-detail-value ${sessionActive ? "dp-status--active" : "dp-status--closed"}`}>
                        {sessionActive ? "● Berlangsung" : "● Ditutup"}
                      </p>
                    </div>
                  </div>
                  <div className="dp-detail-item">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <div>
                      <p className="dp-detail-label">Jadwal Mingguan</p>
                      <p className="dp-detail-value">
                        {selectedMatkul.jadwal || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="dp-stats-grid">
                {[
                  { label: "HADIR",  value: statCount("Hadir"), color: "#2f9696", icon: "check_circle" },
                  { label: "SAKIT",  value: statCount("Sakit"), color: "#4b53bc", icon: "medication" },
                  { label: "IZIN",   value: statCount("Izin"),  color: "#c47f17", icon: "event_busy" },
                  { label: "ALPA",   value: statCount("Alpa"),  color: "#dc2626", icon: "cancel" },
                ].map((s) => (
                  loading ? (
                    <div key={s.label} className="dp-stat-card skeleton-shimmer" style={{ border: 'none', height: '6rem' }}></div>
                  ) : (
                    <div key={s.label} className="dp-stat-card">
                      <span className="material-symbols-outlined dp-stat-icon" style={{ color: s.color }}>{s.icon}</span>
                      <p className="dp-stat-label">{s.label}</p>
                      <p className="dp-stat-value" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Student Table */}
          <div className="dp-table-card">
            <div className="dp-table-header">
              <div>
                <h3>Daftar Hadir Mahasiswa</h3>
                <p>{students.length} mahasiswa terdaftar</p>
              </div>
              <div className="dp-table-actions">
                <button className="dp-icon-btn" onClick={() => { fetchStudents(); showToast("Data diperbarui!"); }}>
                  <span className="material-symbols-outlined">refresh</span>
                </button>
                <select 
                  className="dp-date-filter"
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                >
                  <option value="semua">Semua Tanggal</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="dp-table-wrap">
              <table className="dp-table">
                <thead>
                  <tr>
                    <th>NAMA MAHASISWA</th>
                    <th>NIM</th>
                    <th>WAKTU PRESENSI</th>
                    <th>STATUS KEHADIRAN</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (students.length > 0) {
                      const firstStudent = students[0];
                    }
                    return null;
                  })()}
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                        Tidak ada data mahasiswa. Klik "Buka Sesi" untuk membuat sesi presensi.
                      </td>
                    </tr>
                  ) : (() => {
                    // Jika semua student punya tanggalPertemuan null, tampilkan semua (sesi belum dibuat)
                    const allNullTanggal = students.every(s => !s.tanggalPertemuan);
                    
                    const filtered = selectedDateFilter === "semua" || allNullTanggal
                      ? students 
                      : students.filter(s => {
                          if (!s.tanggalPertemuan) {
                            return false;
                          }
                          let sDate = null;
                          if (typeof s.tanggalPertemuan === 'string' && s.tanggalPertemuan.includes('T')) {
                            sDate = s.tanggalPertemuan.split('T')[0];
                          } else {
                            try {
                              sDate = new Date(s.tanggalPertemuan).toISOString().split('T')[0];
                            } catch (e) {
                              return false;
                            }
                          }
                          return sDate === selectedDateFilter;
                        });
                    return filtered.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="dp-student-cell">
                          {s.photo ? (
                            <img src={s.photo} alt={s.name} className="dp-avatar-img" />
                          ) : (
                            <div className="dp-avatar-initials" style={{ backgroundColor: s.color }}>{s.initials}</div>
                          )}
                          <span className="dp-student-name">{s.name}</span>
                        </div>
                      </td>
                      <td className="dp-nim">{s.nim}</td>
                      <td className="dp-time">
                        {s.waktuPresensi ? new Date(s.waktuPresensi).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td>
                        <div className="dp-status-wrap">
                          <select
                            className="dp-status-select"
                            style={{ color: statusColor(s.status) }}
                            value={s.status}
                            onChange={(e) => handleStatusChange(s.nim, e.target.value)}
                          >
                            {STATUS_OPTS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined dp-select-icon" style={{ color: statusColor(s.status) }}>expand_more</span>
                        </div>
                      </td>
                    </tr>
                  ));})()}
                </tbody>
              </table>
            </div>
            <div className="dp-pagination-row">
              <p className="dp-pagination-info">
                {selectedDateFilter === "semua" 
                  ? `Menampilkan semua ${students.length} mahasiswa`
                  : `Menampilkan ${students.filter(s => {
                      if (!s.tanggalPertemuan) return false;
                      let sDate = null;
                      if (typeof s.tanggalPertemuan === 'string' && s.tanggalPertemuan.includes('T')) {
                        sDate = s.tanggalPertemuan.split('T')[0];
                      } else {
                        try {
                          sDate = new Date(s.tanggalPertemuan).toISOString().split('T')[0];
                        } catch (e) { return false; }
                      }
                      return sDate === selectedDateFilter;
                    }).length} mahasiswa untuk tanggal ${new Date(selectedDateFilter).toLocaleDateString('id-ID')}`
                }
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
