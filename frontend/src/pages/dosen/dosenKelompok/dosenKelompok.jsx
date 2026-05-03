import React, { useState, useEffect } from "react";
import "../../../shared.css";
import "./dosenKelompok.css";
import SidebarDosen from "../../../SidebarDosen";
import { useSidebar } from "../../../useSidebar";
import Navbar from "../../../Navbar";
import { apiClient } from "../../../utils/apiClient";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjoXu55KCdSSPl-2t0t7d2EH6gux6Xz8nZaCdXHePrj-gGn1ZWZyBoOucWc2yVgrhmNFyy8cKbxWH8i9Wm5VKkpqX9jraXjkHTr8PVU1oN3V4nkzLWUUm6nyAIS3hGDic_uY0YoNLNNZluKTKqFwJb2gYlRl9eATGdlXClTx6IXpYvk-2u1qqvfUGTzs-QJPlXTouWTyNYzTe8j8mS09evVA_aHTYfHxneVwUsb2jUygYzuAIDU5KwqO2kISzLvnzaTentePscoGoo";

const ALL_STUDENTS = [
  { id: "S1", name: "Aditya Arisandy", nim: "2021081001", color: "#8991fe" },
  { id: "S2", name: "Bella Puspita", nim: "2021081042", color: "#2f9696" },
  { id: "S3", name: "Dimas Anggara", nim: "2021081056", color: "#c47f17" },
  { id: "S4", name: "Eka Wahyuni", nim: "2021081098", color: "#4b53bc" },
  { id: "S5", name: "Fajar Ramadhan", nim: "2021081073", color: "#059669" },
  { id: "S6", name: "Gina Sari", nim: "2021081089", color: "#dc2626" },
  { id: "S7", name: "Hendra Susanto", nim: "2021081102", color: "#7c3aed" },
  { id: "S8", name: "Indah Permata", nim: "2021081115", color: "#0891b2" },
];

const INITIAL_GROUPS = [];

function initials(name) {
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
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [toast, setToast] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [nilaiModal, setNilaiModal] = useState(null); // group
  const [gradeInputs, setGradeInputs] = useState({});
  const [addMemberModal, setAddMemberModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchGroups = async () => {
    try {
      const res = await apiClient.get('/api/kelompok/1'); // default idMataKuliah = 1
      if (res && res.data) {
        const formatted = res.data.map(g => {
          const membersList = g.anggota ? g.anggota.map(a => a.mahasiswa.nomorInduk) : [];
          const nilaiDict = {};
          if (g.anggota) {
            g.anggota.forEach(a => {
              nilaiDict[a.mahasiswa.nomorInduk] = a.nilai || "";
            });
          }
          return {
            id: g.idKelompok,
            name: g.namaKelompok,
            color: "#4b53bc", // default color
            task: g.tugas?.judul || "–",
            members: membersList,
            progress: 0,
            status: "Not Started",
            submitted: false,
            nilai: nilaiDict
          };
        });
        setGroups(formatted);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const openNilai = (group) => {
    setGradeInputs({ ...group.nilai });
    setNilaiModal(group);
  };

  const saveNilai = () => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === nilaiModal.id ? { ...g, nilai: { ...gradeInputs } } : g,
      ),
    );
    setNilaiModal(null);
    showToast("Nilai berhasil disimpan!");
  };

  const removeMember = async (groupId, studentId) => {
    try {
      await apiClient.delete(`/api/kelompok/${groupId}/members/${studentId}`);
      showToast("Anggota dikeluarkan.");
      fetchGroups();
    } catch (error) {
      showToast("Gagal mengeluarkan", "error");
    }
  };

  const addMember = async (groupId, studentId) => {
    try {
      await apiClient.post(`/api/kelompok/${groupId}/members`, {
        nomorInduk: studentId
      });
      showToast("Anggota berhasil ditambahkan!");
      fetchGroups();
      setAddMemberModal(null);
    } catch (error) {
      showToast("Gagal menambahkan", "error");
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      showToast("Nama kelompok wajib diisi.", "error");
      return;
    }
    try {
      await apiClient.post('/api/kelompok', {
        namaKelompok: newGroupName.trim(),
        idMataKuliah: 1 // default
      });
      setNewGroupName("");
      setCreateModal(false);
      showToast("Kelompok berhasil dibuat!");
      fetchGroups();
    } catch (error) {
      showToast("Gagal membuat kelompok", "error");
    }
  };

  const availableStudents = (groupId) => {
    const group = groups.find((g) => g.id === groupId);
    const inAnyGroup = groups.flatMap((g) => g.members);
    return ALL_STUDENTS.filter(
      (s) => !inAnyGroup.includes(s.nim) || group?.members.includes(s.nim),
    ).filter((s) => !group?.members.includes(s.nim));
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
              {nilaiModal.members.map((sid) => {
                let student = ALL_STUDENTS.find((s) => s.nim === sid);
                if (!student) student = { nim: sid, name: "Mahasiswa", color: "#64748b" }; // fallback
                return (
                  <div key={sid} className="dk-grade-row">
                    <div className="dk-grade-student">
                      <div
                        className="dk-avatar-sm"
                        style={{ background: student.color }}
                      >
                        {initials(student.name)}
                      </div>
                      <div>
                        <p className="dk-grade-name">{student.name}</p>
                        <p className="dk-grade-nim">{student.nim}</p>
                      </div>
                    </div>
                    <div className="dk-grade-input-wrap">
                      <input
                        className="dk-grade-input"
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0-100"
                        value={gradeInputs[sid] ?? ""}
                        onChange={(e) =>
                          setGradeInputs({
                            ...gradeInputs,
                            [sid]: e.target.value,
                          })
                        }
                      />
                      <span className="dk-grade-scale">/100</span>
                      {gradeInputs[sid] && (
                        <span className="dk-letter-grade">
                          {+gradeInputs[sid] >= 85
                            ? "A"
                            : +gradeInputs[sid] >= 70
                              ? "B"
                              : +gradeInputs[sid] >= 55
                                ? "C"
                                : "D"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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
                  <div key={s.id} className="dk-member-option">
                    <div
                      className="dk-avatar-sm"
                      style={{ background: s.color }}
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
                <label className="dk-label">Nama Kelompok</label>
                <input
                  className="dk-input"
                  placeholder="Kelompok Delta..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
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
                    {s.value}
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
                    </div>
                    <span
                      className="dk-progress-status"
                      style={{
                        color: statusColor(group.status),
                        background: statusBg(group.status),
                      }}
                    >
                      {group.status}
                    </span>
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
                      {group.members.map((sid) => {
                        let student = ALL_STUDENTS.find((s) => s.nim === sid);
                        if (!student) student = { nim: sid, name: "Mahasiswa", color: "#64748b" }; // fallback
                        const nilai = group.nilai[sid];
                        return (
                          <div key={sid} className="dk-member-row">
                            <div
                              className="dk-avatar-sm"
                              style={{ background: student.color }}
                            >
                              {initials(student.name)}
                            </div>
                            <div className="dk-member-info">
                              <p className="dk-member-name">{student.name}</p>
                              <p className="dk-member-nim">{student.nim}</p>
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
                                onClick={() => removeMember(group.id, sid)}
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
                      <span
                        className={group.submitted ? "dk-sub-yes" : "dk-sub-no"}
                      >
                        {group.submitted
                          ? "Sudah Dikumpulkan"
                          : "Belum Dikumpulkan"}
                      </span>
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
