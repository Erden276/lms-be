# Struktur dan Penjelasan Frontend LMS

Dokumen ini memberikan penjelasan lengkap mengenai struktur folder, fungsi setiap file utama, library yang digunakan, dan cara kerja pemanggilan API pada bagian frontend dari aplikasi Learning Management System (LMS) ini.

## 1. Library yang Digunakan (berdasarkan `package.json`)

Aplikasi frontend ini dibangun menggunakan **React** dengan **Vite** sebagai bundler. Berikut adalah daftar library utama yang digunakan beserta fungsinya:

- **`react` & `react-dom`**: Library utama untuk membangun antarmuka pengguna (UI).
- **`@vitejs/plugin-react` & `vite`**: Tooling untuk menjalankan server pengembangan lokal yang cepat dan melakukan build untuk production.
- **`@google/generative-ai`**: Library untuk mengintegrasikan fitur kecerdasan buatan dari Google Gemini (mungkin digunakan untuk chatbot FAQ atau asisten di LMS).
- **`html5-qrcode`**: Digunakan untuk membaca atau memindai QR Code, sangat berguna untuk fitur presensi mahasiswa dengan QR Code.
- **`pdfjs-dist`**: Digunakan untuk membaca, mengekstrak, atau menampilkan dokumen berformat PDF (biasanya untuk membaca materi atau tugas).
- **`mammoth`**: Library untuk mengekstrak teks dari dokumen Word (`.docx`), sering digunakan untuk membaca konten dari file yang diunggah.
- **`xlsx`**: Digunakan untuk membaca atau membuat file Excel, berguna untuk mengekspor atau mengimpor nilai/presensi.
- **`dompurify`**: Digunakan untuk men-sanitize (membersihkan) HTML untuk mencegah serangan XSS (Cross-Site Scripting) ketika merender konten HTML dinamis, seperti isi forum atau deskripsi tugas.

## 2. Struktur Folder `src/`

Folder `src/` adalah tempat di mana seluruh kode sumber React berada.

### `src/assets/`
Menyimpan file statis seperti gambar.
- **`logo.png`**: Logo aplikasi yang ditampilkan di halaman (seperti Navbar atau Login).

### `src/components/`
Menyimpan komponen-komponen React yang dapat digunakan ulang (reusable) di berbagai halaman.
- **`Navbar.jsx`**: Bilah navigasi atas (top navigation) yang biasanya berisi profil pengguna, notifikasi, dll.
- **`Sidebar.jsx` & `SidebarDosen.jsx`**: Navigasi samping untuk mahasiswa dan dosen. Berisi menu-menu utama sesuai dengan role masing-masing.
- **`useSidebar.js`**: Custom hook (Logika React) untuk mengatur state/perilaku dari Sidebar (buka/tutup).
- **`LoadingSpinner.jsx` & `LoadingSpinner.css`**: Komponen animasi loading saat data sedang diambil (fetching) dari API.
- **`PageTransitionLoader.jsx`**: Animasi transisi yang muncul saat berpindah antar halaman.
- **`shared.css`**: File CSS yang menyimpan gaya (style) global yang digunakan oleh banyak komponen bersamaan.

### `src/pages/`
Menyimpan komponen-komponen yang bertindak sebagai halaman utama (views) yang dirender berdasarkan rute (URL). Folder ini dibagi menjadi beberapa domain besar:

- **`auth/`**: Mengelola halaman autentikasi.
  - `login/`: Halaman untuk masuk ke dalam sistem.
- **`dosen/`**: Kumpulan halaman khusus untuk role Dosen.
  - `dashboardDosen/`: Halaman utama/beranda setelah dosen login.
  - `dosenForum/`, `dosenKelompok/`, `dosenMateri/`, `dosenTugas/`, `dosenNilaiIndividu/`: Halaman-halaman untuk mengelola pembelajaran (materi, tugas, forum diskusi, pembagian kelompok, penilaian).
  - `dosenPresensi/`: Halaman untuk mengelola dan membuka sesi presensi (misal: generate QR Code).
  - `dosenProfile/`: Halaman profil dosen.
- **`mahasiswa/`**: Kumpulan halaman khusus untuk role Mahasiswa.
  - `dashboard/`: Halaman utama mahasiswa.
  - `daftarMataKuliah/`, `mataKuliah/`: Halaman untuk melihat mata kuliah yang diambil.
  - `daftarTugas/`, `pengumpulanTugas/`: Halaman untuk melihat detail tugas dan mengunggah/mengumpulkan tugas.
  - `forumDiskusi/`, `kuis/`, `nilai/`: Halaman untuk interaksi pembelajaran mahasiswa.
  - `presensiMahasiswa/`: Halaman untuk melakukan presensi (misal: scan QR Code yang diberikan dosen).
  - `profile/`: Halaman profil mahasiswa.
- **`faq/`**: 
  - `faq.jsx` & `faq.css`: Halaman Frequently Asked Questions, di sinilah library AI (Google Gemini) kemungkinan diimplementasikan untuk menjawab pertanyaan mahasiswa secara dinamis.

### `src/utils/`
Menyimpan fungsi-fungsi bantuan (helper) atau konfigurasi teknis yang bukan berbentuk UI.
- **`apiClient.js`**: File ini adalah tulang punggung komunikasi antara Frontend (React) dengan Backend (API). (Penjelasan lebih rinci ada di bagian bawah).
- **`extractor.js`**: Berisi fungsi-fungsi utilitas untuk mengekstrak data atau teks dari berbagai format file (menggunakan library `mammoth`, `pdfjs-dist`, `xlsx` seperti yang disebutkan di atas) sebelum dikirim ke server atau diproses di UI.

### File Root di `src/`
- **`App.jsx` & `App.css`**: Komponen akar dari struktur komponen React. Biasanya di sinilah routing (react-router-dom) didefinisikan untuk memetakan URL ke komponen halaman (`pages/`).
- **`main.jsx`**: File *entry point* utama yang dirender pertama kali oleh browser. Menghubungkan komponen React (`App.jsx`) ke dalam struktur HTML (`index.html`).
- **`index.css`**: Gaya global dasar.

## 3. Sistem Pemanggilan API (`apiClient.js`)

Aplikasi ini tidak menggunakan library `axios`, melainkan mengandalkan API bawaan JavaScript yaitu **`fetch`**, namun dibungkus (wrapped) secara rapi di dalam file `src/utils/apiClient.js`.

### Alur Kerja `apiClient.js`:

1. **Konfigurasi URL Dasar (Base URL)**
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || "";
   ```
   Mengambil URL backend dari environment variable. Jika tidak diset, maka akan menggunakan relative path (biasanya diatur lewat Proxy di `vite.config.js`).

2. **Pengaturan Header & Autentikasi (`getAuthHeaders`)**
   ```javascript
   const token = localStorage.getItem("token");
   ```
   Setiap kali ada request ke API (baik itu mengambil data kelas, nilai, dll), `apiClient` akan otomatis mencari token autentikasi di `localStorage` (yang didapat saat login). Token ini akan disisipkan ke dalam header `Authorization: Bearer <token>`. Hal ini membuat sistem aman dan hanya pengguna yang sudah login yang bisa mengakses data.

3. **Penanganan Respon Otomatis (`handleResponse`)**
   - Jika response dari server sukses (status 200-299), fungsi akan mengembalikan data berformat JSON.
   - **Token Kedaluwarsa (401 Unauthorized)**: Jika backend merespon `401`, fungsi ini akan otomatis menghapus `token` dan `user` dari `localStorage`, lalu melakukan reload halaman (`window.location.reload()`), yang mana akan memaksa pengguna kembali ke halaman Login.
   - **Penanganan Error**: Jika terjadi error (seperti 400, 404, 500), pesan error yang dikirim oleh backend akan ditangkap dan diubah menjadi *Exception* di Javascript sehingga mudah ditampilkan sebagai peringatan (alert/toast) di komponen UI.

4. **Metode yang Disediakan**
   `apiClient` mengekspor objek yang berisi fungsi-fungsi untuk setiap metode HTTP:
   - `apiClient.get(endpoint)`: Mengambil data dari server (contoh: mengambil daftar mahasiswa).
   - `apiClient.post(endpoint, body)`: Mengirim data baru ke server (contoh: login, mengumpulkan tugas). Fungsi ini cerdas karena dapat mendeteksi apakah data yang dikirim berupa teks biasa (JSON) atau berupa file (`FormData`), lalu mengatur `Content-Type` header secara otomatis.
   - `apiClient.put(endpoint, body)` / `apiClient.patch`: Mengubah/update data yang sudah ada di server.
   - `apiClient.delete(endpoint)`: Menghapus data dari server.

### Daftar Seluruh API Endpoints yang Dipanggil

Berdasarkan ekstraksi langsung dari kode sumber frontend, berikut adalah daftar seluruh (sekitar 60+) pemanggilan endpoint API yang dikelompokkan berdasarkan fiturnya:

**1. Autentikasi & Profil**
- `/api/auth/login`
- `/api/profile/me`
- `/api/profile/change-password`
- `/api/profile/photo`
- `/api/dosen/profile/profile`

**2. Dashboard**
- `/api/dashboard/mahasiswa` (dengan parameter `?hari=...`)
- `/api/dosen/dashboard`

**3. Mata Kuliah**
- `/api/mata-kuliah`
- `/api/mata-kuliah/:idMataKuliah`
- `/api/mata-kuliah/mahasiswa/me`

**4. Materi & Modul Ajar**
- `/api/modul-ajar` (GET, POST)
- `/api/modul-ajar/:id` (PUT, DELETE)
- `/api/modul-ajar/:id/download`
- `/api/materi/mata-kuliah/:idMataKuliah`
- `/api/materi/mata-kuliah/:idMataKuliah/progress`
- `/api/materi/:id/access`

**5. Tugas**
- `/api/tugas`
- `/api/tugas?idMataKuliah=...`
- `/api/tugas/:taskId` (GET detail tugas)
- `/api/tugas/:taskId/submit` (POST kumpul tugas)
- `/api/dosen/tugas` (GET, POST, PUT)
- `/api/dosen/tugas/:id` (DELETE)

**6. Kuis**
- `/api/kuis` (GET, POST)
- `/api/kuis/:id` (PUT, DELETE)
- `/api/kuis/mata-kuliah/:idMataKuliah`
- `/api/kuis/:idKuis/detail`
- `/api/kuis/:idKuis/soal`
- `/api/kuis/:idKuis/status`
- `/api/kuis/:idKuis/submit`
- `/api/kuis/:idKuis/hasil`

**7. Kelompok**
- `/api/kelompok` (GET, POST)
- `/api/kelompok/:id` (PUT, DELETE)
- `/api/kelompok/mahasiswa/all`
- `/api/kelompok/:groupId/members`
- `/api/kelompok/:groupId/members/:studentId`
- `/api/kelompok/:id/grades`

**8. Penilaian (Grades)**
- `/api/nilai/submissions/nilai`
- `/api/nilai/submissions/tugas/:idTugas`
- `/api/nilai/transkrip/mahasiswa`
- `/api/nilai/tugas-list/:idMataKuliah`

**9. Presensi Kehadiran**
- `/api/presensi/scan` (POST scan QR)
- `/api/presensi/mahasiswa/:idKelas`
- `/api/dosen/presensi/dates/:idMatkul`
- `/api/dosen/presensi/matkul/:idMatkul/generate` (POST QR)
- `/api/dosen/presensi/matkul/:idMatkul/daftar-hadir`
- `/api/dosen/presensi/daftar-hadir/:idMatkul/:tanggal`
- `/api/dosen/presensi/nim/:nim/matkul/:idMatkul/status` (PUT update manual)

**10. Forum Diskusi**
- `/api/forum/mata-kuliah/:id`
- `/api/forum/thread`
- `/api/forum/comment`
- `/api/forum/like`
- `/api/forum/upload-image`
- `/api/dosen/forum/`
- `/api/dosen/forum/mata-kuliah/:id`
- `/api/dosen/forum/:threadId/reply`
- `/api/dosen/forum/:threadId/like`

**11. Notifikasi**
- `/api/notifikasi`
- `/api/notifikasi/unread-count`
- `/api/notifikasi/read-all`
- `/api/notifikasi/:id/read`

### Contoh Pemakaian di Komponen/Halaman:
Jika sebuah halaman ingin mengambil data profil dosen, kodenya kurang lebih akan terlihat seperti ini (tanpa perlu repot mengatur token JWT secara manual tiap kali request):
```javascript
import { apiClient } from '../../utils/apiClient';

// Di dalam fungsi/useEffect
try {
  const data = await apiClient.get('/api/dosen/profile');
  setProfileData(data);
} catch (error) {
  console.error("Gagal mengambil profil:", error.message);
}
```
