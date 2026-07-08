# Data Login LMS (Learning Management System)

Berikut adalah daftar akun yang dapat digunakan untuk login ke dalam sistem berdasarkan data seed (dummy) di database:

**Password untuk semua akun:** `password123`
**Password Khusus untuk Akun dengan NIM 2026001** `Password123.`

## 1. Akun Mahasiswa

Anda dapat login menggunakan `Nomor Induk / NIM` atau `Email`.

| No  | Nomor Induk (NIM) | Nama Mahasiswa | Email                      | Role      |
| :-: | :---------------- | :------------- | :------------------------- | :-------- |
|  1  | `2026001`         | Andi Pratama   | andi.pratama@kampus.ac.id  | MAHASISWA |
|  2  | `2026002`         | Bella Safitri  | bella.safitri@kampus.ac.id | MAHASISWA |
|  3  | `2026003`         | Cahya Nugraha  | cahya.nugraha@kampus.ac.id | MAHASISWA |
|  4  | `2026004`         | Dina Maharani  | dina.maharani@kampus.ac.id | MAHASISWA |
|  5  | `2026005`         | Eko Saputra    | eko.saputra@kampus.ac.id   | MAHASISWA |

## 2. Akun Dosen

Anda dapat login menggunakan `Nomor Induk / NIP` atau `Email`.

| No  | Nomor Induk (NIP) | Nama Dosen                     | Email                      | Role  |
| :-: | :---------------- | :----------------------------- | :------------------------- | :---- |
|  1  | `2025001`         | Dr. Budi Santoso, M.Kom        | budi.santoso@kampus.ac.id  | DOSEN |
|  2  | `2025002`         | Prof. Siti Rahayu, Ph.D        | siti.rahayu@kampus.ac.id   | DOSEN |
|  3  | `2025003`         | Dr. Ahmad Fauzi, M.T           | ahmad.fauzi@kampus.ac.id   | DOSEN |
|  4  | `2025004`         | Dr. Dewi Lestari, M.Sc         | dewi.lestari@kampus.ac.id  | DOSEN |
|  5  | `2025005`         | Dr. Rudi Hermawan, S.Kom, M.Cs | rudi.hermawan@kampus.ac.id | DOSEN |

## 3. Akun Admin (Jika tersedia)

_Catatan: Role Admin tersedia di sistem, pastikan data admin di-seed atau dibuat manual di database._

- Username / NIP: _(Silakan sesuaikan jika telah diset)_
- Password: `password123`

---

**Note:** Pastikan Anda telah menjalankan perintah seed database (misalnya `npx prisma db seed` atau sejenisnya) agar akun-akun ini terdaftar di database.
