import React from "react";
import LoadingSpinner from "./LoadingSpinner";

const PAGE_NAMES = {
  dashboard: "Beranda",
  dosenDashboard: "Beranda Dosen",
  daftarMataKuliah: "Daftar Mata Kuliah",
  mataKuliah: "Materi Mata Kuliah",
  daftarTugas: "Daftar Tugas",
  kuis: "Kuis",
  hasilKuis: "Hasil Kuis",
  presensiMahasiswa: "Kehadiran Mahasiswa",
  forumDiskusi: "Forum Diskusi",
  profile: "Profil",
  nilai: "Transkrip Nilai",
  pengumpulanTugas: "Pengumpulan Tugas",
  dosenPresensi: "Presensi Dosen",
  dosenTugas: "Kelola Tugas",
  dosenKelompok: "Kelola Kelompok",
  dosenNilaiIndividu: "Kelola Nilai",
  dosenForum: "Forum Diskusi Dosen",
  dosenProfile: "Profil Dosen",
  dosenMateri: "Kelola Materi",
  faq: "Tanya Jawab (FAQ)",
};

export default function PageTransitionLoader({ targetPage }) {
  const pageDisplayName = Object.hasOwn(PAGE_NAMES, targetPage) ? PAGE_NAMES[targetPage] : "Halaman";
  return (
    <LoadingSpinner
      message={`Memuat halaman ${pageDisplayName.toLowerCase()}...`}
      fullPage={true}
    />
  );
}
