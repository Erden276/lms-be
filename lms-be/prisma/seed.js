import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";

async function main() {
  console.log("Memulai proses seeding data...");
  console.log("Menghapus data lama...");

  await prisma.likeForum.deleteMany();
  await prisma.komentarForum.deleteMany();
  await prisma.forumDiskusi.deleteMany();
  await prisma.pilihanJawaban.deleteMany();
  await prisma.soal.deleteMany();
  await prisma.kuis.deleteMany();
  await prisma.pengumpulanTugas.deleteMany();
  await prisma.progressTugas.deleteMany();
  await prisma.anggotaKelompok.deleteMany();
  await prisma.kelompok.deleteMany();
  await prisma.notifikasi.deleteMany();
  await prisma.presensi.deleteMany();
  await prisma.tugas.deleteMany();
  await prisma.nilai.deleteMany();
  await prisma.modulAjar.deleteMany();
  await prisma.mataKuliah.deleteMany();
  await prisma.mahasiswa.deleteMany();
  await prisma.dosen.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  console.log("Data lama berhasil dihapus.");

  // ══════════════════════════════════════════════
  // 1. ROLES
  // ══════════════════════════════════════════════
  const roles = [
    { id: 1, nama: "ADMIN" },
    { id: 2, nama: "MAHASISWA" },
    { id: 3, nama: "DOSEN" },
  ];
  for (const role of roles) {
    await prisma.role.create({ data: role });
  }
  console.log("3 Role berhasil dibuat.");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // ══════════════════════════════════════════════
  // 2. DOSEN (5 Dosen)
  // ══════════════════════════════════════════════
  const dosenList = [
    {
      ni: "D001",
      nama: "Dr. Budi Santoso, M.Kom",
      email: "budi.santoso@kampus.ac.id",
      nip: "2025001",
      nidn: "1001",
      bidang: "Rekayasa Perangkat Lunak",
      ruangKantor: "Gedung A Lt.3 R.301",
    },
    {
      ni: "D002",
      nama: "Prof. Siti Rahayu, Ph.D",
      email: "siti.rahayu@kampus.ac.id",
      nip: "2025002",
      nidn: "1002",
      bidang: "Kecerdasan Buatan",
      ruangKantor: "Gedung A Lt.3 R.302",
    },
    {
      ni: "D003",
      nama: "Dr. Ahmad Fauzi, M.T",
      email: "ahmad.fauzi@kampus.ac.id",
      nip: "2025003",
      nidn: "1003",
      bidang: "Jaringan Komputer",
      ruangKantor: "Gedung B Lt.2 R.205",
    },
    {
      ni: "D004",
      nama: "Dr. Dewi Lestari, M.Sc",
      email: "dewi.lestari@kampus.ac.id",
      nip: "2025004",
      nidn: "1004",
      bidang: "Basis Data",
      ruangKantor: "Gedung A Lt.4 R.401",
    },
    {
      ni: "D005",
      nama: "Dr. Rudi Hermawan, S.Kom, M.Cs",
      email: "rudi.hermawan@kampus.ac.id",
      nip: "2025005",
      nidn: "1005",
      bidang: "Sistem Informasi",
      ruangKantor: "Gedung B Lt.3 R.310",
    },
  ];

  for (const d of dosenList) {
    await prisma.user.create({
      data: {
        nomorInduk: d.nip,
        nama: d.nama,
        email: d.email,
        password: hashedPassword,
        telepon: `0812${d.nip.slice(-3)}00001`,
        roleId: 3,
        dosen: {
          create: {
            nidn: d.nidn,
            bidang: d.bidang,
            ruangKantor: d.ruangKantor,
          },
        },
      },
    });
  }
  console.log("5 Dosen berhasil dibuat.");

  // ══════════════════════════════════════════════
  // 3. MAHASISWA (10 Mahasiswa)
  // ══════════════════════════════════════════════
  const mahasiswaList = [
    {
      ni: "2026001",
      nim: "2026001",
      nama: "Andi Pratama",
      email: "andi.pratama@kampus.ac.id",
    },
    {
      ni: "2026002",
      nim: "2026002",
      nama: "Bella Safitri",
      email: "bella.safitri@kampus.ac.id",
    },
    {
      ni: "2026003",
      nim: "2026003",
      nama: "Cahya Nugraha",
      email: "cahya.nugraha@kampus.ac.id",
    },
    {
      ni: "2026004",
      nim: "2026004",
      nama: "Dina Maharani",
      email: "dina.maharani@kampus.ac.id",
    },
    {
      ni: "2026005",
      nim: "2026005",
      nama: "Eko Saputra",
      email: "eko.saputra@kampus.ac.id",
    },
    {
      ni: "2026006",
      nim: "2026006",
      nama: "Fitri Handayani",
      email: "fitri.handayani@kampus.ac.id",
    },
    {
      ni: "2026007",
      nim: "2026007",
      nama: "Galih Wicaksono",
      email: "galih.wicaksono@kampus.ac.id",
    },
    {
      ni: "2026008",
      nim: "2026008",
      nama: "Hana Permata",
      email: "hana.permata@kampus.ac.id",
    },
    {
      ni: "2026009",
      nim: "2026009",
      nama: "Irfan Maulana",
      email: "irfan.maulana@kampus.ac.id",
    },
    {
      ni: "2026010",
      nim: "2026010",
      nama: "Jasmine Putri",
      email: "jasmine.putri@kampus.ac.id",
    },
  ];

  for (const m of mahasiswaList) {
    await prisma.user.create({
      data: {
        nomorInduk: m.nim,
        nama: m.nama,
        email: m.email,
        password: hashedPassword,
        telepon: `08123${m.nim}`,
        roleId: 2,
        mahasiswa: { create: {} },
      },
    });
  }
  console.log("10 Mahasiswa berhasil dibuat.");

  // ══════════════════════════════════════════════
  // 4. MATA KULIAH (4 per semester, total 16)
  // Semester 1, 2, 3: Selesai | Semester 4: Aktif
  // ══════════════════════════════════════════════
  const matkulList = [
    // Semester 1 (Completed)
    {
      nama: "Dasar Pemrograman",
      nipDosen: dosenList[0].nip,
      jadwal: "Senin,Rabu",
      waktu: "08:00 - 10:00",
      semester: 1,
      sks: 3,
    },
    {
      nama: "Matematika Diskrit",
      nipDosen: dosenList[1].nip,
      jadwal: "Selasa,Kamis",
      waktu: "10:30 - 12:00",
      semester: 1,
      sks: 3,
    },
    {
      nama: "Logika Informatika",
      nipDosen: dosenList[2].nip,
      jadwal: "Rabu,Jumat",
      waktu: "13:00 - 15:00",
      semester: 1,
      sks: 2,
    },
    {
      nama: "Pengantar Teknologi Informasi",
      nipDosen: dosenList[3].nip,
      jadwal: "Senin,Kamis",
      waktu: "15:30 - 17:00",
      semester: 1,
      sks: 2,
    },
    // Semester 2 (Completed)
    {
      nama: "Struktur Data",
      nipDosen: dosenList[0].nip,
      jadwal: "Senin,Rabu",
      waktu: "10:30 - 12:30",
      semester: 2,
      sks: 4,
    },
    {
      nama: "Algoritma & Kompleksitas",
      nipDosen: dosenList[1].nip,
      jadwal: "Selasa,Kamis",
      waktu: "08:00 - 10:00",
      semester: 2,
      sks: 3,
    },
    {
      nama: "Pemrograman Berorientasi Objek",
      nipDosen: dosenList[2].nip,
      jadwal: "Rabu,Jumat",
      waktu: "10:30 - 12:30",
      semester: 2,
      sks: 3,
    },
    {
      nama: "Arsitektur Komputer",
      nipDosen: dosenList[3].nip,
      jadwal: "Senin,Kamis",
      waktu: "13:00 - 15:00",
      semester: 2,
      sks: 3,
    },
    // Semester 3 (Completed)
    {
      nama: "Basis Data",
      nipDosen: dosenList[0].nip,
      jadwal: "Senin,Rabu",
      waktu: "15:30 - 17:30",
      semester: 3,
      sks: 4,
    },
    {
      nama: "Jaringan Komputer",
      nipDosen: dosenList[1].nip,
      jadwal: "Selasa,Kamis",
      waktu: "13:00 - 15:00",
      semester: 3,
      sks: 3,
    },
    {
      nama: "Sistem Operasi",
      nipDosen: dosenList[2].nip,
      jadwal: "Rabu,Jumat",
      waktu: "08:00 - 10:00",
      semester: 3,
      sks: 3,
    },
    {
      nama: "Probabilitas & Statistika",
      nipDosen: dosenList[3].nip,
      jadwal: "Senin,Kamis",
      waktu: "10:30 - 12:00",
      semester: 3,
      sks: 3,
    },
    // Semester 4 (Active)
    {
      nama: "Pemrograman Web",
      nipDosen: dosenList[0].nip,
      jadwal: "Senin,Rabu",
      waktu: "13:00 - 15:00",
      semester: 4,
      sks: 3,
    },
    {
      nama: "Kecerdasan Buatan",
      nipDosen: dosenList[1].nip,
      jadwal: "Selasa,Kamis",
      waktu: "15:30 - 17:30",
      semester: 4,
      sks: 3,
    },
    {
      nama: "Rekayasa Perangkat Lunak",
      nipDosen: dosenList[2].nip,
      jadwal: "Rabu,Jumat",
      waktu: "08:00 - 10:00",
      semester: 4,
      sks: 3,
    },
    {
      nama: "Interaksi Manusia Komputer",
      nipDosen: dosenList[3].nip,
      jadwal: "Senin,Kamis",
      waktu: "10:30 - 12:00",
      semester: 4,
      sks: 2,
    },
  ];

  const createdMatkul = [];
  for (const mk of matkulList) {
    const created = await prisma.mataKuliah.create({
      data: {
        namaMataKuliah: mk.nama,
        nipDosen: mk.nipDosen,
        jadwal: mk.jadwal,
        waktu: mk.waktu,
        semester: mk.semester,
        sks: mk.sks,
      },
    });
    createdMatkul.push(created);
  }
  console.log(`16 Mata Kuliah berhasil dibuat (4 per semester).`);

  // ══════════════════════════════════════════════
  // 5. PRESENSI — Semua mahasiswa terdaftar di SEMUA mata kuliah
  //    2 pertemuan per matkul
  // ══════════════════════════════════════════════
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const statusOptions = [
    "Hadir",
    "Hadir",
    "Hadir",
    "Hadir",
    "Hadir",
    "Hadir",
    "Hadir",
    "Sakit",
    "Izin",
    "Alpha",
  ];

  const presensiData = [];
  for (const mk of createdMatkul) {
    for (const m of mahasiswaList) {
      presensiData.push({
        nim: m.nim,
        idMataKuliah: mk.idMataKuliah,
        tanggalPertemuan: lastWeek,
        waktuPresensi: new Date(
          lastWeek.getTime() + (8 + Math.floor(Math.random() * 4)) * 3600000,
        ),
        statusKehadiran:
          statusOptions[Math.floor(Math.random() * statusOptions.length)],
      });
      presensiData.push({
        nim: m.nim,
        idMataKuliah: mk.idMataKuliah,
        tanggalPertemuan: today,
        statusKehadiran: "Alpha",
      });
    }
  }
  await prisma.presensi.createMany({ data: presensiData });
  console.log(`${presensiData.length} data Presensi berhasil dibuat.`);

  // ══════════════════════════════════════════════
  // 6. NILAI — Nilai untuk semua mahasiswa
  // Semester 1-3: Selesai (dengan nilai akhir untuk IPK)
  // Semester 4: Aktif (nilai akhir null)
  // ══════════════════════════════════════════════
  // Nilai akhir per course untuk user 2026001 (Andi) — IPK target ~3.73
  const nilaiAndi = {
    "Dasar Pemrograman": 88,
    "Matematika Diskrit": 82,
    "Logika Informatika": 90,
    "Pengantar Teknologi Informasi": 85,
    "Struktur Data": 78,
    "Algoritma & Kompleksitas": 85,
    "Pemrograman Berorientasi Objek": 80,
    "Arsitektur Komputer": 75,
    "Basis Data": 86,
    "Jaringan Komputer": 79,
    "Sistem Operasi": 83,
    "Probabilitas & Statistika": 88,
  };

  const nilaiData = [];
  for (const mk of createdMatkul) {
    for (const m of mahasiswaList) {
      if (mk.semester <= 3) {
        let nilaiAkhir;
        if (m.ni === "2026001" && nilaiAndi[mk.namaMataKuliah]) {
          nilaiAkhir = nilaiAndi[mk.namaMataKuliah];
        } else {
          nilaiAkhir = 65 + Math.floor(Math.random() * 30);
        }
        nilaiData.push({
          nomorInduk: m.nim,
          idMataKuliah: mk.idMataKuliah,
          nilaiTugas: Math.min(100, nilaiAkhir + Math.floor(Math.random() * 8)),
          nilaiKuis: Math.min(100, nilaiAkhir + Math.floor(Math.random() * 6)),
          nilaiAkhir: nilaiAkhir,
          semester: mk.semester,
        });
      } else {
        const base = 65 + Math.floor(Math.random() * 30);
        nilaiData.push({
          nomorInduk: m.nim,
          idMataKuliah: mk.idMataKuliah,
          nilaiTugas: base + Math.floor(Math.random() * 10),
          nilaiKuis: base + Math.floor(Math.random() * 8),
          nilaiAkhir: null,
          semester: mk.semester,
        });
      }
    }
  }
  await prisma.nilai.createMany({ data: nilaiData });
  console.log(`${nilaiData.length} data Nilai berhasil dibuat.`);

  // ══════════════════════════════════════════════
  // 7. MODUL AJAR — 2 modul per matkul
  // ══════════════════════════════════════════════
  const modulData = [];
  for (let i = 0; i < createdMatkul.length; i++) {
    const mk = createdMatkul[i];
    modulData.push({
      idMataKuliah: mk.idMataKuliah,
      judul: `Pengantar ${matkulList[i].nama}`,
      tipe_modul: "PDF",
      deskripsi: `Materi pengantar dan silabus untuk mata kuliah ${matkulList[i].nama}.`,
      fileUrl: `/uploads/modul_pengantar_${mk.idMataKuliah}.pdf`,
      ukuran: "2.5 MB",
      canDownload: true,
    });
    modulData.push({
      idMataKuliah: mk.idMataKuliah,
      judul: `Praktikum ${matkulList[i].nama}`,
      tipe_modul: "Video",
      deskripsi: `Video tutorial praktikum untuk ${matkulList[i].nama}.`,
      url: "https://www.youtube.com/watch?v=example",
      ukuran: "150 MB",
      canDownload: false,
    });
  }
  await prisma.modulAjar.createMany({ data: modulData });
  console.log(`${modulData.length} Modul Ajar berhasil dibuat.`);

  // ══════════════════════════════════════════════
  // 8. TUGAS — 2 tugas per matkul (setiap mahasiswa punya record)
  // ══════════════════════════════════════════════
  const tugasTemplates = [
    // Semester 1
    [
      {
        judul: "Membuat Program Input Output",
        detail:
          "Buat program sederhana menggunakan bahasa C yang menerima input dan menampilkan output.",
        deadlineDays: 7,
      },
      {
        judul: "Implementasi Array dan Fungsi",
        detail:
          "Buat program yang mengimplementasikan array multidimensi dan fungsi untuk manipulasi data.",
        deadlineDays: 21,
      },
    ],
    [
      {
        judul: "Himpunan dan Logika Matematika",
        detail:
          "Kerjakan 10 soal tentang teori himpunan dan logika matematika.",
        deadlineDays: 7,
      },
      {
        judul: "Relasi dan Fungsi Matematika",
        detail: "Buat laporan tentang relasi rekursif dan fungsi pembangkit.",
        deadlineDays: 21,
      },
    ],
    [
      {
        judul: "Tabel Kebenaran dan Gerbang Logika",
        detail:
          "Buat tabel kebenaran untuk 5 gerbang logika beserta implementasi sirkuitnya.",
        deadlineDays: 5,
      },
      {
        judul: "Penyederhanaan Ekspresi Boolean",
        detail:
          "Sederhanakan 10 ekspresi boolean menggunakan aljabar boolean dan K-map.",
        deadlineDays: 18,
      },
    ],
    [
      {
        judul: "Makalah Perkembangan TI",
        detail:
          "Buat makalah tentang perkembangan teknologi informasi di era digital.",
        deadlineDays: 10,
      },
      {
        judul: "Presentasi Inovasi TI",
        detail:
          "Buat slide presentasi tentang inovasi TI terkini di Indonesia.",
        deadlineDays: 24,
      },
    ],
    // Semester 2
    [
      {
        judul: "Implementasi Linked List",
        detail:
          "Implementasikan singly linked list dan doubly linked list dalam bahasa C++.",
        deadlineDays: 10,
      },
      {
        judul: "Binary Search Tree",
        detail:
          "Implementasikan operasi insert, delete, dan traversal pada BST.",
        deadlineDays: 24,
      },
    ],
    [
      {
        judul: "Analisis Kompleksitas Algoritma",
        detail:
          "Analisis kompleksitas waktu dari 5 algoritma sorting menggunakan Big-O notation.",
        deadlineDays: 7,
      },
      {
        judul: "Implementasi Divide and Conquer",
        detail:
          "Implementasikan algoritma merge sort dan quick sort dengan pendekatan divide and conquer.",
        deadlineDays: 20,
      },
    ],
    [
      {
        judul: "Program OOP Dasar",
        detail:
          "Buat program Java dengan konsep inheritance, polymorphism, dan encapsulation.",
        deadlineDays: 8,
      },
      {
        judul: "GUI dengan Java Swing",
        detail:
          "Buat aplikasi desktop sederhana dengan Java Swing yang terhubung ke database.",
        deadlineDays: 22,
      },
    ],
    [
      {
        judul: "Laporan Organisasi Komputer",
        detail: "Buat laporan analisis arsitektur prosesor modern.",
        deadlineDays: 6,
      },
      {
        judul: "Simulasi Manajemen Memori",
        detail:
          "Buat simulasi algoritma manajemen memori (paging, segmentation).",
        deadlineDays: 18,
      },
    ],
    // Semester 3
    [
      {
        judul: "Perancangan Database",
        detail:
          "Rancang database untuk sistem akademik menggunakan ERD dan normalisasi hingga 3NF.",
        deadlineDays: 10,
      },
      {
        judul: "Implementasi SQL Lanjutan",
        detail: "Buat 15 query SQL kompleks meliputi JOIN, subquery, dan view.",
        deadlineDays: 24,
      },
    ],
    [
      {
        judul: "Konfigurasi Routing",
        detail:
          "Konfigurasi routing static dan dynamic menggunakan Cisco Packet Tracer.",
        deadlineDays: 5,
      },
      {
        judul: "Analisis Keamanan Jaringan",
        detail:
          "Lakukan analisis keamanan jaringan sederhana dan buat laporan.",
        deadlineDays: 16,
      },
    ],
    [
      {
        judul: "Manajemen Proses di Linux",
        detail:
          "Buat laporan praktikum manajemen proses dan thread di sistem operasi Linux.",
        deadlineDays: 7,
      },
      {
        judul: "Simulasi Penjadwalan CPU",
        detail:
          "Implementasikan algoritma penjadwalan CPU (FCFS, SJF, Round Robin).",
        deadlineDays: 20,
      },
    ],
    [
      {
        judul: "Analisis Statistik Deskriptif",
        detail:
          "Analisis dataset menggunakan ukuran pemusatan dan penyebaran data.",
        deadlineDays: 8,
      },
      {
        judul: "Uji Hipotesis dan Regresi",
        detail:
          "Lakukan uji hipotesis dan analisis regresi pada dataset yang diberikan.",
        deadlineDays: 22,
      },
    ],
    // Semester 4 (Active)
    [
      {
        judul: "Website Portfolio dengan HTML & CSS",
        detail:
          "Buat website portfolio pribadi menggunakan HTML5 dan CSS3. Harus responsif dengan minimal 3 halaman.",
        deadlineDays: 7,
      },
      {
        judul: "Aplikasi CRUD dengan ReactJS",
        detail:
          "Buat aplikasi CRUD sederhana menggunakan ReactJS dengan penyimpanan data di REST API.",
        deadlineDays: 21,
      },
    ],
    [
      {
        judul: "Laporan Algoritma Machine Learning",
        detail:
          "Analisis dan implementasikan algoritma Decision Tree untuk klasifikasi dataset.",
        deadlineDays: 5,
      },
      {
        judul: "Implementasi Neural Network",
        detail:
          "Implementasikan Neural Network sederhana untuk pengenalan pola menggunakan Python.",
        deadlineDays: 18,
      },
    ],
    [
      {
        judul: "Dokumen SRS",
        detail:
          "Buat dokumen Software Requirements Specification sesuai standar IEEE 830.",
        deadlineDays: 12,
      },
      {
        judul: "Desain UI/UX dengan Figma",
        detail:
          "Buat mockup UI/UX aplikasi mobile dengan Figma. Minimal 8 screen interaktif.",
        deadlineDays: 28,
      },
    ],
    [
      {
        judul: "Evaluasi Usability",
        detail:
          "Lakukan evaluasi usability pada sebuah aplikasi menggunakan metode SUS dan heuristic evaluation.",
        deadlineDays: 8,
      },
      {
        judul: "Perancangan Antarmuka Adaptif",
        detail:
          "Rancang antarmuka adaptif yang dapat menyesuaikan dengan preferensi pengguna.",
        deadlineDays: 22,
      },
    ],
  ];

  const tugasData = [];
  for (let i = 0; i < createdMatkul.length; i++) {
    const mk = createdMatkul[i];
    const templates = tugasTemplates[i];
    for (const tmpl of templates) {
      for (const m of mahasiswaList) {
        const deadlineDate = new Date(
          today.getTime() + tmpl.deadlineDays * 24 * 3600000,
        );
        tugasData.push({
          idMataKuliah: mk.idMataKuliah,
          nim: m.nim,
          judul: tmpl.judul,
          detailTugas: tmpl.detail,
          deadlineTugas: deadlineDate,
        });
      }
    }
  }
  await prisma.tugas.createMany({ data: tugasData });
  console.log(
    `${tugasData.length} Tugas berhasil dibuat (2 tugas x 16 matkul x 10 mahasiswa).`,
  );

  // ══════════════════════════════════════════════
  // 9. KUIS — 1 kuis per matkul
  // ══════════════════════════════════════════════
  const createdKuis = [];
  for (let i = 0; i < createdMatkul.length; i++) {
    const mk = createdMatkul[i];
    const kuis = await prisma.kuis.create({
      data: {
        idMataKuliah: mk.idMataKuliah,
        judul: `Kuis - ${matkulList[i].nama}`,
        deadlineKuis: new Date(today.getTime() + 14 * 24 * 3600000),
        skor: 100,
      },
    });
    createdKuis.push(kuis);
  }
  console.log(
    `${createdKuis.length} Kuis berhasil dibuat (1 kuis x 16 matkul).`,
  );

  // ══════════════════════════════════════════════
  // 10. SOAL & PILIHAN JAWABAN — 2 soal per kuis
  // ══════════════════════════════════════════════
  for (const kuis of createdKuis) {
    for (let q = 1; q <= 2; q++) {
      const soal = await prisma.soal.create({
        data: {
          idKuis: kuis.idKuis,
          pertanyaan: `Pertanyaan ${q}: Jelaskan konsep dasar terkait materi kuis ini.`,
          kunciJawaban: "A",
          skor: 50,
        },
      });
      await prisma.pilihanJawaban.createMany({
        data: [
          { idSoal: soal.idSoal, teksJawaban: "Jawaban A (Benar)" },
          { idSoal: soal.idSoal, teksJawaban: "Jawaban B" },
          { idSoal: soal.idSoal, teksJawaban: "Jawaban C" },
          { idSoal: soal.idSoal, teksJawaban: "Jawaban D" },
        ],
      });
    }
  }
  console.log(
    "Soal & Pilihan Jawaban berhasil dibuat (2 soal x 4 pilihan per kuis).",
  );

  // ══════════════════════════════════════════════
  // 11. FORUM DISKUSI — 1 forum per mata kuliah semester 4
  // ══════════════════════════════════════════════
  const forumCreated = [];
  const matkulSemester4 = matkulList.filter((m) => m.semester === 4);
  for (let i = 0; i < matkulSemester4.length; i++) {
    const mk = createdMatkul.find(
      (c) => c.namaMataKuliah === matkulSemester4[i].nama && c.semester === 4,
    );
    if (!mk) continue;
    const forum = await prisma.forumDiskusi.create({
      data: {
        idMataKuliah: mk.idMataKuliah,
        judul: `Diskusi: ${matkulSemester4[i].nama} - Pertemuan 1`,
        isiForum: `Selamat datang di forum diskusi ${matkulSemester4[i].nama}. Silakan bertanya atau berdiskusi mengenai materi pertemuan pertama.`,
        nomorInduk: dosenList[i].nip,
      },
    });
    forumCreated.push(forum);
  }
  console.log(`${forumCreated.length} Forum Diskusi berhasil dibuat.`);

  // ══════════════════════════════════════════════
  // 12. KOMENTAR FORUM — 2 komentar per forum
  // ══════════════════════════════════════════════
  const komentarData = [];
  for (let i = 0; i < forumCreated.length; i++) {
    komentarData.push({
      nomorInduk: mahasiswaList[(i * 2) % 10].nim,
      idForum: forumCreated[i].idForumDiskusi,
      isiKomentar:
        "Terima kasih Pak/Bu, materinya sangat bermanfaat. Apakah ada referensi tambahan?",
    });
    komentarData.push({
      nomorInduk: mahasiswaList[(i * 2 + 1) % 10].nim,
      idForum: forumCreated[i].idForumDiskusi,
      isiKomentar:
        "Saya ingin bertanya mengenai topik yang dibahas di slide ke-3.",
    });
  }
  await prisma.komentarForum.createMany({ data: komentarData });
  console.log(`${komentarData.length} Komentar Forum berhasil dibuat.`);

  // ══════════════════════════════════════════════
  // 13. LIKE FORUM
  // ══════════════════════════════════════════════
  const likeData = [];
  for (let i = 0; i < forumCreated.length; i++) {
    for (let j = 0; j < 3; j++) {
      likeData.push({
        nomorInduk: mahasiswaList[(i + j) % 10].nim,
        idForum: forumCreated[i].idForumDiskusi,
      });
    }
  }
  await prisma.likeForum.createMany({ data: likeData, skipDuplicates: true });
  console.log(`${likeData.length} Like Forum berhasil dibuat.`);

  // ══════════════════════════════════════════════
  // 14. KELOMPOK — 2 kelompok per matkul
  // ══════════════════════════════════════════════
  const kelompokCreated = [];
  const warna = ["#4b53bc", "#2f9696", "#c47f17", "#dc2626", "#059669"];
  for (let i = 0; i < createdMatkul.length; i++) {
    const mk = createdMatkul[i];
    const k1 = await prisma.kelompok.create({
      data: {
        idMataKuliah: mk.idMataKuliah,
        namaKelompok: `Kelompok 1 - ${matkulList[i].nama}`,
        warna: warna[i % warna.length],
        tugasName: `Proyek Akhir ${matkulList[i].nama}`,
        progress: 60,
        status: "In Progress",
        submitted: false,
      },
    });
    const k2 = await prisma.kelompok.create({
      data: {
        idMataKuliah: mk.idMataKuliah,
        namaKelompok: `Kelompok 2 - ${matkulList[i].nama}`,
        warna: warna[(i + 1) % warna.length],
        tugasName: `Proyek Akhir ${matkulList[i].nama}`,
        progress: 35,
        status: "In Progress",
        submitted: false,
      },
    });
    kelompokCreated.push(k1, k2);
  }
  console.log(`${kelompokCreated.length} Kelompok berhasil dibuat.`);

  // ══════════════════════════════════════════════
  // 15. ANGGOTA KELOMPOK — 5 mahasiswa per kelompok
  // ══════════════════════════════════════════════
  const anggotaData = [];
  for (let ki = 0; ki < kelompokCreated.length; ki++) {
    const k = kelompokCreated[ki];
    const startIdx = ki % 2 === 0 ? 0 : 5;
    for (let j = 0; j < 5; j++) {
      anggotaData.push({
        idKelompok: k.idKelompok,
        nim: mahasiswaList[startIdx + j].nim,
        nilaiTugas: 75 + Math.floor(Math.random() * 20),
      });
    }
  }
  await prisma.anggotaKelompok.createMany({
    data: anggotaData,
    skipDuplicates: true,
  });
  console.log(`${anggotaData.length} Anggota Kelompok berhasil dibuat.`);

  // ══════════════════════════════════════════════
  // 16. PROGRESS TUGAS
  // ══════════════════════════════════════════════
  const progressData = [];
  for (let i = 0; i < createdMatkul.length; i++) {
    const mk = createdMatkul[i];
    for (let j = 0; j < 5; j++) {
      progressData.push({
        idMataKuliah: mk.idMataKuliah,
        nim: mahasiswaList[j].nim,
        judul: `Progress Tugas 1 - ${matkulList[i].nama}`,
        detailTugas: "Sudah mengerjakan 50% bagian teori dan praktikum.",
        deadlineTugas: new Date(today.getTime() + 14 * 24 * 3600000),
      });
    }
  }
  await prisma.progressTugas.createMany({ data: progressData });
  console.log(`${progressData.length} Progress Tugas berhasil dibuat.`);

  // ══════════════════════════════════════════════
  // 17. PENGUMPULAN TUGAS — beberapa mahasiswa sudah mengumpulkan
  // ══════════════════════════════════════════════
  const tugasFromDB = await prisma.tugas.findMany();
  const pengumpulanData = [];
  for (let i = 0; i < createdMatkul.length; i++) {
    const mkTugas = tugasFromDB.filter(
      (t) => t.idMataKuliah === createdMatkul[i].idMataKuliah,
    );
    for (let j = 0; j < 2 && j < mkTugas.length; j++) {
      const t = mkTugas[j];
      pengumpulanData.push({
        idTugas: t.idTugas,
        nim: t.nim,
        judul: `Submission: ${t.judul}`,
        detailTugas: "Berikut terlampir file jawaban tugas.",
        fileJawaban: `/uploads/jawaban_${t.nim}_mk${t.idMataKuliah}.pdf`,
      });
    }
  }
  await prisma.pengumpulanTugas.createMany({ data: pengumpulanData });
  console.log(`${pengumpulanData.length} Pengumpulan Tugas berhasil dibuat.`);

  // ══════════════════════════════════════════════
  // 18. NOTIFIKASI — beberapa notifikasi untuk user U001
  // ══════════════════════════════════════════════
  const sem4Matkul = createdMatkul.filter((m) => m.semester === 4);
  const notifData = [];
  for (const mk of sem4Matkul) {
    notifData.push({
      nim: "2026001",
      judul: "Materi Baru",
      pesan: `Materi "Pengantar ${mk.namaMataKuliah}" untuk mata kuliah ${mk.namaMataKuliah} telah tersedia. Silakan dipelajari!`,
      tipe: "materi",
      isRead: false,
      tipeRef: "materi",
    });
    notifData.push({
      nim: "2026001",
      judul: "Tugas Baru",
      pesan: `Tugas baru telah tersedia untuk mata kuliah ${mk.namaMataKuliah}. Jangan lupa dikerjakan!`,
      tipe: "tugas",
      isRead: false,
      tipeRef: "tugas",
    });
  }
  await prisma.notifikasi.createMany({ data: notifData });
  console.log(`${notifData.length} Notifikasi berhasil dibuat.`);

  // ══════════════════════════════════════════════
  // SELESAI
  // ══════════════════════════════════════════════
  console.log("");
  console.log("═══════════════════════════════════════════");
  console.log("  SEEDING SELESAI!");
  console.log("═══════════════════════════════════════════");
  console.log("");
  console.log("Ringkasan Data:");
  console.log("  - 3 Role (Admin, Mahasiswa, Dosen)");
  console.log("  - 5 Dosen");
  console.log("  - 10 Mahasiswa");
  console.log("  - 16 Mata Kuliah (4 per semester)");
  console.log("  - 2 Tugas + 1 Kuis per matkul = 3 total per matkul");
  console.log("  - IPK Andi (2026001) ~3.73 berdasarkan nilai sebenarnya");
  console.log("");
  console.log("Akun Login:");
  console.log("  Dosen    -> 2025001 (NIP) / password123");
  console.log("  Mahasiswa -> 2026001 (NIM) / password123");
  console.log("");
}

main()
  .catch((e) => {
    console.error("Seeding gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
