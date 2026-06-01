<h1 align="center">STANDAR DOKUMENTASI & RENCANA PENGUJIAN (TEST PLAN)</h1>
<p align="center"><b>Panduan Terintegrasi: DFD Level 1, Sequence Diagram, dan Testing</b></p>
<p align="center"><i>Proyek: LE-MAS (LEARNING MANAGEMENT SYSTEM)</i></p>

## 1. STANDAR INSTALLATION MANUAL
---

Mahasiswa wajib mendetailkan proses setup aplikasi agar dapat dijalankan oleh penguji atau pengguna lain.

*(Berikut adalah detail instalasi untuk aplikasi LeMaS:)*

### 1.1 System Requirements (Spesifikasi Sistem)
Untuk menjalankan aplikasi LeMaS dengan optimal, sistem Anda disarankan memenuhi kriteria minimum berikut:

#### A. Spesifikasi Hardware (Minimum):
*   **Processor:** Intel Core i3 / AMD Ryzen 3 (Dual-core 2.0 GHz) atau lebih tinggi.
*   **RAM:** 4 GB (direkomendasikan 8 GB untuk kelancaran pengerjaan kompilasi Node.js dan service database PostgreSQL secara bersamaan).
*   **Storage:** Minimal 10 GB ruang penyimpanan kosong (disarankan menggunakan SSD).
*   **Kamera / Webcam:** Diperlukan bagi perangkat mahasiswa yang akan melakukan pemindaian QR Code presensi secara langsung.

#### B. Spesifikasi Software & Lingkungan (Environment):
*   **Node.js:** Versi LTS terbaru (v18.x atau v20.x).
*   **Package Manager:** npm v9.x atau v10.x (otomatis terinstall bersama Node.js).
*   **Database Engine:** PostgreSQL v14.x / v15.x / v16.x (case-sensitive).
*   **ORM Tooling:** Prisma Client & CLI v5.x.
*   **Web Browser:** Google Chrome (versi 110+), Mozilla Firefox (versi 110+), atau Microsoft Edge (versi 110+) dengan izin akses Kamera aktif.

---

### 1.2 Environment Setup & Konfigurasi File `.env`

Aplikasi LeMaS terbagi menjadi dua bagian: **Backend (Express.js + Prisma)** dan **Frontend (React.js + Vite)**. Masing-masing direktori membutuhkan file `.env` untuk menyimpan konfigurasi keamanan dan koneksi.

#### A. Konfigurasi Backend (`lms-be/.env`)
Buat file bernama `.env` di dalam root direktori backend (`lms-be/`) dan masukkan konfigurasi berikut:
```env
PORT_APP="3000"
DATABASE_URL="postgresql://postgres:password_anda@localhost:5432/lemes?schema=public"
JWT_SECRET="masukkan_rahasia_jwt_anda_disini"
FRONTEND_URL="http://localhost:5173"
```
> [!NOTE]
> Ganti kata sandi `password_anda`, host `localhost:5432`, dan nama database `lemes` sesuai dengan kredensial PostgreSQL lokal di komputer Anda.

#### B. Konfigurasi Frontend (`frontend/.env`)
Buat file bernama `.env` di dalam root direktori frontend (`frontend/`) dan masukkan konfigurasi berikut:
```env
VITE_GEMINI_API_KEY="masukkan_api_key_gemini_anda_disini"
VITE_API_URL="http://localhost:3000"
```

---

### 1.3 Database Deployment (Migrasi Database dengan Prisma)
Prisma ORM digunakan untuk melakukan deployment dan sinkronisasi skema database ke PostgreSQL:

1.  Buka terminal atau PowerShell, lalu arahkan ke direktori backend:
    ```powershell
    cd "c:\Users\Firman\Documents\Kuliah\Tugas kuliah\Semester 4\Implementasi perancangan perangkat lunak\Learning_Management_System\lms-be"
    ```
2.  Install seluruh package dan dependensi backend yang terdaftar di `package.json`:
    ```powershell
    npm install
    ```
3.  Jalankan perintah migrasi skema database Prisma ke PostgreSQL lokal Anda (perintah ini akan otomatis membaca file schema di `prisma/schema.prisma` dan membuat seluruh tabel database seperti `Kelompok`, `AnggotaKelompok`, `Tugas`, `Nilai`, dll.):
    ```powershell
    npx prisma migrate dev --name init
    ```
4.  Jalankan perintah seeding untuk memasukkan data awal (*seed data* bawaan seperti akun Dosen, Mahasiswa, Admin, serta daftar mata kuliah default):
    ```powershell
    npx prisma db seed
    ```

---

### 1.4 Execution (Cara Menjalankan Aplikasi)

#### A. Cara Menjalankan Backend Server:
1.  Buka terminal baru di direktori `lms-be/`.
2.  Jalankan perintah berikut untuk mengaktifkan server backend:
    ```powershell
    npm start
    ```
    Server backend akan berjalan aktif di alamat **`http://localhost:3000`**.

#### B. Cara Menjalankan Frontend Server:
1.  Buka terminal baru di direktori `frontend/`.
2.  Install dependensi frontend jika belum pernah dijalankan sebelumnya:
    ```powershell
    npm install
    ```
3.  Jalankan server development lokal React:
    ```powershell
    npm run dev
    ```
    Server development frontend akan berjalan aktif di alamat **`http://localhost:5173`**. Silakan buka alamat tersebut di browser Anda.

## 2. BACKEND TEST PLAN (Berdasarkan Sequence Diagram)
---

Pengujian backend dilakukan menggunakan Postman dengan aturan **Traceability** sebagai berikut:

| Komponen Desain | Implementasi Testing |
| :--- | :--- |
| **1 Sequence Diagram** | Setara dengan 1 folder Collection atau alur proses di Postman. |
| **Semua Method di Diagram** | Setiap pemanggilan method (call) dalam diagram harus diuji endpoint-nya. |
| **Return Value** | Hasil balik di diagram divalidasi pada bagian "Tests" di Postman (Response Body). |

### 2.2 Penulisan Script Validasi Otomatis (Tests) di Postman

Guna memastikan response backend sesuai ekspektasi, script validasi otomatis diimplementasikan pada setiap request Postman:

#### A. Contoh Validasi Status Code Sukses (HTTP 200 OK):
```javascript
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
```

#### B. Contoh Validasi Payload Login JWT & Penyimpanan Token Otomatis:
Digunakan pada folder **S9 - Auth** untuk mengambil token hasil login secara dinamis dan menyimpannya sebagai variabel koleksi agar dapat digunakan oleh request berikutnya:
```javascript
pm.test("Login berhasil dan mengembalikan token JWT", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("token");
    pm.expect(jsonData.user).to.have.property("role");
    
    // Menyimpan token ke variabel koleksi Postman
    pm.collectionVariables.set("token", jsonData.token);
});
```

#### C. Contoh Validasi Penghapusan Kelompok (S2 - Cascade Delete):
Script untuk memvalidasi bahwa kelompok berhasil dihapus secara permanen beserta seluruh dependensi datanya:
```javascript
pm.test("Kelompok berhasil dihapus secara permanen", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.include("berhasil dihapus");
});
```

## 3. USABILITY TEST PLAN (Berdasarkan DFD Level 1)
---

Pengujian ini ditujukan untuk user non-teknis guna memvalidasi alur bisnis yang didefinisikan pada DFD Level 1.
*   **Skenario Uji:** Setiap proses di DFD Level 1 (misal: Proses 1.0 Registrasi) diturunkan menjadi 1 *Task* untuk pengguna.
*   **Target Peserta:** Minimal 3-5 orang yang merepresentasikan end-user (bukan developer).
*   **Metrik:**
    *   *Completion Rate*: Apakah user berhasil menyelesaikan alur sesuai DFD?
    *   *Error Rate*: Berapa kali user mengalami kendala navigasi?

*(Berikut adalah rincian skenario dan metrik pengujian yang telah disesuaikan untuk aplikasi LeMaS:)*

### 3.1 Skenario Uji (User Task Scenarios)
Setiap proses utama pada DFD Level 1 diturunkan menjadi skenario tugas dunia nyata yang harus diselesaikan oleh peserta uji:

*   **Skenario Uji 9.0 (Login & Auth):**
    *   *Dosen/Mahasiswa* melakukan login ke platform LeMaS menggunakan Nomor Induk (NIP/NIM) dan password default, memverifikasi kesesuaian role pada dashboard, dan melakukan logout setelah selesai.
*   **Skenario Uji 1.0 (Kelola Tugas & Kuis):**
    *   *Dosen* membuat tugas reguler baru (mengunggah instruksi file PDF) dan membuat kuis online baru yang berisi beberapa soal pilihan ganda di portal Dosen.
*   **Skenario Uji 2.0 (Kelola Anggota & Hapus Kelompok):**
    *   *Dosen* mengelompokkan mahasiswa secara acak, menambahkan anggota kelompok berdasarkan NIM, dan menghapus salah satu kelompok kelas menggunakan tombol hapus berikon tong sampah merah dengan mengklik modal konfirmasi merah soft.
*   **Skenario Uji 3.0 (Kelola Deadline):**
    *   *Dosen* memperpanjang deadline tugas kuis yang telah terlewat agar mahasiswa yang belum mengerjakan dapat kembali mengakses tugas tersebut.
*   **Skenario Uji 5.0 (Upload Tugas & Pengerjaan Kuis):**
    *   *Mahasiswa* mengunggah dokumen jawaban tugas reguler (PDF) dan menyelesaikan pengerjaan kuis online pilihan ganda di halaman tugas sebelum batas waktu terlewati.
*   **Skenario Uji 4.0 (Monitoring Progress):**
    *   *Mahasiswa* mengakses modul ajar materi yang diunggah dosen. Sistem mencatat penanda akses materi, dan mahasiswa memantau persentase progress belajar mereka pada progress bar di dashboard utama.
*   **Skenario Uji 6.0 (Presensi QR Code):**
    *   *Dosen* membuka sesi kehadiran kelas untuk memunculkan QR Code presensi berdurasi 15 menit. *Mahasiswa* memindai QR Code tersebut menggunakan kamera browser di HP untuk mencatatkan kehadirannya secara otomatis.
*   **Skenario Uji 7.0 (Penilaian & Download Transkrip):**
    *   *Dosen* menginput nilai tugas reguler mahasiswa, memantau rekap skor kuis otomatis (permanen), dan *Mahasiswa* melihat rekap nilai dan mengunduh transkrip nilai akademik berformat PDF.
*   **Skenario Uji 8.0 (Forum Diskusi):**
    *   *Dosen/Mahasiswa* membuat thread diskusi mata kuliah baru, menyukai (*like*) postingan forum, dan menuliskan komentar tanggapan diskusi kelas.

### 3.2 Target Peserta Pengujian
*   **Dosen (3 Orang):** Dosen pengampu mata kuliah aktif dengan tingkat literasi komputer menengah.
*   **Mahasiswa (5 Orang):** Mahasiswa aktif di kelas dengan tingkat kebiasaan menggunakan gawai/ponsel pintar yang tinggi.

### 3.3 Metrik Pengukuran Usability
Untuk mengukur keberhasilan tingkat kegunaan antarmuka aplikasi, metrik berikut dicatat secara kuantitatif:
1.  **Completion Rate (Tingkat Keberhasilan):** Persentase skenario tugas yang berhasil diselesaikan secara mandiri oleh peserta tanpa intervensi pengembang (Target: **> 90%**).
2.  **Error Rate (Tingkat Kesalahan):** Jumlah kesalahan navigasi, mis-klik, atau kegagalan aksi yang dilakukan pengguna selama mencoba menyelesaikan satu skenario (Target: **< 2 kali per skenario**).
3.  **System Usability Scale (SUS Score):** Skor kuisioner subjektif berisi 10 pertanyaan standar yang diisi peserta pasca-pengujian (Target: **Skor > 75** dengan kategori *Good/Excellent*).

## 4. MATRIKS PENYELARASAN (Traceability Matrix)
---

| ID DFD 1 | Nama Sequence Diagram | Method Backend (Postman) | Skenario Usability |
| :--- | :--- | :--- | :--- |
| **1.0** | `S1 - Kelola Tugas` | `GET /api/dosen/tugas`<br>`POST /api/dosen/tugas`<br>`PUT /api/dosen/tugas/:id`<br>`DELETE /api/dosen/tugas/:id`<br>`GET /api/kuis`<br>`POST /api/kuis`<br>`PUT /api/kuis/:id`<br>`DELETE /api/kuis/:id` | **Dosen** mengelola (membuat, mengubah, menghapus) penugasan reguler serta menyusun soal kuis online interaktif untuk kelas perkuliahan. |
| **2.0** | `S2 - Kelola Anggota` | `POST /api/kelompok`<br>`POST /api/kelompok/:id/members`<br>`DELETE /api/kelompok/:id/members/:nim`<br>`DELETE /api/kelompok/:id` *(Hapus Kelompok)* | **Dosen** membuat kelompok belajar baru di kelas, menginput mahasiswa ke dalam kelompok, dan menghapus kelompok secara permanen (*cascade delete*). |
| **3.0** | `S3 - Kelola Deadline` | `PUT /api/dosen/tugas/:id` *(Update deadline)*<br>`GET /api/tugas/:id` *(Validasi waktu)* | **Dosen** memperpanjang batas waktu pengerjaan tugas/kuis online, dan **Mahasiswa** memverifikasi tombol pengerjaan tugas yang kembali terbuka secara dinamis. |
| **4.0** | `S4 - Monitoring Progress` | `GET /api/materi/mata-kuliah/:idMataKuliah`<br>`POST /api/materi/:idModulAjar/access`<br>`GET /api/materi/mata-kuliah/:idMataKuliah/progress`<br>`GET /api/modul-ajar`<br>`POST /api/modul-ajar`<br>`PUT /api/modul-ajar/:id`<br>`DELETE /api/modul-ajar/:id` | **Mahasiswa** membuka/mengunduh modul ajar materi kuliah. Sistem mencatat progress membaca, dan menampilkan diagram persentase progress belajar di dashboard. |
| **5.0** | `S5 - Upload Tugas` | `POST /api/tugas/:idTugas/submit` *(Upload Jawaban)*<br>`POST /api/kuis/:idKuis/submit` *(Submit Kuis)* | **Mahasiswa** mengunggah file dokumen jawaban tugas (PDF/Word/Zip) atau menyelesaikan kuis online pilihan ganda langsung dari antarmuka halaman kuis. |
| **6.0** | `S6 - Presensi` | `POST /api/dosen/presensi/matkul/:idMataKuliah/generate` *(Generate QR)*<br>`POST /api/presensi/scan` *(Pindai QR)*<br>`PUT /api/dosen/presensi/nim/:nim/matkul/:idMataKuliah/status` *(Ubah Status)* | **Dosen** mengaktifkan sesi presensi (QR Code muncul), **Mahasiswa** memindai QR Code untuk absen otomatis, dan Dosen mengubah kehadiran manual jika sakit/izin. |
| **7.0** | `S7 - Penilaian` | `POST /api/nilai/submissions/nilai`<br>`GET /api/nilai/transkrip/mahasiswa`<br>`GET /api/kuis/:idKuis/hasil` *(🔒 Read-only)* | **Dosen** menginput nilai tugas mahasiswa, memantau rekap skor kuis otomatis (permanen), dan **Mahasiswa** mencetak/mengunduh transkrip nilai akademik PDF. |
| **8.0** | `S8 - Diskusi` | `POST /api/forum/thread`<br>`POST /api/forum/comment`<br>`POST /api/forum/like` | **Dosen & Mahasiswa** membuat topik diskusi perkuliahan baru, menanggapi forum kelas dengan memberikan komentar, serta menyukai (*like*) topik bahasan. |
| **9.0** | `S9 - Log-in dan Log-out` | `POST /api/auth/login`<br>`POST /api/auth/logout` | **Dosen & Mahasiswa** masuk ke platform LeMaS dengan memasukkan Nomor Induk dan password menggunakan otentikasi JWT token, dan menghapus token saat keluar. |

---

> [!TIP]
> **Prompt untuk AI (ChatGPT/Claude/Gemini):**
> Anda dapat menyalin prompt di bawah ini beserta seluruh isi dokumen markdown ini ke AI lain untuk dibuatkan dokumen Word yang rapi:

---

**[COPY MULAI DARI SINI UNTUK PROMPT AI]**

Tolong bertindak sebagai Technical Writer profesional. Saya memiliki draf dokumen teknis berformat Markdown yang berisi "Standar Dokumentasi & Rencana Pengujian (Test Plan) Panduan Terintegrasi: DFD Level 1, Sequence Diagram, dan Testing". 

Tugas Anda adalah:
1. Mengubah struktur dan isi teks ini menjadi format dokumen resmi yang sangat rapi.
2. Tolong buatkan ini agar siap disalin ke Microsoft Word. Gunakan heading yang jelas (H1, H2, H3).
3. Buatkan bagian tabel dengan format tabel yang bersih dan proporsional (terutama untuk "Backend Test Plan" dan "Matriks Penyelarasan").
4. Tambahkan bagian pengantar singkat di awal dokumen sebagai kata pengantar dokumen spesifikasi.
5. Gunakan bahasa Indonesia baku yang sesuai dengan standar akademik/laporan teknis kampus.

Berikut adalah draf Markdown-nya:
*(...paste isi markdown mulai dari "1. STANDAR INSTALLATION MANUAL" sampai "MATRIKS PENYELARASAN" di sini...)*
