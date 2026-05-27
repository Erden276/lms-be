# Dokumentasi Class Diagram LMS

Berdasarkan diagram `Class_Diagram.png`, berikut adalah rincian setiap class, atribut, method, dan relasi antar class.

## 1. Rincian Class, Atribut, dan Method

### User
*   **Atribut:**
    *   `- nomorInduk: String`
    *   `- nama: String`
    *   `- email: String`
    *   `- password: String`
*   **Method:**
    *   `+ logout(): void`
    *   `+ login(nomorInduk: String, password: String): boolean`
    *   `+ getName(): String`

### Dosen
*   **Atribut:**
    *   `- nip: String`
*   **Method:**
    *   `+ membuatMataKuliah(nama: String): MataKuliah`
    *   `+ menambahModulAjar(mk: MataKuliah, m: ModulAjar): void`
    *   `+ menambahVidioPembelajaran(mk: MataKuliah, v: VidioAjar): void`
    *   `+ menambahTugas(mk: MataKuliah, t: Tugas): void`
    *   `+ menambahForumDiskusi(mk: MataKuliah, f: ForumDiskusi): void`
    *   `+ inputNilai(mk: MataKuliah, n: Nilai): void`
    *   `+ inputPresensi(mk: MataKuliah, p: Presensi): void`

### Mahasiswa
*   **Atribut:**
    *   `- nim: String`
    *   `- semester: int`
    *   `- daftarMatkul: MataKuliah[]`
    *   `- kelompok: Kelompok`
*   **Method:**
    *   `+ gabungKelas(mk: MataKuliah, kode: String): boolean`
    *   `+ bacaModul(mk: MataKuliah, idModul: String): ModulAjar`
    *   `+ kerjakanTugas(mk: MataKuliah, idTugas: String): Tugas`
    *   `+ kumpulkanTugas(mk: MataKuliah, t: Tugas): boolean`
    *   `+ tontonVidio(mk: MataKuliah, idVidio: String): VidioAjar`
    *   `+ kerjakanKuis(mk: MataKuliah, idVidio: String): boolean`
    *   `+ melihatNilai(mk: MataKuliah): void`
    *   `+ gabungKelompok(k: Kelompok): boolean`
    *   `+ kumpulkanTugasKelompok(t: tugas, k: Kelompok): boolean`

### MataKuliah
*   **Atribut:**
    *   `+ namaMatkul: String`
    *   `+ daftarTugas: Tugas[]`
    *   `+ daftarModul: ModulAjar[]`
    *   `+ daftarVidio: VidioAjar[]` 
    *   `+ daftarKuis: Kuis[]`
    *   `+ daftarForumDiskusi: ForumDiskusi[]`
    *   `- daftarKelompok: Kelompok[]`
*   **Method:**
    *   `+ menyimpanTugas(t: Tugas): boolean`
    *   `+ menyimpanModul(m: ModulAjar): boolean`
    *   `+ menyimpanVidio(v: VidioAjar): boolean`
    *   `+ menyimpanKuis(k: Kuis): boolean`
    *   `+ menyimpanForumDiskusi(f: ForumDiskusi): boolean`
    *   `+ buatKelompok(namaKelompok: String): Kelompok`

### Nilai
*   **Atribut:**
    *   `- nilaiTugas: double`
    *   `- nilaiKuis: double`
    *   `- nilaiAkhir: double`
    *   `- indeks: String`
*   **Method:**
    *   `+ akumulasiAkhir(nilaiTugas: double, nilaiKuis: double): double`
    *   `+ menentukanIndeks(): String`

### Presensi
*   **Atribut:**
    *   `- tanggalPertemuan: Date`
    *   `- statusKehadiran: String`
*   **Method:**
    *   `+ catatKehadiran(m: Mahasiswa, status: String): void`
    *   `+ getRekapKehadiran(): String`

### Kelompok
*   **Atribut:**
    *   `- id_kelompok: String`
    *   `- nama_kelompok: String`
    *   `- anggota_tim: Mahasiswa[]`
*   **Method:**
    *   `+ tambahAnggota(id_mahasiswa: String): void`
    *   `+ hapusAnggota(id_mahasiswa: String): void`
    *   `+ getAnggota(): Mahasiswa[]`
    *   `+ hapusKelompok(): boolean`

### Tugas
*   **Atribut:**
    *   `+ judul: String`
    *   `+ detailTugas: String`
    *   `+ deadlineTugas: DateTime`
    *   `+ fileJawaban: String`
    *   `+ tipeTugas: String`
    *   `+ kelompokPengumpul: Kelompok`
*   **Method:**
    *   `+ unduhTugas(): void`
    *   `+ editTugas(dataBaru: String): void`
    *   `+ hapusTugas(): void`
    *   `+ jawabanIndividu(file: String): boolean`
    *   `+ jawabanKelompok(k: Kelompok, file: String): boolean`
    *   `+ getRekapProgressTim(): void`
    *   `+ setdeadline(tgl: DateTime): void`
    *   `+ cekDeadline(): boolean`

### ProgressTugas
*   **Atribut:**
    *   `- tanggalUpdate: DateTime`
    *   `- deskripsiProgress: String`
    *   `- presentaseSelesai: integer`
*   **Method:**
    *   `+ simpanProgress(): boolean`
    *   `+ getDetailProgress(): String`

### ModulAjar
*   **Atribut:**
    *   `+ judul: String`
    *   `+ tipe: String`
*   **Method:**
    *   `+ unduhModul(): void`

### BisaDiunduh
*   **Method:**
    *   `+ unduhFile(): void`

### ForumDiskusi
*   **Atribut:**
    *   `+ judul: String`
    *   `+ isiForum: String`
*   **Method:**
    *   `+ kirimPesan(pesan: String): void`

### KomentarForumDiskusi
*   **Atribut:**
    *   `- idKomentar: String`
    *   `- isiKomentar: String`
    *   `- penulis: User`
*   **Method:**
    *   `+ editKomentar(komentarBaru: String): boolean`
    *   `+ hapusKomentar(): boolean`
    *   `+ getDetailKomentar(): String`

### Kuis
*   **Atribut:**
    *   `+ judul: String`
    *   `+ deadlineKuis: DateTime`
    *   `+ soal: Soal[]`
*   **Method:**
    *   `+ mengerjakanKuis(): void`
    *   `+ melihatNilai(): void`

### Soal
*   **Atribut:**
    *   `- idSoal: String`
    *   `- pertanyaan: String`
    *   `- pilihanJawaban: String[]`
    *   `- kunciJawaban: String`
    *   `- skor: double`
*   **Method:**
    *   `+ cekJawaban(pilihanUser: String): boolean`
    *   `+ menampilkanSoal(): String`
    *   `+ bobotSoal(nilai: double): void`

---

## 2. Relasi Antar Class

Berikut adalah rincian jenis relasi yang terdapat pada diagram antar class:

### 1. Inheritance (Pewarisan / Generalization)
Ditandai dengan panah garis lurus berujung segitiga kosong.
*   **`Dosen`** mawarisi dari **`User`** (Dosen adalah User).
*   **`Mahasiswa`** mawarisi dari **`User`** (Mahasiswa adalah User).

### 2. Realization (Implementasi Interface)
Ditandai dengan panah bergaris putus-putus berujung segitiga kosong.
*   **`ModulAjar`** merealisasikan **`BisaDiunduh`** (Class ModulAjar mengimplementasikan fungsi di interface BisaDiunduh).

### 3. Composition (Komposisi - *Tergantung Hidup/Matinya Objek*)
Ditandai dengan panah berujung belah ketupat/diamond *terisi penuh* (solid diamond). Objek yang menjadi bagian (part) akan ikut hancur jika objek utamanya (whole) dihancurkan.
*   **`MataKuliah`** memiliki komposisi dengan **`ModulAjar`** (`1` ke `1..*`).
*   **`MataKuliah`** memiliki komposisi dengan **`Kuis`** (`1` ke `0..*`).
*   **`MataKuliah`** memiliki komposisi dengan **`ForumDiskusi`** (`1` ke `0..*`).
*   **`MataKuliah`** memiliki komposisi dengan **`Tugas`** (`1` ke `1..*`).
*   **`MataKuliah`** memiliki komposisi dengan **`Presensi`** (`1` ke `0..*`).
*   **`MataKuliah`** memiliki komposisi dengan **`Kelompok`** (`1` ke `0..*`).
*   **`Kuis`** memiliki komposisi dengan **`Soal`** (`1` ke `1..*`). Soal melekat erat pada Kuis.
*   **`Tugas`** memiliki komposisi dengan **`ProgressTugas`** (`1` ke `1..*`). Progress melekat pada sebuah Tugas.
*   **`ForumDiskusi`** memiliki komposisi dengan **`KomentarForumDiskusi`** (`1` ke `0..*`).

### 4. Association (Asosiasi)
Ditandai dengan garis lurus biasa tanpa diamond, terkadang disertai panah atau nama peran relasi.
*   **`Dosen`** `mengelola` **`MataKuliah`** (`1` ke `1..*`).
*   **`Mahasiswa`** `mengikuti` **`MataKuliah`** (`1..*` ke `1..*`).
*   **`Dosen`** `memberikan` **`Nilai`** (`1` ke `0..*`).
*   **`Mahasiswa`** `mendapatkan` **`Nilai`** (`1` ke `1`).
*   **`Nilai`** `berasal dari` **`MataKuliah`** (`1` ke `1`).
*   **`Mahasiswa`** `mencatat kehadiran` pada **`Presensi`** (`1..*` ke `0..*`).
*   **`Kelompok`** `mengerjakan` **`Tugas`** (`1..*` ke `1..*`).
*   **`Mahasiswa`** dan **`Kelompok`** memiliki relasi kepemilikan/asosiasi anggota (bisa dilihat dari artibut `anggota_tim`).
