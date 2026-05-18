# LMS Setup Guide - Menjalankan Frontend & Backend Bersamaan

Panduan lengkap untuk menjalankan Learning Management System (LeMaS) dengan menyambungkan frontend dan backend secara bersamaan, serta panduan pengujian API dan deployment ke cloud.

---

## 📋 Prasyarat

Pastikan Anda sudah menginstal:

- ✅ **Node.js** (v18 atau lebih baru) - [Download](https://nodejs.org/)
- ✅ **PostgreSQL** (v12 atau lebih baru) - [Download](https://www.postgresql.org/download/)
- ✅ **npm** atau **yarn** (biasanya sudah terinstal dengan Node.js)

Verifikasi instalasi:

```bash
node --version
npm --version
psql --version
```

---

## 🚀 Quick Start (Cara Cepat)

### Windows Users - Double-click Script

```
run-lms.bat
```

Script ini akan:

1. ✅ Mengecek dependencies dan menginstal jika diperlukan
2. ✅ Menjalankan Backend di terminal baru (port 3000)
3. ✅ Menjalankan Frontend di terminal baru (port 5173)
4. ✅ Menampilkan informasi koneksi dan kredensial login

---

## 🛠️ Manual Setup (Kalau Script Tidak Bekerja)

### Terminal 1 - Backend Server

```bash
# Masuk ke direktori backend
cd lms-be

# Install dependencies (jika belum)
npm install

# Jalankan development server
npm run dev
```

**Output yang diharapkan:**

```
🚀 Server ready at http://localhost:3000
```

### Terminal 2 - Frontend Server

```bash
# Masuk ke direktori frontend
cd frontend

# Install dependencies (jika belum)
npm install

# Jalankan development server
npm run dev
```

**Output yang diharapkan:**

```
VITE v5.x.x ready in xxx ms

➜ Local: http://localhost:5173/
```

---

## 📱 Akses Aplikasi

Setelah kedua server berjalan:

| Component        | URL                        | Deskripsi |
| ---------------- | -------------------------- | ----------|
| **Frontend**     | http://localhost:5173      | Tampilan User Interface utama |
| **Backend API**  | http://localhost:3000      | Server pengolah data & logika bisnis |
| **Health Check** | http://localhost:3000/ping | Cek status keaktifan server API |

---

## 🔐 Kredensial Pengujian (Testing Credentials)

Gunakan akun-akun di bawah ini untuk mencoba seluruh fitur aplikasi sesuai dengan role masing-masing:

### 👨‍🎓 Mahasiswa (Student)
*   **Nomor Induk (NIM):** `2026001`
*   **Password:** `password123`
*   **Role:** `Mahasiswa`

### 👨‍🏫 Dosen (Lecturer)
*   **Nomor Induk (NIP):** `D001`
*   **Password:** `password123`
*   **Role:** `Dosen`

### 👑 Admin
*   **Nomor Induk:** `U001`
*   **Password:** `password123`
*   **Role:** `Admin`

---

## 🗄️ Database Configuration

### PostgreSQL Connection

```
Host:     localhost
Port:     5432
Database: LMS
User:     postgres
Password: Hilmi17 (sesuaikan dengan setup PostgreSQL lokal Anda)
```

### Setup Database Pertama Kali

```bash
cd lms-be

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init_lms

# Seed data awal (Penting untuk membuat akun testing)
npx prisma db seed
```

---

## 🔌 Konfigurasi Koneksi (.env)

### Backend (`lms-be/.env`)
```env
PORT_APP=3000
DATABASE_URL=postgresql://postgres:Hilmi17@localhost:5432/LMS?schema=public
JWT_SECRET=bG1zLWJlDQo=
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_GEMINI_API_KEY=AIzaSyB4U6nXh6nN8L5D_sBYzNg8fGWtnGIPuf8
```

---

## 🌟 Fitur Unggulan Terbaru (Premium Features)

Aplikasi LeMaS ini telah dilengkapi dengan berbagai fitur premium modern:

1.  **⚡ Tutup-Buka Sidebar (Collapsible Sidebar):**
    *   Pengguna dapat melipat sidebar pada layar desktop untuk mendapatkan ruang baca dan fokus yang lebih luas.
    *   Cukup klik tombol **Hamburger** di bagian navbar atas untuk menyembunyikan/menampilkan sidebar dengan animasi geser yang sangat mulus.
    *   Status sidebar (tertutup/terbuka) disimpan langsung di **`localStorage`**, sehingga tidak akan berubah atau berkedip ketika Anda berpindah-pindah halaman!
2.  **🎨 Identitas Visual Baru (Branding LeMaS):**
    *   Menggunakan logo PNG transparan premium di halaman login, sidebar mahasiswa, dan sidebar dosen.
    *   Dilengkapi dengan sistem **Cache-Busting Favicon** (`/src/assets/logo.png?v=1.0.1`) di `index.html` untuk menghindari *cache* browser agresif, sehingga logo langsung berubah seketika.
    *   Halaman login dibersihkan dari kotak penutup logo yang mengganggu, membuat logo melayang secara estetis.
3.  **💬 FAQ Komprehensif (Pusat Bantuan):**
    *   Tersedia halaman pusat bantuan lengkap untuk menjawab permasalahan teknis umum mahasiswa dan dosen.

---

## 🚀 Panduan Deployment ke Cloud

Bagi Anda yang ingin mempublikasikan aplikasi LeMaS agar bisa diakses secara online dari mana saja:

### 1. Database (Cloud PostgreSQL) — Gratis di Supabase / Neon
*   Daftar di [Supabase](https://supabase.com) atau [Neon.tech](https://neon.tech).
*   Buat database baru di wilayah terdekat (Singapura) dan salin **Connection String**-nya.
*   Jalankan migrasi tabel ke database cloud dengan mengubah isi `DATABASE_URL` di file `.env` lokal Anda sementara, lalu ketik:
    `npx prisma migrate deploy` dan `npx prisma db seed`

### 2. Backend Server — Gratis di Render / Railway
*   Hubungkan repositori GitHub Anda ke **Render** atau **Railway**.
*   Pilih repositori `lms-be`.
*   Atur **Build Command** ke `npm install` dan **Start Command** ke `npm start`.
*   Tambahkan variabel lingkungan di dashboard cloud:
    *   `DATABASE_URL` = *(Koneksi PostgreSQL cloud Anda)*
    *   `JWT_SECRET` = *(Kunci rahasia JWT Anda)*
    *   `FRONTEND_URL` = *(URL hasil deployment frontend Vercel)*

### 3. Frontend Client — Gratis di Vercel
*   Hubungkan repositori GitHub Anda ke [Vercel](https://vercel.com).
*   Pilih repositori `frontend`, Vercel akan otomatis mengenali framework **Vite**.
*   Tambahkan variabel lingkungan di dasbor Vercel:
    *   `VITE_API_URL` = *(Masukkan URL Backend dari Render/Railway Anda)*
    *   `VITE_GEMINI_API_KEY` = *(API Key Gemini Anda)*
*   Klik **Deploy**! Selesai!

---

## 🧪 Pengujian API dengan Postman

Dokumentasi API lengkap dan pengujian berpatokan pada DFD (Level 0 dan Level 1) yang diurutkan per alur Sequence Diagram dapat diakses melalui:

*   **File Postman Collection:** [Testing_Postman.json](./assets/Postman/Testing_Postman.json)
*   **Dokumentasi Endpoint Lengkap:** [API_DOCUMENTATION.md](./lms-be/API_DOCUMENTATION.md)

---

## 📚 Stack Teknologi

| Layer            | Technology            |
| ---------------- | --------------------- |
| **Frontend**     | React 19, Vite, CSS3  |
| **Backend**      | Node.js, Express.js 5 |
| **Database**     | PostgreSQL 12+        |
| **ORM**          | Prisma 7.8            |
| **Auth**         | JWT, Bcrypt           |
| **Architecture** | Clean Architecture    |

---

## 🎯 Langkah Selanjutnya

1.  Jalankan script `run-lms.bat`
2.  Buka http://localhost:5173 di browser Anda
3.  Login menggunakan kredensial testing di atas
4.  Coba fitur sidebar tutup-buka baru dan jelajahi dasbor LeMaS!

---

**Last Updated:** 18 Mei 2026
**Status:** ✅ Production Ready & Fully Documented
