# Daftar API LeMaS — Urutan per Sequence Diagram

Base URL: `http://localhost:3000`  
Auth: Header `Authorization: Bearer <token>` (kecuali yang ditandai _public_)

---

## S9 — Log-in / Log-out

| Method | Endpoint          | Auth   | Deskripsi                          |
| ------ | ----------------- | ------ | ---------------------------------- |
| POST   | `/api/auth/login` | Public | Login dengan nomorInduk + password |

**Body login:**

```json
{
  "nomorInduk": "U001",
  "password": "password123"
}
```

---

## S2 — Kelola Anggota (Kelas / Kelompok)

| Method | Endpoint                                 | Auth | Deskripsi                                   |
| ------ | ---------------------------------------- | ---- | ------------------------------------------- |
| GET    | `/api/kelompok`                          | ✅   | Ambil semua kelompok (dosen: filter by NIP) |
| GET    | `/api/kelompok/mahasiswa/all`            | ✅   | Ambil semua mahasiswa                       |
| GET    | `/api/kelompok/:idMataKuliah`            | ✅   | Ambil kelompok per mata kuliah              |
| POST   | `/api/kelompok`                          | ✅   | Buat kelompok baru                          |
| POST   | `/api/kelompok/:idKelompok/members`      | ✅   | Tambah anggota ke kelompok                  |
| DELETE | `/api/kelompok/:idKelompok/members/:nim` | ✅   | Hapus anggota dari kelompok                 |
| PUT    | `/api/kelompok/:idKelompok/grades`       | ✅   | Simpan nilai anggota kelompok               |
| DELETE | `/api/kelompok/:idKelompok`              | ✅   | Hapus kelompok secara permanen (Cascade)    |

**Body POST /api/kelompok:**

```json
{
  "name": "Kelompok 1",
  "idMataKuliah": 1,
  "task": "Proyek Akhir"
}
```

**Body POST /api/kelompok/:id/members:**

```json
{ "nim": "2026001" }
```

---

## S1 — Kelola Tugas

| Method | Endpoint                                     | Auth | Deskripsi                                       |
| ------ | -------------------------------------------- | ---- | ----------------------------------------------- |
| GET    | `/api/dosen/tugas`                           | ✅   | Ambil semua tugas (dosen)                       |
| GET    | `/api/dosen/tugas/mata-kuliah/:idMataKuliah` | ✅   | Ambil tugas per mata kuliah                     |
| POST   | `/api/dosen/tugas`                           | ✅   | Buat tugas baru (multipart/form-data)           |
| PUT    | `/api/dosen/tugas/:id`                       | ✅   | Update tugas                                    |
| DELETE | `/api/dosen/tugas/:id`                       | ✅   | Hapus tugas                                     |
| GET    | `/api/tugas`                                 | ✅   | Ambil daftar tugas (mahasiswa)                  |
| GET    | `/api/tugas/:id`                             | ✅   | Detail tugas + status pengumpulan               |
| GET    | `/api/kuis`                                  | ✅   | Ambil semua kuis (dosen management)             |
| GET    | `/api/kuis/mata-kuliah/:idMataKuliah`        | ✅   | Ambil kuis per mata kuliah (mahasiswa)          |
| GET    | `/api/kuis/:idKuis/detail`                   | ✅   | Detail kuis + soal + jawaban benar (dosen edit) |
| GET    | `/api/kuis/:idKuis/soal`                     | ✅   | Daftar soal kuis (mahasiswa mengerjakan)        |
| POST   | `/api/kuis`                                  | ✅   | Buat kuis baru + soal (dosen)                   |
| PUT    | `/api/kuis/:idKuis`                          | ✅   | Update kuis + soal (dosen)                      |
| DELETE | `/api/kuis/:idKuis`                          | ✅   | Hapus kuis (dosen)                              |
| POST   | `/api/kuis/:idKuis/submit`                   | ✅   | Submit jawaban kuis (mahasiswa)                 |
| GET    | `/api/kuis/:idKuis/status`                   | ✅   | Cek status pengerjaan kuis (mahasiswa)          |

**Body POST /api/dosen/tugas (form-data):**

```
judul        : Website Portfolio
detailTugas  : Buat website portfolio...
deadlineTugas: 2026-06-01T23:59:00.000Z
tipeTugas    : Individu
idMataKuliah : 13
fileTugas    : (file, opsional)
```

---

## S3 — Kelola Deadline

> Deadline diatur saat buat / update tugas. Tidak ada endpoint terpisah.

| Method | Endpoint               | Auth | Deskripsi                         |
| ------ | ---------------------- | ---- | --------------------------------- |
| POST   | `/api/dosen/tugas`     | ✅   | Buat tugas + set deadline         |
| PUT    | `/api/dosen/tugas/:id` | ✅   | Update deadline tugas             |
| GET    | `/api/tugas/:id`       | ✅   | Cek deadline + status (mahasiswa) |

---

## S5 — Upload Tugas

| Method | Endpoint                               | Auth | Deskripsi                             |
| ------ | -------------------------------------- | ---- | ------------------------------------- |
| POST   | `/api/tugas/:idTugas/submit`           | ✅   | Upload file jawaban tugas (multipart) |
| GET    | `/api/tugas/:idTugas/submission`       | ✅   | Cek status pengumpulan mahasiswa      |
| DELETE | `/api/tugas/submission/:idPengumpulan` | ✅   | Hapus pengumpulan                     |

**Body POST /api/tugas/:idTugas/submit (form-data):**

```
file       : (file PDF/DOC/ZIP)
catatan    : Berikut terlampir jawaban tugas
```

---

## S4 — Monitoring Progress

| Method | Endpoint                                         | Auth | Deskripsi                                 |
| ------ | ------------------------------------------------ | ---- | ----------------------------------------- |
| GET    | `/api/materi/mata-kuliah/:idMataKuliah`          | ✅   | Ambil materi + status sudah/belum diakses |
| POST   | `/api/materi/:idModulAjar/access`                | ✅   | Tandai materi sudah diakses               |
| GET    | `/api/materi/mata-kuliah/:idMataKuliah/progress` | ✅   | Ringkasan progress materi (%)             |
| GET    | `/api/dashboard`                                 | ✅   | Dashboard mahasiswa (progress tugas, IPK) |
| GET    | `/api/dosen/dashboard`                           | ✅   | Dashboard dosen                           |

---

## S6 — Presensi

| Method | Endpoint                                                   | Auth | Deskripsi                             |
| ------ | ---------------------------------------------------------- | ---- | ------------------------------------- |
| POST   | `/api/dosen/presensi/matkul/:idMataKuliah/generate`        | ✅   | Generate sesi presensi + token QR     |
| GET    | `/api/dosen/presensi/matkul/:idMataKuliah/daftar-hadir`    | ✅   | Daftar hadir terbaru                  |
| GET    | `/api/dosen/presensi/daftar-hadir/:idMataKuliah/:tanggal`  | ✅   | Daftar hadir per tanggal              |
| GET    | `/api/dosen/presensi/dates/:idMataKuliah`                  | ✅   | Semua tanggal presensi yang tersedia  |
| PUT    | `/api/dosen/presensi/:idPresensi/status`                   | ✅   | Update status kehadiran by idPresensi |
| PUT    | `/api/dosen/presensi/nim/:nim/matkul/:idMataKuliah/status` | ✅   | Update status kehadiran by NIM        |
| POST   | `/api/presensi/scan`                                       | ✅   | Mahasiswa scan QR Code                |
| GET    | `/api/presensi/mahasiswa/:idMataKuliah`                    | ✅   | Rekap presensi mahasiswa              |
| GET    | `/api/presensi/summary/:idMataKuliah`                      | ✅   | Summary presensi per mata kuliah      |

**Body POST /api/dosen/presensi/matkul/:id/generate:**

```json
{ "tanggal": "2026-05-15" }
```

**Body POST /api/presensi/scan:**

```json
{ "token": "LeMaS-1234567890-abc123", "idMataKuliah": 13 }
```

**Body PUT status:**

```json
{ "statusKehadiran": "Hadir" }
```

---

## S7 — Penilaian

| Method | Endpoint                                | Auth | Deskripsi                                                  |
| ------ | --------------------------------------- | ---- | ---------------------------------------------------------- |
| GET    | `/api/nilai/tugas-list/:idMataKuliah`   | ✅   | Daftar tugas unik per mata kuliah (dosen)                  |
| GET    | `/api/nilai/submissions/tugas/:idTugas` | ✅   | List mahasiswa + status kumpul per tugas                   |
| POST   | `/api/nilai/submissions/nilai`          | ✅   | Simpan nilai tugas individu                                |
| GET    | `/api/nilai/mata-kuliah/:idMataKuliah`  | ✅   | Nilai per mata kuliah                                      |
| GET    | `/api/nilai/transkrip/mahasiswa`        | ✅   | Transkrip nilai mahasiswa                                  |
| PATCH  | `/api/nilai/:id`                        | ✅   | Update nilai (UTS/UAS/Akhir)                               |
| GET    | `/api/kuis/:idKuis/hasil`               | ✅   | Hasil kuis mahasiswa (skor + detail jawaban, read-only 🔒) |

**Body POST /api/nilai/submissions/nilai:**

```json
{
  "nim": "2026001",
  "idMataKuliah": 13,
  "nilaiTugas": 88
}
```

---

## S8 — Diskusi (Forum)

| Method | Endpoint                               | Auth   | Deskripsi                           |
| ------ | -------------------------------------- | ------ | ----------------------------------- |
| GET    | `/api/forum/mata-kuliah/:idMataKuliah` | ✅     | Ambil semua thread forum per matkul |
| POST   | `/api/forum/thread`                    | ✅     | Buat thread forum baru              |
| PUT    | `/api/forum/thread/:idForumDiskusi`    | ✅     | Edit thread forum                   |
| DELETE | `/api/forum/thread/:idForumDiskusi`    | ✅     | Hapus thread forum                  |
| POST   | `/api/forum/comment`                   | ✅     | Tambah komentar                     |
| GET    | `/api/forum/comment/:idKomentar`       | Public | Ambil komentar by ID                |
| PUT    | `/api/forum/comment/:idKomentar`       | ✅     | Edit komentar                       |
| DELETE | `/api/forum/comment/:idKomentar`       | ✅     | Hapus komentar                      |
| POST   | `/api/forum/like`                      | ✅     | Toggle like forum                   |

**Body POST /api/forum/thread:**

```json
{
  "idMataKuliah": 13,
  "judul": "Diskusi Pertemuan 1",
  "isiForum": "Silakan bertanya mengenai materi React..."
}
```

**Body POST /api/forum/comment:**

```json
{
  "idForum": 1,
  "isiKomentar": "Terima kasih materinya sangat membantu!"
}
```

**Body POST /api/forum/like:**

```json
{ "idForum": 1 }
```

---

## Endpoint Tambahan (Pendukung)

| Method | Endpoint           | Auth   | Deskripsi                   |
| ------ | ------------------ | ------ | --------------------------- |
| GET    | `/api/mata-kuliah` | ✅     | Daftar mata kuliah          |
| GET    | `/ping`            | Public | Health check server         |
| GET    | `/api/notifikasi`  | ✅     | Daftar notifikasi mahasiswa |
| GET    | `/api/profile`     | ✅     | Profil user                 |
