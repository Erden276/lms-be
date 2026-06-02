import React, { useState, useEffect } from "react";
import "../../../components/shared.css";
import "./dosenKelompok.css";
import SidebarDosen from "../../../components/SidebarDosen";
import { useSidebar } from "../../../components/useSidebar";
import Navbar from "../../../components/Navbar";
import { apiClient } from "../../../utils/apiClient";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjoXu55KCdSSPl-2t0t7d2EH6gux6Xz8nZaCdXHePrj-gGn1ZWZyBoOucWc2yVgrhmNFyy8cKbxWH8i9Wm5VKkpqX9jraXjkHTr8PVU1oN3V4nkzLWUUm6nyAIS3hGDic_uY0YoNLNNZluKTKqFwJb2gYlRl9eATGdlXClTx6IXpYvk-2u1qqvfUGTzs-QJPlXTouWTyNYzTe8j8mS09evVA_aHTYfHxneVwUsb2jUygYzuAIDU5KwqO2kISzLvnzaTentePscoGoo";

const MEMBER_COLORS = ["#4b53bc", "#2f9696", "#c47f17", "#7c3aed", "#0891b2", "#059669", "#dc2626", "#be185d", "#8991fe"];

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
function statusColor(status) {
  return (
    {
      "On-Track": "#2f9696",
      Behind: "#dc2626",
      Completed: "#059669",
      "Not Started": "#94a3b8",
    }[status] ?? "#94a3b8"
  );
}
function statusBg(status) {
  return (
    {
      "On-Track": "#f0fdfa",
      Behind: "#fff1f2",
      Completed: "#ecfdf5",
      "Not Started": "#f1f5f9",
    }[status] ?? "#f1f5f9"
  );
}

export default function DosenKelompok({ onNavigate, onLogout }) {
  const { sidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [nilaiModal, setNilaiModal] = useState(null);
  const [gradeInputs, setGradeInputs] = useState({});
  const [addMemberModal, setAddMemberModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupTask, setNewGroupTask] = useState("");
  const [allStudents, setAllStudents] = useState([]);
  const [mataKuliahList, setMataKuliahList] = useState([]);
  const [selectedMkId, setSelectedMkId] = useState("");
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const normalizeGroup = (g) => {
    const members = (g.members || []).map(m =>
      typeof m === 'string' ? { nim: m, name: m, nomorInduk: m } : m
    );
    return { ...g, members, nilai: g.nilai || {} };
  };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/kelompok');
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setGroups(data.map(normalizeGroup));
      }
    } catch (error) {
      console.error("Gagal memuat kelompok:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const data = await apiClient.get('/api/kelompok/mahasiswa/all');
      if (Array.isArray(data)) {
        setAllStudents(data);
      }
    } catch (error) {
      console.error("Gagal memuat mahasiswa:", error);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchAllStudents();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await apiClient.get('/api/mata-kuliah');
      const data = Array.isArray(res) ? res : (res.data || []);
      setMataKuliahList(data);
    } catch (error) {
      console.error("Gagal memuat mata kuliah:", error);
    }
  };

  const openNilai = (group) => {
    setGradeInputs({ ...group.nilai });
    setNilaiModal(group);
  };

  const saveNilai = async () => {
    try {
      await apiClient.put(`/api/kelompok/${nilaiModal.id}/grades`, {
        grades: gradeInputs
      });
      setNilaiModal(null);
      showToast("Nilai berhasil disimpan!");
      fetchGroups();
    } catch (error) {
      showToast("Gagal menyimpan nilai", "error");
    }
  };

  const removeMember = async (groupId, studentId) => {
    try {
      await apiClient.delete(`/api/kelompok/${groupId}/members/${studentId}`);
      showToast("Anggota dikeluarkan.");
      await fetchGroups();
    } catch (error) {
      showToast("Gagal mengeluarkan", "error");
    }
  };

  const addMember = async (groupId, nim) => {
    try {
      await apiClient.post(`/api/kelompok/${groupId}/members`, {
        nim: nim
      });
      showToast("Anggota berhasil ditambahkan!");
      await fetchGroups();
    } catch (error) {
      showToast(error.message || "Gagal menambahkan anggota", "error");
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      showToast("Nama kelompok wajib diisi.", "error");
      return;
    }
    if (!selectedMkId) {
      showToast("Pilih mata kuliah terlebih dahulu.", "error");
      return;
    }
    try {
      await apiClient.post('/api/kelompok', {
        name: newGroupName.trim(),
        idMataKuliah: parseInt(selectedMkId),
        task: newGroupTask.trim() || null
      });
      setNewGroupName("");
      setNewGroupTask("");
      setSelectedMkId("");
      setCreateModal(false);
      showToast("Kelompok berhasil dibuat!");
      fetchGroups();
    } catch (error) {
      showToast(error.message || "Gagal membuat kelompok", "error");
    }
  };

  const handleDeleteGroup = (groupId, groupName) => {
    setDeleteConfirmModal({ id: groupId, name: groupName });
  };

  const confirmDeleteGroup = async () => {
    if (!deleteConfirmModal) return;
    const { id, name } = deleteConfirmModal;
    try {
      await apiClient.delete(`/api/kelompok/${id}`);
      setDeleteConfirmModal(null);
      showToast(`Kelompok "${name}" berhasil dihapus!`);
      fetchGroups();
    } catch (error) {
      showToast("Gagal menghapus kelompok", "error");
    }
  };

  const getMemberColor = (nim) => {
    const idx = allStudents.findIndex(s => s.nim === nim);
    return MEMBER_COLORS[idx >= 0 ? idx % MEMBER_COLORS.length : 0];
  };

  const availableStudents = (groupId) => {
    const targetGroup = groups.find(g => g.id === groupId);
    if (!targetGroup) return allStudents;
    // Exclude mahasiswa yang sudah ada di kelompok manapun dalam matkul yang sama
    const sameMkGroups = groups.filter(g => g.idMataKuliah === targetGroup.idMataKuliah);
    const alreadyInAnyGroup = new Set(
      sameMkGroups.flatMap(g => g.members.map(m => m.nim))
    );
    return allStudents.filter((s) => !alreadyInAnyGroup.has(s.nim));
  };

  return (
    <div
      className="page-shell"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Toast */}
      {toast && (
        <div className={`dk-toast dk-toast--${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Nilai Modal */}
      {nilaiModal && (
        <div className="dk-overlay" onClick={() => setNilaiModal(null)}>
          <div className="dk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dk-modal-header">
              <div>
                <h3>Beri Nilai — {nilaiModal.name}</h3>
                <p>{nilaiModal.task}</p>
              </div>
              <button
                className="dk-modal-close"
                onClick={() => setNilaiModal(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="dk-modal-body">
              {nilaiModal.members.map((member) => (
                  <div key={member.nim} className="dk-grade-row">
                    <div className="dk-grade-student">
                      <div
                        className="dk-avatar-sm"
                        style={{ background: getMemberColor(member.nim) }}
                      >
                        {initials(member.name)}
                      </div>
                      <div>
                        <p className="dk-grade-name">{member.name}</p>
                        <p className="dk-grade-nim">{member.nim}</p>
                      </div>
                    </div>
                    <div className="dk-grade-input-wrap">
                      <input
                        className="dk-grade-input"
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0-100"
                        value={gradeInputs[member.nim] ?? ""}
                        onChange={(e) =>
                          setGradeInputs({
                            ...gradeInputs,
                            [member.nim]: e.target.value,
                          })
                        }
                      />
                      <span className="dk-grade-scale">/100</span>
                      {gradeInputs[member.nim] && (
                        <span className="dk-letter-grade">
                          {+gradeInputs[member.nim] >= 85
                            ? "A"
                            : +gradeInputs[member.nim] >= 70
                              ? "B"
                              : +gradeInputs[member.nim] >= 55
                                ? "C"
                                : "D"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
            <div className="dk-modal-footer">
              <button
                className="dk-btn-cancel"
                onClick={() => setNilaiModal(null)}
              >
                Batal
              </button>
              <button className="dk-btn-save" onClick={saveNilai}>
                <span className="material-symbols-outlined">save</span>
                Simpan Nilai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="dk-overlay" onClick={() => setDeleteConfirmModal(null)}>
          <div
            className="dk-modal dk-modal--sm"
            style={{
              maxWidth: "400px",
              textAlign: "center",
              padding: "2rem",
              borderRadius: "var(--radius-lg)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1.25rem"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "4rem",
                height: "4rem",
                borderRadius: "50%",
                backgroundColor: "#fee2e2",
                color: "#dc2626"
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "2.5rem" }}>warning</span>
              </div>
            </div>
            
            <h3 style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--slate-800)",
              margin: "0 0 0.75rem 0"
            }}>
              Hapus Kelompok?
            </h3>
            
            <p style={{
              fontSize: "0.9rem",
              color: "var(--slate-600)",
              lineHeight: "1.5",
              margin: "0 0 2rem 0"
            }}>
              Apakah Anda yakin ingin menghapus kelompok <strong>"{deleteConfirmModal.name}"</strong>? 
              <br />
              <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 500, marginTop: "0.5rem", display: "inline-block" }}>
                * Tindakan ini permanen. Semua anggota dan pengumpulan tugas kelompok ini juga akan terhapus.
              </span>
            </p>
            
            <div style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center"
            }}>
              <button
                className="dk-btn-cancel"
                style={{
                  margin: 0,
                  flex: 1,
                  padding: "0.75rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "white",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onClick={() => setDeleteConfirmModal(null)}
              >
                Batal
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s"
                }}
                onClick={confirmDeleteGroup}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#b91c1c"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#dc2626"}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>delete</span>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {addMemberModal && (
        <div className="dk-overlay" onClick={() => setAddMemberModal(null)}>
          <div className="dk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dk-modal-header">
              <div>
                <h3>Tambah Anggota</h3>
                <p>{groups.find((g) => g.id === addMemberModal)?.name}</p>
              </div>
              <button
                className="dk-modal-close"
                onClick={() => setAddMemberModal(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="dk-modal-body">
              {availableStudents(addMemberModal).length === 0 ? (
                <p className="dk-empty-state">
                  Semua mahasiswa sudah tergabung dalam kelompok.
                </p>
              ) : (
                availableStudents(addMemberModal).map((s) => (
                  <div key={s.nim} className="dk-member-option">
                    <div
                      className="dk-avatar-sm"
                      style={{ background: getMemberColor(s.nim) }}
                    >
                      {initials(s.name)}
                    </div>
                    <div className="dk-member-info">
                      <p className="dk-member-name">{s.name}</p>
                      <p className="dk-member-nim">{s.nim}</p>
                    </div>
                    <button
                      className="dk-btn-add-member"
                      onClick={() => addMember(addMemberModal, s.nim)}
                    >
                      <span className="material-symbols-outlined">add</span>
                      Tambah
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {createModal && (
        <div className="dk-overlay" onClick={() => setCreateModal(false)}>
          <div
            className="dk-modal dk-modal--sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dk-modal-header">
              <h3>Buat Kelompok Baru</h3>
              <button
                className="dk-modal-close"
                onClick={() => setCreateModal(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="dk-modal-body">
              <div className="dk-field">
                <label className="dk-label">Mata Kuliah</label>
                <select
                  className="dk-input"
                  value={selectedMkId}
                  onChange={(e) => setSelectedMkId(e.target.value)}
                >
                  <option value="">— Pilih Mata Kuliah —</option>
                  {mataKuliahList.map((mk) => (
                    <option key={mk.idMataKuliah} value={mk.idMataKuliah}>
                      {mk.namaMataKuliah}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dk-field">
                <label className="dk-label">Nama Kelompok</label>
                <input
                  className="dk-input"
                  placeholder="Kelompok Delta..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="dk-field">
                <label className="dk-label">Nama Tugas <span style={{ color: "#94a3b8", fontWeight: 400 }}>(opsional)</span></label>
                <input
                  className="dk-input"
                  placeholder="Misal: Proyek Akhir Semester..."
                  value={newGroupTask}
                  onChange={(e) => setNewGroupTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createGroup()}
                />
              </div>
            </div>
            <div className="dk-modal-footer">
              <button
                className="dk-btn-cancel"
                onClick={() => setCreateModal(false)}
              >
                Batal
              </button>
              <button className="dk-btn-save" onClick={createGroup}>
                <span className="material-symbols-outlined">add</span>
                Buat Kelompok
              </button>
            </div>
          </div>
        </div>
      )}

      <SidebarDosen
        onNavigate={onNavigate}
        onLogout={onLogout}
        activePage="dosenKelompok"
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
          <div className="dk-topbar">
            <div>
              <h2 className="dk-page-title">Kelompok & Nilai</h2>
              <p className="dk-page-sub">
                Kelola anggota kelompok, pantau progress, dan berikan penilaian.
              </p>
            </div>
            <button
              className="dk-btn-primary"
              onClick={() => setCreateModal(true)}
            >
              <span className="material-symbols-outlined">group_add</span>
              Buat Kelompok
            </button>
          </div>

          {/* Stats */}
          <div className="dk-stats-row">
            {[
              {
                label: "Total Kelompok",
                value: groups.length,
                icon: "groups",
                color: "var(--color-secondary)",
              },
              {
                label: "On-Track",
                value: groups.filter((g) => g.status === "On-Track").length,
                icon: "trending_up",
                color: "#2f9696",
              },
              {
                label: "Terlambat",
                value: groups.filter((g) => g.status === "Behind").length,
                icon: "warning",
                color: "#dc2626",
              },
              {
                label: "Selesai",
                value: groups.filter((g) => g.status === "Completed").length,
                icon: "task_alt",
                color: "#059669",
              },
            ].map((s) => (
              <div key={s.label} className="dk-stat-mini">
                <span
                  className="material-symbols-outlined"
                  style={{ color: s.color }}
                >
                  {s.icon}
                </span>
                <div>
                  <p className="dk-stat-val" style={{ color: s.color }}>
                    {loading ? (
                      <span className="skeleton-text" style={{ display: 'inline-block', height: '1.875rem', width: '3rem', margin: 0 }}></span>
                    ) : (
                      s.value
                    )}
                  </p>
                  <p className="dk-stat-lbl">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Groups */}
          <div className="dk-groups-grid">
            {groups.map((group) => {
              const graded = Object.values(group.nilai).filter(
                (v) => v !== "",
              ).length;
              return (
                <div key={group.id} className="dk-group-card">
                  {/* Card Header */}
                  <div
                    className="dk-group-header"
                    style={{ borderLeftColor: group.color }}
                  >
                    <div>
                      <h3 className="dk-group-name">{group.name}</h3>
                      <p className="dk-group-task">
                        <span className="material-symbols-outlined">
                          assignment
                        </span>
                        {group.task}
                      </p>
                      <p className="dk-group-task" style={{ color: "var(--color-secondary)", fontSize: "0.75rem" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>
                          school
                        </span>
                        {group.mataKuliahName || "-"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span
                        className="dk-progress-status"
                        style={{
                          color: statusColor(group.status),
                          background: statusBg(group.status),
                        }}
                      >
                        {group.status}
                      </span>
                      <button
                        className="dk-delete-group-btn"
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                        title="Hapus Kelompok"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0.25rem",
                          borderRadius: "0.375rem",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="dk-group-progress">
                    <div className="dk-progress-hdr">
                      <span>Progress</span>
                      <span
                        style={{
                          color: statusColor(group.status),
                          fontWeight: 800,
                        }}
                      >
                        {group.progress}%
                      </span>
                    </div>
                    <div className="dk-progress-track">
                      <div
                        className="dk-progress-fill"
                        style={{
                          width: `${group.progress}%`,
                          background: group.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Members */}
                  <div className="dk-members-section">
                    <div className="dk-members-hdr">
                      <span className="dk-members-label">
                        Anggota ({group.members.length})
                      </span>
                      <button
                        className="dk-add-member-btn"
                        onClick={() => setAddMemberModal(group.id)}
                      >
                        <span className="material-symbols-outlined">
                          person_add
                        </span>
                        Tambah
                      </button>
                    </div>
                    <div className="dk-members-list">
                      {group.members.map((member) => {
                        const nilai = group.nilai[member.nim];
                        return (
                          <div key={member.nim} className="dk-member-row">
                            <div
                              className="dk-avatar-sm"
                              style={{ background: getMemberColor(member.nim) }}
                            >
                              {initials(member.name)}
                            </div>
                            <div className="dk-member-info">
                              <p className="dk-member-name">{member.name}</p>
                              <p className="dk-member-nim">{member.nim}</p>
                            </div>
                            <div className="dk-member-right">
                              {nilai ? (
                                <span className="dk-nilai-badge">{nilai}</span>
                              ) : (
                                <span className="dk-nilai-badge dk-nilai-badge--empty">
                                  –
                                </span>
                              )}
                              <button
                                className="dk-remove-btn"
                                onClick={() => removeMember(group.id, member.nim)}
                                title="Keluarkan anggota"
                              >
                                <span className="material-symbols-outlined">
                                  person_remove
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {group.members.length === 0 && (
                        <p className="dk-empty-members">Belum ada anggota</p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="dk-group-footer">
                    <div className="dk-submission-info">
                      <span
                        className={`material-symbols-outlined ${group.submitted ? "dk-sub-yes" : "dk-sub-no"}`}
                      >
                        {group.submitted ? "check_circle" : "pending"}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <span className={group.submitted ? "dk-sub-yes" : "dk-sub-no"}>
                          {group.submitted ? "Sudah Dikumpulkan" : "Belum Dikumpulkan"}
                        </span>
                        {group.submitted && group.fileKumpulan && (
                          <a
                            href={`${API_BASE}${group.fileKumpulan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "0.75rem", color: "#4b53bc", display: "flex", alignItems: "center", gap: "0.25rem", textDecoration: "none" }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>download</span>
                            Lihat File
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      className="dk-grade-btn"
                      onClick={() => openNilai(group)}
                    >
                      <span className="material-symbols-outlined">grade</span>
                      Beri Nilai ({graded}/{group.members.length})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
